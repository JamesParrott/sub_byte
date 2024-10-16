import sys
import math
import pathlib
import subprocess

import pytest
from hypothesis import given, settings
from hypothesis.strategies import sampled_from, lists, binary, integers, builds, tuples

from tnetennums import core, encoder as fis_encoder


PARENT_DIR = pathlib.Path(__file__).parent


def _output_from_cmd(cmd: str) -> subprocess.CompletedProcess :

    # Python Unicode mode is needed on Windows to pass encoded 
    # unicode bytes directly into the PIPE on stdout, so that cmd.exe
    # doesn't mess up the PIPE encodings.  
    # On other platforms, "-X utf8" could be omitted.

    result = subprocess.run(cmd
                           ,stderr=subprocess.STDOUT
                           ,stdout = subprocess.PIPE
                           )
    output = result.stdout.decode(encoding = 'utf8')
    return output, result


op_strings_strategy = lists(sampled_from(list(core.OPS)))


def cli_encoder(
    command: str = f"{sys.executable} -X utf8 {PARENT_DIR / 'encode.py'}"
    ):
    def encoder(ops):
        output, result = _output_from_cmd(f"{command} {' '.join(ops)}")
        result.check_returncode()
        return output
    return encoder


def cli_decoder(
    command: str = f"{sys.executable} -X utf8 {PARENT_DIR / 'decode.py'}"
    ):
    def decoder(encoded, num_ops):
        output, result = _output_from_cmd(f"{command} {num_ops} {encoded}")
        result.check_returncode()
        stripped = output.strip()
        if not output:
            return []
        return stripped.split()
    return decoder

NODE_RUN = 'node --disable-warning ExperimentalWarning'

py_encoder, py_decoder = cli_encoder(), cli_decoder()
js_encoder, js_decoder = (cli_encoder(f"{NODE_RUN} {PARENT_DIR / 'encode.mjs'}"),
                          cli_decoder(f"{NODE_RUN} {PARENT_DIR / 'decode.mjs'}"))

@given(op_strings_strategy)
@settings(max_examples = 500, deadline = None)
@pytest.mark.parametrize(
        'encoder,decoder',
        [
        #  (lambda ops: bytes(fis_encoder.encode_ops(ops)),
        #   lambda encoded, num_ops : list(fis_encoder.decode_ops(encoded, num_ops))
        #  ),
           (py_encoder, py_decoder),
           (js_encoder, js_decoder),
           (py_encoder, js_decoder),
           (js_encoder, py_decoder),
        ]
)
def test_roundtrip_ops_encoder(encoder,decoder,ops: list[str]):
    num_ops = len(ops)
    encoded = encoder(ops).replace('\r\n',' ').replace('\n',' ')
    decoded = decoder(encoded, num_ops)
    assert ops == decoded, f'{ops=}, {encoded=}, {decoded=}'

@given(binary(min_size = 1))
@pytest.mark.skip
def test_roundtrip_ops_decoder(b):
    # Leading zeros in last byte mean it could define fewer ops
    min_num_ops_from_last_byte = math.ceil(len( bin(b[-1]).removeprefix('0b') ) / fis_encoder.bits_per_op)
    
    for i in range(min_num_ops_from_last_byte, fis_encoder.ops_per_byte+1):
        num_ops = fis_encoder.ops_per_byte*(len(b) - 1) + i
        decoded = list(fis_encoder.decode_ops(b, num_ops))
        encoded = bytes(fis_encoder.encode_ops(decoded))
        assert b == encoded, f'{b=}, {encoded=}, {decoded=} {num_ops=}'

seeds_strategy = lists(sampled_from(list(core.ALL_SEEDS)))

@given(seeds_strategy)
@pytest.mark.skip
def test_roundtrip_seeds_encoder(s):
    num_seeds = len(s)
    encoded = bytes(fis_encoder.encode_seeds(s))
    decoded = list(fis_encoder.decode_seeds(encoded, num_seeds))
    assert s == decoded, f'{s=}, {encoded=}, {decoded=}'

N_UNIQUE = len(set(core.ALL_SEEDS))
binary_of_valid_seeds = builds(lambda l: bytes([(i1 << 4) + i2 for i1, i2 in l])
                              ,lists(
                                    tuples(integers(min_value=0, max_value=N_UNIQUE-1)
                                          ,integers(min_value=0, max_value=N_UNIQUE-1)
                                          )
                                   ,min_size=1
                                   )
                              )

@given(binary_of_valid_seeds)
@pytest.mark.skip
def test_roundtrip_seeds_decoder(b):

    # Leading zeros in last byte mean it could define fewer seeds
    min_num_seeds_from_last_byte = math.ceil(len( bin(b[-1]).removeprefix('0b') ) / fis_encoder.bits_per_seed)
    
    for i in range(min_num_seeds_from_last_byte, fis_encoder.seeds_per_byte+1):
        num_seeds = fis_encoder.seeds_per_byte*(len(b) - 1) + i
        decoded = list(fis_encoder.decode_seeds(b, num_seeds))
        encoded = bytes(fis_encoder.encode_seeds(decoded))
        assert b == encoded, f'{b=}, {encoded=}, {decoded=} {num_seeds=}'