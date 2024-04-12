import { info, warn } from '../util/log';
import { config } from '../extension/config';
import { URL } from 'url';
import fs from 'fs';

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
        })
    });

    if (res.ok) {
        const filestream = fs.createWriteStream(model);
        res.body?.pipeThrough(filestream);
    } else {
        warn(await res.text());
    }
}