const fs = require('fs');
const buffer = fs.readFileSync('assets/farmmily logo.png');
// PNG width/height are at offset 16 and 20 as 32-bit big-endian integers
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);
console.log(`Width: ${width}, Height: ${height}`);
