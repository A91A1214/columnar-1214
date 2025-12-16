# Custom Columnar File Format Specification

## Overview
This document defines a binary columnar file format designed for analytical
workloads. The format enables efficient selective column reads (column pruning)
by storing each column as a separate compressed data block with metadata-driven
random access.

## Endianness
All multi-byte integers and floating-point values are encoded using
little-endian byte order.

---

## File Structure

The file consists of a header followed by compressed column data blocks.

---

### 1. Magic Number (4 bytes)
- ASCII string: `COL1`
- Used to identify the file as this custom columnar format.

---

### 2. Version (4 bytes)
- Little-endian 32-bit integer.
- Current version: `1`.

---

### 3. Number of Rows (8 bytes)
- Little-endian 64-bit integer.
- Total number of rows in the dataset.

---

### 4. Number of Columns (4 bytes)
- Little-endian 32-bit integer.
- Total number of columns in the dataset.

---

### 5. Column Metadata (repeated for each column)

For each column, the following metadata is stored sequentially in the header:

- **Column Name Length** (4 bytes)  
  Little-endian 32-bit integer indicating the length of the column name.

- **Column Name** (variable length)  
  UTF-8 encoded column name.

- **Column Type** (1 byte)  
  Data type identifier:
  - `0x01` = 32-bit integer (int32)
  - `0x02` = 64-bit floating-point number (float64)
  - `0x03` = UTF-8 encoded string

- **Data Offset** (8 bytes)  
  Little-endian 64-bit integer specifying the absolute byte offset from the
  beginning of the file where this column’s compressed data block starts.

- **Uncompressed Size** (8 bytes)  
  Little-endian 64-bit integer specifying the size in bytes of the column’s
  data before compression.

- **Compressed Size** (8 bytes)  
  Little-endian 64-bit integer specifying the size in bytes of the column’s
  data after compression.

---

### Header End
The header ends immediately after the metadata entry of the final column.
All column data blocks begin immediately after the header.

---

## 6. Column Data Blocks

Each column is stored as a separate, contiguous, independently compressed
binary block. Column blocks are stored in the same order as their metadata
entries.

---

### int32 Columns
- Data layout: array of 32-bit little-endian integers.
- Entire column data is compressed using zlib.

---

### float64 Columns
- Data layout: array of 64-bit little-endian floating-point values.
- Entire column data is compressed using zlib.

---

### string Columns
- **Offsets Array**:  
  An array of 32-bit little-endian integers (4 bytes per row), where each entry
  indicates the cumulative byte offset of the end of a string within the
  string data block.

- **String Data Block**:  
  All UTF-8 encoded strings concatenated back-to-back.

- The offsets array and concatenated string data are combined into a single
  byte sequence and compressed together using zlib.

---

## Compression
- Algorithm: zlib (DEFLATE).
- Compression is applied independently to each column block, allowing columns
  to be decompressed individually.

---

## Selective Column Reads (Column Pruning)
Readers can efficiently read only the required subset of columns by:
1. Parsing column metadata from the header.
2. Seeking directly to the desired column’s data offset using the stored
   absolute byte position.
3. Reading and decompressing only the selected column data blocks.

This avoids scanning unrelated columns and provides significant performance
advantages over row-oriented formats such as CSV.

---

## Example File Layout

[Magic][Version][Row Count][Column Count]  
[Column 1 Metadata][Column 2 Metadata] ... [Column N Metadata]  
[Compressed Column 1 Data][Compressed Column 2 Data] ... [Compressed Column N Data]
