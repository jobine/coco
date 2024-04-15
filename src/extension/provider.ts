import * as vscode from 'vscode';
import { isSupported } from '../util/vscode';
import { info, warn } from '../util/log';
import { AsyncLock } from '../util/lock';
import { LanguageDescriptor, detectLanguage, comment, languages } from '../model/language';
import { StatusBarState, setupStatusBar, refreshStatusBar } from './statusBar';
import { config } from './config';
import { checkModel, downloadModel, generate } from '../model/model';
import { getModelTemplate } from '../model/templates';

export class CocoInlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    #lock: AsyncLock;
    #context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.#lock = new AsyncLock();
        this.#context = context;
    }

    #fileHeader(content: string, filepath: string, languageDescriptor: LanguageDescriptor | undefined) : string {
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

    #preparePrompt(document: vscode.TextDocument, position: vscode.Position, inlineCompletinoContext: vscode.InlineCompletionContext) {
        let text = document.getText();
        let offset = document.offsetAt(position);
        let prefix = text.slice(0, offset);
        let suffix = text.slice(offset);
    
        let language = detectLanguage(document);
        
        if (language) {
            prefix = this.#fileHeader(prefix, document.uri.fsPath, languages[language]);
        }
    
        return {
            prefix,
            suffix
        };
    }

    async #delayCompletion(delayInMillis: number, cancellationToken: vscode.CancellationToken): Promise<boolean> {
        if (delayInMillis < 0) {
            return false;
        }
    
        await new Promise(resolve => setTimeout(resolve, delayInMillis));
    
        if (cancellationToken.isCancellationRequested) {
            return false;
        }
    
        return true;
    }

    async #generateCompletion(prefix: string, suffix: string, canceled: Function): Promise<string> {
        const { template, completionOptions } = getModelTemplate(config.model);
    
        const prompt = template({prefix: prefix, suffix: suffix, snippets: []});
    
        // Receive tokens
        let res = '';
        let totalLines = 1;
        let blockStack: ('(' | '[' | '{')[] = [];

        outer: for await (let tokens of generate(prompt, completionOptions.stop)) {
            if (canceled && canceled()) {
                break;
            }

            console.log('line: ' + tokens.response);
        }
        
        return '# Test Code Generation\n def test():\n\tpass\n\n';
    }

    async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, cancellationToken: vscode.CancellationToken): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[] | undefined> {
        if (!config.enableAutocomplete) {
            return ;
        }
    
        // check model exists
        let modelExists = await checkModel(config.model);
        if (!modelExists) {
            // check if user ignored the model
            if (this.#context.globalState.get('coco.ignored-model') === config.model) {
                info(`Ignored model ${ config.model } since user abandoned.`);
                return ;
            }

            // Ask for downloding
            let download = await vscode.window.showInformationMessage(`Model '${config.model}' doesn't exist, click 'Yes' to download.`, 'Yes', 'No');
            if (download === 'No') {
                info(`Ignore downloading model ${ config.model } since user abandoned.`);
                this.#context.globalState.update('coco.ignored-model', config.model);
                return ;
            }
    
            // downloading model
            try {
                setupStatusBar(StatusBarState.Downloading);
                await downloadModel(config.model);
            } catch (e) {
                warn('Error in downloading model: ', e);
            } finally {
                setupStatusBar();
            }
        }
    
        // check document schema matched
        if (!isSupported(document)) {
            info(`Unsupported document: ${document.uri.toString()} ignored.`);
            return;
        }
    
        // completion generating
        try {
            setupStatusBar(StatusBarState.Loading);
        
            if (!await this.#delayCompletion(config.delay, cancellationToken)) {
                return ;
            }
    
            if (cancellationToken.isCancellationRequested) {
                return ;
            }
    
            return await this.#lock.inLock(async () => {
                let prepared = await this.#preparePrompt(document, position, context);
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
                completions = await this.#generateCompletion(prepared.prefix, prepared.suffix, () => cancellationToken.isCancellationRequested);
    
                return [{
                    insertText: completions,
                    range: new vscode.Range(position, position)
                }];
            });
        } catch (e) {
            warn('Error inline completion: ', e);
        } finally {
            setupStatusBar();
        }
    
        return undefined;
    }
}