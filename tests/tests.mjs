

import {test, describe, it} from 'node:test';
import fc from 'fast-check';

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


// Code under test
const roundtrip_intEncoder_to_intDecoder = function(integers_and_extra_widths) {
    const integers = [];
    const bit_widths = [];

    integers_and_extra_widths.forEach(([integer, extra_width]) => {
        const bit_width = integer.toString(2).length + extra_width;
        integers.push(integer);
        bit_widths.push(bit_width);
    });

    const ints_to_encode = Array.from(integers);
    const N = ints_to_encode.length;
    const encoded = Array.from(intEncoder(integers, bit_widths));
    const decoded = Array.from(intDecoder(integers, N, bit_widths));
    return ints_to_encode === decoded;

}


// Properties
describe('properties', () => {
    it('should encode any array of positive integers and valid bit widths to bytes, and decode them to recoer the original array.', () => {
        fc.assert(fc.property(fc.array(fc.tuple(fc.nat(), fc.nat({max: 4}))), roundtrip_intEncoder_to_intDecoder))
    })

});