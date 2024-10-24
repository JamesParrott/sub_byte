import SYMBOLS from "./symbols.json" with { type: "json" };
// const SYMBOLS = await import('./symbols.json', { with: { type: "json" } });

import { MakeSubByteEncoderAndDecoder } from "../src/sub_byte/factories.mjs";

const ALL_SEEDS = SYMBOLS.SEEDS;

// Sets are not necessary for MakeSubByteEncoderAndDecoder (it will
// create a set itself).  They're just to make writing the
// tests a little easier.
export const UNIQUE_SEEDS = new Set(ALL_SEEDS.map((x) => x.toString()));
export const OPS = new Set(SYMBOLS.OPS);

export const [encodeOps, decodeOps, opsBitWidths, opsEncodings, opsDecodings] =
  MakeSubByteEncoderAndDecoder([OPS]);
export const [
  encodeSeeds,
  decodeSeeds,
  seedsBitWidths,
  seedsEncodings,
  seedsDecodings,
] = MakeSubByteEncoderAndDecoder([ALL_SEEDS]);
