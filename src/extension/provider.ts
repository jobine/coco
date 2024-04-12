import * as vscode from 'vscode';
import { isSupported } from '../util/vscode';
import { info, warn } from '../util/log';
import { AsyncLock } from '../util/lock';
import { LanguageDescriptor, detectLanguage, comment, languages } from './language';
import { StatusBarState, setupStatusBar, resetStatusBar } from './statusBar';
import { config } from './config';
import { checkModel, downloadModel } from '../model/model';

const lock = new AsyncLock();

function fileHeader(content: string, filepath: string, languageDescriptor: LanguageDescriptor | undefined) : string {
    let res = content;

    if (languageDescriptor) {
        let pathMarker = comment(`Path: ${filepath}`, languageDescriptor);
        if (pathMarker) {
            res = pathMarker + '\n' + res;
        }

        let typeMarker = comment(`Language: ${languageDescriptor.name}`, languageDescriptor);
        if (typeMarker) {
            res = typeMarker + '\n' + res;
        }
    }

    return res;
}

async function preparePrompt(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext) {
    let text = document.getText();
    let offset = document.offsetAt(position);
    let prefix = text.slice(0, offset);
    let suffix = text.slice(offset);

    let language = detectLanguage(document);
    
    if (language) {
        prefix = fileHeader(prefix, document.uri.fsPath, languages[language]);
    }

    return {
        prefix,
        suffix
    };
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
    if (!config.enableAutocomplete) {
        return ;
    }

    let modelExists = await checkModel(config.model);

    if (!modelExists) {
        // Ask for downloding
        let download = await vscode.window.showInformationMessage(`Model '${config.model}' doesn't exist, click 'Yes' to download.`, 'Yes', 'No');
        if (download === 'No') {
            info('Ignore downloading model since user abandoned.');
            return ;
        }

        try {
            setupStatusBar(StatusBarState.Downloading);
            await downloadModel(config.model);
        } catch (e) {
            warn('Error in downloading model: ', e);
        } finally {
            resetStatusBar();
        }
    }

    if (!isSupported(document)) {
        info(`Unsupported document: ${document.uri.toString()} ignored.`);
        return;
    }

    try {
        setupStatusBar(StatusBarState.Loading);
    
        if (!await delayCompletion(config.delay, cancellationToken)) {
            return ;
        }

        if (cancellationToken.isCancellationRequested) {
            return ;
        }

        return await lock.inLock(async () => {
            let prepared = await preparePrompt(document, position, context);
            if (cancellationToken.isCancellationRequested) {
                return ;
            }

            // completions
            let completions: string | undefined = undefined;

            // TODO: check if in cache
            let cache = null;

            if (!!cache) {
                completions = cache;
            } else {

            }
            
            // checkModel(config.model);
            completions = '# Test Code Generation\n def test():\n\tpass\n\n```';

            return [{
                insertText: completions,
                range: new vscode.Range(position, position)
            }];
        });
    } catch (e) {
        warn('Error inline completion: ', e);
    } finally {
        resetStatusBar();
    }

    return undefined;
}

export function registerProviders(context: vscode.ExtensionContext) {
    // Register the inline completion provider
    const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**' },
        { provideInlineCompletionItems }
    );

    context.subscriptions.push(inlineCompletionProvider);
}
