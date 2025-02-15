import { intDecoder } from "../../../factories.mts";

import { argv } from "node:process";

const BIT_WIDTHS = [14,4,5];

const decoded = intDecoder(Uint8Array.fromHex(argv.slice(2).join("")),
                                null,
                                BIT_WIDTHS,
                                );

while (true) {
    const result = decoded.next();
    if (result.done) {
        break;
    }
    const year = result.value;  // -1 + datetime.MINYEAR;  // datetime.MINYEAR == 1 in Python 
    const month = decoded.next().value;
    const day = decoded.next().value;
    
    // Error check.
    if (year * month * day == 0) {
        throw new Error(`Year, month and day must all be >= 1`);
    }

    const dateString = `Year: ${year}, month: ${month}, day: ${day}`;
    console.log(dateString);
    
    // const yearString = year.toString().padStart(4,"0");
    // const monthString = month.toString().padStart(2,"0");
    // const dayString = day.toString().padStart(2,"0");

    // Laboriously forming the ISO date string 
    // is more robust than using the 
    // Date(year, month_index, day) constructor, as:
    // "Values from 0 to 99 map to the years 1900 to 1999. 
    //  All other values are the actual year. "
    //  Obviously.
    //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date 
    // And on top of that, quirks such as this must be navigated:
    // > d = new Date('0001-01-01T00:00:00Z')
    // 0001-01-01T00:00:00.000Z
    // > d.toDateString()
    // 'Sun Dec 31 0000'
    // 
    //


}
