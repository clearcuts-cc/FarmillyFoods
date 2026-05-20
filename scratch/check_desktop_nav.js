const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const startIdx = content.indexOf('<nav class="desktop-nav"');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('</nav>', startIdx);
    const navContent = content.substring(startIdx, endIdx + 6);
    console.log(`${file}:`, navContent.replace(/\s+/g, ' '));
  } else {
    console.log(`${file}: No desktop-nav found`);
  }
}
