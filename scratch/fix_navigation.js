const fs = require('fs');
const path = require('path');

const dir = 'd:\\project\\Farmily Web';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== '404.html' && f !== 'googleb8b8728164cbee19.html');

// Define the clean, standard mobile menu HTML from index.html
const standardMobMenu = `  <div id="mob-menu">
    <a href="index.html" class="mob-menu-item" data-page="home">Home</a>
    <a href="shop.html" class="mob-menu-item" data-page="shop">Shop</a>
    <a href="mangoes.html" class="mob-menu-item" data-page="mangoes">Mangoes</a>
    <div class="mob-menu-item" onclick="toggleMobCat(this)">
      Categories
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
    <div id="mob-drawer-cats" style="display:none; padding-left: 20px;">
      <div id="mob-cat-list"></div>
    </div>
    <a href="track.html" class="mob-menu-item" data-page="track">Track Order</a>
    <a href="contact.html" class="mob-menu-item" data-page="contact">Contact</a>
    <a href="corporate.html" class="mob-menu-item" data-page="corporate">Corporate</a>
  </div>`;

// Generate the standard desktop nav HTML based on active page
function getDesktopNav(activePage) {
  return `      <nav class="desktop-nav" id="desktop-nav">
        <a href="index.html" data-page="home"${activePage === 'home' ? ' class="active"' : ''}>Home</a>
        <a href="shop.html" data-page="shop"${activePage === 'shop' ? ' class="active"' : ''}>Shop</a>
        <a href="mangoes.html" data-page="mangoes"${activePage === 'mangoes' ? ' class="active"' : ''}>Mangoes</a>
        <div class="cat-drop-wrap" style="position:relative; display:flex; align-items:center; height:100%"
          onmouseleave="closeDeskCat()">
          <a data-page="categories" onclick="toggleDeskCat()" style="display:flex; align-items:center;">Categories</a>
          <div id="desk-cat-drop"
            style="display:none; position:absolute; top:100%; left:0; background:rgba(255,255,255,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); box-shadow:0 8px 32px rgba(0,0,0,0.1); border:1px solid rgba(255,255,255,0.5); border-radius:12px; padding:8px 0; min-width:180px; z-index:200; flex-direction:column;">
            <!-- Categories rendered here -->
          </div>
        </div>
        <a href="corporate.html" data-page="corporate"${activePage === 'corporate' ? ' class="active"' : ''}>Corporate</a>
        <a href="track.html" data-page="track"${activePage === 'track' ? ' class="active"' : ''}>Tracking</a>
        <a href="contact.html" data-page="contact"${activePage === 'contact' ? ' class="active"' : ''}>Contact</a>
      </nav>`;
}

// Find matching end tag index for a tag starting at startIdx
function findClosingTagIndex(content, startIdx, openTag, closeTag) {
  let depth = 1;
  let curr = startIdx + openTag.length;
  while (depth > 0 && curr < content.length) {
    if (content.substring(curr, curr + openTag.length) === openTag) {
      depth++;
      curr += openTag.length;
    } else if (content.substring(curr, curr + closeTag.length) === closeTag) {
      depth--;
      curr += closeTag.length;
    } else {
      curr++;
    }
  }
  return curr;
}

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Determine active page
  let activePage = '';
  if (file === 'index.html') activePage = 'home';
  else if (file === 'shop.html') activePage = 'shop';
  else if (file === 'mangoes.html') activePage = 'mangoes';
  else if (file === 'track.html') activePage = 'track';
  else if (file === 'corporate.html') activePage = 'corporate';
  else if (file === 'contact.html') activePage = 'contact';
  else if (['ghee.html', 'honey.html', 'bee-products.html', 'beverages.html', 'spices.html'].includes(file)) {
    // subcategory pages highlight "Shop"
    activePage = 'shop';
  }

  // 1. Replace desktop-nav
  const startNav = content.indexOf('<nav class="desktop-nav"');
  if (startNav !== -1) {
    const endNav = content.indexOf('</nav>', startNav) + 6;
    const currentNav = content.substring(startNav, endNav);
    const targetNav = getDesktopNav(activePage);
    
    // Normalize spaces to compare
    if (currentNav.replace(/\s+/g, ' ') !== targetNav.replace(/\s+/g, ' ')) {
      content = content.substring(0, startNav) + targetNav + content.substring(endNav);
      changed = true;
      console.log(`Updated desktop-nav in ${file}`);
    }
  }

  // 2. Replace mob-menu
  // Reload content in case it was modified
  const startMenu = content.indexOf('<div id="mob-menu">');
  if (startMenu !== -1) {
    const endMenu = findClosingTagIndex(content, startMenu, '<div', '</div>');
    const currentMenu = content.substring(startMenu, endMenu);
    
    if (currentMenu.replace(/\s+/g, ' ') !== standardMobMenu.replace(/\s+/g, ' ')) {
      content = content.substring(0, startMenu) + standardMobMenu + content.substring(endMenu);
      changed = true;
      console.log(`Updated mob-menu in ${file}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
  }
}

console.log(`Done. Cleaned navigation in ${updatedCount} files.`);
