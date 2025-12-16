# Custom Columnar File Format

A simple columnar file format implementation in Node.js with compression and selective column reads.

## Features

- ✅ Binary columnar storage format
- ✅ Support for int32, float64, and string data types
- ✅ zlib compression for each column
- ✅ Selective column reads (column pruning)
- ✅ CSV conversion tools

## Installation
npm install

## Usage

### Convert CSV to Custom Format

node csv_to_custom.js input.csv output.col
### Convert Custom Format to CSV

node custom_to_csv.js input.col output.csv
## Example

Create sample CSV
cat > data.csv << EOF
id,name,age,salary
1,Alice,25,50000.50
2,Bob,30,65000.75
EOF

Convert to columnar format
node csv_to_custom.js data.csv data.col

Convert back to CSV
node custom_to_csv.js data.col output.csv

## File Format Specification

See [SPEC.md](./SPEC.md) for detailed format specification.
## Project Structure

├── src/
│ ├── writer.js # Columnar format writer
│ └── reader.js # Columnar format reader with selective reads
├── csv_to_custom.js # CLI tool: CSV → Custom format
├── custom_to_csv.js # CLI tool: Custom format → CSV
├── SPEC.md # Format specification
└── package.json # Node.js dependencies

## Testing

Round-trip test:
node csv_to_custom.js sample.csv sample.col
node custom_to_csv.js sample.col output.csv
diff sample.csv output.csv

## Requirements
- Node.js 14+
- Dependencies: csv-parse, csv-stringify
Save and push:

bash
git add README.md
git commit -m "Add comprehensive README with usage instructions"
git push