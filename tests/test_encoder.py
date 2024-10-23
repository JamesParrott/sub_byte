import functools
import sys
import math
import pathlib
import subprocess
from typing import Callable

import pytest
from hypothesis import given, settings
from hypothesis.strategies import sampled_from, lists, binary, integers, builds, tuples

from . import ops_and_seeds_codecs


PARENT_DIR = pathlib.Path(__file__).parent


@given(binary(min_size=1))
def test_roundtrip_py_ops_decoder(b):
    # Leading zeros in last byte mean it could define fewer ops
    min_num_ops_from_last_byte = math.ceil(
        len(bin(b[-1]).removeprefix("0b")) / ops_and_seeds_codecs.bits_per_op
    )

    for i in range(min_num_ops_from_last_byte, ops_and_seeds_codecs.ops_per_byte + 1):
        num_ops = ops_and_seeds_codecs.ops_per_byte * (len(b) - 1) + i
        decoded = list(ops_and_seeds_codecs.decode_ops(b, num_ops))
        encoded = bytes(ops_and_seeds_codecs.encode_ops(decoded))
        assert b == encoded, f"{b=}, {encoded=}, {decoded=} {num_ops=}"


seeds_strategy = lists(sampled_from(list(ops_and_seeds_codecs.ALL_SEEDS)))


@given(seeds_strategy)
def test_roundtrip_py_seeds_encoder(s):
    num_seeds = len(s)
    encoded = bytes(ops_and_seeds_codecs.encode_seeds(s))
    decoded = list(ops_and_seeds_codecs.decode_seeds(encoded, num_seeds))
    assert s == decoded, f"{s=}, {encoded=}, {decoded=}"


N_UNIQUE = len(set(ops_and_seeds_codecs.ALL_SEEDS))
binary_of_valid_seeds = builds(
    lambda list_: bytes([(i1 << 4) + i2 for i1, i2 in list_]),
    lists(
        tuples(
            integers(min_value=0, max_value=N_UNIQUE - 1),
            integers(min_value=0, max_value=N_UNIQUE - 1),
        ),
        min_size=1,
    ),
)


@given(binary_of_valid_seeds)
def test_roundtrip_py_seeds_decoder(b):
    # Leading zeros in last byte mean it could define fewer seeds
    min_num_seeds_from_last_byte = math.ceil(
        len(bin(b[-1]).removeprefix("0b")) / ops_and_seeds_codecs.bits_per_seed
    )

    for i in range(
        min_num_seeds_from_last_byte, ops_and_seeds_codecs.seeds_per_byte + 1
    ):
        num_seeds = ops_and_seeds_codecs.seeds_per_byte * (len(b) - 1) + i
        decoded = list(ops_and_seeds_codecs.decode_seeds(b, num_seeds))
        encoded = bytes(ops_and_seeds_codecs.encode_seeds(decoded))
        assert b == encoded, f"{b=}, {encoded=}, {decoded=} {num_seeds=}"


def _output_from_cmd(cmd: str) -> subprocess.CompletedProcess:
    result = subprocess.run(
        cmd,
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
        # shell needs to be True on Linux, but not on Windows.
        shell=sys.platform in ("linux", "darwin"),
    )
    output = result.stdout.decode(encoding="utf8")
    return output, result


op_strings_strategy = lists(sampled_from(list(ops_and_seeds_codecs.OPS)))


def cli_encoder(prep_args: Callable[[str], str]):
    @functools.wraps(prep_args)
    def encoder(ops):
        # Quote the args, as one of our ops, *, is a special char in shells, e.g. Bash.
        output, result = _output_from_cmd(prep_args(" ".join(f'"{op}"' for op in ops)))
        result.check_returncode()
        return output

    return encoder


def cli_decoder(prep_args: Callable[[str, int], str]):
    @functools.wraps(prep_args)
    def decoder(encoded, num_ops):
        output, result = _output_from_cmd(prep_args(encoded, num_ops))
        result.check_returncode()
        stripped = output.strip()
        if not output:
            return []
        return stripped.split()

    return decoder


# Python Unicode mode is needed on Windows to pass encoded
# unicode bytes directly into the PIPE on stdout, so that cmd.exe
# doesn't mess up the PIPE encodings.
# On other platforms, "-X utf8" could be omitted.
RUN_PY = f"{sys.executable} -X utf8"

# Support for direct import of json files is currently experimental
# in node (ops_and_seeds_codecs.mjs imports symbols.json).
RUN_NODE = "node --disable-warning ExperimentalWarning"


@cli_encoder
def py_encoder(args: str):
    return f'{RUN_PY} {PARENT_DIR / "encode.py"} {args}'


@cli_decoder
def py_ops_decoder(
    encoded_ops: str,  # A hex string
    num_symbols: int,
):
    return f'{RUN_PY} {PARENT_DIR / "decode.py"} {num_symbols} {encoded_ops}'


@cli_decoder
def py_seeds_decoder(
    encoded_seeds: str,  # A hex string
    num_symbols: int,
):
    return f'{RUN_PY} {PARENT_DIR / "decode.py"} {num_symbols} " " {encoded_seeds}'


@cli_encoder
def js_encoder(args: str):
    return f'{RUN_NODE} {PARENT_DIR / "encode.mjs"} {args}'


@cli_decoder
def js_ops_decoder(
    encoded_ops: str,  # A hex string
    num_symbols: int,
):
    return f'{RUN_NODE} {PARENT_DIR / "decode.mjs"} {num_symbols} {encoded_ops}'


@cli_decoder
def js_seeds_decoder(
    encoded_seeds: str,  # A hex string
    num_symbols: int,
):
    return f'{RUN_NODE} {PARENT_DIR / "decode.mjs"} {num_symbols} " " {encoded_seeds}'


@given(op_strings_strategy)
@settings(max_examples=25, deadline=None)
@pytest.mark.parametrize(
    "encoder,decoder",
    [
        (py_encoder, py_ops_decoder),
        (js_encoder, js_ops_decoder),
        (py_encoder, js_ops_decoder),
        (js_encoder, py_ops_decoder),
    ],
)
def test_roundtrip_Py_and_JS_ops_encoder_via_CLIs(encoder, decoder, ops: list[str]):
    num_ops = len(ops)
    encoded = encoder(ops).replace("\r\n", " ").replace("\n", " ")
    decoded = decoder(encoded, num_ops)
    assert ops == decoded, f"{ops=}, {encoded=}, {decoded=}"


@given(seeds_strategy)
@settings(max_examples=25, deadline=None)
@pytest.mark.parametrize(
    "encoder,decoder",
    [
        (py_encoder, py_seeds_decoder),
        (js_encoder, js_seeds_decoder),
        (py_encoder, js_seeds_decoder),
        (js_encoder, py_seeds_decoder),
    ],
)
def test_roundtrip_Py_and_JS_seeds_encoder_via_CLIs(encoder, decoder, seeds: list[int]):
    if not seeds:
        return
    num_seeds = len(seeds)
    encoded = encoder(seeds).replace("\r\n", " ").replace("\n", " ")
    decoded = decoder(encoded, num_seeds)
    assert seeds == decoded, f"{seeds=}, {encoded=}, {decoded=}"


@given(binary(min_size=1))
@settings(max_examples=25, deadline=None)
@pytest.mark.parametrize(
    "encoder,decoder",
    [
        (py_encoder, py_ops_decoder),
        (js_encoder, js_ops_decoder),
        (py_encoder, js_ops_decoder),
        (js_encoder, py_ops_decoder),
    ],
)
def test_roundtrip_Py_and_JS_ops_decoder_via_CLIs(encoder, decoder, b: bytes):
    # Leading zeros in last byte mean it could define fewer ops
    min_num_ops_from_last_byte = math.ceil(
        len(bin(b[-1]).removeprefix("0b")) / ops_and_seeds_codecs.bits_per_op
    )

    for i in range(min_num_ops_from_last_byte, ops_and_seeds_codecs.ops_per_byte + 1):
        num_ops = ops_and_seeds_codecs.ops_per_byte * (len(b) - 1) + i

        decoded = list(decoder(b.hex(), num_ops))
        encoded = bytes.fromhex(encoder(decoded))
        assert b == encoded, f"{b=}, {encoded=}, {decoded=} {num_ops=}"


@given(binary_of_valid_seeds)
@settings(max_examples=25, deadline=None)
@pytest.mark.parametrize(
    "encoder,decoder",
    [
        (py_encoder, py_seeds_decoder),
        (js_encoder, js_seeds_decoder),
        (py_encoder, js_seeds_decoder),
        (js_encoder, py_seeds_decoder),
    ],
)
def test_roundtrip_Py_and_JS_seeds_decoder_via_CLIs(encoder, decoder, b: bytes):
    # Leading zeros in last byte mean it could define fewer seeds
    min_num_seeds_from_last_byte = math.ceil(
        len(bin(b[-1]).removeprefix("0b")) / ops_and_seeds_codecs.bits_per_seed
    )

    for i in range(
        min_num_seeds_from_last_byte, ops_and_seeds_codecs.seeds_per_byte + 1
    ):
        num_seeds = ops_and_seeds_codecs.seeds_per_byte * (len(b) - 1) + i

        decoded = list(decoder(b.hex(), num_seeds))
        encoded = bytes.fromhex(encoder(decoded))
        assert b == encoded, f"{b=}, {encoded=}, {decoded=} {num_seeds=}"
