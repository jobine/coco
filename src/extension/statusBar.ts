import * as vscode from 'vscode';
import { config } from './config';

const enableItemText = (enabled: boolean | undefined) => enabled ? '$(rocket) CoCo' : '$(circle-slash) CoCo';
const loadingItemText = (state: StatusBarState) => state === StatusBarState.Loading ? '$(loading~spin) CoCo' : enableItemText(config.enableAutocomplete);
const downloadingItemText = (state: StatusBarState) => state === StatusBarState.Downloading ? '$(gear~spin) Pulling model - CoCo' : loadingItemText(state);

let lastStatusBarItem: vscode.StatusBarItem | undefined = undefined;
let statusBarFalseTimeout: NodeJS.Timeout | undefined = undefined;

export enum StatusBarState {
    None,
    Loading,
    Downloading
}

export function resetStatusBar() {
    statusBarFalseTimeout = setTimeout(() => {
        setupStatusBar();
    }, 100);
}

export function setupStatusBar(state: StatusBarState = StatusBarState.None) {
    if (state === StatusBarState.Loading) {
        clearTimeout(statusBarFalseTimeout);
        statusBarFalseTimeout = undefined;
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

    statusBarItem.text = downloadingItemText(state);
    statusBarItem.command = 'coco.toggleAutocomplete';

    if (lastStatusBarItem) {
        lastStatusBarItem.dispose();
    }

    statusBarItem.show();

    lastStatusBarItem = statusBarItem;

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('coco')) {
            setupStatusBar(state);
        }
    });
}