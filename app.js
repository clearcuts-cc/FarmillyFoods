// ===== SUPABASE =====
const supabaseUrl = 'https://jztreusepxilnfqffwka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== DATA =====
let products = [];
let cats = [];

// SVG icon helper
const svgCheck = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

// ===== STATE =====
let cart = JSON.parse(localStorage.getItem('ff_cart') || '[]');
let curPage = 'home', prevPage = 'home', curProd = null, detQty = 1, activeFilter = 'All';

// ===== CART HELPERS =====
function saveCart() {
  localStorage.setItem('ff_cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  const m = document.getElementById('mob-cnt');
  if (el) { el.textContent = n; n > 0 ? el.classList.add('show') : el.classList.remove('show'); }
  if (m) { m.textContent = n; n > 0 ? m.classList.add('show') : m.classList.remove('show'); }
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || !p.inStock) return;
  const ex = cart.find(x => x.id === id);
  if (ex) ex.qty++; else cart.push({ id, qty: 1 });
  saveCart();
  showToast(p.name + ' added to cart!');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ===== ROUTING =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); prevPage = curPage; curPage = page; window.scrollTo(0, 0); }
  updateNav(page);
  if (page === 'shop') renderShop();
  if (page === 'cart') renderCart();
  if (page === 'checkout') renderCheckout();
  closeMob();
}

function updateNav(page) {
  document.querySelectorAll('nav.desktop-nav a').forEach(a => {
    a.classList.remove('active');
    if (a.dataset.page === page) a.classList.add('active');
  });
  document.querySelectorAll('.mob-item').forEach(i => {
    i.classList.remove('active');
    if (i.dataset.mob === page) i.classList.add('active');
  });
}

function refreshCurrentView() {
  if (curPage === 'home') renderHome();
  else if (curPage === 'shop') filterProds();
  else if (curPage === 'cart') renderCart();
  else if (curPage === 'checkout') renderCheckout();
  else if (curPage === 'product') {
    if (curProd) openProduct(curProd.id);
  }
}

function goBack() { showPage(prevPage === 'product' ? 'shop' : prevPage); }

// ===== STARS =====
function stars(r) { return '<span style="color:var(--secondary)">' + String.fromCharCode(9733).repeat(Math.floor(r)) + String.fromCharCode(9734).repeat(5 - Math.floor(r)) + '</span>'; }

// ===== PRODUCT CARD HTML =====
function pcardHTML(p) {
  const inCart = !!cart.find(x => x.id === p.id);
  const disc = Math.round((1 - p.price / p.orig) * 100);
  const bClass = p.badge === 'New' ? 'new' : (p.badge ? 'amber' : '');
  
  let btnHTML = '';
  if (!p.inStock) {
    btnHTML = '<button class="btn-notify" disabled>Out of Stock</button>';
  } else if (inCart) {
    btnHTML = '<button class="btn-add" style="background:#fff;color:#e74c3c;border:1px solid #e74c3c" onclick="event.stopPropagation();rmCart(' + p.id + ')">Remove from Cart</button>';
  } else {
    btnHTML = '<button class="btn-add" onclick="event.stopPropagation();addToCartAnim(this,' + p.id + ')">Add to Cart</button>';
  }

  return '<div class="pcard" onclick="openProduct(' + p.id + ')">' +
    '<div class="ci-wrap">' +
    '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
    (p.badge ? '<span class="pbadge ' + bClass + '">' + p.badge + '</span>' : '') +
    '</div><div class="pbody">' +
    '<div class="pname">' + p.name + '</div>' +
    '<div class="pwt">' + p.wt + '</div>' +
    '<div class="pstars">' + stars(p.rating) + '<span class="rv">(' + p.revs + ')</span></div>' +
    '<div class="pprices"><span class="pp">' + String.fromCharCode(8377) + p.price + '</span><span class="pop">' + String.fromCharCode(8377) + p.orig + '</span><span class="pdisc">' + disc + '% off</span></div>' +
    btnHTML +
    '</div></div>';
}

function addToCartAnim(btn, id) {
  addToCart(id);
  btn.classList.add('added');
  btn.textContent = 'Added';
  setTimeout(() => { refreshCurrentView(); }, 800);
}

// ===== HOME =====
function renderHome() {
  const cr = document.getElementById('cats-row');
  if (cr) cr.innerHTML = cats.map(c =>
    '<div class="cat-card" onclick="filterBycat(\'' + c.name + '\')">' +
    '<div class="cat-icon-wrap">' + c.svg + '</div>' +
    '<span class="cn">' + c.name + '</span></div>'
  ).join('');

  const fr = document.getElementById('feat-row');
  if (fr) fr.innerHTML = products.slice(0, 8).map(pcardHTML).join('');
}

function filterBycat(cat) { activeFilter = cat; showPage('shop'); }

// ===== SHOP =====
const allCats = ['All', 'Ghee & Oils', 'Honey & Jaggery', 'Millets & Grains', 'Spices', 'Flours', 'Dry Fruits'];

function renderShop() {
  const chips = document.getElementById('chips');
  if (chips) {
    chips.innerHTML = allCats.map(c =>
      '<div class="chip' + (c === activeFilter ? ' active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</div>'
    ).join('');
  }
  filterProds();
}

function setFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('active');
    if (c.textContent === cat) c.classList.add('active');
  });
  filterProds();
}

function filterProds() {
  const q = (document.getElementById('shop-srch')?.value || '').toLowerCase();
  const sort = document.getElementById('sort-sel')?.value || '';
  let list = products.filter(p => {
    const matchCat = activeFilter === 'All' || p.cat === activeFilter;
    const catStr = p.cat ? p.cat.toLowerCase() : '';
    const matchQ = !q || p.name.toLowerCase().includes(q) || catStr.includes(q);
    return matchCat && matchQ;
  });
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  const g = document.getElementById('pgrid');
  const cnt = document.getElementById('prod-cnt');
  if (cnt) cnt.textContent = list.length;
  if (g) g.innerHTML = list.length
    ? list.map(pcardHTML).join('')
    : '<div class="empty-st"><div class="ei"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><p>No products found. Try a different search.</p></div>';
}

// ===== PRODUCT DETAIL =====
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  curProd = p; detQty = 1;
  prevPage = curPage;
  document.getElementById('det-img').src = p.img;
  document.getElementById('det-img').alt = p.name;
  const badge = document.getElementById('det-badge');
  badge.textContent = p.badge || '';
  badge.style.display = p.badge ? 'inline-block' : 'none';
  document.getElementById('det-name').textContent = p.name;
  document.getElementById('det-stars').innerHTML = stars(p.rating);
  document.getElementById('det-rev').textContent = p.rating + ' (' + p.revs + ' reviews)';
  document.getElementById('det-price').textContent = String.fromCharCode(8377) + p.price;
  document.getElementById('det-orig').textContent = String.fromCharCode(8377) + p.orig;
  const disc = Math.round((1 - p.price / p.orig) * 100);
  document.getElementById('det-disc').textContent = disc + '% off';
  document.getElementById('det-desc').textContent = p.desc;
  document.getElementById('det-qty').textContent = 1;
  document.getElementById('det-ben').innerHTML = p.benefits.map(b => '<li>' + svgCheck + ' ' + b + '</li>').join('');
  const btn = document.getElementById('det-add-btn');
  const inCart = !!cart.find(x => x.id === p.id);
  
  if (!p.inStock) {
    btn.textContent = 'Out of Stock'; btn.disabled = true;
    btn.className = 'btn det-add'; btn.style.background = '#ddd'; btn.style.color = '#888'; btn.style.border = 'none';
  } else if (inCart) {
    btn.textContent = 'Remove from Cart'; btn.disabled = false;
    btn.className = 'btn det-add'; btn.style.background = '#fff'; btn.style.color = '#e74c3c'; btn.style.border = '1px solid #e74c3c';
    btn.onclick = () => { rmCart(p.id); };
  } else {
    btn.textContent = 'Add to Cart'; btn.disabled = false;
    btn.className = 'btn btn-green det-add'; btn.style.background = ''; btn.style.color = ''; btn.style.border = '';
    btn.onclick = () => { addDetToCart(); };
  }
  
  const rel = products.filter(x => x.id !== id && x.cat === p.cat).slice(0, 4);
  const rg = document.getElementById('rgrid');
  if (rg) rg.innerHTML = (rel.length ? rel : products.filter(x => x.id !== id).slice(0, 4)).map(pcardHTML).join('');
  showPage('product');
}

function chQty(d) { detQty = Math.max(1, detQty + d); document.getElementById('det-qty').textContent = detQty; }

function addDetToCart() {
  if (!curProd || !curProd.inStock) return;
  const ex = cart.find(x => x.id === curProd.id);
  if (ex) ex.qty += detQty; else cart.push({ id: curProd.id, qty: detQty });
  saveCart();
  showToast(curProd.name + ' added to cart!');
  const btn = document.getElementById('det-add-btn');
  btn.textContent = 'Added!';
  setTimeout(() => { refreshCurrentView(); }, 800);
}

// ===== CART =====
function renderCart() {
  const el = document.getElementById('cart-content');
  if (!el) return;
  if (!cart.length) {
    el.innerHTML = '<div class="cart-empty"><div class="eicon"><svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div><h3>Your cart is empty</h3>' +
      '<p>Add organic goodness to your cart!</p>' +
      '<button class="btn btn-green" onclick="showPage(\'shop\')">Start Shopping</button></div>';
    return;
  }
  let sub = 0;
  const R = String.fromCharCode(8377);
  const items = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (!p) return '';
    sub += p.price * ci.qty;
    return '<div class="citem"><img src="' + p.img + '" alt="' + p.name + '"><div>' +
      '<div class="ci-name">' + p.name + '</div><div class="ci-wt">' + p.wt + '</div>' +
      '<div class="ci-bot"><span class="ci-price">' + R + (p.price * ci.qty) + '</span>' +
      '<div class="ci-qty"><button class="ci-qbtn" onclick="updCart(' + p.id + ',-1)">-</button>' +
      '<span class="ci-qval">' + ci.qty + '</span>' +
      '<button class="ci-qbtn" onclick="updCart(' + p.id + ',1)">+</button></div>' +
      '<button class="ci-rm" onclick="rmCart(' + p.id + ')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div></div></div>';
  }).join('');
  const del = sub >= 499 ? '<span class="free-del">Free</span>' : '<span>' + R + '49</span>';
  const total = sub >= 499 ? sub : sub + 49;
  el.innerHTML = '<div class="clist">' + items + '</div>' +
    '<div class="csummary">' +
    '<div class="srow"><span>Subtotal</span><span>' + R + sub + '</span></div>' +
    '<div class="srow"><span>Delivery</span>' + del + '</div>' +
    '<div class="srow total"><span>Total</span><span>' + R + total + '</span></div>' +
    '<button class="btn btn-green btn-co" onclick="showPage(\'checkout\')">Proceed to Checkout</button></div>';
}

function updCart(id, d) {
  const ci = cart.find(x => x.id === id);
  if (!ci) return;
  ci.qty += d;
  if (ci.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart(); refreshCurrentView();
}

function rmCart(id) { 
  cart = cart.filter(x => x.id !== id); 
  saveCart(); 
  refreshCurrentView(); 
}

// ===== CHECKOUT =====
function renderCheckout() {
  let sub = 0;
  const R = String.fromCharCode(8377);
  const items = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (!p) return '';
    sub += p.price * ci.qty;
    return '<div class="sbi"><img src="' + p.img + '" alt="' + p.name + '"><div>' +
      '<div class="sbi-n">' + p.name + ' x' + ci.qty + '</div>' +
      '<div class="sbi-p">' + R + (p.price * ci.qty) + '</div></div></div>';
  }).join('');
  const el = document.getElementById('co-items');
  if (el) el.innerHTML = items;
  const del = sub >= 499 ? 'Free' : R + '49';
  const tot = sub >= 499 ? sub : sub + 49;
  const subEl = document.getElementById('co-sub');
  const delEl = document.getElementById('co-del');
  const totEl = document.getElementById('co-tot');
  if (subEl) subEl.textContent = R + sub;
  if (delEl) delEl.textContent = del;
  if (totEl) totEl.textContent = R + tot;
  document.getElementById('co-s1').style.display = 'block';
  document.getElementById('co-s2').style.display = 'none';
  ['si1', 'si2', 'si3'].forEach(id => { const e = document.getElementById(id); if (e) { e.classList.remove('active', 'done'); } });
  ['sl1', 'sl2'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.remove('done'); });
  document.getElementById('si1')?.classList.add('active');
}

function goStep2() {
  const name = document.getElementById('cn').value;
  const phone = document.getElementById('cp').value;
  const addr = document.getElementById('ca').value;
  if (!name || !phone || !addr) { showToast('Please fill required fields'); return; }
  document.getElementById('co-s1').style.display = 'none';
  document.getElementById('co-s2').style.display = 'block';
  document.getElementById('si1').classList.remove('active');
  document.getElementById('si1').classList.add('done');
  document.getElementById('sl1').classList.add('done');
  document.getElementById('si2').classList.add('active');
}

function selPay(el) {
  document.querySelectorAll('.popt').forEach(p => p.classList.remove('sel'));
  el.classList.add('sel');
}

function placeOrder() {
  const oid = '#FF-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('succ-oid').textContent = oid;
  cart = []; saveCart();
  showPage('success');
}

// ===== SEARCH =====
let _srchOpen = false;
function openSearch() {
  const bar = document.getElementById('nav-search-bar');
  const nav = document.getElementById('desktop-nav');
  const btn = document.getElementById('search-icon-btn');
  bar.classList.add('open');
  nav.style.display = 'none';
  btn.style.display = 'none';
  setTimeout(() => { _srchOpen = true; }, 150);
  document.getElementById('srch-in').focus();
}

function closeSearch() {
  _srchOpen = false;
  const bar = document.getElementById('nav-search-bar');
  const nav = document.getElementById('desktop-nav');
  const btn = document.getElementById('search-icon-btn');
  bar.classList.remove('open');
  nav.style.display = '';
  btn.style.display = '';
  document.getElementById('srch-in').value = '';
  const res = document.getElementById('srch-res');
  res.innerHTML = '';
  res.classList.remove('open');
}

function liveSearch(q) {
  const res = document.getElementById('srch-res');
  if (!res) return;
  const R = String.fromCharCode(8377);
  if (!q) { res.innerHTML = ''; res.classList.remove('open'); return; }
  const list = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.cat.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6);
  res.innerHTML = list.length
    ? list.map(p =>
      '<div class="sri" onclick="closeSearch();openProduct(' + p.id + ')">' +
      '<img src="' + p.img + '" alt="' + p.name + '"><div>' +
      '<div class="sri-name">' + p.name + '</div>' +
      '<div class="sri-price">' + R + p.price + ' Â· ' + p.wt + '</div></div></div>'
    ).join('')
    : '<div style="text-align:center;color:#aaa;padding:20px;font-size:.88rem">No results found</div>';
  res.classList.add('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
document.addEventListener('click', e => {
  if (!_srchOpen) return;
  const wrap = document.getElementById('nav-search-wrap');
  if (wrap && !wrap.contains(e.target)) closeSearch();
});

// ===== MOBILE MENU & DROPDOWNS =====
function toggleMob() {
  const m = document.getElementById('mob-menu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function closeMob() { document.getElementById('mob-menu').style.display = 'none'; }

function toggleDeskCat() {
  const dc = document.getElementById('desk-cat-drop');
  if (dc) dc.style.display = dc.style.display === 'none' ? 'flex' : 'none';
}
function closeDeskCat() {
  const dc = document.getElementById('desk-cat-drop');
  if (dc) dc.style.display = 'none';
}
function toggleMobCat() {
  const mc = document.getElementById('mob-cat-list');
  const arr = document.getElementById('mc-arr');
  if (mc) {
    if (mc.style.display === 'none') {
      mc.style.display = 'flex';
      if(arr) arr.style.transform = 'rotate(180deg)';
    } else {
      mc.style.display = 'none';
      if(arr) arr.style.transform = 'rotate(0deg)';
    }
  }
}
function closeMobCatAndMenu() {
  closeMob();
}

// ===== LOGIN TABS =====
function switchTab(t) {
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('lf-login').style.display = t === 'login' ? 'grid' : 'none';
  document.getElementById('lf-signup').style.display = t === 'signup' ? 'grid' : 'none';
}

// ===== SCROLL EVENTS =====
function scrollToSection(id) {
  showPage('home');
  setTimeout(() => {
    const el = document.getElementById(id);
    if(el) {
      const headerHeight = document.getElementById('header').offsetHeight || 60;
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elTop - headerHeight,
        behavior: 'smooth'
      });
      if (id === 'categories-sec') {
        updateNav('categories');
      }
    }
  }, 100);
}

window.addEventListener('scroll', () => {
  const bt = document.getElementById('back-top');
  if (bt) window.scrollY > 300 ? bt.classList.add('show') : bt.classList.remove('show');
});

// ===== INIT =====
const svgMap = {
  'Ghee & Oils': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l1 3H8L9 3z"/><path d="M7 6h10l-1 14H8L7 6z"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>',
  'Honey & Jaggery': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4v2h-4z"/><path d="M8 5h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>',
  'Millets & Grains': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V9"/><path d="M9 18c1-1.5 2-2 3-2s2 .5 3 2"/><path d="M8 13c1.3-1.5 2.3-2 4-2s2.7.5 4 2"/><path d="M12 9c0-2 1-5 3-7"/><path d="M12 9c0-2-1-5-3-7"/></svg>',
  'Spices': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="17" rx="8" ry="4"/><path d="M4 17V9a8 4 0 0116 0v8"/><path d="M12 13V5"/><path d="M9 8c1-2 4-2 6 0"/></svg>',
  'Flours': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l2 6H4L6 2z"/><path d="M4 8h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"/><path d="M9 12h6"/><path d="M12 12v4"/></svg>',
  'Dry Fruits': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h16"/><path d="M5 13c0 4 3.1 7 7 7s7-3 7-7"/><ellipse cx="9" cy="8" rx="2.5" ry="3.5"/><ellipse cx="15" cy="8" rx="2.5" ry="3.5"/></svg>'
};

async function initApp() {
  updateCartCount();
  
  // Load Categories
  const { data: catData, error: catErr } = await supabaseClient.from('categories').select('*');
  if (catErr) console.error("Category Error", catErr);
  if (catData && catData.length > 0) {
    cats = catData.map(c => ({
      name: c.name,
      svg: svgMap[c.name] || svgMap['Spices']
    }));
    
    // Populate Dropdowns
    const dc = document.getElementById('desk-cat-drop');
    if (dc) dc.innerHTML = cats.map(c => '<a style="display:block;padding:10px 16px;font-size:.85rem;color:var(--text);border-radius:0;margin:0;cursor:pointer;" onclick="filterBycat(\'' + c.name + '\');closeDeskCat()">' + c.name + '</a>').join('');
    const mc = document.getElementById('mob-cat-list');
    if (mc) mc.innerHTML = cats.map(c => '<a style="display:block;padding:8px 0;font-size:.88rem;color:#666;cursor:pointer;" onclick="filterBycat(\'' + c.name + '\');closeMobCatAndMenu()">' + c.name + '</a>').join('');
  }

  // Load Products
  const { data: prodData, error: prodErr } = await supabaseClient.from('products').select('*, categories (name)').eq('in_stock', true);
  if (prodErr) console.error("Products Error", prodErr);
  if (prodData && prodData.length > 0) {
    products = prodData.map(p => ({
      id: p.id,
      name: p.name,
      cat: p.categories?.name,
      price: p.price,
      orig: p.original_price, // Changed to match your real schema
      wt: p.weight,           // Changed to match your real schema
      rating: p.rating,
      revs: p.review_count,   // Changed to match your real schema
      badge: p.badge || '',
      desc: p.description,
      benefits: p.benefits || [],
      img: p.image_url,
      inStock: p.in_stock
    }));
  }

  renderHome();
}

// Start

// ===== REALTIME & DYNAMIC UPDATES =====
async function loadCategories() {
  const { data: catData, error: catErr } = await supabaseClient.from('categories').select('*');
  if (catErr) return;
  if (catData && catData.length > 0) {
    cats = catData.map(c => ({
      name: c.name,
      svg: svgMap[c.name] || svgMap['Spices']
    }));
    const dc = document.getElementById('desk-cat-drop');
    if (dc) dc.innerHTML = cats.map(c => '<a style="display:block;padding:10px 16px;font-size:.85rem;color:var(--text);border-radius:0;margin:0;cursor:pointer;" onclick="filterBycat(\'' + c.name + '\');closeDeskCat()">' + c.name + '</a>').join('');
    const mc = document.getElementById('mob-cat-list');
    if (mc) mc.innerHTML = cats.map(c => '<a style="display:block;padding:8px 0;font-size:.88rem;color:#666;cursor:pointer;" onclick="filterBycat(\'' + c.name + '\');closeMobCatAndMenu()">' + c.name + '</a>').join('');
    refreshCurrentView();
  }
}

async function loadProducts() {
  const { data: prodData, error: prodErr } = await supabaseClient.from('products').select('*, categories (name)').eq('in_stock', true);
  if (prodErr) return;
  if (prodData) {
    products = prodData.map(p => ({
      id: p.id,
      name: p.name,
      cat: p.categories?.name,
      price: p.price,
      orig: p.original_price, 
      wt: p.weight,           
      rating: p.rating,
      revs: p.review_count,   
      badge: p.badge || '',
      desc: p.description,
      benefits: p.benefits || [],
      img: p.image_url,
      inStock: p.in_stock
    }));
    refreshCurrentView();
  }
}

async function loadBanners() {
  const { data } = await supabaseClient.from('banners').select('*').eq('active', true).limit(1);
  if (data && data.length > 0) {
    const b = data[0];
    const heroImg = document.querySelector('.hero img');
    if (heroImg && b.image_url) heroImg.src = b.image_url;
    const heroH1 = document.querySelector('.hero-c h1');
    if (heroH1 && b.title) heroH1.innerHTML = b.title;
    const heroP = document.querySelector('.hero-c p');
    if (heroP && b.subtitle) heroP.innerHTML = b.subtitle;
  }
}

async function loadCoupons() {
  const { data } = await supabaseClient.from('coupons').select('*').eq('active', true).limit(1);
  if (data && data.length > 0) {
    const c = data[0];
    const ob = document.getElementById('offer-banner');
    if (ob) {
      const codeSpan = ob.querySelector('.code');
      if (codeSpan) codeSpan.textContent = c.code;
      ob.style.display = 'flex';
      // If we want to replace the whole text safely:
      ob.querySelector('span').innerHTML = `Use code <span class="code">${c.code}</span> for ${c.discount_text || 'discount'}!`;
    }
  }
}

// ===== START =====
// Wait for app data to load, then start realtime
initApp().then(() => {
  loadBanners();
  loadCoupons();

  // Realtime WebSocket listeners
  supabaseClient
    .channel('products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      console.log('[Realtime] product change:', payload.eventType);
      loadProducts();
    })
    .subscribe((s) => console.log('[Realtime] products:', s));

  supabaseClient
    .channel('banners-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => loadBanners())
    .subscribe((s) => console.log('[Realtime] banners:', s));

  supabaseClient
    .channel('categories-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategories())
    .subscribe((s) => console.log('[Realtime] categories:', s));

  supabaseClient
    .channel('coupons-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => loadCoupons())
    .subscribe((s) => console.log('[Realtime] coupons:', s));

  // Fallback polling every 5 seconds (catches updates if WebSocket fails)
  setInterval(loadProducts, 5000);
  console.log('[Farmily] Realtime + 5s polling active');
});
