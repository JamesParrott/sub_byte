import sys

from sub_byte import oder


for encoded, decoder in zip(sys.argv[2:4],
                            [encoder.decode_ops, encoder.decode_seeds]):
    if not encoded:
        continue
    print(' '.join(decoder(bytes.fromhex(encoded), int(sys.argv[1]))))
