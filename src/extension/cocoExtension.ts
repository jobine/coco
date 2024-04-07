import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { setupStatusBar } from './statusBar';
import { getConfigValue } from '../util/vscode';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public initialize(): void {
        const autocompleteEnabled = getConfigValue<boolean>('enableAutoComplete');
        setupStatusBar(autocompleteEnabled);

        this.register();
    }

    private register(): void {
        registerCommands(this.context);
    }
}