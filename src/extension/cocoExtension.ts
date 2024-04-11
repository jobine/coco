import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerProviders } from './provider';
import { setupStatusBar } from './statusBar';
import { config } from './config';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public initialize(): void {
        setupStatusBar(config.enableAutocomplete);

        this.register();
    }

    private register(): void {
        registerCommands(this.context);
        registerProviders(this.context);
    }
}