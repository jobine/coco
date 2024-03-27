import * as vscode from 'vscode';

export function getExtensionUri(): vscode.Uri {
    return vscode.extensions.getExtension('Coco.coco')!.extensionUri;
}