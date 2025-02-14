import { intDecoder } from "../../../factories.mts";

import { argv } from "node:process";

const BIT_WIDTHS = [14,4,5];

const decoded = intDecoder(Uint8Array.fromHex(argv.slice(3).join("")),
                                3*parseInt(argv[2]),
                                BIT_WIDTHS,
                                );

while (true) {
    const result = decoded.next();
    if (result.done) {
        break;
    }
    const year = result.value + 1; // datetime.MINYEAR == 1 in Python
    const month_index = decoded.next().value;
    const day = decoded.next().value + 1;
    
    console.log((new Date(year, month_index, day)).toDateString());


}
