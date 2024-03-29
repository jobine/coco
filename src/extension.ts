import * as vscode from 'vscode';
import { activateExtension } from './activation/activate';

async function dynamicImportAndActivate(context: vscode.ExtensionContext) {
	// const {activateExtension} = await import('./activation/activate');

	try {
		await activateExtension(context);
	} catch (error) {
		console.log("Error activating extension: ", error);

		vscode.window.showInformationMessage(
			'Error activating the Coco extension.',
			'View Logs',
			'Retry',
		).then((selection) => {
			if (selection === 'View Logs') {
				vscode.commands.executeCommand('coco.viewLogs');
			} else if (selection === 'Retry') {
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}
		});
	}
}

export function activate(context: vscode.ExtensionContext) {
	dynamicImportAndActivate(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
