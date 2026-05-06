
const fs = require('fs');
const path = require('path');

const filesToPrune = [
    { name: 'index.html', keep: ['page-home'] },
    { name: 'shop.html', keep: ['page-shop'] },
    { name: 'track.html', keep: ['page-track'] },
    { name: 'corporate.html', keep: ['page-corporate'] },
    { name: 'contact.html', keep: ['page-contact'] },
    { name: 'cart.html', keep: ['page-cart'] },
    { name: 'mangoes.html', keep: ['page-shop'] } // Mangoes is a shop variant
];

filesToPrune.forEach(fileConfig => {
    const filePath = path.join(__dirname, '..', fileConfig.name);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match <div id="page-..." class="page">...</div>
    // Note: This assumes page divs are NOT nested inside each other and use standard formatting.
    // We search for the start of any page div and find its matching closing div.
    
    const pageRegex = /<div\s+id="page-([^"]+)"[^>]*class="page"[^>]*>([\s\S]*?)<\/div>\s*<!--\s*end\s+page\s*-->/gi;
    
    // If the file doesn't use the comment markers, we need a more complex strategy or we add them first.
    // Let's try a simpler regex first for the standard structure I saw.
    
    const simplePageRegex = /<div\s+id="(page-[^"]+)"[^>]*class="page"[^>]*>([\s\S]*?)<\/div>(?=\s*(?:<div|<footer|<\!--))/gi;

    let match;
    let modified = false;
    let newContent = content;

    // First, let's identify all pages present
    const pagesFound = [];
    const matches = content.matchAll(/<div\s+id="(page-[^"]+)"[^>]*class="page"/gi);
    for (const m of matches) {
        pagesFound.push(m[1]);
    }

    console.log(`Processing ${fileConfig.name}: Found pages [${pagesFound.join(', ')}]`);

    pagesFound.forEach(pId => {
        if (!fileConfig.keep.includes(pId)) {
            console.log(`  - Pruning ${pId}`);
            // Use a specific regex for this pId to find its block
            const specificRegex = new RegExp(`<div\\s+id="${pId}"[^>]*class="page"[^>]*>[\\s\\S]*?<\\/div>(?=\\s*(?:<div id="page-|<footer|<\\!--))`, 'gi');
            
            // Special case for the LAST page which might be followed by footer directly
            const lastPageRegex = new RegExp(`<div\\s+id="${pId}"[^>]*class="page"[^>]*>[\\s\\S]*?<\\/div>(?=\\s*<footer)`, 'gi');

            if (specificRegex.test(newContent)) {
                newContent = newContent.replace(specificRegex, '');
                modified = true;
            } else if (lastPageRegex.test(newContent)) {
                newContent = newContent.replace(lastPageRegex, '');
                modified = true;
            }
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  Successfully pruned ${fileConfig.name}`);
    } else {
        console.log(`  No pruning needed for ${fileConfig.name}`);
    }
});
