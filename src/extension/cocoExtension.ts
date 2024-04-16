import * as vscode from 'vscode';
import { commandsMap } from './commands';
import { CocoInlineCompletionItemProvider } from './provider';
import { setupStatusBar, refreshStatusBar } from './statusBar';
import { config } from './config';
import { registerLogger } from '../util/log';

export class CocoExtension {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public initialize(): void {
        registerLogger(vscode.window.createOutputChannel('Code Copilot', { log: true }));

        setupStatusBar();

        this.registerCommands(this.context);
        this.registerProviders(this.context);

        vscode.workspace.onDidChangeConfiguration((event) => {
            config.refresh();

            if (event.affectsConfiguration('coco')) {
                refreshStatusBar();
            }
        });
    }

    registerProviders(context: vscode.ExtensionContext) {
        // Register the inline completion provider
        const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            new CocoInlineCompletionItemProvider(context)
        );
    
        context.subscriptions.push(inlineCompletionProvider);
    }

    registerCommands(context: vscode.ExtensionContext) {
        const commands = commandsMap(context);
        for (const [command, handler] of Object.entries(commands)) {
            context.subscriptions.push(
                vscode.commands.registerCommand(command, handler)
            );
        }
    }
}