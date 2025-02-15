import datetime
import math
from typing import Iterator, Iterable

from sub_byte.factories import int_encoder, int_decoder


BIT_WIDTHS = [(datetime.MAXYEAR - datetime.MINYEAR).bit_length(),
              (12 - 1).bit_length(),
              (31 - 1).bit_length(),
             ]


def encoder(dates: Iterable[datetime.date])-> Iterator[int]:
    for date in dates:
        yield from int_encoder([date.year - datetime.MINYEAR,
                                date.month - 1,
                                date.day - 1,
                               ],
                                BIT_WIDTHS)
