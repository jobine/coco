import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { getLogPath } from '../util/vscode';
import { get } from 'http';

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
    }
});


export function registerCommands(context: vscode.ExtensionContext) {
    const commands = commandsMap(context);
    for (const [command, handler] of Object.entries(commands)) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, handler)
        );
    }
}