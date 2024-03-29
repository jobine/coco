import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export function getExtensionUri(): vscode.Uri {
    return vscode.extensions.getExtension('mingzhao.coco')!.extensionUri;
}

export function getGlobalPath(): string {
    // This is ~/.codecopilot
    const globalPath = path.join(os.homedir(), '.codecopilot');

    if (!fs.existsSync(globalPath)) {
        fs.mkdirSync(globalPath);
    }

    return globalPath;
}

export function getLogPath(): string {
    // This is ~/.codecopilot/codecopilot.log
    const logPath = path.join(getGlobalPath(), 'codecopilot.log');

    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
    }

    return logPath;
}
