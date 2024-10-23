
from hypothesis import given, settings
from hypothesis.strategies import sampled_from, lists, integers


from sub_byte import factories


extra_bit_widths_strategy = lists(integers(min_value=0, max_value=6))



seeds_strategy = lists(sampled_from(list(ops_and_seeds_codecs.ALL_SEEDS)))

@given(lists(integers))
@given(extra_bit_widths_strategy)
@settings(max_examples = 25, deadline = None)
def test_roundtrip_py_int_encoder_and_decoder(list_of_ints, extra_widths):
    num_seeds = len(list_of_ints)
    bit_widths = [len(factories.get_bits(i)) - 2 + extra_width
                  for (i, extra_width) in zip(list_of_ints, extra_widths)
                 ]
    encoded = bytes(factories.int_encoder(list_of_ints, bit_widths))
    decoded = list(factories.int_decoder(encoded, num_seeds, bit_widths))
    assert list_of_ints == decoded, f'{list_of_ints=}, {bit_widths=}, {encoded=}, {decoded=}'


