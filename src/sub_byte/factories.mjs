// node --disable-warning ExperimentalWarning encoder.mjs


const GetBits = function(x) {
    return x.toString(2)
} 


export class ValueSet extends Set {
    Natural
};



export class IntegerWidthsInCycle {
    constructor() {


    };
    static FromMaximumIntegers(max_ints) {

    };
};


const cycle = function*(items) {
    while (true) {
        for (const item of items) {
            yield item;
        }
    }
}

const getBitWidth = function(bit_widths) {
    
    const result = bit_widths.next();

    return result.done ? 0 : result.value;
}

const getN1Bits = function(N) {
    // e.g. getN1Bits(8) === 0b11111111 === 255
    return ((1 << (N + 1)) -1);
}

const intEncoder = function* (integers, uint_bit_widths) {

    // If uint_bit_widths is an iterable that is not a container, e.g.
    // a once only iterator from a generator, it must yield the 
    // same number of items or more, than the number of integers.  
    // i.e. the caller must handle cacheing of bit widths (or 
    // repeating without cacheing).
    const bit_widths = cycle(uint_bit_widths);

    // Initialise a buffer (an ordinary Number) 
    // and a bit counter.
    let buffer = 0;
    let bits_used = 0;
    let i=0;


    for (const integer of integers) {
        const bit_width = getBitWidth(bit_widths, integer, i);


        if (bit_width === 0) {
            throw new Error(`No bit width specified for integer: ${integer},  number: ${i}`);
        }
        
        // Left bitshift to make room for next integer, add it in and bump the bit counter.
        buffer <<= bit_width;
        buffer |= integer;
        bits_used += bit_width;


        // Yield encoded bytes from the buffer
        while (bits_used >= 8) {
            // subtract bits to be yielded from counter, and yield them
            bits_used -= 8;
            yield (buffer >> bits_used) & getN1Bits(8);
        }

        // Clear buffer of yielded bytes (only keep bits_used bits).
        buffer = buffer & getN1Bits(bits_used);
        // ((1 << (bits_used + 1)) -1);


        i++;
    }

    // Clear the buffer of any encoded integers, that were too few 
    // to completely fill a whole byte.
    if (bits_used >= 1) {
        yield buffer;
    }

};


const int_decoder = function* (encoded, uint_bit_widths, num_symbols) {

    // If uint_bit_widths is an 
    // iterable that is not a container, e.g.
    // a once only iterator from a generator, the total of all its 
    // widths yielded, must be >= (8 * the number of bytes from encoded)  
    // i.e. as for int_encoder above, the caller must handle cacheing 
    // of bit widths (or repeating them without cacheing).
    const bit_widths = cycle(uint_bit_widths);
    const bytes = encoded?.[Symbol.iterator]() || encoded;

    // Initialise a buffer (an ordinary Number) 
    // and a bit counter.
    let buffer = 0;
    let buffer_width_in_bits = 0;
    let i=0;

    let uint_bit_width=getBitWidth(bit_widths,"No items yet. ", i);
    

    for (const byte of bytes) {

        // Left shift 8 bits to make room for byte
        buffer <<= 8;
        // Bump counter by 8
        buffer_width_in_bits += 8;
        // Add in byte to buffer
        buffer |= byte;


        if (buffer_width_in_bits < uint_bit_width) {
            continue;
        }
        
        while (buffer_width_in_bits >= uint_bit_width && uint_bit_width > 0) {
            buffer_width_in_bits -= uint_bit_width;
            // mask is uint_bit_width 1s followed by buffer_width_in_bits 0s up 
            // the same total width as the original value of buffer_width_in_bits
            // before the previous line.
            const mask = getN1Bits(uint_bit_width);
            yield (buffer >> buffer_width_in_bits) & mask;
            
            // Clear buffer of the bits that made up the yielded integer
            // (the left most uint_bit_width bits)
            buffer &= getN1Bits(buffer_width_in_bits);

            uint_bit_width=getBitWidth(bit_widths, byte, i);
        }

        if (uint_bit_width === 0) {

            if (buffer_width_in_bits >= 1) {
                throw new Error(`Not enough uint bit widths to decode remaining bits ${buffer_width_in_bits} with.`)
            }

            break;
        }

        i++
    }
}


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