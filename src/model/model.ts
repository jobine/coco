import { info, warn } from '../util/log';
import { config } from '../extension/config';
import { URL } from 'url';

export type CocoToken = {
    model: string,
    response: string,
    done: boolean
};

export async function listModels(): Promise<string[]> {
    let url = new URL('api/tags', config.endpoint).href;

    const res = await fetch(url);

    if (res.ok) {
        let body = await res.json() as { models: { name: string }[] };
        return body.models.map(v => v.name);
    } else {
        warn(await res.text());
    }

    return [];
}

export async function checkModel(model: string): Promise<boolean> {
    let models = await listModels();

    return models.includes(model);
}

export async function downloadModel(model: string) {
    let url = new URL('api/pull', config.endpoint);

    info(`Downloading model ${model}.`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: model,
            insecure: false,
            stream: true
        }),
    });

    if (!!res.ok && !!res.body) {
        const decoder = new TextDecoder();
        let reader = res.body.getReader();

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }
            }
        } finally {
            reader?.releaseLock();

            if (!reader?.closed) {
                await reader?.cancel();
            }
        }

    } else {
        warn(await res.text());
    }
}

export async function* generate(prompt: string, stop?: string[]): AsyncGenerator<CocoToken> {
    for await (let line of generateLine(prompt, stop)) {
        let parsed: CocoToken;

        try {
            parsed = JSON.parse(line) as CocoToken;
        } catch (e) {
            warn('Received wrong line: ' + line, e);
            continue;
        }

        yield parsed;
    }
}

export async function* generateLine(prompt: string, stop?: string[]): AsyncGenerator<string> {
    const url = new URL('api/generate', config.endpoint);
    const body = {
        model: config.model,
        prompt: prompt,
        raw: true,
        optinos: {
            stop: stop,
            num_predict: config.maxTokens,
            temperature: config.temperature
        }
    };

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!!res.ok && !!res.body) {
        const decoder = new TextDecoder();
        const reader = res.body.getReader();
        let pending: string = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                // when done
                if (done) {
                    if (pending.length > 0) {
                        yield pending;
                    }
                    break;
                }

                // append chunk
                let chunk = decoder.decode(value);
                pending += chunk;

                // yield results
                
                while (pending.indexOf('\n') >= 0) {
                    let offset = pending.indexOf('\n');
                    yield pending.slice(0, offset);
                    pending = pending.slice(offset + 1);
                }
            }
        } finally {
            reader?.releaseLock();

            if (!reader?.closed) {
                await reader?.cancel();
            }
        }

    } else {
        warn(await res.text());
    }
}