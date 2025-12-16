#!/usr/bin/env node

const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
const { readColumnarFile } = require('./src/reader');

if (process.argv.length < 4) {
  console.log('Usage: node custom_to_csv.js <input.col> <output.csv>');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

// Read columnar file
const { data, columns, numRows } = readColumnarFile(inputPath);

console.log(`Read ${numRows} rows with ${columns.length} columns`);

// Convert to CSV
const csvContent = stringify(data, {
  header: true,
  columns: columns.map(c => c.name)
});

// Write CSV file
fs.writeFileSync(outputPath, csvContent, 'utf8');

console.log(`Written to ${outputPath}`);
