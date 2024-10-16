import sys

from ops_and_seeds_codecs import decode_ops, decode_seeds


for encoded, decoder in zip(sys.argv[2:4],
                            [decode_ops, decode_seeds]):
    if not encoded:
        continue
    print(' '.join(decoder(bytes.fromhex(encoded), int(sys.argv[1]))))
