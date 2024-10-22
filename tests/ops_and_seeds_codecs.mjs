import SYMBOLS from "./symbols.json" //with { type: "json" };

import { MakeSubByteEncoderAndDecoder } from "../src/subByte/factories.mjs";

const ALL_SEEDS = SYMBOLS.SEEDS;

// Sets are not necessary for MakeSubByteEncoderAndDecoder (it will
// create a set itself).  They're just to make writing the
// tests a little easier.
export const UNIQUE_SEEDS = new Set(SYMBOLS.SEEDS.map((x) => x.toString()));
export const OPS = new Set(SYMBOLS.OPS);

export const [encodeOps, decodeOps, bitsPerOp, numOpsPerByte] =
  MakeSubByteEncoderAndDecoder(OPS);
export const [encodeSeeds, decodeSeeds, bitsPerSeed, numSeedsPerByte] =
  MakeSubByteEncoderAndDecoder(ALL_SEEDS);
