import { CodeSnippet, CompletionOptions } from '..';

interface ModelTemplate {
    template: ((args: {prefix: string, suffix: string, snippets: CodeSnippet[]}) => string);
    completionOptions: Partial<CompletionOptions>;
}

// REF: https://huggingface.co/stabilityai/stable-code-3b
const stableCodeFimTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `<fim_prefix>${args.prefix}<fim_suffix>${args.suffix}<fim_middle>`; 
    },
    completionOptions: {
      stop: ['<fim_prefix>', '<fim_suffix>', '<fim_middle>', '<|endoftext|>'],
    },
};
  
const codegemmaFimTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `<|fim_prefix|>${args.prefix}<|fim_suffix|>${args.suffix}<|fim_middle|>`; 
    },
    completionOptions: {
        stop: ['<|fim_prefix|>', '<|fim_suffix|>', '<|fim_middle|>', '<|file_separator|>', '<end_of_turn>', '<eos>'],
    }
};

// REF: https://arxiv.org/pdf/2402.19173.pdf section 5.1
const starcoder2FimTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string, snippets: CodeSnippet[]}): string => {
      const otherFiles = args.snippets.length === 0 ? '' : '<file_sep>' + args.snippets.map((snippet) => { return snippet.contents; }).join('<file_sep>') + '<file_sep>';
  
      return `${otherFiles}<fim_prefix>${args.prefix}<fim_suffix>${args.suffix}<fim_middle>`;
    },
    completionOptions: {
      stop: ['<fim_prefix>', '<fim_suffix>', '<fim_middle>', '<|endoftext|>', '<file_sep>'],
    },
};

const codeLlamaFimTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `<PRE> ${args.prefix} <SUF>${args.suffix} <MID>`;
    },
    completionOptions: { 
        stop: ['<PRE>', '<SUF>', '<MID>', '<EOT>'] 
    },
};

// https://huggingface.co/deepseek-ai/deepseek-coder-1.3b-base
const deepseekFimTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `<｜fim▁begin｜>${args.prefix}<｜fim▁hole｜>${args.suffix}<｜fim▁end｜>`;
    },
    completionOptions: {
      stop: ['<｜fim▁begin｜>', '<｜fim▁hole｜>', '<｜fim▁end｜>', '//'],
    },
};
  
const deepseekFimTemplateWrongPipeChar: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `<|fim▁begin|>${args.prefix}<|fim▁hole|>${args.suffix}<|fim▁end|>`;
    },
    completionOptions: { stop: ['<|fim▁begin|>', '<|fim▁hole|>', '<|fim▁end|>'] },
};
  
const gptCompletionTemplate: ModelTemplate = {
    template: (args: {prefix: string, suffix: string}): string => { 
        return `\`\`\`
${args.prefix}[BLANK]${args.suffix}
\`\`\`

Fill in the blank to complete the code block. Your response should include only the code to replace [BLANK], without surrounding backticks.`;
    },
    completionOptions: { stop: ['\n'] },
};

export function getModelTemplate(model: string): ModelTemplate {
    model = model.toLowerCase();

    if (model.startsWith('starcoder') ||
        model.startsWith('star-coder') ||
        model.startsWith('starchat') ||
        model.startsWith('octocoder') ||
        model.startsWith('stable')) {
        return stableCodeFimTemplate;
    }

    if (model.startsWith('codegemma')) {
        return codegemmaFimTemplate;
    }

    if (model.startsWith('deepseek')) {
        return deepseekFimTemplate;
    }

    if (model.startsWith('gpt') ||
        model.startsWith('davinci-002') ||
        model.startsWith('claude')) {
        return gptCompletionTemplate;
    }

    return stableCodeFimTemplate;
}