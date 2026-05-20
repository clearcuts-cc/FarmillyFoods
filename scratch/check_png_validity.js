const fs = require('fs');

const files = ['assets/multifloral_honey.png', 'assets/wild_forest_honey.png'];
for (const file of files) {
  try {
    const buffer = fs.readFileSync(file);
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer.readUInt32BE(0) === 0x89504E47;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    console.log(`${file}: isPng=${isPng}, width=${width}, height=${height}, size=${buffer.length}`);
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}
