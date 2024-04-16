import * as vscode from 'vscode';
import { config } from './config';

export enum StatusBarState {
    None,
    Loading,
    Downloading
}

const enableItemText = (enabled: boolean | undefined) => enabled ? `$(rocket) ${config.model} - CoCo` : '$(circle-slash) CoCo';
const loadingItemText = (state: StatusBarState) => state === StatusBarState.Loading ? `$(loading~spin) ${config.model} - CoCo` : enableItemText(config.enableAutocomplete);
const downloadingItemText = (state: StatusBarState) => state === StatusBarState.Downloading ? `$(gear~spin) Pulling model ${config.model} - CoCo` : loadingItemText(state);

let lastStatusBarItem: vscode.StatusBarItem | undefined = undefined;
let statusBarFalseTimeout: NodeJS.Timeout | undefined = undefined;
let statusBarState: StatusBarState = StatusBarState.None;

export function refreshStatusBar() {
    statusBarFalseTimeout = setTimeout(() => {
        setupStatusBar(statusBarState);
    }, 100);
}

export function setupStatusBar(state: StatusBarState = StatusBarState.None) {
    statusBarState = state;

    if (statusBarState === StatusBarState.Loading) {
        clearTimeout(statusBarFalseTimeout);
        statusBarFalseTimeout = undefined;
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

    statusBarItem.text = downloadingItemText(statusBarState);
    statusBarItem.command = 'coco.openSettings';

    if (lastStatusBarItem) {
        lastStatusBarItem.dispose();
    }

    statusBarItem.show();

    lastStatusBarItem = statusBarItem;
}