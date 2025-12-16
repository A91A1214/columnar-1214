# Custom Columnar File Format Specification

## Byte Order
- Little Endian

## Header Layout
| Field | Size |
|------|------|
| Magic Number | 4 bytes ("COLF") |
| Number of Columns | 4 bytes |
| Number of Rows | 4 bytes |

For each column:
- Column name length (4 bytes)
- Column name (UTF-8)
- Data type (1 byte)
- Column offset (8 bytes)
- Compressed size (8 bytes)
- Uncompressed size (8 bytes)

## Data Types
- 1 = int32
- 2 = float64
- 3 = string (UTF-8)

## Column Storage
- Each column stored as a contiguous compressed block
- Strings stored as:
  - Offsets array
  - Concatenated UTF-8 bytes
