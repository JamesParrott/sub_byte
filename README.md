# Sub Byte

Encodes and decodes sequences of integers with known widths, and sequences of symbols equivalent to integers under some mapping.

## Overview

Sub byte crams as many symbols into each Byte as possible, crossing byte boundaries if necessary.

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
