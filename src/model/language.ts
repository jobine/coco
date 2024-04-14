import vscode from 'vscode';
import path from 'path';

export type Language =
    // Web Languages
    | 'typescript'
    | 'javascript'
    | 'html'
    | 'css'
    | 'json'
    | 'yaml'
    | 'xml'

    // Generic languages that is popular in VS Code
    | 'java'
    | 'kotlin'
    | 'swift'
    | 'objective-c'
    | 'rust'
    | 'python'
    | 'c'
    | 'cpp'
    | 'go'
    | 'php'

    // Shell
    | 'bat'
    | 'shellscript'
;

export type LanguageDescriptor = {
    name: string,
    extensions: string[],
    filenames?: string[],
    comment?: { start: string, end?: string }
};

//
// List of well known languages
// 
// Extensions from: https://github.com/github-linguist/linguist/blob/master/lib/linguist/languages.yml
//

export const languages: { [key in Language]: LanguageDescriptor } = {
    // Web languages
    typescript: {
        name: 'Typescript',
        extensions: ['.ts', '.tsx', '.cts', '.mts'],
        comment: { start: '//' }
    },
    javascript: {
        name: 'Javascript',
        extensions: ['.js', '.jsx', '.cjs'],
        comment: { start: '//' }
    },
    html: {
        name: 'HTML',
        extensions: ['.htm', '.html'],
        comment: { start: '<!--', end: '-->' }
    },
    css: {
        name: 'CSS',
        extensions: ['.css', '.scss', '.sass', '.less'],
        // comment: { start: '/*', end: '*/' } // Disable comments for CSS - not useful anyway
    },
    json: {
        name: 'JSON',
        extensions: ['.json', '.jsonl', '.geojson'],
        // comment: { start: '//' } // Disable comments for CSS - not useful anyway
    },
    yaml: {
        name: 'YAML',
        extensions: ['.yml', '.yaml'],
        comment: { start: '#' }
    },
    xml: {
        name: 'XML',
        extensions: ['.xml'],
        comment: { start: '<!--', end: '-->' }
    },

    // Generic languages
    java: {
        name: 'Java',
        extensions: ['.java'],
        comment: { start: '//' }
    },
    kotlin: {
        name: 'Kotlin',
        extensions: ['.kt', '.ktm', '.kts'],
        comment: { start: '//' }
    },
    swift: {
        name: 'Swift',
        extensions: ['.swift'],
        comment: { start: '//' }
    },
    "objective-c": {
        name: 'Objective C',
        extensions: ['.h', '.m', '.mm'],
        comment: { start: '//' }
    },
    rust: {
        name: 'Rust',
        extensions: ['.rs', '.rs.in'],
        comment: { start: '//' }
    },
    python: {
        name: 'Python',
        extensions: ['.py', 'ipynb'],
        comment: { start: '#' }
    },
    c: {
        name: 'C',
        extensions: ['.c', '.h'],
        comment: { start: '//' }
    },
    cpp: {
        name: 'C++',
        extensions: ['.cpp', '.h'],
        comment: { start: '//' }
    },
    go: {
        name: 'Go',
        extensions: ['.go'],
        comment: { start: '//' }
    },
    php: {
        name: 'PHP',
        extensions: ['.aw', '.ctp', '.fcgi', '.inc', '.php', '.php3', '.php4', '.php5', '.phps', '.phpt'],
        comment: { start: '//' }
    },

    // Shell
    bat: {
        name: 'BAT file',
        extensions: ['.bat', '.cmd'],
        comment: { start: 'REM' }
    },
    shellscript: {
        name: 'Shell',
        extensions: ['.bash', '.sh'],
        comment: { start: '#' }
    }
};

const aliases: { [key: string]: Language } = {
    'typescriptreact': 'typescript',
    'javascriptreact': 'javascript',
    'jsx': 'javascript'
};

export function detectLanguage(document: vscode.TextDocument): Language | undefined {
    const filepath = document.uri.fsPath;
    const languageId = document.languageId;

    // Resolve alias
    if (!!languageId && aliases[languageId]) {
        return aliases[languageId];
    }

    // Resolve using language id
    if (!!languageId && !!languages[languageId as Language]) {
        return languageId as Language;
    }

    // Resolve using file extension
    let extname = path.extname(path.basename(filepath)).toLowerCase();

    for (let lang in languages) {
        let k = languages[lang as Language];

        for (let ext of k.extensions) {
            if (extname === ext) {
                return lang as Language;
            }
        }
    }

    return ;
}

export function comment(text: string, languageDescriptor: LanguageDescriptor): string | undefined {
    if (languageDescriptor.comment) {
        if (languageDescriptor.comment.end) {
            return `${languageDescriptor.comment.start} ${text} ${languageDescriptor.comment.end}`;
        } else {
            return `${languageDescriptor.comment.start} ${text}`;
        }
    }

    return ;
}