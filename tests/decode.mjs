import { argv } from 'node:process';

import {OPS, decode_ops, UNIQUE_SEEDS, decode_seeds} from './ops_and_seeds_codecs.mjs';


const num_symbols = parseInt(argv[2]);


const Uint8ArrayFromHexStr=function(hex_str) {
    if (hex_str.length % 2) {
        throw new Error(`Hex strings must have even length.  Got: "${hex_str}" (length: ${hex_str.length})`);
    }
    const num_bytes = hex_str.length / 2;
    const encoded = new Uint8Array(num_bytes);
    for (let i = 0; i < num_bytes; i++) {
        const hex_byte = hex_str.slice(2*i,2*i+2);
        encoded[i] = parseInt(hex_byte, 16);
    }
    return encoded;
}


for (const [line, decoder] of [[argv[3], decode_ops], [argv[4], decode_seeds]]) {
    
    if (!line.trim()) {
        continue;
    }

    const bytes_from_hex = Uint8ArrayFromHexStr(line);

    const decoded_symbols = Array.from(decoder(bytes_from_hex, num_symbols));

    console.log(decoded_symbols.reduce((s_1, s_2)=>`${s_1} ${s_2}`)); 
}