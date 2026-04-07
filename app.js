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
var products = [
  { id: 200, name: 'Imam Pasand (3KG Box)', cat: 'Mangoes', price: 999, wt: '3 KG', img: 'assets/imam.png', rating: 5.0, inStock: true, revs: 156, benefits: ['Handpicked', 'Elite Selection'], desc: 'The King of Mangoes from Mambalam.' },
  { id: 201, name: 'Alphonso (3KG Box)', cat: 'Mangoes', price: 899, wt: '3 KG', img: 'assets/alphonso.png', rating: 4.9, inStock: true, revs: 89, benefits: ['Rich Aroma'], desc: 'Premium Ratnagiri style Alphonso.' },
  { id: 202, name: 'Banganapalli (3KG Box)', cat: 'Mangoes', price: 799, wt: '3 KG', img: 'assets/banganapalli.png', rating: 4.8, inStock: true, revs: 212, benefits: ['Succulent'], desc: 'Golden and sweet Banganapalli.' },
  { id: 203, name: 'Senthura (3KG Box)', cat: 'Mangoes', price: 699, wt: '3 KG', img: 'assets/senthura.png', rating: 4.7, inStock: true, revs: 45, benefits: ['Red Blush'], desc: 'Honey-sweet Senthura mangoes.' }
];
var cats = [{ name: 'Mangoes', svg: '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M439.4 362.2c-19.3-20.7-58.3-54.3-108.8-87.3-50.5-33.1-94.2-46.1-125.7-43.5-31.5 2.6-47.5 13.9-63.5 29.9s-27.3 32-29.9 63.5c-2.6 31.5 10.4 75.2 43.5 125.7 33.1 50.5 66.7 89.5 87.3 108.8l10.1 9.4 10.1-9.4c20.7-19.3 54.3-58.3 87.3-108.8 33.1-50.5 46.1-94.2 43.5-125.7zM256 128c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zM256 0c-141.4 0-256 114.6-256 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0z"/></svg>' }];
window.products = products;
window.cats = cats;

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
    const p = window.products.find(x => Number(x.id) === Number(i.id));
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

function addToCart(id) {
  const nid = Number(id);
  const p = window.products.find(x => Number(x.id) === nid);
  if (!p || !p.inStock) return;
  const ex = window.cart.find(x => Number(x.id) === nid);
  if (ex) ex.qty++; else window.cart.push({ id: nid, qty: 1 });
  saveCart();
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
function showPage(page) {
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
    document.querySelectorAll('#mob-nav .mob-nav-item, #desktop-nav a').forEach(a => {
      const oc = a.getAttribute('onclick') || '';
      if (oc.includes(`'${page}'`)) a.classList.add('active');
      else a.classList.remove('active');
    });
  }
  
  if (page === 'home') renderHome();
  if (page === 'shop') renderShop();
  if (page === 'cart') renderCart();
  
  closeMob();
}
window.showPage = showPage;

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

function closeMob() {
  const m = document.getElementById('mob-menu');
  const o = document.getElementById('mob-menu-overlay');
  if (m && o) {
    m.classList.remove('active');
    setTimeout(() => o.style.display = 'none', 300);
    document.body.style.overflow = 'auto';
  }
}
window.closeMob = closeMob;

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
  else if (curPage === 'shop') filterProds();
  else if (curPage === 'cart') renderCart();
  else if (curPage === 'product') {
    if (curProd) openProduct(curProd.id);
  }

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

// ===== PRODUCT CARD HTML ====
function pcardHTML(p) {
  const isMango = (p.name || '').toLowerCase().includes('mango') || (p.cat && p.cat.toLowerCase().includes('mango'));
  const ex = (typeof window.cart !== 'undefined' ? window.cart.find(x => x.id === p.id) : null);
  const qty = ex ? ex.qty : 0;

  if (isMango) {
    const actionArea = qty > 0 ? `
      <div class="m-qty-ctrl" onclick="event.stopPropagation()">
          <button onclick="updCart(${p.id}, -1)">-</button>
          <span>${qty}</span>
          <button onclick="updCart(${p.id}, 1)">+</button>
      </div>` : `
      <div class="m-add-btn-image" onclick="event.stopPropagation(); addToCart(${p.id})">
          ADD TO CART
      </div>`;

    return `
            <div class="premium-mango-card">
                <div class="m-img-wrap" style="background: ${getColorForVariety(p.name)}" onclick="if(window.showPremiumDetail) window.showPremiumDetail('${p.name}')">
                    <img src="${p.img}" alt="${p.name}">
                    ${actionArea}
                </div>
                <div class="m-info">
                    <div class="m-top-row">
                        <div class="m-wt-tag">${p.wt || '3 kg'}</div>
                        <div class="m-stats">
                            <div class="m-stars">★★★★★</div>
                            <span class="m-rating-val">${p.rating || '5.0'}</span>
                        </div>
                    </div>
                    <h3 class="m-title">${p.name}</h3>
                    <span class="m-subtitle">Heritage Mambalam Series</span>
                    <div class="m-price-row"><div class="m-price-box"><span class="m-currency">₹</span><span class="m-amt">${p.price}</span></div></div>
                </div>
            </div>
        `;
  }

  return `
        <div class="p-card" onclick="showProduct(${p.id})">
            ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
            <div class="p-img"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
            <div class="p-info">
                <div class="p-cat">${p.cat || ''}</div>
                <h3 class="p-name">${p.name}</h3>
                <div class="p-wt">${p.wt}</div>
                <div class="p-bot" style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="p-price">₹${p.price}</span>
                    <button class="add-btn" style="background:var(--primary); color:white; border:none; width:30px; height:30px; border-radius:50%;" onclick="event.stopPropagation();addToCart(${p.id})">+</button>
                </div>
            </div>
        </div>
    `;
}

function getColorForVariety(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('imam')) return '#FFF9C4';
  if (n.includes('alph')) return '#FFE0B2';
  if (n.includes('bang')) return '#FFF17644';
  if (n.includes('sent')) return '#FFEBEE';
  return '#f0fdf4';
}

function showProduct(id) { openProduct(id); }

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
    const mangoProds = window.products.filter(p => (p.name || '').toLowerCase().includes('mango')).slice(0, 8);
    fr.innerHTML = mangoProds.length ? mangoProds.map(pcardHTML).join('') : '<p style="text-align:center;width:100%;color:#888;">Harvesting fresh mangoes for you...</p>';
  }
}

function filterBycat(cat) { activeFilter = cat; showPage('shop'); }

// ===== SHOP =====
function renderShop() {
  const chips = document.getElementById('shop-cats-row');
  if (chips) {
    const list = ['All', 'Mangoes'];
    chips.innerHTML = list.map(c =>
      '<div class="chip' + (c === activeFilter ? ' active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</div>'
    ).join('');
  }
  filterProds();
}

function setFilter(cat) { activeFilter = cat; renderShop(); }

function filterProds() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const q = (document.getElementById('shop-srch')?.value || '').toLowerCase();
  
  let list = window.products.filter(p => {
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
  showPage('product');
}

function chQty(d) { detQty = Math.max(1, detQty + d); const q = document.getElementById('det-qty'); if (q) q.textContent = detQty; }

function addDetToCart() {
  if (!curProd) return;
  const ex = window.cart.find(x => x.id === curProd.id);
  if (ex) ex.qty += detQty; else window.cart.push({ id: curProd.id, qty: detQty });
  saveCart();
  showToast('Added to basket!');
  showPage('shop');
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
    const p = window.products.find(x => Number(x.id) === Number(ci.id));
    if (!p) return '';
    sub += p.price * ci.qty;
    return `
      <div class="citem">
        <img src="${p.img}">
        <div>
          <div class="ci-name">${p.name}</div>
          <div class="ci-wt">${p.wt}</div>
          <div class="ci-bot">
            <span class="ci-price">₹${p.price * ci.qty}</span>
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
  
  const deliveryFee = sub > 1000 ? 0 : 49;
  const total = sub + deliveryFee;
  
  el.innerHTML = `
    <div class="clist">${items}</div>
    <div class="csummary">
      <div class="srow"><span>Subtotal</span><span>₹${sub}</span></div>
      <div class="srow"><span style="color:#666;">Delivery</span><span style="color:${deliveryFee === 0 ? '#22c55e' : '#666'};">${deliveryFee === 0 ? 'Free' : '₹'+deliveryFee}</span></div>
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
    if(bg) bg.style.transition = 'none';
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
      if(bg) bg.style.width = '100%';
      slider.classList.add('completed');
      text.innerText = 'PROCESSING...';
      placeOrder();
    } else {
      handle.style.transition = 'all 0.3s cubic-bezier(.2,.8,.2,1)';
      handle.style.transform = 'translateX(0)';
      if(bg) { bg.style.transition = 'all 0.3s'; bg.style.width = '0'; }
      text.style.transition = 'all 0.3s';
      text.style.opacity = '1';
    }
  };

  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  handle.addEventListener('touchstart', onStart);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('touchend', onEnd);
}

function placeOrder() {
  const totEl = document.getElementById('co-tot');
  const tot = totEl ? parseInt(totEl.innerText) : 0;
  if (!tot) return;
  
  const options = {
    key: "rzp_test_SYaf8btoC5VUyk", amount: tot * 100, currency: "INR", name: "Farmmily Foods",
    handler: response => {
      showToast('Payment Successful!');
      window.cart = []; saveCart(); showPage('home');
    },
    modal: {
      ondismiss: function() {
        const slider = document.getElementById('cart-slider');
        if(slider) {
          slider.classList.remove('completed');
          slider.querySelector('.slide-text').innerText = 'SLIDE TO PAY';
          const handle = slider.querySelector('.slide-handle');
          const bg = slider.querySelector('.slide-bg');
          handle.style.transform = 'translateX(0)';
          if(bg) bg.style.width = '0';
        }
      }
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// ===== SUPABASE LOAD =====
async function loadCategories() {
  // Hardcode to Mangoes only as requested
  cats = [{ name: 'Mangoes', svg: '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M439.4 362.2c-19.3-20.7-58.3-54.3-108.8-87.3-50.5-33.1-94.2-46.1-125.7-43.5-31.5 2.6-47.5 13.9-63.5 29.9s-27.3 32-29.9 63.5c-2.6 31.5 10.4 75.2 43.5 125.7 33.1 50.5 66.7 89.5 87.3 108.8l10.1 9.4 10.1-9.4c20.7-19.3 54.3-58.3 87.3-108.8 33.1-50.5 46.1-94.2 43.5-125.7zM256 128c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zM256 0c-141.4 0-256 114.6-256 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0z"/></svg>' }];
  renderHome();
}

// ===== SHOP =====
function renderShop() {
  const chips = document.getElementById('shop-cats-row');
  if (chips) {
    // Only show Mangoes chip, or hide it if it's the only one
    chips.style.display = 'none'; 
  }
  filterProds();
}

async function loadProducts() {
  if (!supabaseClient) { handleRawProducts([]); return; }
  const { data } = await supabaseClient.from('products').select('*');
  handleRawProducts(data || []);
}

function handleRawProducts(data) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const assetMap = { 'imam': 'assets/imam.png', 'alph': 'assets/alphonso.png', 'bang': 'assets/banganapalli.png', 'sent': 'assets/senthura.png' };
  
  // 1. Filter ONLY mangoes from the DB data
  const mangoData = (data || []).filter(p => {
    const n = (p.name || '').toLowerCase();
    return n.includes('mango') || n.includes('imam') || n.includes('alph') || n.includes('bang') || n.includes('sent');
  });

  const raw = mangoData.map(p => {
    let img = p.image_url;
    const low = (p.name||'').toLowerCase();
    for (const k in assetMap) if (low.includes(k)) img = assetMap[k];
    return { 
       id: p.id, name: cap(p.name), price: p.price, wt: p.weight, 
       img: img || 'assets/imam.png', inStock: p.in_stock, cat: 'Mangoes',
       rating: p.rating || 5.0, revs: p.review_count || 10, desc: p.description
    };
  });
  
  const combined = [...raw];
  // 2. Add seed products if missing
  [200,201,202,203].forEach(id => {
    const seed = products.find(x => x.id === id);
    if (!combined.some(c => Number(c.id) === id)) combined.push(seed);
  });
  
  // 3. Final safety filter
  window.products = combined.filter(p => {
    const n = (p.name||'').toLowerCase();
    return n.includes('mango') || n.includes('imam') || n.includes('alph') || n.includes('bang') || n.includes('sent');
  });
  
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

  const rates = { imam: 349, alph: 299, bang: 259, sent: 239 };
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
    key: 'rzp_test_SYaf8btoC5VUyk', amount: totalAmount * 100, currency: 'INR',
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
          enquiry_ref: enquiryRef, status: 'confirmed'
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
async function handleTrack() {
  const inp = document.getElementById('track-id');
  const res = document.getElementById('track-res');
  if (!inp || !res) return;
  const id = inp.value.trim().toUpperCase();
  if (!id) { showToast('Enter Order ID'); return; }

  res.style.display = 'block';
  res.innerHTML = '<div style="text-align:center;padding:20px;">Tracking...</div>';

  const { data } = await supabaseClient.from('orders').select('*').eq('order_number', id).maybeSingle();
  if (data) {
    res.innerHTML = `<div style="background:#f9f9f9;padding:20px;border-radius:12px;"><h3>Order: ${id}</h3><p>Status: ${data.status.toUpperCase()}</p></div>`;
  } else {
    // Try corporate
    const { data: cd } = await supabaseClient.from('corporate_orders').select('*').eq('enquiry_ref', id).maybeSingle();
    if (cd) {
       res.innerHTML = `<div style="background:#f9f9f9;padding:20px;border-radius:12px;"><h3>B2B: ${id}</h3><p>Status: ${cd.status.toUpperCase()}</p></div>`;
    } else {
       res.innerHTML = '<div style="padding:20px;color:red;">Reference not found.</div>';
    }
  }
}
const trackOrder = handleTrack;

function renderRecentHistory() {
  // Logic to show recent searches
}

function saveToHistory(id) {
  // Logic to save search history
}

function initApp() {
  updateCartCount();
  loadProducts();
  loadCategories();
}

initApp();
window.handleTrack = handleTrack;
window.trackOrder = trackOrder;
window.updCart = updCart;
window.addToCartAndFeedback = function(b, id) { addToCart(id); refreshCurrentView(); };
