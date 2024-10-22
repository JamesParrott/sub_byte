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


const cycle = function* (items) {
    while (true) {
        for (const item of items) {
            yield item;
        }
    }
}

const first_N_items = function* (iterable, N) {
    
    let num_items_yielded = 0;
    for (const item of iterable) {
        if (num_items_yielded >= N) {
            break;
        }
        yield item;
        num_items_yielded++;
    }
}

const getBitWidth = function(bit_widths) {
    
    const result = bit_widths.next();

    return result.done ? 0 : result.value;
}

const getN1Bits = function(N) {
    // e.g. getN1Bits(8) === 0b11111111 === 255
    return (1 << N) -1;
}

export const intEncoder = function* (integers, uint_bit_widths) {

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
        // left shift the data to start from the highest order bits (no leading zeros)
        yield buffer << (8 - bits_used);
    }

};


export const intDecoder = function* (encoded, num_ints, uint_bit_widths) {

    // If uint_bit_widths is an 
    // iterable that is not a container, e.g.
    // a once only iterator from a generator, the total of all its 
    // widths yielded, must be >= (8 * the number of bytes from encoded)  
    // i.e. as for int_encoder above, the caller must handle cacheing 
    // of bit widths (or repeating them without cacheing).
    const bit_widths = first_N_items(cycle(uint_bit_widths), num_ints);
    const bytes = encoded?.[Symbol.iterator]() || encoded;

    // Initialise a buffer (an ordinary Number) 
    // and a bit counter.
    let buffer = 0;
    let buffer_width_in_bits = 0;
    let i=0;

    let j=0;

    let uint_bit_width=getBitWidth(bit_widths,"'No bytes read yet. '", i);
    

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
            j++;
            // Clear buffer of the bits that made up the yielded integer
            // (the left most uint_bit_width bits)
            buffer &= getN1Bits(buffer_width_in_bits);

            uint_bit_width=getBitWidth(bit_widths, byte, i);
        }

        if (uint_bit_width === 0) {

            if (buffer_width_in_bits >= 1 && j < num_ints) {
                throw new Error(`Not enough uint bit widths to decode remaining bits ${buffer_width_in_bits} with.`)
            }

            break;
        }

        i++
    }
}


const MakeSubByteEncoderAndDecoder = function(value_sets) {

    const unique_symbols = new Set(symbols);
    if (unique_symbols.size <= 1) {
        throw new Error('All symbols are the same, or no symbols have been given.'
                       +`Set(symbols): ${unique_symbols}` 
                       );
    }
    const decodings = Array.from(unique_symbols.values());

    const encodings = Object.fromEntries(decodings.entries().map(([i,s]) => [s,i]));

    const bits_per_symbol = GetBits(unique_symbols.size - 1).length;

    
    if (bits_per_symbol <= 0) {
        throw new Error(`Internal error: bits per symbol: ${bits_per_symbol}. `
                       +`Unique symbols: ${unique_symbols}` 
                       +'The symbols given each require zero bits to encode.'
                       );
    }

    const num_symbols_per_byte = Math.floor(8 / bits_per_symbol);



    const encoder = function* (symbols_data) {

        // If symbols doesn't have Symbol.iterator, just try to
        // use symbols.

        // Deal with bit_widths?  
        for (const byte of intEncoder(symbols_data.map((x) => encodings[x]))) {
            yield byte;
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