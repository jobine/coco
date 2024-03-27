import * as vscode from 'vscode';
import * as path from 'path';
import { getExtensionUri } from '../util/vscode';

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    vscode.commands.executeCommand(
        'markdown.showPreview',
        vscode.Uri.file(
            context.asAbsolutePath(
                path.join(getExtensionUri().fsPath, 'media', 'welcome.md')
            )
        )
    );

    if (!context.globalState.get('coco.installed')) {
        context.globalState.update('coco.installed', true);
    }
}