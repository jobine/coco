interface BaseCompletionOptions {
    temperature?: number;
    topP?: number;
    topK?: number;
    minP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    mirostat?: number;
    stop?: string[];
    maxTokens?: number;
    numThreads?: number;
    keepAlive?: number;
    raw?: boolean;
    stream?: boolean;
}

interface RangeInFileWithContents {
    filepath: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    contents: string;
}

export interface CompletionOptions extends BaseCompletionOptions {
    model: string;
}

export type CodeSnippet = RangeInFileWithContents & {
    score: number;
}