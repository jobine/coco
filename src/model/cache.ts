import { Hash, createHash } from 'crypto';

export class CompletionsCache {
    #hash: Hash;
    #capacity: number;
    #cach: { [key: string]: string | undefined };

    constructor(capacity: number = 1000) {
        this.#hash = createHash('sha1');
        this.#capacity = capacity;
        this.#cach = {};
    }

    #hashText(text: string): string {
        this.#hash.update(text);
        return this.#hash.digest('hex');
    }

    #extractCacheKey(args: { prefix: string, suffix: string | undefined }): string {
        if (args.suffix) {
            return this.#hashText(`${args.prefix} ##CURSOR## ${args.suffix}`);
        } else {
            return this.#hashText(args.prefix);
        }
    }
}

export const completionCache = new CompletionsCache();