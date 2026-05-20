const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find style block containing #mob-nav
  const navStyles = [];
  const regex = /#mob-nav\s*\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    navStyles.push(match[0].replace(/\s+/g, ' '));
  }
  
  if (navStyles.length > 0) {
    console.log(`${file}:`, navStyles);
  } else {
    console.log(`${file}: No #mob-nav styles found`);
  }
}
