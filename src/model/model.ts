import { info, warn } from '../util/log';
import { config } from '../extension/config';
import { URL } from 'url';

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

// export async function generate(prompt: string, stop: string):  