import { argv } from "node:process";

import {
  OPS,
  encodeOps,
  UNIQUE_SEEDS,
  encodeSeeds,
} from "./ops_andSeeds_codecs.mjs";

for (const [set, encoder] of [
  [OPS, encodeOps],
  [UNIQUE_SEEDS, encodeSeeds],
]) {
  const symbols = argv.slice(2).filter((arg) => set.has(arg));
  if (symbols.length === 0) {
    continue;
  }

  const encodedHexStrs = encoder(symbols.values()).map((x) =>
    Number(x).toString(16).padStart(2, "0"),
  );

  console.log(encodedHexStrs.reduce((s1, s2) => `${s1}${s2}`));
}
