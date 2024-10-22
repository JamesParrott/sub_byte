// node --disable-warning ExperimentalWarning encoder.mjs


const GetBits = function(x) {
    return x.toString(2)
} 


export class ValueSet extends Set {
    Natural
};



// export class IntegerWidthsInCycle {
//     constructor() {


//     };
//     static FromMaximumIntegers(max_ints) {

//     };
// };


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


const getBitWidthsEncodingsAndDecodings = function(value_sets) {

    const bit_widths = [];
    const decodings = [];
    const encodings = [];

    for (const value_set of value_sets) {
        const unique_symbols = new Set(value_set);
        if (unique_symbols.size <= 1) {
            throw new Error('All symbols are the same, or no symbols have been given.'
                           +`Value set: ${value_set}` 
                           );
        }

        const bit_width = GetBits(unique_symbols.size - 1).length;
        bit_widths.push(bit_width);

        const decoding = Array.from(unique_symbols.values());
        decodings.push(decoding);

        const encoding = Object.fromEntries(decoding.entries().map(([i,s]) => [s,i]));
        encodings.push(encoding);
    }

    return [bit_widths, encodings, decodings];
}


const mapSymbolsToIntegers = function*(symbols, encodings) {

    const encodings_iterator = cycle(encodings);

    for (const symbol of symbols) {
        const encoding = encodings_iterator.next().value;
        yield encoding[symbol];
    }
}

const mapIntegersToSymbols = function*(integers, decodings) {

    const decodings_iterator = cycle(decodings);

    for (const integer of integers) {
        const decoding = decodings_iterator.next().value;
        yield decoding[integer];
    }
}


const MakeSubByteEncoderAndDecoder = function(value_sets) {


    const [bit_widths, encodings, decodings] = getBitWidthsEncodingsAndDecodings(value_sets);

    const encoder = function* (symbols) {
        for (const byte of intEncoder(mapSymbolsToIntegers(symbols, encodings), bit_widths)) {
            yield byte;
        }
    };

    
    const decoder = function* (encoded, num_symbols) {


        const symbols = mapIntegersToSymbols(intDecoder(encoded, num_symbols, bit_widths), decodings);
        for (const symbol of symbols) {
            yield symbol;
        }
    }

    return [encoder, decoder, bit_widths, encodings, decodings];
}

export default MakeSubByteEncoderAndDecoder;