#!/usr/bin/env node

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { writeColumnarFile } = require('./src/writer');

if (process.argv.length < 4) {
  console.log('Usage: node csv_to_custom.js <input.csv> <output.col>');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

// Read CSV file
const csvContent = fs.readFileSync(inputPath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

if (records.length === 0) {
  console.error('Error: CSV file is empty');
  process.exit(1);
}

// Infer column types from first row
const firstRow = records[0];
const columns = Object.keys(firstRow).map(name => {
  const value = firstRow[name];
  let type = 'string';
  
  if (!isNaN(value)) {
    if (value.includes('.')) {
      type = 'float64';
    } else {
      type = 'int32';
    }
  }
  
  return { name, type };
});

console.log('Detected columns:', columns);

// Write to columnar format
writeColumnarFile(records, columns, outputPath);
