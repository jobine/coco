import { info } from '../util/log';
import { config } from '../extension/config';
import { URL } from 'url';

export async function checkModel() {
    let endpoint = config.endpoint;

    let res = await fetch(`${endpoint}`)
}