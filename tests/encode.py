import sys

from ops_and_seeds_codecs import encode_ops, OPS, encode_seeds, ALL_SEEDS


for symbols, encoder_func in [
    (OPS, encode_ops),
    (ALL_SEEDS, encode_seeds),
]:
    parsed_args = [arg for arg in sys.argv[1:] if arg in set(symbols)]
    print(bytes(encoder_func(parsed_args)).hex())
