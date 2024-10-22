import SYMBOLS from "./symbols.json" //with { type: "json" };

import { MakeSubByteEncoderAndDecoder } from "../src/sub_byte/factories.mjs";

const ALL_SEEDS = SYMBOLS.SEEDS;

// Sets are not necessary for MakeSubByteEncoderAndDecoder (it will
// create a set itself).  They're just to make writing the
// tests a little easier.
export const UNIQUE_SEEDS = new Set(SYMBOLS.SEEDS.map((x) => x.toString()));
export const OPS = new Set(SYMBOLS.OPS);

export const [encode_ops, decode_ops, bits_per_op, num_ops_per_byte] =
  MakeSubByteEncoderAndDecoder(OPS);
export const [encode_seeds, decode_seeds, bits_per_seed, num_seeds_per_byte] =
  MakeSubByteEncoderAndDecoder(ALL_SEEDS);
