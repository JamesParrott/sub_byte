# Sub_Byte

Encodes and decodes sequences of integers with known widths (and sequences of symbols equivalent to integers under some mapping).

## Overview

Sub_byte efficiently stores data, while preserving its structure, without requiring compression or decompression.  Simple bit packing, using less than a byte for <=7 bit fiels less, crossing byte 
boundaries if necessary, utilising a known fixed bit width for each symbol (avoiding continuation bits).  The bit width sequence and the 
total number of symbols, must be associated with the encoded data as meta data.
Data validation (e.g. checksums or hashes) must be done by the user, but can be appended to a bit width cycle.

## Implementations

### Python
Calculate a cache of data in Python.

### Javascript
Decode a cache of data in Javascript, even in browser.

## Alternatives

### A bespoke protocol using custom width integer types

Up to 8 u1s (bits), up to 4 u2s, or up to 2 u3s or u4s per byte.
Each developer must create their own implementation and tests.
Interoperability between different private implementations is untestable.

### Protocol buffers

Encodes max symbol per byte. Variable byte encoding - uses continuation bits.

### Zipping (data compression)

- Exploits statistical distributions (e.g. "E" being more common in English text than "Q") and patterns.
- Unstructured until the end user unzips the archive.


## Development

### Type checking:
#### Python
##### MyPy
```shell
mypy --python-executable=path/to/venv/where/deps/installed/python.exe src/sub_byte
```

##### Pyright
Activate venv where deps installed
```shell
pyright src/sub_byte/factories.py
```