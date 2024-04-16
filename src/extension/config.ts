import vscode from 'vscode';

class Config {
    #enableAutocomplete: boolean = false;
    #endpoint: string = '';
    #model: string = '';
    #maxTokens: number = 0;
    #delay: number = 0;
    #temperature: number = 0;
    #enableCache: boolean = false;

    constructor() {
        this.refresh();
    }

    public refresh() {
        let config = vscode.workspace.getConfiguration('coco');

        this.#enableAutocomplete = config.get<boolean>('enableAutocomplete') || false;
        this.#endpoint = config.get<string>('endpoint') || '';
        this.#model = config.get<string>('model') || '';
        this.#maxTokens = config.get<number>('maxTokens') || 0;
        this.#delay = config.get<number>('delay') || 0;
        this.#temperature = config.get<number>('temperature') || 0;
        this.#enableCache = config.get<boolean>('enableCache') || false;
    }

    public get enableAutocomplete() {
        return this.#enableAutocomplete;
    }

    public set enableAutocomplete(value: boolean) {
        this.#enableAutocomplete = value;
        this.#update('enableAutocomplete', value);
    }

    public get endpoint() {
        return this.#endpoint;
    }

    public set endpoint(value: string) {
        this.#endpoint = value;
        this.#update('endpoint', value);
    }

    public get model() {
        return this.#model;
    }

    public set model(value: string) {
        this.#model = value;
        this.#update('model', value);
    }

    public get maxTokens() {
        return this.#maxTokens;
    }

    public set maxTokens(value: number) {
        this.#maxTokens = value;
        this.#update('maxTokens', value);
    }

    public get delay() {
        return this.#delay;
    }

    public set delay(value: number) {
        this.#delay = value;
        this.#update('delay', value);
    }

    public get temperature() {
        return this.#temperature;
    }

    public set temperature(value: number) {
        this.#temperature = value;
        this.#update('temperature', value);
    }

    public get enableCache() {
        return this.#enableCache;
    }

    public set enableCache(value: boolean) {
        this.#enableCache = value;
        this.#update('enableCache', value);
    }

    #update(key: string, value: any, section: string = 'coco') {
        let config = vscode.workspace.getConfiguration(section);

        config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}

export const config = new Config();