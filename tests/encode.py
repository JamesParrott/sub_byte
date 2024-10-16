import sys

import sub_byte


for symbols, encoder_func in [(core.OPS, encoder.encode_ops),
                              (core.ALL_SEEDS, encoder.encode_seeds),
                             ]:
    parsed_args = [arg for arg in sys.argv[1:] if arg in set(symbols)]
    print(bytes(encoder_func(parsed_args)).hex())