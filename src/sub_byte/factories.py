import itertools
from collections.abc import Iterable, Iterator, Callable, Hashable, Sequence
import typing

import more_itertools


def get_bits(x: int) -> str:
    """E.g. get_bits(13) == '1101'."""
    return bin(x).removeprefix("0b")


def all_ones_bit_mask(n: int) -> int:
    """E.g. all_ones_bit_mask(8) == 255
    Invariant property:  len(get_bits(all_ones_bit_mask(n))) - 2
    """
    return (1 << n) - 1


def int_encoder(
    integers: Iterable[int],
    uint_bit_widths: Iterable[int],
) -> Iterator[int]:
    """If uint_bit_widths is an iterable that is not a container, e.g.
    a once only iterator from a generator, it must yield the
    same number of items or more, than len(integers).
    i.e. the caller must handle cacheing of bit widths (or
    repeating without cacheing).
    """
    bit_widths = itertools.cycle(uint_bit_widths)

    # Initialise a buffer (an ordinary Number)
    # and a bit counter.
    buffer = 0
    bits_used = 0

    for i, integer in enumerate(integers):
        bit_width = next(bit_widths, 0)

        if bit_width == 0:
            raise Exception(
                f"No bit width specified for integer: {integer},  number: {i}"
            )

        # Left bitshift to make room for next integer, add it in and bump the bit counter.
        buffer <<= bit_width
        buffer |= integer
        bits_used += bit_width

        # Yield encoded bytes from the buffer
        while bits_used >= 8:
            # subtract bits to be yielded from counter, and yield them
            bits_used -= 8
            yield (buffer >> bits_used) & all_ones_bit_mask(8)

        # Clear buffer of yielded bytes (only keep bits_used bits).
        buffer &= all_ones_bit_mask(bits_used)

    # Clear the buffer of any encoded integers, that were too few
    # to completely fill a whole byte.
    if bits_used >= 1:
        # left shift the data to start from the highest order bits (no leading zeros)
        yield buffer << (8 - bits_used)


def int_decoder(
    encoded: Iterable[int],
    num_ints: int,
    uint_bit_widths: Iterable[int]
) -> Iterator[int]:
    """If uint_bit_widths is an
    Iterable that is not a Container, e.g.
    # a once only iterator from a generator, the total of all its
    # widths yielded, must be >= (8 * the number of bytes from encoded)
    # i.e. as for int_encoder above, the caller must handle cacheing
    # of bit widths (or repeating them without cacheing).
    """
    bit_widths = itertools.islice(itertools.cycle(uint_bit_widths), num_ints)
    bytes_ = iter(encoded)

    # Initialise a buffer (an ordinary Number)
    # and a bit counter.
    buffer = 0
    buffer_width_in_bits = 0

    j = 0

    bit_width = next(bit_widths, 0)

    for i, byte in enumerate(bytes_):
        # Left shift 8 bits to make room for byte
        buffer <<= 8
        # Bump counter by 8
        buffer_width_in_bits += 8
        # Add in byte to buffer
        buffer |= byte

        if buffer_width_in_bits < bit_width:
            continue

        while buffer_width_in_bits >= bit_width and bit_width > 0:
            buffer_width_in_bits -= bit_width
            # mask is bit_width 1s followed by buffer_width_in_bits 0s up
            # the same total width as the original value of buffer_width_in_bits
            # before the previous line.
            mask = all_ones_bit_mask(bit_width)
            yield (buffer >> buffer_width_in_bits) & mask
            j += 1
            # Clear buffer of the bits that made up the yielded integer
            # (the left most bit_width bits)
            buffer &= all_ones_bit_mask(buffer_width_in_bits)

            bit_width = next(bit_widths, 0)

        if bit_width == 0:
            if buffer_width_in_bits >= 1 and j < num_ints:
                raise Exception(
                    f"Not enough uint bit widths to decode remaining bits {buffer_width_in_bits} with.",
                )

            break


def get_bit_widths_encodings_and_decodings(
    value_sets: Iterable[Iterable[Hashable]],
) -> tuple[list[int], list[dict[Hashable, int]], list[list[Hashable]]]:
    bit_widths = []
    decodings = []
    encodings = []

    for value_set in value_sets:
        # A set would not preserve the order of the elements 
        # in value_set, hence dict.fromkeys is used.
        decoding = list(dict.fromkeys((value_set)))
        if len(decoding) <= 1:
            raise Exception(
                "All symbols are the same, or no symbols have been given."
                f"Value set: {value_set}"
            )
        decodings.append(decoding)

        # Mapping starts at zero, so we subtract one from num of
        # total symbols to get highest int.
        binary_of_highest_mapped_int = get_bits(len(decoding) - 1)
        bit_width = len(binary_of_highest_mapped_int)
        bit_widths.append(bit_width)

        encoding = {symbol: i for i, symbol in enumerate(decoding)}
        encodings.append(encoding)

    return bit_widths, encodings, decodings


def map_symbols_to_integers[H: Hashable](
    symbols: Iterable[H],
    encodings: Iterable[dict[H, int]]
) -> Iterator[int]:
    for symbol, encoding in zip(symbols, itertools.cycle(encodings)):
        yield encoding[symbol]


def map_integers_to_symbols[H: Hashable](
    unsigned_integers: Iterable[int],
    decodings: Iterable[Sequence[H]]
) -> Iterator[H]:
    for unsigned_integer, decoding in zip(
        unsigned_integers, itertools.cycle(decodings)
    ):
        yield decoding[unsigned_integer]


def encoder_and_decoder_from_bit_widths_and_mappings[H: Hashable](
    bit_widths: list[int],
    encodings: list[dict[H, int]],
    decodings: list[list[H]], 
    ):

    def encoder(
        symbols: Iterable[H],
    ) -> Iterator[int]:
        for unsigned_integer in int_encoder(
            map_symbols_to_integers(symbols, encodings), bit_widths
        ):
            yield unsigned_integer

    def decoder(
        encoded: Iterable[int],
        number_of_symbols: int,
    ) -> Iterator[H]:
        for symbol in map_integers_to_symbols(
            int_decoder(encoded, number_of_symbols, bit_widths), decodings
        ):
            yield symbol

    return encoder, decoder


def make_sub_byte_encoder_and_decoder(
    value_sets: Iterable[Iterable[Hashable]],
) -> tuple[Callable[[Iterable[Hashable]], Iterator[int]],
           Callable[[Iterable[int], int], Iterator[Hashable]],
           list[int],
           list[dict[Hashable, int]],
           list[list[Hashable]]
          ]:

    bit_widths, encodings, decodings = get_bit_widths_encodings_and_decodings(
        value_sets
    )

    encoder, decoder = encoder_and_decoder_from_bit_widths_and_mappings(
        bit_widths, encodings, decodings)

    return encoder, decoder, bit_widths, encodings, decodings



def possible_numbers_of_symbols(
    b: Sequence[int],
    bit_widths: Iterable[int],  # Must be positive integers
) -> Iterator[int]:

    padding = [None] * 8
    bit_widths_subsequences = more_itertools.windowed(
        itertools.chain(padding, itertools.cycle(bit_widths)), 9
    )

    num_symbols = 0

    num_bits = 0

    for bit_widths_subsequence in bit_widths_subsequences:

        last_bit_width = bit_widths_subsequence[-1]
        
        if last_bit_width is None:
            raise Exception(
                f'{last_bit_width=} cannot be None (got: {bit_widths_subsequence=})'
            )


        if num_bits + last_bit_width > 8 * len(b):
            break

        num_symbols += 1

        assert last_bit_width >= 1
        num_bits += last_bit_width
    else:
        raise Exception(
            'Could not find last bit widths (up to 8). '
            'Ensure bit_widths is non-empty '
            f'(got: {bit_widths=}).'
        )

    up_to_last_8_bit_widths = bit_widths_subsequence[:9]

    last_byte = b[-1]
    last_byte_bits = get_bits(last_byte)
    __, __, last_byte_trailing_zero_bits = last_byte_bits.rpartition("1")
    num_zero_bits = len(last_byte_trailing_zero_bits)

    for one_of_last_bit_widths in reversed(up_to_last_8_bit_widths):
        yield num_symbols

        if one_of_last_bit_widths is None:
            break

        num_zero_bits -= one_of_last_bit_widths

        if num_zero_bits < 0:
            break

        num_symbols -= 1
