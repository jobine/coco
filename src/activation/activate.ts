import * as vscode from 'vscode';
import * as path from 'path';
import { CocoExtension } from '../extension/cocoExtension';

export async function activateExtension(context: vscode.ExtensionContext) {
    const extension = new CocoExtension(context);

    extension.register();
    
    vscode.commands.executeCommand('coco.openWelcome');

    throw new Error('This is an error');

    if (!context.globalState.get('coco.installed')) {
        context.globalState.update('coco.installed', true);
    }
}