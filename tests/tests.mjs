import { describe, it } from "node:test";

import assert from "node:assert";

import { intEncoder, intDecoder } from "../src/sub_byte/factories.mjs";

function randInt(x) {
  return Math.floor(Math.random() * x);
}

describe("round_trip", function () {
  const tests = [
    { integers: [1, 2], bitWidths: [8] },
    {
      integers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      bitWidths: [4],
    },
    {
      integers: [
        0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1,
        1, 0, 1,
      ],
      bitWidths: [1],
    },
    { integers: [1000, 2, 1234], bitWidths: [10, 2, 11] },
  ];

  for (let i = 0; i < 16; i++) {
    const n = randInt(50);
    const integers = [];
    const bitWidths = [];
    for (let j = 0; j < n; j++) {
      const integer = randInt(1000000);
      const bitWidth = integer.toString(2).length + randInt(4);

      integers.push(integer);
      bitWidths.push(bitWidth);
    }
    tests.push({ integers: integers, bitWidths: bitWidths });
  }

  tests.forEach(({ integers, bitWidths }) => {
    it(`correctly roundtrips ${integers} using widths: ${bitWidths}`, function () {
      const N = integers.length;
      const encoded = Array.from(intEncoder(integers, bitWidths));
      const decoded = Array.from(intDecoder(encoded, N, bitWidths));
      assert.deepEqual(decoded, integers);
    });
  });
});
