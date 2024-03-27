import * as vscode from 'vscode';
import { registerCommands } from './commands';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public register(): void {
        registerCommands(this.context);
    }
}