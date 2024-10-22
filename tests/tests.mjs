

import {test, describe, it} from 'node:test';


import assert from 'node:assert';

import {intEncoder, intDecoder} from '../src/sub_byte/factories.mjs';



function randInt(x) {
    return Math.floor(Math.random() * x);
  }

describe('round_trip', function () {
    const tests = [
        {integers: [1, 2], bit_widths: [8]},
        {integers: [0,1, 2,3,4,5,6,7,8,9,10,11,12,13,14,15], bit_widths: [4]},
        {integers: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,0,0,0,0,0,1,1,0,1], bit_widths: [1]},
        {integers: [1000, 2,1234], bit_widths: [10,2,11]},
    ];

    for (let i = 0; i < 16; i++) {
        const n = randInt(50);
        const integers = [];
        const bit_widths = [];
        for (let j=0;  j < n; j++) {
            const integer = randInt(1000000);
            const bit_width = integer.toString(2).length + randInt(4);
            
            integers.push(integer)
            bit_widths.push(bit_width);
        }
        tests.push({integers: integers, bit_widths: bit_widths})
    }
  
    tests.forEach(({integers, bit_widths}) => {
      it(`correctly roundtrips ${integers} using widths: ${bit_widths}`, function () {
        const N = integers.length;
        const encoded = Array.from(intEncoder(integers, bit_widths));
        const decoded = Array.from(intDecoder(encoded, N, bit_widths));
        assert.deepEqual(decoded, integers);
      });
    });
  });