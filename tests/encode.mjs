import { argv } from 'node:process';

import {OPS, encode_ops, UNIQUE_SEEDS, encode_seeds} from './ops_and_seeds_codecs.mjs';


for (const [set, encoder] of [[OPS, encode_ops], [UNIQUE_SEEDS, encode_seeds]]) {

    const symbols = argv.slice(2).filter((arg) => set.has(arg));
    if (symbols.length === 0) {
        continue;
    }

    const encoded_hex_strs = encoder(symbols.values()).map((x) => Number(x).toString(16).padStart(2,"0"));

    console.log(encoded_hex_strs.reduce((s_1, s_2) => `${s_1}${s_2}`));
}