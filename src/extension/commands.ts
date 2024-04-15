import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { config } from './config';
import { getLogPath } from '../util/vscode';

export const commandsMap: (context: vscode.ExtensionContext) => {[command: string]: (...args: any) => any} = (context) => ({
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
        config.enableAutocomplete = !config.enableAutocomplete;
    },
});