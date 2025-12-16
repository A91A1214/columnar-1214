const fs = require('fs');
const zlib = require('zlib');

// Type codes
const TYPE_INT32 = 0x01;
const TYPE_FLOAT64 = 0x02;
const TYPE_STRING = 0x03;

function writeColumnarFile(data, columns, outputPath) {
  const numRows = data.length;
  const numCols = columns.length;
  
  // Prepare column data blocks
  const columnBlocks = [];
  
  for (let col of columns) {
    const colData = data.map(row => row[col.name]);
    let rawBytes;
    
    if (col.type === 'int32') {
      rawBytes = Buffer.alloc(numRows * 4);
      for (let i = 0; i < numRows; i++) {
        rawBytes.writeInt32LE(parseInt(colData[i]), i * 4);
      }
    } else if (col.type === 'float64') {
      rawBytes = Buffer.alloc(numRows * 8);
      for (let i = 0; i < numRows; i++) {
        rawBytes.writeDoubleLE(parseFloat(colData[i]), i * 8);
      }
    } else if (col.type === 'string') {
      // String encoding: offsets + concatenated data
      const offsets = Buffer.alloc(numRows * 4);
      const stringBuffers = [];
      let currentOffset = 0;
      
      for (let i = 0; i < numRows; i++) {
        const strBuf = Buffer.from(String(colData[i]), 'utf8');
        stringBuffers.push(strBuf);
        currentOffset += strBuf.length;
        offsets.writeUInt32LE(currentOffset, i * 4);
      }
      
      rawBytes = Buffer.concat([offsets, ...stringBuffers]);
    }
    
    const compressedBytes = zlib.deflateSync(rawBytes);
    
    columnBlocks.push({
      name: col.name,
      type: col.type,
      uncompressedSize: rawBytes.length,
      compressedSize: compressedBytes.length,
      data: compressedBytes
    });
  }
  
  // Calculate offsets
  let headerSize = 4 + 4 + 8 + 4; // magic + version + numRows + numCols
  for (let block of columnBlocks) {
    headerSize += 4 + Buffer.byteLength(block.name, 'utf8') + 1 + 8 + 8 + 8;
  }
  
  let currentOffset = headerSize;
  for (let block of columnBlocks) {
    block.offset = currentOffset;
    currentOffset += block.compressedSize;
  }
  
  // Write header
  const headerBuffers = [];
  
  // Magic number
  headerBuffers.push(Buffer.from('COL1', 'ascii'));
  
  // Version
  const versionBuf = Buffer.alloc(4);
  versionBuf.writeUInt32LE(1, 0);
  headerBuffers.push(versionBuf);
  
  // Number of rows
  const numRowsBuf = Buffer.alloc(8);
  numRowsBuf.writeBigUInt64LE(BigInt(numRows), 0);
  headerBuffers.push(numRowsBuf);
  
  // Number of columns
  const numColsBuf = Buffer.alloc(4);
  numColsBuf.writeUInt32LE(numCols, 0);
  headerBuffers.push(numColsBuf);
  
  // Column metadata
  for (let block of columnBlocks) {
    const nameBuf = Buffer.from(block.name, 'utf8');
    const nameLenBuf = Buffer.alloc(4);
    nameLenBuf.writeUInt32LE(nameBuf.length, 0);
    headerBuffers.push(nameLenBuf);
    headerBuffers.push(nameBuf);
    
    const typeCode = block.type === 'int32' ? TYPE_INT32 : 
                     block.type === 'float64' ? TYPE_FLOAT64 : TYPE_STRING;
    headerBuffers.push(Buffer.from([typeCode]));
    
    const offsetBuf = Buffer.alloc(8);
    offsetBuf.writeBigUInt64LE(BigInt(block.offset), 0);
    headerBuffers.push(offsetBuf);
    
    const uncompSizeBuf = Buffer.alloc(8);
    uncompSizeBuf.writeBigUInt64LE(BigInt(block.uncompressedSize), 0);
    headerBuffers.push(uncompSizeBuf);
    
    const compSizeBuf = Buffer.alloc(8);
    compSizeBuf.writeBigUInt64LE(BigInt(block.compressedSize), 0);
    headerBuffers.push(compSizeBuf);
  }
  
  // Write to file
  const header = Buffer.concat(headerBuffers);
  const dataBuffers = columnBlocks.map(b => b.data);
  const finalBuffer = Buffer.concat([header, ...dataBuffers]);
  
  fs.writeFileSync(outputPath, finalBuffer);
  console.log(`Written ${numRows} rows, ${numCols} columns to ${outputPath}`);
}

module.exports = { writeColumnarFile };
