const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const startIdx = content.indexOf('<div id="mob-menu">');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('</div>', startIdx);
    // Find the matching end div by counting nested divs
    let depth = 1;
    let curr = startIdx + '<div id="mob-menu">'.length;
    while (depth > 0 && curr < content.length) {
      if (content.substr(curr, 4) === '<div') {
        depth++;
      } else if (content.substr(curr, 5) === '</div') {
        depth--;
      }
      curr++;
    }
    const navContent = content.substring(startIdx, curr + 5);
    console.log(`${file}:`, navContent.replace(/\s+/g, ' '));
  } else {
    console.log(`${file}: No mob-menu found`);
  }
}
