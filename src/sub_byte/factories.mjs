// node --disable-warning ExperimentalWarning encoder.mjs


const GetBits = function(x) {
    return x.toString(2)
} 

export class ValueSet extends Set {
    Natural
};


const MakeSubByteEncoderAndDecoder = function(symbols) {

    const unique_symbols = new Set(symbols);
    if (unique_symbols.size <= 1) {
        throw new Error('All symbols are the same, or no symbols have been given, so there '
                       +'is little point in using this library - just count them and '
                       +'transmit the total number of symbols.'
                       +`Set(symbols): ${unique_symbols}` 
                       );
    }
    const decodings = Array.from(unique_symbols.values());

    const encodings = Object.fromEntries(decodings.entries().map(([i,s]) => [s,i]));

    if (unique_symbols.size > 256) {
        throw new Error(`Too many symbols to encode in a single byte, in ${symbols}`)
    }

    const bits_per_symbol = GetBits(unique_symbols.size - 1).length;

    
    if (bits_per_symbol <= 0) {
        throw new Error(`Internal error: bits per symbol: ${bits_per_symbol}. `
                       +`Unique symbols: ${unique_symbols}` 
                       +'The symbols given each require zero bits to encode.'
                       );
    }

    const num_symbols_per_byte = Math.floor(8 / bits_per_symbol);

    // if (num_symbols_per_byte <= 0) {
    //     throw new Error('More than one byte needed to uniquely encode each symbol. '
    //                    +' Use a byte stream encoding library instead, e.g. protobuf.dev'
    //                    );
    // }

    const encoder = function* (symbols_data) {

        // If symbols doesn't have Symbol.iterator, just try to
        // use symbols.
        const iterator = symbols_data?.[Symbol.iterator]() || symbols_data;

        // Initialise a binary buffer (num, an ordinary Number) 
        // and a bit counter.
        let num = 0;
        let bits_used = 0;

        // This could be rewritten as a for...of loop over iterator, 
        // as we have already reference to it.  But multiple explicit 
        // calls to .next are easier to debug, (also called in 
        // the inner while loop) and emphasises the intent, without
        // requiring knowledge of JS deep magic.
        for (let result = iterator.next(); 
             !result.done === false;
             result = iterator.next()) {
            
            // let num = encodings[result.value];

            // const rest_of_symbols_in_this_byte = iterator.take(num_symbols_per_byte-1);


            // rest_of_symbols_in_this_byte.forEach((symbol) => {
            //     num <<= bits_per_symbol;
            //     num += encodings[symbol];
            //     // bits_used += bits_per_symbol;
            // });


            while (bits_used < 8 && result.done === false) {
                // Left bitshift to make room for next symbol's encoding.
                num <<= bits_per_symbol;
                // Add in the next symbol's encoding (overwriting  
                // the zero bits just created).
                num += encodings[result.value];
                bits_used += bits_per_symbol;

                // Get next symbol
                result = iterator.next()
            }

            // yield num;

            // Yield encoded bytes from the buffer
            while (bits_used >= 8) {}
                // subtract bits to be yielded from counter, and yield them
                bits_used -= 8;
                yield (num >> bits_used) & 255;
            // Bit shift any remaining unyielded bits that don't fill 
            // an entire byte to the highest order bits (128, 64, 32 etc.)
            num = (num << (8 - bits_used)) & 255 

        }

        // Clear the buffer of any encoded symbols, that were too few 
        // to completely fill the buffer.
        if (bits_used >= 1) {
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

export default MakeSubByteEncoderAndDecoder;