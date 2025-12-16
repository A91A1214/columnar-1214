# Custom Columnar File Format Specification

## Overview
This document defines a binary columnar file format optimized for analytical queries with selective column reads.

## File Structure

### 1. Magic Number (4 bytes)
- ASCII string: `COL1`
- Used to identify the file format

### 2. Version (4 bytes)
- Little-endian 32-bit integer
- Current version: 1

### 3. Number of Rows (8 bytes)
- Little-endian 64-bit integer
- Total rows in the dataset

### 4. Number of Columns (4 bytes)
- Little-endian 32-bit integer

### 5. Column Metadata (variable size, repeated for each column)
For each column:
- **Column Name Length** (4 bytes): little-endian 32-bit integer
- **Column Name** (variable): UTF-8 encoded string
- **Column Type** (1 byte):
  - `0x01` = int32
  - `0x02` = float64
  - `0x03` = string (UTF-8)
- **Data Offset** (8 bytes): little-endian 64-bit integer, byte position where column data starts
- **Uncompressed Size** (8 bytes): size of raw column data before compression
- **Compressed Size** (8 bytes): size after zlib compression

### 6. Column Data Blocks (variable size)
Each column's data stored as a separate compressed block:

#### For int32 columns:
- Array of 32-bit little-endian integers, then compressed with zlib

#### For float64 columns:
- Array of 64-bit little-endian floats, then compressed with zlib

#### For string columns:
- **Offsets array** (4 bytes per string): cumulative byte positions
- **String data**: concatenated UTF-8 bytes
- Both compressed together with zlib

## Endianness
All multi-byte integers and floats use **little-endian** byte order.

## Compression
- Algorithm: zlib (DEFLATE)
- Applied to each column block independently
