// node --disable-warning ExperimentalWarning encoder.mjs


const GetBits = function(x) {
    return x.toString(2)
} 


export const MakeSubByteEncoderAndDecoder = function(symbols) {

    const unique_symbols = new Set(symbols);
    const decodings = Array.from(unique_symbols.values());

    const encodings = Object.fromEntries(decodings.entries().map(([i,s]) => [s,i]));

    if (unique_symbols.size > 256) {
        throw new Error(`Too many symbols to encode in a single byte, in ${symbols}`)
    }

    const bits_per_symbol = GetBits(unique_symbols.size - 1).length;
    const num_symbols_per_byte = Math.floor(8 / bits_per_symbol);

    if (num_symbols_per_byte <= 0) {
        throw new Error('More than one byte needed to uniquely encode each symbol. '
                       +' Use a byte stream encoding library instead, e.g. protobuf.dev'
                       );
    }

    const encoder = function* (symbols_iterator) {
        for (let result = symbols_iterator.next(); 
             result.done===false;
             result = symbols_iterator.next()) {
            
            let num = encodings[result.value];

            const rest_of_symbols_in_this_byte = symbols_iterator.take(num_symbols_per_byte-1);

            rest_of_symbols_in_this_byte.forEach((symbol) => {
                num <<= bits_per_symbol;
                num += encodings[symbol];
            });

            yield num;
        }

    };

    let masks_and_offsets = [];

    for (let j=0; j < num_symbols_per_byte; j++) {
        
        const num_zeros_to_prepad = bits_per_symbol * j;
        const num_zeros_to_postpad = 8 - num_zeros_to_prepad - bits_per_symbol;

        if (num_zeros_to_prepad + bits_per_symbol + num_zeros_to_postpad != 8) {
            throw new Error('Internal calculation of padding bits within byte error: '
                  +`${num_zeros_to_prepad}, ${bits_per_symbol}, ${num_zeros_to_postpad}`);
        }

        const byte_mask_bit_chars = `${'0'.repeat(num_zeros_to_prepad)}${'1'.repeat(bits_per_symbol)}${'0'.repeat(num_zeros_to_postpad)}`;

        if (byte_mask_bit_chars.length != 8) {
            throw new Error(`Byte bit mask not length 8 (should contain 8 1s or 0s): ${byte_mask_bit_chars}`);
        }

        
        const byte_mask = parseInt(byte_mask_bit_chars, 2);

        masks_and_offsets.push([byte_mask, num_zeros_to_postpad]);

    }
    
    const decoder = function* (encoded, num_symbols) {
        let masks_and_offsets_ = masks_and_offsets;
        for (const byte of encoded) {
            if (num_symbols < num_symbols_per_byte) {
                masks_and_offsets_ = masks_and_offsets.slice(-num_symbols);
            }
            for (const [mask, num_trailing_zeros] of masks_and_offsets_) {
                const index = (mask & byte) >> num_trailing_zeros;
                yield decodings[index]; 
                num_symbols -= 1;
            }

            if (num_symbols <= 0) {
                return;
            }
        }
    }

    return [encoder, decoder, bits_per_symbol, num_symbols_per_byte];
}

