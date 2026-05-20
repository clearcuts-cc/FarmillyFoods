const fs = require('fs');
const files = ['assets/multifloral_honey.png', 'assets/wild_forest_honey.png'];
for (const file of files) {
  try {
    const buffer = fs.readFileSync(file);
    console.log(`${file} first 20 bytes:`, buffer.slice(0, 20));
  } catch (e) {
    console.error(e);
  }
}
