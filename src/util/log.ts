import * as vscode from 'vscode';

type Logger = {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    // error(message: string, ...args: any[]): void;
};

let logger: Logger | null = null;

// registerLogger(vscode.window.createOutputChannel('Llama Coder', { log: true }));
export function registerLogger(channel: vscode.LogOutputChannel) {
    logger = channel;
}

export function info(message: string, ...args: any[]) {
    if (logger) {
        logger.info(message, ...args);
    }
}

export function warn(message: string, ...args: any[]) {
    if (logger) {
        logger.warn(message, ...args);
    }
}