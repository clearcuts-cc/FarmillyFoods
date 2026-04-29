const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Update Favicon with version string
  const faviconRegex = /href="assets\/favicon\.svg"/g;
  if (faviconRegex.test(content)) {
    content = content.replace(faviconRegex, 'href="assets/favicon.svg?v=2"');
    changed = true;
  }

  // 2. Update meta description and other 2026 references
  const desc2026 = /Shop the 2026 harvest!/g;
  if (desc2026.test(content)) {
    content = content.replace(desc2026, 'Shop the latest natural harvest!');
    changed = true;
  }

  // 3. Update priceValidUntil in schema
  const priceValid = /"priceValidUntil": "2026-12-31"/g;
  if (priceValid.test(content)) {
    content = content.replace(priceValid, '"priceValidUntil": "2030-12-31"');
    changed = true;
  }

  // 4. Update footer year
  const footerYear = /2026 Farmmily Farms and Foods/g;
  if (footerYear.test(content)) {
    content = content.replace(footerYear, 'Farmmily Farms and Foods');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
