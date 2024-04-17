import * as vscode from 'vscode';
import { isSupported } from '../util/vscode';
import { info, error } from '../util/log';
import { AsyncLock } from '../util/lock';
import { LanguageDescriptor, detectLanguage, comment, languages } from '../model/language';
import { StatusBarState, setupStatusBar } from './statusBar';
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
        let stopWords: string[] = [];

        if (language) {
            let languageDescriptor = languages[language];
            stopWords = languageDescriptor.stop || [];
            prefix = this.#fileHeader(prefix, document.uri.fsPath, languages[language]);
        }

        const { template, completionOptions } = getModelTemplate(config.model);
        const prompt = template({prefix: prefix, suffix: suffix, snippets: []});
        const stop = [...stopWords, ...(completionOptions.stop || []), '\n\n', '/src/', '```'];

        info(`Prompt: ${prompt}`);
        info(`Stop: ${stop}`);
    
        return {
            prompt,
            stop
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

    async #generateCompletion(prompt: string, stop: string[], canceled: Function): Promise<string> {
        // Receive tokens
        let res = '';

        for await (let tokens of generate(prompt, stop)) {
            // info('generate: ' + tokens.response);
            
            if (canceled && canceled()) {
                break;
            }
            
            res += tokens.response;
        }

        // Remove <EOT>
        if (res.endsWith('<EOT>')) {
            res = res.slice(0, res.length - 5);
        }

        // Trim ends of all lines since sometimes the AI completion will add extra spaces
        res = res.split('\n').map((v) => v.trimEnd()).join('\n');

        return res;
    }

    async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, cancellationToken: vscode.CancellationToken): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[] | undefined> {
        if (!config.enableAutocomplete) {
            return ;
        }
    
        try {
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
                    error('Error in downloading model: ', e);
                } finally {
                    setupStatusBar();
                }
            }

            if (cancellationToken.isCancellationRequested) {
                info('Canceled completion request.');
                return ;
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
                    info('Canceled completion request.');
                    return ;
                }
        
                return await this.#lock.inLock(async () => {
                    let prepared = this.#preparePrompt(document, position, context);
        
                    // completions
                    let completion: string | undefined = undefined;
        
                    // TODO: need check cache
                    let cache = config.enableCache ? null : null;
        
                    if (!!cache) {
                        completion = cache;
                    } else {
                        completion = await this.#generateCompletion(prepared.prompt, prepared.stop, () => cancellationToken.isCancellationRequested);
                        info(`Completion: ${completion}`);
                        // TODO: update cache
                    }

                    if (cancellationToken.isCancellationRequested) {
                        info('Canceled completion request.');
                        return ;
                    }

                    if (completion && completion.trim() !== '') {
                        return [{
                            insertText: completion,
                            range: new vscode.Range(position, position)
                        }];
                    }
                });
            } finally {
                setupStatusBar();
            }
        } catch (e) {
            error('Error inline completion: ', e);
            vscode.window.showInformationMessage('The LLM service is not available. Please launch the Ollama service if you are using a local LLM.', 'OK');
        }
    
        return undefined;
    }
}