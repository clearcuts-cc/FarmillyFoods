const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const target1 = `          // Robust direct ID lookup
          if (variantIds && variantIds.length > 0) {
            const idSet = new Set(variantIds.map(Number));
            variants = list.filter(p => idSet.has(Number(p.id)));
          } else {`;

const target2 = `          // \u20b9 Prefer direct ID lookup (fast, accurate, no name-matching bugs)
          if (variantIds && variantIds.length > 0) {
            const idSet = new Set(variantIds.map(Number));
            variants = list.filter(p => idSet.has(Number(p.id)));
          } else {`;

// Let's also check for a third possible variation with standard rupee symbol or without it
const target3 = `          // Prefer direct ID lookup (fast, accurate, no name-matching bugs)
          if (variantIds && variantIds.length > 0) {
            const idSet = new Set(variantIds.map(Number));
            variants = list.filter(p => idSet.has(Number(p.id)));
          } else {`;

const replacementText = `          // Robust direct ID lookup
          if (variantIds && variantIds.length > 0) {
            const idSet = new Set(variantIds.map(Number));
            const matched = list.find(p => idSet.has(Number(p.id)) && !p.isCustomBox);
            if (matched) {
              const targetProductId = matched.productId;
              variants = list.filter(p => idSet.has(Number(p.id)) && p.productId === targetProductId && !p.isCustomBox);
            } else {
              variants = [];
            }
          } else {`;

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const targets = [target1, target2, target3];
  
  for (const t of targets) {
    if (content.includes(t)) {
      content = content.replace(t, replacementText);
      changed = true;
      break;
    }
    
    // Normalize content line endings to check
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedTarget = t.replace(/\r\n/g, '\n');
    const normalizedReplacement = replacementText.replace(/\r\n/g, '\n');
    
    if (normalizedContent.includes(normalizedTarget)) {
      content = normalizedContent.replace(normalizedTarget, normalizedReplacement);
      changed = true;
      break;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated openVariantSheet in ${file}`);
    updatedCount++;
  } else {
    console.log(`Target not found in ${file}`);
  }
}

console.log(`Done. Updated ${updatedCount} HTML files.`);
