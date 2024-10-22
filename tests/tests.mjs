

import {test, describe, it} from 'node:test';


import assert from 'node:assert';
// import fc from 'fast-check';

import {intEncoder, intDecoder} from '../src/sub_byte/factories.mjs';

// // Code under test
// const contains = (text, pattern) => text.indexOf(pattern) >= 0;

// // Properties
// describe('properties', () => {
//   // string text always contains itself
//   it('should always contain itself', () => {
//     fc.assert(fc.property(fc.string(), (text) => contains(text, text)));
//   });
//   // string a + b + c always contains b, whatever the values of a, b and c
//   it('should always contain its substrings', () => {
//     fc.assert(
//       fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
//         // Alternatively: no return statement and direct usage of expect or assert
//         return contains(a + b + c, b);
//       }),
//     );
//   });
// });

// fc.configureGlobal({ numRuns: 4 });

// Code under test
const roundtrip_intEncoder_to_intDecoder = function(integers_and_extra_widths) {
    const integers = [];
    const bit_widths = [];

    integers_and_extra_widths.forEach(([integer, extra_width]) => {
        const bit_width = integer.toString(2).length + extra_width;
        integers.push(integer);
        bit_widths.push(8); //bit_width);
    });

    const N = integers.length;
    const encoded = Array.from(intEncoder(integers, bit_widths));
    const decoded = Array.from(intDecoder(encoded, N, bit_widths));
    // return integers === decoded;
    return (decoded.length === N) && decoded.every((x,i) => x === integers[i] );
    // return integers_and_extra_widths.every((tuple) => integers.includes(tuple[0]));

}


// // Properties
// describe('properties', () => {
//     it('should encode any array of positive integers and valid bit widths to bytes, and decode them to recover the original array.', () => {
//         fc.assert(fc.property(fc.array(fc.tuple(fc.nat({max:255}), fc.nat({max: 0})),{maxLength:4}), roundtrip_intEncoder_to_intDecoder))
//     })

// });

describe('round_trip', function () {
    const tests = [
        {integers: [1, 2], bit_widths: [8]},
        {integers: [0,1, 2,3,4,5,6,7,8,9,10,11,12,13,14,15], bit_widths: [4]},
        {integers: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,0,0,0,0,0,1,1,0,1], bit_widths: [1]},
        {integers: [1000, 2,1234], bit_widths: [10,2,11]},
    ];
  
    tests.forEach(({integers, bit_widths}) => {
      it(`correctly roundtrips ${integers} using widths: ${bit_widths}`, function () {
        const N = integers.length;
        const encoded = Array.from(intEncoder(integers, bit_widths));
        const decoded = Array.from(intDecoder(encoded, N, bit_widths));
        assert.deepEqual(decoded, integers);
      });
    });
  });