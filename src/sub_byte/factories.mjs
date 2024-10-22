// node --disable-warning ExperimentalWarning encoder.mjs

const GetBits = function (x) {
  return x.toString(2);
};

export class ValueSet extends Set {
  Natural;
}

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
};

const firstNItems = function* (iterable, N) {
  let numItemsYielded = 0;
  for (const item of iterable) {
    if (numItemsYielded >= N) {
      break;
    }
    yield item;
    numItemsYielded++;
  }
};

const getBitWidth = function (bitWidths) {
  const result = bitWidths.next();

  return result.done ? 0 : result.value;
};

const getN1Bits = function (N) {
  // e.g. getN1Bits(8) === 0b11111111 === 255
  return (1 << N) - 1;
};

export const intEncoder = function* (integers, uintBitWidths) {
  // If uintBitWidths is an iterable that is not a container, e.g.
  // a once only iterator from a generator, it must yield the
  // same number of items or more, than the number of integers.
  // i.e. the caller must handle cacheing of bit widths (or
  // repeating without cacheing).
  const bitWidths = cycle(uintBitWidths);

  // Initialise a buffer (an ordinary Number)
  // and a bit counter.
  let buffer = 0;
  let bitsUsed = 0;
  let i = 0;

  for (const integer of integers) {
    const bitWidth = getBitWidth(bitWidths, integer, i);

    if (bitWidth === 0) {
      throw new Error(
        `No bit width specified for integer: ${integer},  number: ${i}`,
      );
    }

    // Left bitshift to make room for next integer, add it in and bump the bit counter.
    buffer <<= bitWidth;
    buffer |= integer;
    bitsUsed += bitWidth;

    // Yield encoded bytes from the buffer
    while (bitsUsed >= 8) {
      // subtract bits to be yielded from counter, and yield them
      bitsUsed -= 8;
      yield (buffer >> bitsUsed) & getN1Bits(8);
    }

    // Clear buffer of yielded bytes (only keep bitsUsed bits).
    buffer = buffer & getN1Bits(bitsUsed);
    // ((1 << (bitsUsed + 1)) -1);

    i++;
  }

  // Clear the buffer of any encoded integers, that were too few
  // to completely fill a whole byte.
  if (bitsUsed >= 1) {
    // left shift the data to start from the highest order bits (no leading zeros)
    yield buffer << (8 - bitsUsed);
  }
};

export const intDecoder = function* (encoded, numInts, uintBitWidths) {
  // If uintBitWidths is an
  // iterable that is not a container, e.g.
  // a once only iterator from a generator, the total of all its
  // widths yielded, must be >= (8 * the number of bytes from encoded)
  // i.e. as for int_encoder above, the caller must handle cacheing
  // of bit widths (or repeating them without cacheing).
  const bitWidths = firstNItems(cycle(uintBitWidths), numInts);
  const bytes = encoded?.[Symbol.iterator]() || encoded;

  // Initialise a buffer (an ordinary Number)
  // and a bit counter.
  let buffer = 0;
  let bufferWidthInBits = 0;
  let i = 0;

  let j = 0;

  let uintBitWidth = getBitWidth(bitWidths, "'No bytes read yet. '", i);

  for (const byte of bytes) {
    // Left shift 8 bits to make room for byte
    buffer <<= 8;
    // Bump counter by 8
    bufferWidthInBits += 8;
    // Add in byte to buffer
    buffer |= byte;

    if (bufferWidthInBits < uintBitWidth) {
      continue;
    }

    while (bufferWidthInBits >= uintBitWidth && uintBitWidth > 0) {
      bufferWidthInBits -= uintBitWidth;
      // mask is uintBitWidth 1s followed by bufferWidthInBits 0s up
      // the same total width as the original value of bufferWidthInBits
      // before the previous line.
      const mask = getN1Bits(uintBitWidth);
      yield (buffer >> bufferWidthInBits) & mask;
      j++;
      // Clear buffer of the bits that made up the yielded integer
      // (the left most uintBitWidth bits)
      buffer &= getN1Bits(bufferWidthInBits);

      uintBitWidth = getBitWidth(bitWidths, byte, i);
    }

    if (uintBitWidth === 0) {
      if (bufferWidthInBits >= 1 && j < numInts) {
        throw new Error(
          `Not enough uint bit widths to decode remaining bits ${bufferWidthInBits} with.`,
        );
      }

      break;
    }

    i++;
  }
};

const getBitWidthsEncodingsAndDecodings = function (valueSets) {
  const bitWidths = [];
  const decodings = [];
  const encodings = [];

  for (const valueSet of valueSets) {
    const uniqueSymbols = new Set(valueSet);
    if (uniqueSymbols.size <= 1) {
      throw new Error(
        "All symbols are the same, or no symbols have been given." +
          `Value set: ${valueSet}`,
      );
    }

    const bitWidth = GetBits(uniqueSymbols.size - 1).length;
    bitWidths.push(bitWidth);

    const decoding = Array.from(uniqueSymbols.values());
    decodings.push(decoding);

    const encoding = Object.fromEntries(
      decoding.entries().map(([i, s]) => [s, i]),
    );
    encodings.push(encoding);
  }

  return [bitWidths, encodings, decodings];
};

const mapSymbolsToIntegers = function* (symbols, encodings) {
  const encodingsIterator = cycle(encodings);

  for (const symbol of symbols) {
    const encoding = encodingsIterator.next().value;
    yield encoding[symbol];
  }
};

const mapIntegersToSymbols = function* (integers, decodings) {
  const decodingsIterator = cycle(decodings);

  for (const integer of integers) {
    const decoding = decodingsIterator.next().value;
    yield decoding[integer];
  }
};

const MakeSubByteEncoderAndDecoder = function (valueSets) {
  const [bitWidths, encodings, decodings] =
    getBitWidthsEncodingsAndDecodings(valueSets);

  const encoder = function* (symbols) {
    for (const byte of intEncoder(
      mapSymbolsToIntegers(symbols, encodings),
      bitWidths,
    )) {
      yield byte;
    }
  };

  const decoder = function* (encoded, numSymbols) {
    const symbols = mapIntegersToSymbols(
      intDecoder(encoded, numSymbols, bitWidths),
      decodings,
    );
    for (const symbol of symbols) {
      yield symbol;
    }
  };

  return [encoder, decoder, bitWidths, encodings, decodings];
};

export default MakeSubByteEncoderAndDecoder;
