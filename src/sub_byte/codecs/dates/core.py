import datetime
import math
from typing import Iterator, Iterable

from sub_byte.factories import int_encoder, int_decoder

# To avoid having to write special code for Javascript
# for dates in the first century AD
MIN_YEAR = 100
# Because "Values from 0 to 99 map to the years 1900 to 1999. 
# All other values are the actual year. "
# Obviously.
# https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date


BIT_WIDTHS = [datetime.MAXYEAR.bit_length(),
              (12).bit_length(),
              (31).bit_length(),
             ]


def year_month_day_tuple_offsets_from_dates(dates: Iterable[datetime.date]) -> Iterator[int]:
    for date in dates:
        yield date.year
        yield date.month
        yield date.day


def encoder(dates: Iterable[datetime.date])-> Iterator[int]:
    yield from int_encoder(
            year_month_day_tuple_offsets_from_dates(dates),
            BIT_WIDTHS,
            )
