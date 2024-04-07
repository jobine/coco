import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { getLogPath } from '../util/vscode';
import { get } from 'http';


async function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, cancellationToken: vscode.CancellationToken) {
    const item = new vscode.CompletionItem('Code Copilot Autocomplete.');
    item.insertText = new vscode.SnippetString('${1:}');

    // if (responsePreview) await new Promise(resolve => setTimeout(resolve, responsePreviewDelay * 1000));
    return [item];
}

// async function autocompleteCommand(textEditor: vscode.TextEditor, cancellationToken?: vscode.CancellationToken) {

// }

const commandsMap: (
    context: vscode.ExtensionContext
) => {[command: string]: (...args: any) => any} = (context) => ({
    'coco.viewLogs': async () => {
        const logUri = vscode.Uri.file(getLogPath());
        await vscode.window.showTextDocument(logUri);
    },
    'coco.openWelcome': () => {
        vscode.commands.executeCommand(
            'markdown.showPreview',
            vscode.Uri.joinPath(context.extensionUri, 'assets', 'welcome.md')
        );
    },
    'coco.openSettings': () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:mingzhao.coco');
    },
    'coco.toggleAutocomplete': () => {
        const config = vscode.workspace.getConfiguration('coco');
        const enabled = config.get<boolean>('enableAutoComplete');
        config.update('enableAutoComplete', !enabled, vscode.ConfigurationTarget.Global);
    },
});


export function registerCommands(context: vscode.ExtensionContext) {
    const commands = commandsMap(context);
    for (const [command, handler] of Object.entries(commands)) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, handler)
        );
    }

    // Register the completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('*', {
        provideCompletionItems
    },
        ' '// TODO: ...completionKeys.split('')
    );
    context.subscriptions.push(completionProvider);
}
