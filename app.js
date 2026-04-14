// ===== SUPABASE =====
const supabaseUrl = 'https://jztreusepxilnfqffwka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

const svgCheck = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

var cart = [];
try {
  cart = JSON.parse(localStorage.getItem('ff_cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  console.error("Cart load error", e);
  cart = [];
}
window.cart = cart;

// Signature Heritage Collection (Static Initialization)
var products = [];
var cats = [];
window.products = products;
window.cats = cats;
window.deliveryConfig = { charge: 49, free_above: 999 };

var curPage = 'home';
var prevPage = 'home', curProd = null, detQty = 1, activeFilter = 'All';

// ===== CART HELPERS =====
function saveCart() {
  localStorage.setItem('ff_cart', JSON.stringify(window.cart));
  updateCartCount();
}
window.saveCart = saveCart;

function updateCartCount() {
  const n = window.cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = window.cart.reduce((s, i) => {
    const p = i.p || window.products.find(x => Number(x.id) === Number(i.id));
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const el = document.getElementById('cart-count');
  const m = document.getElementById('mob-cnt');
  const fBar = document.getElementById('floating-cart-bar');
  const fCount = document.getElementById('f-cart-count');
  const fPrice = document.getElementById('f-cart-price');

  if (fBar) {
    if (n > 0) {
      fBar.classList.add('show');
      if (fCount) fCount.textContent = `${n} item${n > 1 ? 's' : ''}`;
      if (fPrice) fPrice.textContent = `₹${totalPrice}`;
    } else {
      fBar.classList.remove('show');
    }
  }

  if (el) { el.textContent = n; n > 0 ? el.classList.add('show') : el.classList.remove('show'); }
  if (m) { m.textContent = n; n > 0 ? m.classList.add('show') : m.classList.remove('show'); }

  const mb = document.getElementById('mob-badge');
  if (mb) {
    mb.textContent = n;
    n > 0 ? mb.classList.add('show') : mb.classList.remove('show');
  }

  refreshCurrentView();
}
window.updateCartCount = updateCartCount;

function rmCart(id) {
  const ex = window.cart.find(x => Number(x.id) === Number(id));
  if (ex) {
    ex.qty--;
    if (ex.qty <= 0) window.cart = window.cart.filter(x => Number(x.id) !== Number(id));
    saveCart();
  }
}
window.rmCart = rmCart;

function addToCart(id, customProduct = null) {
  const nid = Number(id);
  if (!nid) { console.error("addToCart: Invalid ID", id); return; }

  const p = customProduct || (window.products || []).find(x => Number(x.id) === nid);
  if (!p) {
    console.error("addToCart: Product not found", nid);
    return;
  }

  if (p && p.inStock === false) {
    showToast("This item is currently sold out.");
    return;
  }

  const ex = window.cart.find(x => Number(x.id) === nid);
  if (ex) {
    ex.qty++;
  } else {
    window.cart.push({ id: nid, qty: 1, p: customProduct });
  }

  saveCart();
  console.log("Cart updated:", window.cart);
}
window.addToCart = addToCart;

function updCart(id, d) {
  const nid = Number(id);
  const ci = window.cart.find(x => Number(x.id) === nid);
  if (!ci && d > 0) { addToCart(nid); return; }
  if (!ci) return;
  ci.qty += d;
  if (ci.qty <= 0) window.cart = window.cart.filter(x => Number(x.id) !== nid);
  saveCart();
}
window.updCart = updCart;

function deleteFromCart(id) {
  window.cart = window.cart.filter(x => Number(x.id) !== Number(id));
  saveCart();
}
window.deleteFromCart = deleteFromCart;

function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
}
window.showToast = showToast;

// ===== ROUTING =====
function showPage(page, push = true) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const el = document.getElementById('page-' + page);
  if (el) {
    el.style.display = 'block';
    setTimeout(() => el.classList.add('active'), 10);
    prevPage = curPage;
    curPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- Dynamic SEO Tracking ---
    const pageTitles = {
      'home': 'Farmmily Farms — Premium Organic Mangoes & A2 Ghee',
      'shop': 'Shop Online — Organic Heritage Mangoes & Farm Fresh Goods',
      'corporate': 'Corporate Gifting — Bespoke Mango Crates & Luxury Hampers',
      'track': 'Track Your Order — Farmmily Delivery Status',
      'cart': 'Your Shopping Cart — Farmmily Boutique',
      'success': 'Order Success — Farmmily Foods'
    };
    const pageDescs = {
      'home': 'Direct from our estates to your family. Experience the legendary purity of our seasonal harvest.',
      'shop': 'Explore our collection of Imam Pasand, Alphonso, and Banganapalli mangoes along with artisan ghee.',
      'corporate': 'Premium B2B gifting solutions. Hand-curated mango boxes for your brand partners.',
      'track': 'Enter your order number or enquiry reference to track your farm-fresh delivery live.',
      'cart': 'Complete your purchase of heritage products from Farmmily Farms.',
      'success': 'Thank you for your order! Your harvest is being prepared.'
    };

    if (pageTitles[page]) document.title = pageTitles[page];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && pageDescs[page]) metaDesc.setAttribute('content', pageDescs[page]);
    // ----------------------------

    // Sync URL
    if (push) {
      const path = page === 'home' ? '/' : '/' + page;
      syncUrl(path);
    }

    document.querySelectorAll('#mob-nav .mob-nav-item, #desktop-nav a, .mob-menu-item').forEach(a => {
      const oc = a.getAttribute('onclick') || '';
      if (oc.includes(`'${page}'`)) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  if (page === 'home') renderHome();
  if (page === 'shop') renderShop();
  if (page === 'cart') renderCart();

  closeMob();
  
  // Close detail view if open when switching pages (safety)
  if (page !== 'product' && typeof window.closePremiumDetail === 'function') {
    window.closePremiumDetail(false); // pass false to not update URL again
  }
}
window.showPage = showPage;

function syncUrl(targetPath) {
  const currentPath = window.location.pathname;
  let cleanTargetPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
  let newUrl = cleanTargetPath;
  
  // Handling for /index.html environments
  if (currentPath.includes('index.html')) {
    const base = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    newUrl = base + cleanTargetPath.substring(1);
  }
  
  if (window.location.pathname + window.location.search !== newUrl) {
    try {
      window.history.pushState({ path: targetPath }, '', newUrl);
    } catch(e) { console.error('Router failed:', e); }
  }
}
window.syncUrl = syncUrl;

function toggleMob() {
  const m = document.getElementById('mob-menu');
  const o = document.getElementById('mob-menu-overlay');
  if (m && o) {
    m.classList.add('active');
    o.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}
window.toggleMob = toggleMob;
window.openMobileSidebar = toggleMob;

function closeMob() {
  const m = document.getElementById('mob-menu');
  const o = document.getElementById('mob-menu-overlay');
  if (m && o) {
    m.classList.remove('active');
    setTimeout(() => { if(!m.classList.contains('active')) o.style.display = 'none'; }, 300);
    document.body.style.overflow = 'auto';
  }
}
window.closeMob = closeMob;
window.closeMobileSidebar = closeMob;

function toggleMobCat(el) {
  const d = document.getElementById('mob-drawer-cats');
  const svg = el.querySelector('svg');
  if (d) {
    if (d.style.display === 'none') {
      d.style.display = 'block';
      if (svg) svg.style.transform = 'rotate(180deg)';
    } else {
      d.style.display = 'none';
      if (svg) svg.style.transform = 'rotate(0deg)';
    }
  }
}
window.toggleMobCat = toggleMobCat;

function refreshCurrentView() {
  if (curPage === 'home') renderHome();
  else if (curPage === 'shop') renderShop();
  else if (curPage === 'cart') renderCart();
  else if (curPage === 'track') {
    if (window.lastTrackQuery) {
       handleTrack(window.lastTrackQuery);
    } else {
       const res = document.getElementById('tr-res');
       if (res) res.innerHTML = '';
    }
  }
  else if (curPage === 'corporate') { /* corporate rendering if needed */ }
  
  // REFRESH VARIANT SHEET IF OPEN
  const vSheet = document.getElementById('variant-sheet');
  if (window.currentSheetVariety && vSheet && vSheet.classList.contains('active')) {
    if (typeof window.openVariantSheet === 'function') {
      window.openVariantSheet(window.currentSheetVariety);
    }
  }
}

function goBack() { showPage(prevPage === 'product' ? 'shop' : prevPage); }

function stars(r) { return '<span style="color:var(--secondary)">' + String.fromCharCode(9733).repeat(Math.floor(r)) + String.fromCharCode(9734).repeat(5 - Math.floor(r)) + '</span>'; }
window.getWeightMultiplier = function (wt) {
  const w = (wt || '').toLowerCase();
  const nm = w.match(/[\d.]+/);
  const nVal = nm ? parseFloat(nm[0]) : 0;
  if (nVal > 0) {
    if (w.includes('ml')) return nVal / 1000;
    if (w.includes('kg') || (w.includes('l') && !w.includes('ml'))) return nVal;
    if (w.includes('g') && !w.includes('kg')) return nVal / 1000;
  }
  return 1;
};

window.getUnitPrice = function (price, wt) {
  const pVal = parseFloat(price || 0);
  const mult = window.getWeightMultiplier(wt);
  const rate = mult > 0 ? Math.round(pVal / mult) : pVal;
  const w = (wt || '').toLowerCase();
  const unit = (w.includes('l') && !w.includes('ml')) || w.includes('lit') || w.includes('ml') ? 'L' : 'kg';
  return { rate, unit };
};

window.getItemPrice = function (price, qty) {
  // Price is total for 1 unit. qty is count in basket.
  return price * Number(qty || 1);
};

// ===== PRODUCT CARD HTML ====
function pcardHTML(p) {
  if ((p.name || '').toLowerCase().includes('custom heritage')) {
    return `<div class="premium-mango-card" onclick="window.openCrateBuilder()">
            <div class="m-img-wrap" style="background: #e0f2f1;">
              <img src="https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1000&auto=format&fit=crop" alt="Custom Crate" style="mix-blend-mode: multiply; opacity: 0.9;">
              <div class="m-add-btn-image" onclick="event.stopPropagation(); window.openCrateBuilder()">
                CUSTOM
              </div>
            </div>
            <div class="m-info">
              <div class="m-top-row">
                <div class="m-wt-tag">3-5 KG</div>
                <div class="m-stats">
                  <div class="m-stars">★★★★★</div>
                  <span class="m-rating-val">5.0</span>
                </div>
              </div>
              <h3 class="m-title" style="margin-bottom:0px;">Custom Heritage Mango Crate</h3>
              <div style="font-size:10px; color:#0d47a1; font-weight:700; background:#e3f2fd; display:inline-block; padding:2px 8px; border-radius:4px; margin:4px 0;">MIX ALL VARIETIES</div>
              <span class="m-subtitle">Create Your Signature Blend</span>
              <div class="m-price-row">
                <div class="m-price-box">
                  <span class="m-currency">₹</span>
                  <span class="m-amt">299</span>
                  <span style="font-size: 11px; color: #166534; margin-left: 2px; opacity: 0.8;">/kg avg</span>
                </div>
                <div style="font-size:11px; color:#6b7280; font-weight:600; margin-top:6px;">Build your own mix!</div>
              </div>
            </div>
          </div>`;
  }

  const variants = p.variants || [];
  const hasOptions = variants.length > 1;
  const v0 = hasOptions ? variants[0] : p;

  // High-precision unit price calculation
  const unitInfo = window.getUnitPrice(v0.price || p.price, v0.wt || p.wt);
  const rate = unitInfo.rate;
  const unitLabel = unitInfo.unit;

  // Cart quantity
  let gQty = 0;
  if (window.cart && Array.isArray(window.cart)) {
    if (hasOptions) {
      variants.forEach(v => { const ex = window.cart.find(x => x.id === v.id); if (ex) gQty += ex.qty; });
    } else {
      const ex = window.cart.find(x => x.id === p.id); if (ex) gQty = ex.qty;
    }
  }
  const qty = gQty;

  const isOutOfStock = hasOptions ? variants.every(v => v.inStock === false) : (p.inStock === false);
  const bg = getProductBG(p);
  const badgeHTML = isOutOfStock ? `<div class="p-badge" style="background:#ef4444 !important; color:white !important; position:absolute; top:12px; left:12px; z-index:10; padding:4px 12px; border-radius:12px; font-size:10px; font-weight:900;">OUT OF STOCK</div>` : (p.badge ? `<div class="p-badge" style="position:absolute; top:12px; left:12px; z-index:10; font-size:10px; font-weight:900;">${p.badge}</div>` : '');

  // If grouped, show "CHOOSE SIZES" else show ADD/QTY
  // If grouped, show "CHOOSE SIZES" else show ADD/QTY
  const action = isOutOfStock ? `
    <div class="m-add-btn-image" style="background: rgba(148, 163, 184, 0.9) !important; color: white !important; cursor: not-allowed; opacity: 0.7;" onclick="event.stopPropagation()">
        SOLD OUT
    </div>` : (hasOptions ? `
    <div class="m-add-btn-image" onclick="event.stopPropagation(); window.openVariantSheet(arguments[0], '${p.name.replace(/'/g, "\\'")}',[${variants.map(v=>v.id).join(',')}])">
        ADD
    </div>` : (qty > 0 ? `
    <div class="m-add-btn-image" style="background:#f0fdf4 !important; color:#1b391b !important; border:1px solid #22c55e !important;" onclick="event.stopPropagation()">
        <span onclick="window.updCart(${p.id}, -1)">–</span>
        <span style="font-size:14px; font-weight:900; min-width:24px; text-align:center;">${qty}</span>
        <span onclick="window.updCart(${p.id}, 1)">+</span>
    </div>` : `
    <div class="m-add-btn-image" onclick="event.stopPropagation(); window.openVariantSheet(arguments[0], '${p.name.replace(/'/g, "\\'")}', [${p.id}])">
        ADD
    </div>`));

  // Product card click now opening full beautiful details
  const cardOnclick = `window.showProduct(${p.id})`;

  return `
    <div class="premium-mango-card" onclick="${cardOnclick}">
          <div class="m-img-wrap" style="background: ${bg}">
              ${badgeHTML}
              <img src="${p.img}" alt="${p.name}" loading="lazy" style="${(p.name || '').toLowerCase().includes('custom') ? 'mix-blend-mode: multiply; opacity: 0.9;' : ''}" onerror="this.style.opacity='0'; this.parentElement.style.background='#f0f4f0'">
              ${action}
          </div>
        <div class="m-info">
            <div class="m-top-row">
                <div class="m-stats">
                    <div class="m-stars">★★★★★</div>
                    <span class="m-rating-val">${p.rating || '5.0'}</span>
                </div>
                <div class="m-wt-tag" style="display:inline-block !important; cursor:pointer;" onclick="event.stopPropagation(); window.openVariantSheet(event, '${p.name.replace(/'/g, "\\'")}',[${hasOptions ? variants.map(v=>v.id).join(',') : p.id}])">${hasOptions ? variants.length + ' OPTIONS' : v0.wt}</div>
            </div>
            <h3 class="m-title" style="margin-bottom:0px;">${p.name}</h3>
            <div style="font-size:10px; color:#22c55e; font-weight:700; background:#f0fdf4; display:inline-block; padding:2px 8px; border-radius:4px; margin:4px 0;">1 ${unitLabel.toUpperCase()} PRICE RATE</div>
            <span class="m-subtitle" style="margin-bottom:8px;">${p.cat || 'Premium Selection'}</span>
            <div class="m-price-row">
                <div class="m-price-box">
                    <span class="m-currency">₹</span>
                    <span class="m-amt">${rate}</span>
                    <span style="font-size: 11px; color: #166534; margin-left: 2px; opacity: 0.8;">/${unitLabel}</span>
                </div>
                <div style="font-size:11px; color:#6b7280; font-weight:600; margin-top:6px; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                    ${v0.originalPrice && v0.originalPrice > v0.price ? `<span style="text-decoration:line-through; opacity:0.5; font-weight:500;">₹${v0.originalPrice}</span>` : ''}
                    ${v0.originalPrice && v0.originalPrice > v0.price ? `<span style="background:#fefce8; color:#a16207; font-size:9px; padding:1px 5px; border-radius:4px; font-weight:800; border:1px solid #fef08a;">${Math.round(((v0.originalPrice - v0.price) / v0.originalPrice) * 100)}% OFF</span>` : ''}
                    <span>${hasOptions ? 'from ₹' + v0.price : '₹' + v0.price + ' (' + v0.wt + ')'}</span>
                </div>
            </div>
        </div>
    </div>
  `;
}

window.getUnitLabel = function (wt) {
  const w = (wt || '').toLowerCase();
  return (w.includes('l') && !w.includes('ml')) || w.includes('lit') || w.includes('ml') ? 'L' : 'kg';
};

function getProductBG(p) {
  const c = (p.cat || '').toLowerCase();
  const n = (p.name || '').toLowerCase();

  // Variety based specifics
  if (n.includes('imam')) return '#FFF9C4';
  if (n.includes('alph')) return '#FFE0B2';
  if (n.includes('bang')) return '#FFF17644';
  if (n.includes('sent')) return '#FFEBEE';
  if (n.includes('custom')) return '#e0f2f1';

  // Category based defaults
  if (c.includes('ghee') || c.includes('oil')) return '#FFFDE7';
  if (c.includes('honey')) return '#FFF8E1';
  if (c.includes('spice')) return '#FBE9E7';
  if (c.includes('bee')) return '#FFF9C4';
  if (c.includes('beverage')) return '#E0F2F1';
  if (c.includes('mango')) return '#F9FBE7';

  return '#f5f8f5';
}

function showProduct(id, push = true) {
  const p = (window.products || []).find(x => Number(x.id) === Number(id));
  if (!p) return;

  if (push) {
    const slug = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    syncUrl('/product/' + id + '/' + slug);
  }

  if (typeof window.showPremiumDetail === 'function') {
    window.showPremiumDetail(p.name, false); 
  } else {
    openProduct(id);
  }
}
window.showProduct = showProduct;

function addToCartAnim(btn, id) {
  addToCart(id);
  const old = btn.textContent;
  btn.textContent = 'Added!';
  setTimeout(() => { btn.textContent = old; refreshCurrentView(); }, 800);
}

// ===== HOME =====
function renderHome() {
  const cr = document.getElementById('cats-row');
  if (cr) {
    cr.innerHTML = cats.map(c =>
      '<div class="cat-card" onclick="filterBycat(\'' + c.name + '\')">' +
      '<div class="cat-icon-wrap">' + c.svg + '</div>' +
      '<span class="cn">' + c.name + '</span></div>'
    ).join('');
  }

  const fr = document.getElementById('feat-row');
  if (fr) {
    const baseList = window.displayProducts || window.products;
    const featuredProds = baseList.filter(p => p.isFeatured).slice(0, 8);
    const displayProds = featuredProds.length ? featuredProds : baseList.slice(0, 8);
    fr.innerHTML = displayProds.length ? displayProds.map(pcardHTML).join('') : '<p style="text-align:center;width:100%;color:#888;">Harvesting fresh products for you...</p>';
  }
}

// Removed redundant filterBycat

// ===== SHOP =====
function renderShop() {
  const chips = document.getElementById('shop-cats-row');
  if (chips) {
    const list = ['All', ...cats.map(c => c.name)];
    chips.innerHTML = list.map(c =>
      '<div class="chip' + (c === activeFilter ? ' active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</div>'
    ).join('');
  }
  filterProds();
}

function setFilter(cat) { 
  activeFilter = cat; 
  renderShop(); 
  
  if (cat === 'All') {
    syncUrl('/shop');
  } else {
    const path = '/' + cat.toLowerCase().replace(/\s+/g, '-');
    syncUrl(path);
  }
}

function filterProds() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const q = (document.getElementById('shop-srch')?.value || '').toLowerCase();

  // Use grouped products for display
  const displayList = window.displayProducts || window.products;

  let list = displayList.filter(p => {
    const matchCat = activeFilter === 'All' || p.cat === activeFilter;
    const matchQ = !q || p.name.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  grid.innerHTML = list.length ? list.map(pcardHTML).join('') : '<div style="text-align:center;width:100%;padding:100px 20px;color:#888;">No results found.</div>';
}

// ===== PRODUCT DETAIL =====
function openProduct(id) {
  const p = window.products.find(x => Number(x.id) === Number(id));
  if (!p) return;
  curProd = p; detQty = 1; prevPage = curPage;
  const imgEL = document.getElementById('det-img'); if (imgEL) imgEL.src = p.img;
  const nameEL = document.getElementById('det-name'); if (nameEL) nameEL.textContent = p.name;
  const priceEL = document.getElementById('det-price'); if (priceEL) priceEL.textContent = '₹' + p.price;
  const qtyEL = document.getElementById('det-qty'); if (qtyEL) qtyEL.textContent = 1;
  showPage('product', false);
}

function chQty(d) { detQty = Math.max(1, detQty + d); const q = document.getElementById('det-qty'); if (q) q.textContent = detQty; }

function addDetToCart() {
  if (!curProd) return;
  const ex = window.cart.find(x => x.id === curProd.id);
  if (ex) ex.qty += detQty; else window.cart.push({ id: curProd.id, qty: detQty });
  saveCart();
  showToast('Added to basket!');
  showPage('shop', true);
}

// ===== CART =====
function renderCart() {
  const el = document.getElementById('cart-content');
  if (!el) return;
  if (!window.cart.length) {
    el.innerHTML = '<div class="cart-empty"><h3>Your basket is empty</h3><button class="btn btn-green" onclick="showPage(\'shop\')">Start Shopping</button></div>';
    return;
  }
  let sub = 0;
  const items = window.cart.map(ci => {
    const p = ci.p || window.products.find(x => Number(x.id) === Number(ci.id));
    if (!p) return '';
    const itemTotal = p.price * ci.qty;
    sub += itemTotal;
    
    // For custom products, we use the stored description
    const weightLabel = p.wt || '';
    const unitInfo = (window.getUnitPrice && !p.isCustom) ? window.getUnitPrice(p.price, p.wt) : null;
    const rateText = unitInfo ? ` (₹${unitInfo.rate}/${unitInfo.unit} rate)` : (p.desc ? ` <span style="font-size:10px; color:#666; display:block; margin-top:4px;">${p.desc}</span>` : '');

    return `
      <div class="citem">
        <img src="${p.img}">
        <div>
          <div class="ci-name">${p.name}</div>
          <div class="ci-wt" style="font-size:11px; color:#888;">${weightLabel}${rateText}</div>
          <div class="ci-bot">
            <span class="ci-price">₹${Math.round(itemTotal)}</span>
            <div class="ci-qty">
              <button class="ci-qbtn" onclick="updCart(${p.id},-1)">-</button>
              <span class="ci-qval">${ci.qty}</span>
              <button class="ci-qbtn" onclick="updCart(${p.id},1)">+</button>
            </div>
            <button class="ci-rm" onclick="deleteFromCart(${p.id})">×</button>
          </div>
        </div>
      </div>`;
  }).join('');

  const config = window.deliveryConfig || { charge: 49, free_above: 999 };
  const deliveryFee = sub >= config.free_above ? 0 : config.charge;
  const total = sub + deliveryFee;

  el.innerHTML = `
    <div class="clist">${items}</div>
    <div class="csummary">
      <div class="srow"><span>Subtotal</span><span>₹${sub}</span></div>
      <div class="srow"><span style="color:#666;">Delivery</span><span style="color:${deliveryFee === 0 ? '#22c55e' : '#666'};">${deliveryFee === 0 ? 'Free' : '₹' + deliveryFee}</span></div>
      <div class="srow total" style="margin-top:12px; padding-top:12px; border-top:1px solid #eee;"><span>Total</span><span style="font-size:24px; font-weight:900;">₹${total}</span></div>
      <div id="co-tot" style="display:none">${total}</div>
      <div class="slide-wrap" id="cart-slider" style="margin-top:24px;">
        <div class="slide-bg"></div>
        <div class="slide-text">SLIDE TO PAY</div>
        <div class="slide-handle" style="display:flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => initSlider(), 50);
}

function initSlider() {
  const slider = document.getElementById('cart-slider');
  if (!slider) return;
  const handle = slider.querySelector('.slide-handle');
  const text = slider.querySelector('.slide-text');
  const bg = slider.querySelector('.slide-bg');
  let isDragging = false, startX = 0, currentPos = 0;
  const maxTravel = slider.offsetWidth - handle.offsetWidth - 12;

  const onStart = (e) => {
    isDragging = true;
    startX = (e.type === 'mousedown') ? e.pageX : e.touches[0].pageX;
    handle.style.transition = 'none';
    text.style.transition = 'none';
    if (bg) bg.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const x = (e.type === 'mousemove') ? e.pageX : e.touches[0].pageX;
    currentPos = Math.max(0, Math.min(x - startX, maxTravel));
    handle.style.transform = `translateX(${currentPos}px)`;
    if (bg) bg.style.width = (currentPos + handle.offsetWidth / 2) + 'px';
    text.style.opacity = 1 - (currentPos / (maxTravel * 0.8));
    if (currentPos >= maxTravel * 0.9) slider.classList.add('ready'); else slider.classList.remove('ready');
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    if (currentPos >= maxTravel * 0.9) {
      handle.style.transform = `translateX(${maxTravel}px)`;
      if (bg) bg.style.width = '100%';
      slider.classList.add('completed');
      text.innerText = 'PROCESSING...';
      placeOrder();
    } else {
      handle.style.transition = 'all 0.3s cubic-bezier(.2,.8,.2,1)';
      handle.style.transform = 'translateX(0)';
      if (bg) { bg.style.transition = 'all 0.3s'; bg.style.width = '0'; }
      text.style.transition = 'all 0.3s';
      text.style.opacity = '1';
    }
  };

  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  handle.addEventListener('mouseup', onEnd);
  handle.addEventListener('touchstart', onStart);
  window.addEventListener('touchmove', onMove);
  handle.addEventListener('touchend', onEnd);
}

// Opens delivery details modal before payment
function placeOrder() {
  const totEl = document.getElementById('co-tot');
  const tot = totEl ? parseInt(totEl.innerText) : 0;
  if (!tot) return;
  window.openDeliveryModal();
}

window.openDeliveryModal = function() {
  const overlay = document.getElementById('delivery-overlay');
  const modal = document.getElementById('delivery-modal');
  if (overlay) { overlay.style.display = 'block'; }
  if (modal) {
    modal.style.display = 'block';
    setTimeout(() => { modal.style.transform = 'translateY(0)'; }, 10);
  }
};

window.closeDeliveryModal = function() {
  const overlay = document.getElementById('delivery-overlay');
  const modal = document.getElementById('delivery-modal');
  if (modal) { 
    modal.style.transform = 'translateY(100%)'; 
    modal.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    modal.classList.remove('active');
  }
  setTimeout(() => {
    if (overlay) overlay.style.display = 'none';
    if (modal) {
      modal.style.display = 'none';
      modal.style.transform = '';
      modal.style.transition = '';
    }
    // Reset slider on cancel
    const slider = document.getElementById('cart-slider');
    if (slider) {
      slider.classList.remove('completed','ready');
      const st = slider.querySelector('.slide-text');
      const sh = slider.querySelector('.slide-handle');
      const sb = slider.querySelector('.slide-bg');
      if (st) st.innerText = 'SLIDE TO PAY';
      if (sh) sh.style.transform = 'translateX(0)';
      if (sb) sb.style.width = '0';
    }
  }, 400);
};

window.submitDeliveryAndPay = function() {
  const name    = (document.getElementById('del-name')?.value || '').trim();
  const phone   = (document.getElementById('del-phone')?.value || '').trim();
  const bldg    = (document.getElementById('del-building')?.value || '').trim();
  const street  = (document.getElementById('del-street')?.value || '').trim();
  const city    = (document.getElementById('del-city')?.value || '').trim();
  const state   = (document.getElementById('del-state')?.value || '').trim();
  const pin     = (document.getElementById('del-pincode')?.value || '').trim();
  const mapLink = (document.getElementById('del-maplink')?.value || '').trim();

  if (!name)    { showToast('Please enter your full name'); return; }
  if (!phone || phone.length < 10) { showToast('Please enter a valid phone number'); return; }
  if (!bldg || !street || !city || !state || !pin) { showToast('Please fill all address fields'); return; }

  let fullAddress = `${bldg}, ${street}, ${city}, ${state} - ${pin}`;
  if (mapLink) fullAddress += ` (Map: ${mapLink})`;

  window.closeDeliveryModal();
  setTimeout(() => openRazorpayWithDetails(name, phone, bldg + ', ' + street, city, state, pin, mapLink), 450);
};

window.autoDetectLocation = async function() {
  const mapInput = document.getElementById('del-maplink');
  const pastedLink = (mapInput?.value || '').trim();

  // Helper to fetch address from coords
  const fetchAddress = async (lat, lon) => {
    try {
      showToast('Extracting address details...');
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const streetEl = document.getElementById('del-street');
        if (streetEl) streetEl.value = addr.road || addr.suburb || addr.neighbourhood || addr.pedestrian || '';
        const cityEl = document.getElementById('del-city');
        if (cityEl) cityEl.value = addr.city || addr.town || addr.village || addr.city_district || '';
        const stateEl = document.getElementById('del-state');
        if (stateEl) stateEl.value = addr.state || '';
        const pinEl = document.getElementById('del-pincode');
        if (pinEl) pinEl.value = addr.postcode || '';
        showToast('Address details captured!');
      }
    } catch (e) {
      console.error(e);
      showToast('Found location, but details need manual entry.');
    }
  };

  // Choice 1: Paste a link
  if (pastedLink.includes('google.com/maps') || pastedLink.includes('goo.gl/maps') || pastedLink.includes('maps.app.goo.gl')) {
    const coords = window.parseMapLink(pastedLink);
    if (coords) {
      await fetchAddress(coords.lat, coords.lon);
      return;
    }
  }

  // Choice 2: Browser Geo
  if (navigator.geolocation) {
    showToast('Detecting live location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (mapInput) mapInput.value = `https://maps.google.com/?q=${lat},${lon}`;
        await fetchAddress(lat, lon);
      },
      (err) => {
        let msg = 'Unable to detect location. Please paste a Google Maps link or type manually.';
        if (err.code === 1) msg = 'Location access denied. Please allow it in settings or paste a link.';
        showToast(msg);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  } else {
    showToast('Browser geolocation not supported. Please paste a link.');
  }
};

window.parseMapLink = function(url) {
  try {
    // Standard link: ?q=lat,lon or @lat,lon
    let match = url.match(/q=([\d.-]+),([\d.-]+)/) || url.match(/@([\d.-]+),([\d.-]+)/);
    if (match) return { lat: match[1], lon: match[2] };
    
    // Some shortened links might need to be resolved, but we can't easily do that client-side
    // without a proxy. However, we can try to find anything that looks like lat,lon
    match = url.match(/ll=([\d.-]+),([\d.-]+)/);
    if (match) return { lat: match[1], lon: match[2] };

    return null;
  } catch (e) { return null; }
};

function openRazorpayWithDetails(customerName, phone, address, cityVal = 'Guest', stateVal = 'Order', pinVal = '000000', mapLink = '') {
  const totEl = document.getElementById('co-tot');
  const tot = totEl ? parseInt(totEl.innerText) : 0;
  if (!tot) return;

  const options = {
    key: "rzp_live_SblSXsCRc6GjPo", amount: tot * 100, currency: "INR", name: "Farmmily Foods",
    handler: async response => {
      showToast('Payment Successful!');

      if (supabaseClient) {
        try {
          // 0. Create guest address record for Admin compatibility
          let addressId = null;
          try {
            const { data: addrData } = await supabaseClient
              .from('addresses')
              .insert([{ 
                full_name: customerName, 
                phone: phone, 
                address_line: address, 
                city: cityVal, 
                state: stateVal, 
                pincode: pinVal,
                map_link: mapLink
              }])
              .select().single();
            if (addrData) addressId = addrData.id;
          } catch (e) { console.error("Address sync failed:", e); }

          // 1. Create main order (order_number is generated by DB default)
          const { data: orderData, error: orderErr } = await supabaseClient
            .from('orders')
            .insert([{ 
              subtotal: tot - (tot > 1000 ? 0 : 49), 
              delivery_charge: (tot > 1000 ? 0 : 49), 
              total: tot, 
              payment_status: 'paid', 
              status: 'confirmed', 
              customer_name: customerName, 
              phone: phone, 
              address: `${address}, ${cityVal}, ${stateVal} - ${pinVal}${mapLink ? ' (Map: ' + mapLink + ')' : ''}`, 
              address_id: addressId 
            }])
            .select()
            .single();

          if (orderErr) throw orderErr;

          if (orderData) {
            // 2. Add line items
            const itemInserts = window.cart.map(ci => {
              const p = ci.p || window.products.find(x => Number(x.id) === Number(ci.id));
              return {
                order_id: orderData.id,
                product_id: (p && p.id > 999000) ? null : (p ? p.id : null), 
                product_name: p ? p.name : 'Unknown Product',
                product_image: p ? p.img : null,
                quantity: ci.qty,
                unit_price: p ? p.price : 0,
                total_price: (p ? p.price : 0) * ci.qty,
                weight: p ? p.wt : '',
                description: p ? (p.desc || '') : ''
              };
            });
            const { error: itemsErr } = await supabaseClient.from('order_items').insert(itemInserts);
            if (itemsErr) console.error("Order items sync failed:", itemsErr);

            // 3. Record payment
            const { error: payErr } = await supabaseClient.from('payments').insert([{
              order_id: orderData.id,
              razorpay_payment_id: response.razorpay_payment_id,
              amount: tot,
              status: 'paid',
              method: 'card'
            }]);
            if (payErr) console.error("Payment record failed:", payErr);

            // 3.5 Update Stock (Admin Side Sync)
            for (const item of itemInserts) {
              if (item.product_id) {
                // Fetch current stock
                const { data: pData } = await supabaseClient.from('products').select('stock_count').eq('id', item.product_id).single();
                if (pData) {
                  const newStock = Math.max(0, pData.stock_count - item.quantity);
                  await supabaseClient.from('products').update({ 
                    stock_count: newStock,
                    in_stock: newStock > 0 
                  }).eq('id', item.product_id);
                }
              }
            }

            // 4. Update Success UI and Navigate
            const succIdEl = document.getElementById('succ-oid');
            if (succIdEl) succIdEl.textContent = orderData.order_number;

            window.cart = [];
            saveCart();
            showPage('success');
          }
        } catch (err) {
          console.error("Order completion failed:", err);
          showToast("Order saved but navigation failed.");
          window.cart = []; saveCart(); showPage('home');
        }
      } else {
        // Fallback for demo
        window.cart = []; saveCart(); showPage('home');
      }
    },
    modal: {
      ondismiss: function () {
        const slider = document.getElementById('cart-slider');
        if (slider) {
          slider.classList.remove('completed');
          slider.querySelector('.slide-text').innerText = 'SLIDE TO PAY';
          const handle = slider.querySelector('.slide-handle');
          const bg = slider.querySelector('.slide-bg');
          handle.style.transform = 'translateX(0)';
          if (bg) bg.style.width = '0';
        }
      }
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// ===== SUPABASE LOAD =====
async function loadCategories() {
  if (!supabaseClient) {
    cats = [{ name: 'Products', svg: '' }];
    renderHome();
    renderCatLists();
    return;
  }
  const { data } = await supabaseClient.from('categories').select('*').eq('active', true);
  if (data) {
    cats = data.map(c => {
      const lowName = c.name.toLowerCase();
      let iconHtml = '';

      // Premium Minimalist Icon Set (Gold & Green)
      if (lowName.includes('ghee') || lowName.includes('oil')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M12 2c-4 4-6 8-6 11a6 6 0 0 0 12 0c0-3-2-7-6-11z"/><path d="M12 18a3 3 0 0 1 0-6" stroke="#22c55e"/></svg>`;
      } else if (lowName.includes('honey') || lowName.includes('jaggery')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M12 2l2 2m-4 0l2-2m6 10a8 8 0 1 1-16 0c0-4 3-7 8-7s8 3 8 7z"/><path d="M12 12v6" stroke="#22c55e"/></svg>`;
      } else if (lowName.includes('spice')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M12 2c-1 3-5 3-5 8s2 8 5 8 5-3 5-8-4-5-5-8z"/><circle cx="12" cy="12" r="2" stroke="#22c55e"/></svg>`;
      } else if (lowName.includes('bee')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 8l4 2.25v4.5L12 17l-4-2.25v-4.5L12 8z" stroke="#22c55e"/></svg>`;
      } else if (lowName.includes('beverage')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M6 8h12l-1 11H7L6 8z"/><path d="M18 11a3 3 0 0 1 0 6M9 4l1 4m4-4l-1 4" stroke="#22c55e"/></svg>`;
      } else if (lowName.includes('mango')) {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><path d="M12 2C7 2 4 6 4 11s3 9 8 9 8-4 8-9-3-9-8-9z"/><path d="M12 2c1 2 2 4 1 6" stroke="#22c55e"/></svg>`;
      } else {
        // Fallback generic icon
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8" stroke="#22c55e"/></svg>`;
      }

      return {
        id: c.id,
        name: c.name,
        svg: iconHtml
      };
    });
  }
  renderHome();
  renderCatLists();
}

function renderCatLists() {
  const d = document.getElementById('desk-cat-drop');
  const m = document.getElementById('mob-cat-list');
  if (d) {
    d.innerHTML = cats.map(c => `<div style="padding:10px 20px; cursor:pointer; font-size:14px; color:#555;" onclick="filterBycat('${c.name}');closeDeskCat()">${c.name}</div>`).join('');
  }
  if (m) {
    m.innerHTML = cats.map(c => `<div style="padding:12px 0; cursor:pointer; font-size:15px; color:#666;" onclick="filterBycat('${c.name}');closeMob()">${c.name}</div>`).join('');
  }
}

function toggleDeskCat() {
  const d = document.getElementById('desk-cat-drop');
  if (d) d.style.display = d.style.display === 'none' ? 'flex' : 'none';
}
window.toggleDeskCat = toggleDeskCat;

function closeDeskCat() {
  const d = document.getElementById('desk-cat-drop');
  if (d) d.style.display = 'none';
}
window.closeDeskCat = closeDeskCat;

function filterBycat(c, push = true) {
  activeFilter = c;
  showPage('shop', false);
  
  if (push) {
    const path = '/' + c.toLowerCase().replace(/\s+/g, '-');
    syncUrl(path);
  }

  const chips = document.querySelectorAll('.chip');
  chips.forEach(ch => {
    if (ch.innerText === c) ch.classList.add('active');
    else ch.classList.remove('active');
  });
}
window.filterBycat = filterBycat;

// ===== CLIENT-SIDE ROUTER =====
function handleRoute() {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  
  // Basic Pages
  if (path === '/' || path === '/home' || path === '/index.html') {
    showPage('home', false);
    return;
  }
  
  if (path === '/shop') {
    activeFilter = 'All';
    showPage('shop', false);
    return;
  }

  if (path === '/cart') {
    showPage('cart', false);
    return;
  }

  if (path === '/track') {
    showPage('track', false);
    return;
  }

  if (path === '/corporate') {
    showPage('corporate', false);
    return;
  }

  if (path === '/success') {
    showPage('success', false);
    return;
  }

  // Product Detail Route: /product/123/name
  if (path.includes('/product/')) {
    const segments = path.split('/');
    const pIndex = segments.indexOf('product');
    const id = segments[pIndex + 1];
    if (id) {
       const checkLoaded = setInterval(() => {
         if (window.products && window.products.length) {
            clearInterval(checkLoaded);
            showProduct(id, false);
         }
       }, 100);
       setTimeout(() => clearInterval(checkLoaded), 5000);
    }
    return;
  }

  // Category Route: /mango, /honey, etc.
  const catSlug = path.substring(1).replace(/-/g, ' ');
  const checkCats = setInterval(() => {
    if (window.cats && window.cats.length) {
      clearInterval(checkCats);
      const found = window.cats.find(c => c.name.toLowerCase() === catSlug);
      if (found) {
        filterBycat(found.name, false);
      } else {
        // If not a category, maybe it's a page we don't know, default to home
        showPage('home', false);
      }
    }
  }, 100);
  setTimeout(() => clearInterval(checkCats), 5000);
}

window.addEventListener('popstate', (event) => {
  handleRoute();
});

// showProduct is defined above

async function loadProducts() {
  if (!supabaseClient) { handleRawProducts([]); return; }
  
  // Fetch active products with positive stock
  const { data: prods } = await supabaseClient
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock_count', 0);
  
  handleRawProducts(prods || []);
}

function handleRawProducts(data) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const assetMap = { 'imam': 'assets/imam.png', 'alph': 'assets/alphonso.png', 'bang': 'assets/banganapalli.png', 'sent': 'assets/senthura.png', 'custom': 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1000&auto=format&fit=crop' };

  const allProds = (data || []).map(p => {
    let img = p.image_url;
    const low = (p.name || '').toLowerCase();
    for (const k in assetMap) if (low.includes(k)) img = assetMap[k];
    const category = cats.find(c => c.id === p.category_id)?.name || 'Products';

    return {
      id: p.id, name: cap(p.name), price: Number(p.price), 
      originalPrice: p.original_price ? Number(p.original_price) : null,
      wt: p.weight,
      img: img || 'assets/placeholder.png', inStock: p.in_stock, cat: category,
      rating: p.rating || 5.0, revs: p.review_count || 10, desc: p.description,
      isFeatured: p.is_featured, rawName: p.name
    };
  });

  window.products = allProds;

  const grouped = {};
  allProds.forEach(p => {
    // 1. Remove parentheses content: "Senthura Mango (3kg)" -> "Senthura Mango"
    // 2. Remove trailing weights: "Honey 500g" -> "Honey"
    // 3. Remove common product suffixes for better grouping
    let baseName = p.name
      .replace(/\(.*\)/g, '')
      .replace(/\s+\d+\s*(kg|g|l|ml|litres|litre|lit|kilo|gram|oz|lb)\s*$/i, '')
      .replace(/ mangoes$/i, '')
      .replace(/ mango$/i, '')
      .replace(/ powder$/i, '')
      .replace(/ oil$/i, '')
      .replace(/ ghee$/i, '')
      .trim();
      
    if (!grouped[baseName]) {
      grouped[baseName] = { ...p, name: baseName, variants: [] };
    }
    grouped[baseName].variants.push(p);
  });

  Object.values(grouped).forEach(g => {
    g.variants.sort((a, b) => a.price - b.price);
    const v0 = g.variants[0];
    g.id = v0.id; g.price = v0.price; g.wt = v0.wt; g.img = v0.img;
    g.originalPrice = v0.originalPrice;
    g.inStock = g.variants.some(v => v.inStock);
  });

  window.displayProducts = Object.values(grouped);
  updateCartCount();
  refreshCurrentView();
}

// ===== CORPORATE ORDER SUBMISSION =====
async function submitCorpOrder() {
  const companyName = (document.getElementById('corp-company-name')?.value || '').trim();
  const heritageMsg = (document.getElementById('corp-heritage-msg')?.value || '').trim();
  const totalUnits = Math.max(15, parseInt(document.getElementById('corp-total-units')?.value || 15));
  const contactEmail = (document.getElementById('corp-email')?.value || '').trim();
  const contactPhone = (document.getElementById('corp-phone')?.value || '').trim();

  if (!companyName) { showToast('Please enter your company name.'); return; }
  if (!contactPhone) { showToast('Please enter a contact phone number.'); return; }

  const cCounts = window.corpCounts || { imam: 0, alph: 0, bang: 0, sent: 0 };
  const cLimit = window.corpLimit || 3;

  const getR = k => {
    const p = (window.products || []).find(x => x.name.toLowerCase().includes(k));
    return p ? window.getUnitPrice(p.price, p.wt).rate : ({ imam: 349, alph: 299, bang: 259, sent: 239 }[k] || 250);
  };
  const rates = { imam: getR('imam'), alph: getR('alph'), bang: getR('bang'), sent: getR('sent') };
  let pricePerCrate = 0, totalKg = 0;
  for (const v of ['imam', 'alph', 'bang', 'sent']) {
    const qty = cCounts[v] || 0;
    pricePerCrate += qty * rates[v];
    totalKg += qty;
  }

  if (totalKg !== cLimit) {
    showToast(`Your mix total (${totalKg}kg) must match the crate size (${cLimit}kg)!`);
    return;
  }

  const totalAmount = pricePerCrate * totalUnits;
  const enquiryRef = 'CE-' + Math.floor(1000000 + Math.random() * 9000000);

  const options = {
    key: 'rzp_live_SblSXsCRc6GjPo', amount: totalAmount * 100, currency: 'INR',
    name: 'Farmmily Executive B2B', description: `${totalUnits} Crates`,
    image: 'assets/farmmily logo.png', prefill: { contact: contactPhone, email: contactEmail },
    handler: async function (response) {
      try {
        const obj = {
          company_name: companyName, crate_size: cLimit,
          imam_qty: cCounts.imam || 0, alph_qty: cCounts.alph || 0,
          bang_qty: cCounts.bang || 0, sent_qty: cCounts.sent || 0,
          total_units: totalUnits, heritage_message: heritageMsg,
          total_amount: totalAmount, contact_phone: contactPhone,
          contact_email: contactEmail, razorpay_payment_id: response.razorpay_payment_id,
          enquiry_ref: enquiryRef, status: 'confirmed',
          // Legacy fields for Admin Side compatibility
          phone: contactPhone, email: contactEmail
        };
        await supabaseClient.from('corporate_orders').insert([obj]);
        const overlay = document.getElementById('corp-success-overlay');
        const refEl = document.getElementById('corp-enquiry-ref');
        if (overlay) overlay.style.display = 'flex';
        if (refEl) refEl.textContent = enquiryRef;
      } catch (err) {
        console.error('Corp DB Error:', err);
      }
    }
  };
  const rzp = new Razorpay(options); rzp.open();
}
window.submitCorpOrder = submitCorpOrder;

// ===== TRACKING & HISTORY =====
async function handleTrack(manualId = null) {
  const inp = document.getElementById('tr-oid');
  const res = document.getElementById('tr-res');
  const btn = document.getElementById('track-btn');
  if (!res) return;

  const query = (manualId || (inp ? inp.value : '')).trim();
  if (!query) { showToast('Enter Reference ID or Phone'); return; }
  window.lastTrackQuery = query;

  const id = query.toUpperCase().replace('#', '');
  const isPhone = /^\d{10}$/.test(id.replace(/\s/g, ''));
  const cleanPhone = id.replace(/\s/g, '');

  res.style.display = 'block';
  res.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><div class="spinner" style="margin:0 auto 15px;"></div>Locating your harvest...</div>';
  
  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
  }

  try {
    let standardOrders = [];
    let corporateOrders = [];

    if (isPhone) {
      // Find ALL standard orders by phone
      const { data: stdData } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('phone', cleanPhone)
        .order('created_at', { ascending: false });
      standardOrders = stdData || [];

      // Find ALL corporate orders by phone
      const { data: corpData } = await supabaseClient
        .from('corporate_orders')
        .select('*')
        .eq('contact_phone', cleanPhone)
        .order('created_at', { ascending: false });
      corporateOrders = corpData || [];
    } else {
      // Find standard order by number
      const { data: stdData } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .or(`order_number.eq.${id},order_number.eq.FM-${id}`)
        .maybeSingle();
      if (stdData) standardOrders = [stdData];

      // Find corporate order by ref
      const { data: corpData } = await supabaseClient
        .from('corporate_orders')
        .select('*')
        .or(`enquiry_ref.eq.${id},enquiry_ref.eq.CE-${id}`)
        .maybeSingle();
      if (corpData) corporateOrders = [corpData];
    }

    const combined = [
      ...standardOrders.map(o => ({ ...o, type: 'ORDER' })),
      ...corporateOrders.map(c => ({ ...c, type: 'CORPORATE' }))
    ];

    if (combined.length > 0) {
      if (combined.length === 1) {
        renderTrackResult(combined[0], combined[0].type, res);
      } else {
        renderMultiOrderResults(combined, res);
      }
    } else {
      res.innerHTML = `
        <div style="padding:40px; text-align:center; background:#fff5f5; border-radius:24px; border:1px solid #fed7d7;">
          <div style="font-size:32px; margin-bottom:12px;">🔍</div>
          <h3 style="color:#c53030; margin-bottom:8px;">Not Found</h3>
          <p style="color:#718096; font-size:14px;">We couldn't find any order with ${isPhone ? 'Phone' : 'ID'}: <b>${query}</b>.</p>
        </div>`;
    }
  } catch (err) {
    console.error("Tracking error:", err);
    res.innerHTML = '<div style="padding:20px;color:#e74c3c;text-align:center;">Connection error. Please try again.</div>';
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }
}

function renderTrackResult(data, type, container) {
  const rawStatus = (data.status || 'confirmed').toLowerCase();
  const id = data.order_number || data.enquiry_ref;
  const date = new Date(data.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Map backend statuses to simple UI steps
  let status = rawStatus;
  if (type === 'CORPORATE') {
    if (rawStatus === 'new') status = 'confirmed';
    if (rawStatus === 'contacted') status = 'packed'; // or similar stage
    if (rawStatus === 'fulfilled') status = 'delivered';
  }

  const steps = ['confirmed', 'packed', 'shipped', 'delivered'];
  let currentStepIndex = steps.indexOf(status);
  if (currentStepIndex === -1 && status === 'cancelled') {
     // Special handle for cancelled
     container.innerHTML = `<div style="padding:40px; text-align:center; background:#fff5f5; border-radius:32px; border:1px solid #fed7d7;">
       <div style="font-size:32px; margin-bottom:12px;">🚫</div>
       <h3 style="color:#c53030; margin-bottom:8px;">Order Cancelled</h3>
       <p style="color:#718096; font-size:14px;">This reference <b>${id}</b> has been cancelled. Please contact support if this is an error.</p>
     </div>`;
     return;
  }
  
  if (currentStepIndex === -1) currentStepIndex = 0; // Default to confirmed

  // --- ITEM SUMMARY LOGIC ---
  let itemsSummaryHTML = '';
  if (type === 'ORDER' && data.order_items && data.order_items.length) {
    itemsSummaryHTML = `
      <div style="margin-top:24px; padding:16px; background:#f9fafb; border-radius:16px; border:1px solid #f0f0f0;">
        <h5 style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Items Summary</h5>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${data.order_items.map(item => `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size:13px; font-weight:600; color:#333;">${item.product_name} <span style="font-size:11px; color:#999;">x${item.quantity}</span></div>
              <div style="font-size:12px; color:#666; font-weight:700;">₹${Math.round(item.total_price)}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  } else if (type === 'CORPORATE') {
    const corpItems = [];
    if (data.imam_qty) corpItems.push(`${data.imam_qty}kg Imam Pasand`);
    if (data.alph_qty) corpItems.push(`${data.alph_qty}kg Alphonso`);
    if (data.bang_qty) corpItems.push(`${data.bang_qty}kg Banganapalli`);
    if (data.sent_qty) corpItems.push(`${data.sent_qty}kg Senthura`);

    if (corpItems.length) {
      itemsSummaryHTML = `
        <div style="margin-top:24px; padding:16px; background:#f0f9ff; border-radius:16px; border:1px solid #e0f2fe;">
          <h5 style="font-size:10px; font-weight:900; color:#0369a1; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">B2B Mix (per crate)</h5>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${corpItems.map(txt => `<span style="font-size:11px; font-weight:700; background:#fff; padding:4px 10px; border-radius:8px; border:1px solid #e0f2fe; color:#0c4a6e;">${txt}</span>`).join('')}
          </div>
          <div style="margin-top:12px; font-size:12px; font-weight:900; color:#0369a1;">Total Units: ${data.total_units} Crates</div>
        </div>`;
    }
  }

  let stepsHTML = steps.map((s, i) => {
    const isDone = i <= currentStepIndex;
    const isActive = i === currentStepIndex;
    return `
      <div class="track-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
        <div class="ts-icon">${isDone ? '✓' : ''}</div>
        <div class="ts-info">
          <h4 style="text-transform:capitalize;">${s}</h4>
          <p>${isActive ? 'Your order is currently here' : (isDone ? 'Completed' : 'Pending')}</p>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="background:white; padding:32px; border-radius:32px; box-shadow:0 20px 50px rgba(0,0,0,0.05); border:1px solid #f0f0f0; position:relative;">
      <!-- Invoice Label -->
      <div style="position:absolute; top:-12px; right:32px; background:#1b391b; color:white; padding:4px 15px; border-radius:30px; font-size:10px; font-weight:900; letter-spacing:1px; box-shadow:0 5px 15px rgba(27,57,27,0.2);">DIGITAL INVOICE</div>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; padding-bottom:20px; border-bottom:1px solid #f5f5f5;">
        <div>
          <span style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; letter-spacing:3px;">${type} REFERENCE</span>
          <div style="font-size:24px; font-weight:900; color:#1b391b;">#${id}</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; font-weight:900; color:#888; text-transform:uppercase; letter-spacing:3px;">PLACED ON</span>
          <div style="font-size:16px; font-weight:700; color:#444;">${date}</div>
        </div>
      </div>

      <div class="track-steps-container" style="margin-top:20px;">
        ${stepsHTML}
      </div>
      
      ${itemsSummaryHTML}

      <!-- Financial Detail -->
      <div style="margin-top:20px; padding:16px; border-radius:16px; background:#fff; border:1px dashed #e2e8f0;">
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#64748b; margin-bottom:6px;">
          <span>Subtotal</span>
          <span>₹${data.subtotal || data.total - (data.delivery_charge || 0)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#64748b; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;">
          <span>Delivery Charge</span>
          <span>${data.delivery_charge > 0 ? '₹' + data.delivery_charge : 'FREE'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:900; color:#1b391b;">
          <span>Total Paid</span>
          <span>₹${data.total}</span>
        </div>
      </div>

      <div style="margin-top:32px; display:flex; gap:12px; align-items:center;">
        <button onclick="window.print()" style="flex:1; background:#f1f5f9; color:#475569; border:none; padding:12px; border-radius:14px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg> Save PDF / Print
        </button>
        <a href="https://wa.me/917708847977" style="flex:1.5; background:#1b391b; color:white; text-decoration:none; padding:12px; border-radius:14px; font-size:12px; font-weight:700; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px;">
           Estate Support Manager →
        </a>
      </div>
      <p style="text-align:center; font-size:11px; color:#94a3b8; margin-top:20px;">Thank you for supporting heritage harvests! 🍃</p>
    </div>
  `;
}
function renderMultiOrderResults(orders, container) {
  const html = orders.map(o => {
    const id = o.order_number || o.enquiry_ref;
    const date = new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const status = (o.status || 'confirmed').toLowerCase();
    
    return `
      <div onclick="window.renderOneOrder('${id}')" style="background:white; padding:20px; border-radius:20px; margin-bottom:12px; border:1px solid #eee; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.3s ease; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:40px; height:40px; background:#f0fdf4; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px;">📦</div>
          <div>
            <div style="font-size:14px; font-weight:900; color:#1b391b;">#${id}</div>
            <div style="font-size:11px; color:#888;">Order placed ${date}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px; font-weight:900; background:#f0fdf4; color:#22c55e; padding:4px 8px; border-radius:6px; text-transform:uppercase;">${status}</div>
          <div style="font-size:11px; color:#22c55e; margin-top:4px; font-weight:700;">Track →</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="margin-top:20px;">
      <h3 style="font-size:13px; font-weight:900; color:#1b391b; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; margin-left:8px;">Orders Found (${orders.length})</h3>
      ${html}
    </div>
  `;
}
window.renderMultiOrderResults = renderMultiOrderResults;

window.renderOneOrder = function(id) {
  handleTrack(id);
};

async function initApp() {
  await fetchDeliveryConfig();
  await loadCategories();
  await loadProducts();
  showPage('home');
  updateCartCount();

  // Realtime Subscriptions
  if (supabaseClient) {
    supabaseClient
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        console.log('Product update detected, refreshing...', payload);
        loadProducts(); // Re-fetch and re-render
      })
      .subscribe();

    supabaseClient
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
        loadCategories();
      })
      .subscribe();
  }
}

function openSearch() {
  const hdr = document.getElementById('header');
  const bar = document.getElementById('nav-search-bar');
  if (hdr) hdr.classList.add('search-open');
  if (bar) {
    bar.classList.add('active');
    const inp = document.getElementById('srch-in');
    if (inp) setTimeout(() => inp.focus(), 100);
  }
}
window.openSearch = openSearch;

function closeSearch() {
  const hdr = document.getElementById('header');
  const bar = document.getElementById('nav-search-bar');
  const res = document.getElementById('srch-res');
  if (hdr) hdr.classList.remove('search-open');
  if (bar) bar.classList.remove('active');
  if (res) res.style.display = 'none';
  const inp = document.getElementById('srch-in');
  if (inp) inp.value = '';
}
window.closeSearch = closeSearch;

function copyOrderId() {
  const el = document.getElementById('succ-oid');
  if (el) {
    const txt = el.textContent.replace('#', '');
    navigator.clipboard.writeText(txt).then(() => {
      showToast('Order ID Copied!');
    });
  }
}
window.copyOrderId = copyOrderId;

function liveSearch(q) {
  const res = document.getElementById('srch-res');
  if (!res) return;
  if (!q.trim()) { res.style.display = 'none'; return; }

  const list = (window.displayProducts || []).filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.cat && p.cat.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 6);

  if (!list.length) {
    res.innerHTML = '<div style="padding:15px; color:#999; font-size:13px;">No products found</div>';
    res.style.display = 'block';
    return;
  }

  res.innerHTML = list.map(p => `
    <div class="srch-item" onclick="showProduct(${p.id}); closeSearch();" style="display:flex; align-items:center; gap:12px; padding:10px 15px; cursor:pointer; border-bottom:1px solid #f5f5f5;">
      <img src="${p.img}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
      <div style="flex:1">
        <div style="font-size:14px; font-weight:600; color:#333;">${p.name}</div>
        <div style="font-size:11px; color:#22c55e; font-weight:700;">₹${p.price}</div>
      </div>
    </div>
  `).join('');
  res.style.display = 'block';
}
window.liveSearch = liveSearch;

// ===== CUSTOM CRATE BUILDER =====
let crateLimit = 3;
let crateMix = {}; // { id: qty }
let mangoVarieties = [];

window.openCrateBuilder = function() {
  const overlay = document.getElementById('crate-overlay');
  const modal = document.getElementById('crate-builder');
  if (!overlay || !modal) return;

  // Initialize mangoes - exclude the Custom Crate itself!
  mangoVarieties = (window.displayProducts || []).filter(p => {
    const isMangoCrate = p.name.toLowerCase().includes('custom') || p.name.toLowerCase().includes('crate');
    const isMango = (p.cat && p.cat.toLowerCase().includes('mango')) || 
                    p.name.toLowerCase().includes('mango');
    return isMango && !isMangoCrate;
  });
  
  crateMix = {};
  mangoVarieties.forEach(v => crateMix[v.id] = 0);
  crateLimit = 3;
  
  window.renderCrateVarieties();
  window.updateCrateUI();
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
  setTimeout(() => {
    modal.style.transform = 'translateY(0)';
    overlay.style.opacity = '1';
  }, 10);
  document.body.style.overflow = 'hidden';
};

window.closeCrateBuilder = function() {
  const c = document.getElementById('crate-builder');
  const o = document.getElementById('crate-overlay');
  if (c) { 
    c.style.transform = 'translateY(100%)';
    c.classList.remove('active');
  }
  setTimeout(() => {
    if (o) o.style.display = 'none';
    if (c) {
      c.style.display = 'none';
      c.style.transform = '';
      c.style.transition = '';
    }
  }, 400);
  document.body.style.overflow = '';
};

window.setCrateLimit = function(lim) {
  crateLimit = lim;
  console.log("Crate limit changed to:", lim);
  
  // Reset previous mixes to avoid weight overflow
  if (mangoVarieties && mangoVarieties.length) {
    mangoVarieties.forEach(v => crateMix[String(v.id)] = 0);
  } else {
    crateMix = {};
  }
  
  // Update Tab UI
  document.querySelectorAll('.crate-size-tab').forEach(t => {
    t.style.background = '#f8fafc';
    t.style.borderColor = '#eee';
    t.style.color = '#64748b';
    t.classList.remove('active');
  });
  
  const activeTab = document.getElementById(`tab-${lim}kg`);
  if (activeTab) {
    activeTab.style.background = '#f0fdf4';
    activeTab.style.borderColor = '#22c55e';
    activeTab.style.color = '#166534';
    activeTab.classList.add('active');
  }

  window.renderCrateVarieties();
  window.updateCrateUI();
};

window.updateCrateVariety = function(id, delta) {
  const cid = String(id);
  const currentTotal = Object.values(crateMix).reduce((a, b) => a + b, 0);
  
  if (delta > 0 && currentTotal + delta > crateLimit) {
    showToast(`Crate limit reached (${crateLimit} KG)`);
    return;
  }
  
  const currentQty = crateMix[cid] || 0;
  if (currentQty + delta < 0) return;
  
  crateMix[cid] = currentQty + delta;
  console.log(`Updated ${cid} to ${crateMix[cid]}`);
  
  window.renderCrateVarieties();
  window.updateCrateUI();
};

window.renderCrateVarieties = function() {
  const container = document.getElementById('crate-varieties');
  if (!container) return;
  
  container.innerHTML = mangoVarieties.map(v => {
    const qty = crateMix[String(v.id)] || 0;
    // Get the accurate 1KG rate
    const unitPrice = window.getUnitPrice ? window.getUnitPrice(v.price, v.wt).rate : v.price;
    
    return `
    <div style="display:flex; align-items:center; gap:15px; padding:15px; border-bottom:1px solid #f1f5f9;">
        <img src="${v.img}" style="width:60px; height:60px; border-radius:12px; object-fit:contain; background:#f8fafc; border:1px solid #f1f5f9; padding:4px;">
        <div style="flex:1">
            <div style="font-weight:700; color:#1b391b;">${v.name}</div>
            <div style="font-size:12px; color:#22c55e; font-weight:700;">₹${unitPrice} / KG</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; background:#f8fafc; border-radius:50px; padding:6px 14px; border:1px solid #e2e8f0;">
            <button onclick="window.updateCrateVariety('${v.id}', -1)" style="background:none; border:none; font-weight:900; color:#ef4444; cursor:pointer; font-size:22px; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">–</button>
            <span style="font-weight:900; min-width:20px; text-align:center; font-size:16px; color:#1b391b;">${qty}</span>
            <button onclick="window.updateCrateVariety('${v.id}', 1)" style="background:none; border:none; font-weight:900; color:#22c55e; cursor:pointer; font-size:22px; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">+</button>
        </div>
    </div>
  `}).join('');
};

window.updateCrateUI = function() {
  const currentTotal = Object.values(crateMix).reduce((a, b) => a + b, 0);
  let totalPrice = 0;
  
  mangoVarieties.forEach(v => {
    const qty = crateMix[String(v.id)] || 0;
    const unitPrice = window.getUnitPrice ? window.getUnitPrice(v.price, v.wt).rate : v.price;
    totalPrice += qty * unitPrice;
  });
  
  const curWtEl = document.getElementById('crate-current-wt');
  const maxLimEl = document.getElementById('crate-max-limit');
  const totPrEl = document.getElementById('crate-total-price');
  
  if (curWtEl) curWtEl.textContent = currentTotal;
  if (maxLimEl) maxLimEl.textContent = crateLimit;
  if (totPrEl) totPrEl.textContent = totalPrice.toLocaleString('en-IN');
  
  const btn = document.getElementById('add-crate-btn');
  if (btn) {
    if (currentTotal === crateLimit) {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.background = '#1b391b';
      btn.disabled = false;
      btn.textContent = `ADD ${crateLimit}KG MIX TO CART - ₹${totalPrice.toLocaleString('en-IN')}`;
    } else {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.background = '#64748b';
      btn.disabled = true;
      btn.textContent = `SELECT ${crateLimit - currentTotal} KG MORE...`;
    }
  }
};

window.crateLimit = crateLimit;
window.crateMix = crateMix;

window.addCustomCrateToCart = function() {
  const currentTotal = Object.values(crateMix).reduce((a, b) => a + b, 0);
  if (currentTotal !== crateLimit) return;
  
  let totalPrice = 0;
  let summary = [];
  mangoVarieties.forEach(v => {
    const qty = crateMix[String(v.id)] || 0;
    if (qty > 0) {
      const perKgRate = window.getUnitPrice ? window.getUnitPrice(v.price, v.wt).rate : v.price;
      totalPrice += qty * perKgRate;
      summary.push(`${qty}kg ${v.name}`);
    }
  });

  const customId = 999000 + (Date.now() % 10000);
  const customProduct = {
    id: customId,
    name: `Custom Crate (${crateLimit}kg)`,
    price: totalPrice,
    img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=60&w=400&fit=crop',
    desc: `Mixed Pack: ${summary.join(', ')}`,
    wt: `${crateLimit}kg`,
    is_active: true,
    inStock: true,
    isCustom: true
  };
  
  addToCart(customId, customProduct);
  showToast('Custom Crate added to harvest bag!');
  window.closeCrateBuilder();
  refreshCurrentView();
};

// End of App logic

async function initApp() {
  await fetchDeliveryConfig();
  await loadCategories();
  await loadProducts();
  loadCart();
  
  // router handles initial page selection
  handleRoute();
  
  updateCartCount();

  // Realtime Subscriptions
  if (supabaseClient) {
    supabaseClient.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts).subscribe();
    supabaseClient.channel('public:categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadCategories).subscribe();
    supabaseClient.channel('public:store_settings').on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchDeliveryConfig).subscribe();
    
    // Track Order Updates live
    supabaseClient.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
       if (curPage === 'track' && window.lastTrackQuery) handleTrack(window.lastTrackQuery);
    }).subscribe();
    supabaseClient.channel('public:corporate_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'corporate_orders' }, () => {
       if (curPage === 'track' && window.lastTrackQuery) handleTrack(window.lastTrackQuery);
    }).subscribe();
  }
}

async function fetchDeliveryConfig() {
  try {
    const { data } = await supabaseClient.from('store_settings').select('value').eq('key', 'delivery_config').maybeSingle();
    if (data && data.value) {
      window.deliveryConfig = data.value;
      if (curPage === 'cart') renderCart();
    }
  } catch (err) {
    console.error("Error fetching delivery config:", err);
  }
}

initApp();
window.handleTrack = handleTrack;
window.trackOrder = handleTrack;
window.updCart = updCart;

function setupMobileMarquee() {
  const trowNode = document.querySelector('.trow');
  if (trowNode && window.innerWidth < 900 && !trowNode.classList.contains('marquee-enabled')) {
    trowNode.classList.add('marquee-enabled');
    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = '100%';
    trowNode.parentNode.insertBefore(wrapper, trowNode);
    wrapper.appendChild(trowNode);
    const children = Array.from(trowNode.children);
    children.forEach(c => {
      const clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      trowNode.appendChild(clone);
    });
    trowNode.style.width = 'max-content';
    trowNode.style.overflowX = 'visible';
    trowNode.style.animation = 'marqueeMob 20s linear infinite';
    const style = document.createElement('style');
    style.textContent = '@keyframes marqueeMob { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-50% - 12px)); } } .trow:active { animation-play-state: paused !important; }';
    document.head.appendChild(style);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMobileMarquee);
} else {
  setupMobileMarquee();
}
