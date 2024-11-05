import itertools

from hypothesis import given, settings
from hypothesis.strategies import lists, integers
import pytest

from sub_byte import factories

from .test_encoder import _output_from_cmd

extra_bit_widths_strategy = lists(
    integers(min_value=0, max_value=6),
    min_size=1,
)


@given(ints=lists(integers(min_value=0)), extra_widths=extra_bit_widths_strategy)
@settings(max_examples=10, deadline=None)
def test_roundtrip_py_int_encoder_and_decoder(ints, extra_widths):
    num_seeds = len(ints)
    bit_widths = [
        # Can't use int.bit_length without extra code, as (0).bit_length() == 0
        len(factories.get_bits(i)) + extra_width
        for (i, extra_width) in zip(ints, itertools.cycle(extra_widths))
    ]
    encoded = bytes(factories.int_encoder(ints, bit_widths))
    decoded = list(factories.int_decoder(encoded, num_seeds, bit_widths))
    assert ints == decoded, f"{ints=}, {bit_widths=}, {encoded=}, {decoded=}"

@pytest.mark.skip(reason="Flakey.  Sporadically hangs in CI. ")
def test_JS_int_encoder_decoder_roundtrip_hardcoded_test_data():
    output, result = _output_from_cmd("npm test")

    assert result.returncode == 0, output
