import math
import itertools
from collections.abc import Iterable, Sequence, Iterator, Callable, Hashable


def get_bits(x: int) -> str:
    """ E.g. get_bits(13) == '1101' because:
             x == 13  =>  get_bits()
             bin(x) == '0b1101'
             bin(x).removeprefix == '1101'
    """ 
    return bin(x).removeprefix('0b')

def make_encoder_and_decoder(symbols: Iterable[Hashable]) -> tuple[Callable, Callable]:
    # TODO: Use new Generics syntax instead of Hashable
    
    # Remove repeated symbols, preserving their order.
    # A set will not preserve order, hence dict.fromkeys.  
    # Requires dict to be ordered (Python >= 3.6 ish, 
    # otherwise use collections.OrderedDict).
    decodings = list(dict.fromkeys(symbols))

    encodings = {symbol : decodings.index(symbol) for symbol in decodings}

    try:
        bytes([max(encodings.values())])
    except ValueError as e:
        raise Exception(f'Too many symbols to encode in a single byte, in {symbols=}')
        


    bits_per_symbol = len(get_bits(max(encodings.values())))
    num_symbols_per_byte = 8 // bits_per_symbol

    assert num_symbols_per_byte >= 1, ('More than one byte needed to uniquely encode each symbol. '
                                       'Use a byte stream encoding library instead, e.g. protobuf.dev')


    def encoder(symbols_: Iterable[Hashable], /) -> Iterator[int]:
        """ Generates integers from an iterable of symbols 
            (the data to be encoded).  Call "bytes" directly on 
            this (no need to iterate over it) to encode symbols
            in binary, suitable for the decoder.  
        """


        # Grab the maximum number of symbols we can squeeze into a byte.
        for symbols_this_byte in itertools.batched(symbols_, num_symbols_per_byte):

            # Initialise with the first symbol.  This could be re-written Matlab
            # style instead, using symbols_this_byte[0] and symbols_this_byte[1:]
            symbols_iter = iter(symbols_this_byte)
            
            # It doesn't matter if num == 0, as 0 is still yielded, and when 
            # bytes is called on a generator yielding 0s, it produces a 
            # null byte for each 0, using leading zero bits as part
            # of the encoding, to pack more symbols in each byte.
            num = encodings[next(symbols_iter)]
            for symbol in symbols_iter:
                # Bit-shift left to make room for the next symbol's encoded bits.
                num <<= bits_per_symbol

                # Add in the encoded symbol to the 0-bit space the left bit-shift
                # just created.  
                num += encodings[symbol]

            # Encoded as an integer for debugging.  Call bytes directly on this 
            # generator of ints to encode symbols as binary, e.g. for round-tripping.
            yield num

    masks_and_offsets = []
    # For each symbol's index, i
    for i in range(num_symbols_per_byte):

        num_zeros_to_prepad = bits_per_symbol * i
        num_zeros_to_postpad = 8 - num_zeros_to_prepad - bits_per_symbol

        assert num_zeros_to_prepad + bits_per_symbol + num_zeros_to_postpad == 8

        # Create a mask for the Byte that can be used to extract 
        # the bits for symbol i via "&" (bit-wise AND).
        byte_mask_bit_chars = f"0b{'0'*num_zeros_to_prepad}{'1'*bits_per_symbol}{'0'*num_zeros_to_postpad}"

        # Check we have constructed exactly 8 bits for a byte.
        # Minus 2 for Python syntax's '0b' prefix for a binary literal int
        assert len(byte_mask_bit_chars) - 2 == 8

        byte_mask = int(byte_mask_bit_chars, base=2)

        masks_and_offsets.append((byte_mask, num_zeros_to_postpad))

    def decoder(
        encoded: bytes,
        num_symbols: int, # to support decoding a final byte that was not fully 
                          # packed.  E.g. if the total number of symbols to
                          # decode is known from additional metadata.
                          # In such bytes, the left most leading zero-bits should 
                          # be ignored, not treated as symbol 0.
        /,
        ) -> Iterator[Hashable]:

        masks_and_offsets_ = masks_and_offsets

        for byte in encoded:

            # Only read off the last symbols from the middle up to 
            # the end of the byte, if the byte is not fully packed
            if num_symbols < num_symbols_per_byte:
                masks_and_offsets_ = masks_and_offsets[-num_symbols:]

            # This should run through num_symbols iterations
            for (mask, num_zeros_postpadded) in masks_and_offsets_:

                # Apply byte mask, and right bit-shift to remove the
                # number of zero-bits, the symbol's encoded bits were 
                # left-bit shifted by in the encoded byte.
                index = (mask & byte) >> num_zeros_postpadded
                yield decodings[index]
                num_symbols -= 1

            if not num_symbols:
                return

    return encoder, decoder, bits_per_symbol, num_symbols_per_byte


