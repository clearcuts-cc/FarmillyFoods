const fs = require('fs');
const buffer = fs.readFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity\\brain\\c7450c93-be4e-4c5f-af2a-afe498ca57aa\\media__1777446135219.png');
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);
console.log(`media__1777446135219.png -> Width: ${width}, Height: ${height}`);
