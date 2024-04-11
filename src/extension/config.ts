import vscode from 'vscode';

class Config {
    private _enableAutocomplete: boolean = false;
    private _endpoint: string = '';
    private _model: string = '';
    private _maxTokens: number = 0;
    private _delay: number = 0;
    private _temperature: number = 0;


    constructor() {
        let config = vscode.workspace.getConfiguration('coco');

        this._enableAutocomplete = config.get<boolean>('enableAutocomplete') || false;
        this._endpoint = config.get<string>('endpoint') || '';
        this._model = config.get<string>('model') || '';
        this._maxTokens = config.get<number>('maxTokens') || 0;
        this._delay = config.get<number>('delay') || 0;
        this._temperature = config.get<number>('temperature') || 0;

        console.log('Config initialized.');
    }

    public get enableAutocomplete() {
        return this._enableAutocomplete;
    }

    public set enableAutocomplete(value: boolean) {
        this._enableAutocomplete = value;
        this.#update('enableAutocomplete', value);
    }

    public get endpoint() {
        return this._endpoint;
    }

    public set endpoint(value: string) {
        this._endpoint = value;
        this.#update('endpoint', value);
    }

    public get model() {
        return this._model;
    }

    public set model(value: string) {
        this._model = value;
        this.#update('model', value);
    }

    public get maxTokens() {
        return this._maxTokens;
    }

    public set maxTokens(value: number) {
        this._maxTokens = value;
        this.#update('maxTokens', value);
    }

    public get delay() {
        return this._delay;
    }

    public set delay(value: number) {
        this._delay = value;
        this.#update('delay', value);
    }

    public get temperature() {
        return this._temperature;
    }

    public set temperature(value: number) {
        this._temperature = value;
        this.#update('temperature', value);
    }

    #update(key: string, value: any, section: string = 'coco') {
        let config = vscode.workspace.getConfiguration(section);

        config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}

export const config = new Config();