const fs = require('fs');
const zlib = require('zlib');

// Type codes
const TYPE_INT32 = 0x01;
const TYPE_FLOAT64 = 0x02;
const TYPE_STRING = 0x03;

function readColumnarFile(inputPath, selectedColumns = null) {
  const buffer = fs.readFileSync(inputPath);
  let offset = 0;
  
  // Read magic number
  const magic = buffer.toString('ascii', offset, offset + 4);
  offset += 4;
  if (magic !== 'COL1') {
    throw new Error('Invalid file format');
  }
  
  // Read version
  const version = buffer.readUInt32LE(offset);
  offset += 4;
  
  // Read number of rows
  const numRows = Number(buffer.readBigUInt64LE(offset));
  offset += 8;
  
  // Read number of columns
  const numCols = buffer.readUInt32LE(offset);
  offset += 4;
  
  // Read column metadata
  const columns = [];
  for (let i = 0; i < numCols; i++) {
    const nameLen = buffer.readUInt32LE(offset);
    offset += 4;
    
    const name = buffer.toString('utf8', offset, offset + nameLen);
    offset += nameLen;
    
    const typeCode = buffer.readUInt8(offset);
    offset += 1;
    
    const dataOffset = Number(buffer.readBigUInt64LE(offset));
    offset += 8;
    
    const uncompressedSize = Number(buffer.readBigUInt64LE(offset));
    offset += 8;
    
    const compressedSize = Number(buffer.readBigUInt64LE(offset));
    offset += 8;
    
    const type = typeCode === TYPE_INT32 ? 'int32' :
                 typeCode === TYPE_FLOAT64 ? 'float64' : 'string';
    
    columns.push({
      name,
      type,
      dataOffset,
      uncompressedSize,
      compressedSize
    });
  }
  
  // Determine which columns to read
  const columnsToRead = selectedColumns 
    ? columns.filter(col => selectedColumns.includes(col.name))
    : columns;
  
  if (selectedColumns) {
    console.log(`Reading ${columnsToRead.length} of ${numCols} columns (selective read)`);
  }
  
  // Read and decompress column data
  const data = [];
  for (let i = 0; i < numRows; i++) {
    data.push({});
  }
  
  for (let col of columnsToRead) {
    const compressedData = buffer.slice(col.dataOffset, col.dataOffset + col.compressedSize);
    const rawData = zlib.inflateSync(compressedData);
    
    if (col.type === 'int32') {
      for (let i = 0; i < numRows; i++) {
        data[i][col.name] = rawData.readInt32LE(i * 4);
      }
    } else if (col.type === 'float64') {
      for (let i = 0; i < numRows; i++) {
        data[i][col.name] = rawData.readDoubleLE(i * 8);
      }
    } else if (col.type === 'string') {
      const offsetsSize = numRows * 4;
      const offsets = [];
      for (let i = 0; i < numRows; i++) {
        offsets.push(rawData.readUInt32LE(i * 4));
      }
      
      for (let i = 0; i < numRows; i++) {
        const start = (i === 0) ? 0 : offsets[i - 1];
        const end = offsets[i];
        const strData = rawData.slice(offsetsSize + start, offsetsSize + end);
        data[i][col.name] = strData.toString('utf8');
      }
    }
  }
  
  return { data, columns: columns.map(c => ({ name: c.name, type: c.type })), numRows };
}

module.exports = { readColumnarFile };
