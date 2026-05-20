const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find style block containing #header
  const headerStyles = [];
  const regex = /#header\s*\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headerStyles.push(match[0].replace(/\s+/g, ' '));
  }
  
  if (headerStyles.length > 0) {
    console.log(`${file}:`, headerStyles);
  } else {
    console.log(`${file}: No #header styles found`);
  }
}
