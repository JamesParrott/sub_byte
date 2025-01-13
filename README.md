# Sub_Byte

Bit packer and depacker.  Encodes and decodes sequences of integers with known bit-widths (and sequences of symbols equivalent to integers under some mapping).

## Overview

Sub Byte stores data without wasting bits, while preserving its structure, without requiring compression or decompression.  Simple bit packing is used, supporting using less than a byte of storage for <=7 bit fields, crossing byte 
boundaries if necessary.

A bit width for each symbol is required.  The bit width sequence (a simple codec) can be associated with the encoded data as meta data.  The decoder can be passed the total number of symbols to decode (e.g. whether a null byte (0b00000000), is 8 1-bit zeros, 4 2-bit zeros, 2 u4 zeros or a single u8 zero).  

Alternatively, more dynamic codecs can be supported by passing null for the number of symbols to the decoder.  Axtra custom code 
must then be written by the user, to determine when iteration ceases.  This can be used e.g. to encode the actual bit widths first (in some other fixed bit widths), to encode the number of symbols or cycles, and to implement any other codec that determines bit widths, and termination of iteration, according to the user's code.

Data validation (e.g. checksums or hashes) must be done by the user, but an extra field can easily be appended to a bit width cycle.

## Implementations

### Python
Calculate a cache of data in Python.

```shell
uv pip install sub_byte
```


### Typescript/Javascript
Decode a cache of data in Javascript, even in browser.

```shell
npm i sub_byte
```


## Alternatives

### Sub 4kB datasets
This library is not needed for data storage.  Neither Sub_byte nor anything else, will reduce the disk space used.
If the size of the un-encoded data set is less 4kB for example (or the page size of the file system on which the data will be stored, e.g. ext4, NTFS, APFS) then it is already below the minimum file size for that file system. 

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

#### TS
##### Typescipt compiler
```shell
npm run typecheck
```
##### Eslint
```shell
npm run eslint
```

##### Prettier
###### Check
```shell
npm run prettier
```

###### Auto fix
```shell
npm run prettier:write
```
