import { argv } from 'node:process';

import {encode_ops, encode_seeds} from '../src/sub_byte/codec.mjs';

import SYMBOLS from './symbols.json' with { type: 'json' };


const SEEDS = SYMBOLS.SEEDS;
const UNIQUE_SEEDS = new Set(SYMBOLS.SEEDS.map((x) => x.toString()));
const OPS = new Set(SYMBOLS.OPS);


for (const [set, encoder] of [[OPS, encode_ops], [UNIQUE_SEEDS, encode_seeds]]) {

    const symbols = argv.slice(2).filter((arg) => set.has(arg));
    if (symbols.length === 0) {
        continue;
    }

    const encoded_hex_strs = encoder(symbols.values()).map((x) => Number(x).toString(16).padStart(2,"0"));

    console.log(encoded_hex_strs.reduce((s_1, s_2) => `${s_1}${s_2}`));
}