import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { getLogPath, getConfigValue, updateConfigValue } from '../util/vscode';

// const config = vscode.workspace.getConfiguration('coco');
// // const messageHeader = config.get<string>('messageHeader') || '';
// const apiEndpoint = config.get<string>('endpoint') || 'http://localhost:11434';
// const apiModel = config.get<string>('model') || 'gemma:7b';
// const autocompleteEnabled = config.get<boolean>('enableAutoComplete') || false;

function preprocessMessageHeader(document: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('coco');
    const messageHeader = config.get<string>('messageHeader') || '';
    const res = messageHeader
                .replace('{LANG}', document.languageId)
                .replace('{FILE_NAME}', document.fileName)
                .replace('{PROJECT_NAME}', vscode.workspace.name || 'Untitled');

    return res;
}

async function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, cancellationToken: vscode.CancellationToken) {
    // create a completion item.
    const item = new vscode.CompletionItem('Code Copilot Autocomplete.');
    // set the insert text to a placeholder.
    item.insertText = new vscode.SnippetString('${1:}');

    let responsePreview = true;
    let promptWindowSize = 2000;
    let responsePreviewMaxTokens = 50;
    let temperature = 0.7;

    const config = vscode.workspace.getConfiguration('coco');
    const apiEndpoint = config.get<string>('endpoint') || 'http://localhost:11434';
    const apiModel = config.get<string>('model') || 'starcoder2:7b-q4_K_M';

    // wait before initializing ollama to reduce compute usage.
    if (responsePreview) {
        await new Promise(resolve => setTimeout(resolve, 0 * 1000));
    }

    if (cancellationToken.isCancellationRequested) {
        return [item];
    }

    // set the label & insert text to a shortened, non-stream response
    if (responsePreview) {
        let prompt = document.getText(new vscode.Range(document.lineAt(0).range.start, position));
        prompt = prompt.substring(Math.max(0, prompt.length - promptWindowSize), prompt.length);

        const previewResponse = await axios.post(
            apiEndpoint, 
            {
                model: apiModel,
                prompt: preprocessMessageHeader(document) + prompt,
                stream: false,
                raw: true,
                options: {
                    num_predict: responsePreviewMaxTokens,
                    temperature: temperature,
                    stop: ['\n', '```']
                }
            },
            {
                cancelToken: new axios.CancelToken((c) => {
                    const cancelPost = function() {
                        c('CoCo autocomplete request was termniated by completion cancel.');
                    };

                    cancellationToken.onCancellationRequested(cancelPost);
                })
            }
        );

        if (previewResponse.data.response.trim() !== '') {
            let res_data = previewResponse.data.response.trimStart();
            console.log('preview data:', res_data);
            item.label = res_data;
            item.insertText = res_data;
        }
    }

    // set the documentation to a message
    item.documentation = new vscode.MarkdownString('Press `Enter` to get an autocompletion.');
    // set the command to trigger the completion
    if (!responsePreview) {
        item.command = {
            command: 'coco.autocomplete',
            title: 'Coco Autocomplete',
            arguments: [cancellationToken]
        };
    }

    // return the completion item.
    return [item];
}

async function autocompleteCommand(textEditor: vscode.TextEditor, cancellationToken?: vscode.CancellationToken) {
    const config = vscode.workspace.getConfiguration('coco');
    const promptWindowSize = config.get<number>('promptWindowSize') || 2000;

    const document = textEditor.document;
    const position = textEditor.selection.active;

    // get the current prompt
    let prompt = document.getText(new vscode.Range(document.lineAt(0).range.start, position));
    prompt = prompt.substring(Math.max(0, prompt.length - promptWindowSize), prompt.length);

    // show a progress message
}

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
    },
    'coco.openSettings': () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:mingzhao.coco');
    },
    'coco.toggleAutocomplete': () => {
        const enabled = getConfigValue<boolean>('enableAutoComplete');
        updateConfigValue('enableAutoComplete', !enabled);
    },
});


export function registerCommands(context: vscode.ExtensionContext) {
    const commands = commandsMap(context);
    for (const [command, handler] of Object.entries(commands)) {
        context.subscriptions.push(
            vscode.commands.registerCommand(command, handler)
        );
    }

    // Register the completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('*', {
        provideCompletionItems
    },
        ' '// TODO: ...completionKeys.split('')
    );
    context.subscriptions.push(completionProvider);
}
