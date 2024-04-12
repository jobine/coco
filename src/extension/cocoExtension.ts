import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerProviders } from './provider';
import { setupStatusBar } from './statusBar';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public initialize(): void {
        setupStatusBar();

        this.register();
    }

    private register(): void {
        registerCommands(this.context);
        registerProviders(this.context);
    }
}