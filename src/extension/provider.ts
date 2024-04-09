import * as vscode from 'vscode';
import axios from 'axios';
import { getConfigValue, isSupported } from '../util/vscode';
import { info } from '../util/log'
import { AsyncLock } from '../util/lock';

const lock = new AsyncLock();

function preprocessMessageHeader(document: vscode.TextDocument) {
    // const config = vscode.workspace.getConfiguration('coco');
    // const messageHeader = config.get<string>('messageHeader') || '';
    const messageHeader = getConfigValue<string>('messageHeader');
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
    let responsePreviewMaxTokens = 1000;
    let temperature = 0.5;

    // const config = vscode.workspace.getConfiguration('coco');
    // const apiEndpoint = config.get<string>('endpoint') || 'http://localhost:11434';
    // const apiEndpoint = config.get<string>('endponit') as string;
    const apiEndpoint = getConfigValue<string>('endpoint');
    const apiModel = getConfigValue<string>('model');

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
                    stop: ['<END>', '<EOD>', '<EOT>', '```']
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

async function delayCompletion(delayInMillis: number, cancellationToken: vscode.CancellationToken): Promise<boolean> {
    if (delayInMillis < 0) {
        return false;
    }

    await new Promise(resolve => setTimeout(resolve, delayInMillis));

    if (cancellationToken.isCancellationRequested) {
        return false;
    }

    return true;
}

async function provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, cancellationToken: vscode.CancellationToken): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
    if (!getConfigValue<boolean>('enableAutoComplete')) {
        return ;
    }

    if (!isSupported(document)) {
        info(`Unsupported document: ${document.uri.toString()} ignored.`);
    }

    // delay completion
    const delayInMillis = getConfigValue<number>('delay');
    if (!await delayCompletion(delayInMillis, cancellationToken)) {
        return ;
    }

    try {

    }

    return undefined;
}

export function registerProviders(context: vscode.ExtensionContext) {
    // Register the completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('*', {
        provideCompletionItems
    },
        ' '// TODO: ...completionKeys.split('')
    );
    context.subscriptions.push(completionProvider);
}
