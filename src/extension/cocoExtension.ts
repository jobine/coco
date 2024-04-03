import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { setupStatusBar } from './statusBar';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public initialize(): void {
        setupStatusBar(true);
        this.register();
    }

    private register(): void {
        registerCommands(this.context);
    }
}