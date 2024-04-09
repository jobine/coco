import * as vscode from 'vscode';

const statusBarItemText = (enabled: boolean | undefined) => enabled ? '$(rocket) CoCo' : '$(circle-slash) CoCo';
const statusBarItemTooltip = (enabled: boolean | undefined) => enabled ? 'CoCo Autocomplete is enabled.' : 'Click to enable CoCo Autocomplete.';

let lastStatusBarItem: vscode.StatusBarItem | undefined = undefined;
let statusBarFalseTimeout: NodeJS.Timeout | undefined = undefined;

export function stopStatusBarLoading() {
    statusBarFalseTimeout = setTimeout(() => {
        setupStatusBar(true, false);
    }, 100);
}

export function setupStatusBar(enabled: boolean | undefined, loading?: boolean) {
    if (loading !== false) {
        clearTimeout(statusBarFalseTimeout);
        statusBarFalseTimeout = undefined;
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

    statusBarItem.text = loading ? '$(loading~spin) CoCo' : statusBarItemText(enabled);
    statusBarItem.tooltip = statusBarItemTooltip(enabled);
    statusBarItem.command = 'coco.toggleAutocomplete';

    if (lastStatusBarItem) {
        lastStatusBarItem.dispose();
    }

    statusBarItem.show();

    lastStatusBarItem = statusBarItem;

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('coco')) {
            const config = vscode.workspace.getConfiguration('coco');
            const enabled = config.get<boolean>('enableAutoComplete');

            statusBarItem.dispose();
            setupStatusBar(enabled);
        }
    });
}