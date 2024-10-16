import json
import pathlib

from sub_byte import make_sub_byte_encoder_and_decoder

SYMBOLS = json.loads((pathlib.Path(__file__).parent / 'symbols.json').read_text())

ALL_SEEDS = [str(seed) for seed in SYMBOLS['SEEDS']]
OPS = SYMBOLS['OPS']


encode_ops, decode_ops, bits_per_op, ops_per_byte = make_sub_byte_encoder_and_decoder(symbols = OPS)

encode_seeds, decode_seeds, bits_per_seed, seeds_per_byte = make_sub_byte_encoder_and_decoder(symbols = ALL_SEEDS)