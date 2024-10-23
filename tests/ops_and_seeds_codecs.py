import json
import pathlib

from sub_byte.factories import make_sub_byte_encoder_and_decoder

SYMBOLS = json.loads((pathlib.Path(__file__).parent / "symbols.json").read_text())

ALL_SEEDS = [str(seed) for seed in SYMBOLS["SEEDS"]]
OPS = SYMBOLS["OPS"]


encode_ops, decode_ops, ops_bit_widths, __, __ = make_sub_byte_encoder_and_decoder(
    [OPS]
)

encode_seeds, decode_seeds, seeds_bit_widths, __, __ = (
    make_sub_byte_encoder_and_decoder([ALL_SEEDS])
)
