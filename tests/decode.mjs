import { argv } from "node:process";

import { decodeOps, decodeSeeds } from "./ops_andSeeds_codecs.mjs";

const numSymbols = parseInt(argv[2]);

const Uint8ArrayFromHexStr = function (hexStr) {
  if (hexStr.length % 2) {
    throw new Error(
      `Hex strings must have even length.  Got: "${hexStr}" (length: ${hexStr.length})`,
    );
  }
  const numBytes = hexStr.length / 2;
  const encoded = new Uint8Array(numBytes);
  for (let i = 0; i < numBytes; i++) {
    const hexByte = hexStr.slice(2 * i, 2 * i + 2);
    encoded[i] = parseInt(hexByte, 16);
  }
  return encoded;
};

for (const [line, decoder] of [
  [argv[3], decodeOps],
  [argv[4], decodeSeeds],
]) {
  if (!line?.trim()) {
    continue;
  }

  const bytesFromHex = Uint8ArrayFromHexStr(line);

  const decodedSymbols = Array.from(decoder(bytesFromHex, numSymbols));

  console.log(decodedSymbols.reduce((s1, s2) => `${s1} ${s2}`));
}
