//e.g. :
// cd tests
// >node --disable-warning ExperimentalWarning encode.mjs + + + "*" "*" + - // 1 4 5 7 25 75 2 100 9 10
// 014b
// 0346ac1d89
// >node --disable-warning ExperimentalWarning decode.mjs 8 014b
// + + + * * + - //
// >node --disable-warning ExperimentalWarning decode.mjs 10 " " 0346ac1d89
// 1 4 5 7 25 75 2 100 9 10


const GetBits = function (x: number): string {
  // E.g. GetBits(13) === '1101'
  return x.toString(2);
};

function* cycle<T>(items: Iterable<T>): IterableIterator<T> {
  while (true) {
    for (const item of items) {
      yield item;
    }
  }
};

function* firstNItems<T>(iterable: Iterable<T>, N: number): IterableIterator<T> {
  let numItemsYielded = 0;
  for (const item of iterable) {
    if (numItemsYielded >= N) {
      break;
    }
    yield item;
    numItemsYielded++;
  }
};

const getBitWidth = function (bitWidths: IterableIterator<number>): number {
  const result = bitWidths.next();

  return result.done ? 0 : result.value;
};

const allOnesBitMask = function (numberOfOnes: number): number {
  // e.g. allOnesBitMask(8) === 0b11111111 === 255
  return (1 << numberOfOnes) - 1;
};

export const intEncoder = function* (
    integers: Iterable<number>,
    uintBitWidths: Iterable<number>,
    ): IterableIterator<number> {
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
    const bitWidth = getBitWidth(bitWidths);

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
      yield (buffer >> bitsUsed) & allOnesBitMask(8);
    }

    // Clear buffer of yielded bytes (only keep bitsUsed bits).
    buffer &= allOnesBitMask(bitsUsed);

    i++;
  }

  // Clear the buffer of any encoded integers, that were too few
  // to completely fill a whole byte.
  if (bitsUsed >= 1) {
    // left shift the data to start from the highest order bits (no leading zeros)
    yield buffer << (8 - bitsUsed);
  }
};

export function* intDecoder(
    encoded: Iterable<number>,
    numInts: number,
    uintBitWidths: Iterable<number>,
  ): IterableIterator<number> {
  // If uintBitWidths is an
  // iterable that is not a container, e.g.
  // a once only iterator from a generator, the total of all its
  // widths yielded, must be >= (8 * the number of bytes from encoded)
  // i.e. as for int_encoder above, the caller must handle cacheing
  // of bit widths (or repeating them without cacheing).
  const bitWidths = firstNItems(cycle(uintBitWidths), numInts);

  // Initialise a buffer (an ordinary Number)
  // and a bit counter.
  let buffer = 0;
  let bufferWidthInBits = 0;
  let i = 0;

  let j = 0;

  let uintBitWidth = getBitWidth(bitWidths);

  for (const byte of encoded) {
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
      const mask = allOnesBitMask(uintBitWidth);
      yield (buffer >> bufferWidthInBits) & mask;
      j++;
      // Clear buffer of the bits that made up the yielded integer
      // (the left most uintBitWidth bits)
      buffer &= allOnesBitMask(bufferWidthInBits);

      uintBitWidth = getBitWidth(bitWidths);
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

type GenericEncoding<T extends string | number | symbol> = {
  [key in T]: number;
};

// function createObject<T extends string | number | symbol>(): GenericObject<T> {
//   const obj: any = {};
//   return obj;
// }

// const example = createObject();
// example.a = 42;
// example.b = 100;


export function getBitWidthsEncodingsAndDecodings<T extends string | number | symbol>(
      valueSets: T[][]): [number[], GenericEncoding<T>[], T[][]] {

  const bitWidths: number[] = [];
  const decodings: T[][] = [];
  const encodings: GenericEncoding<T>[] = [];

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
      decoding.map((s, i) => [s, i]),
    ) as GenericEncoding<T>;
    encodings.push(encoding);
  }

  return [bitWidths, encodings, decodings];
};

function* mapSymbolsToIntegers<T extends string | number | symbol>(
    symbols: T[], encodings: {[key in T]: number}[]): IterableIterator<number> {

  const encodingsIterator = cycle(encodings);

  for (const symbol of symbols) {
    const encoding = encodingsIterator.next().value;
    yield encoding[symbol];
  }
};

function* mapIntegersToSymbols<T>(integers: Iterable<number>, decodings:T[][]): IterableIterator<T> {
  const decodingsIterator = cycle(decodings);

  for (const integer of integers) {
    const decoding = decodingsIterator.next().value;
    yield decoding[integer];
  }
};

export function MakeSubByteEncoderAndDecoder<T extends string | number | symbol>(valueSets:T[][]) {
  const [bitWidths, encodings, decodings] =
    getBitWidthsEncodingsAndDecodings<T>(valueSets);

  const encoder = function* (symbols: T[]) {
    for (const positiveInteger of intEncoder(
      mapSymbolsToIntegers(symbols, encodings),
      bitWidths,
    )) {
      yield positiveInteger;
    }
  };

  const decoder = function* (encoded: Iterable<number>, numSymbols: number) {
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
