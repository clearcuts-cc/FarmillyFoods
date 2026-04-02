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
let user = null, profile = null, userAddresses = [], userOrders = [], editingAddrId = null;
let redirAfterLogin = null;

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
  if (page === 'checkout' && !user) {
    showToast('Please login to place order');
    redirAfterLogin = 'checkout';
    showPage('login');
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); prevPage = curPage; curPage = page; window.scrollTo(0, 0); }
  updateNav(page);
  if (page === 'shop') renderShop();
  if (page === 'cart') renderCart();
  if (page === 'checkout') renderCheckout();
  if (page === 'account') initAccount();
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
  if (fr) {
    const harvestSlugs = ['wild-forest-honey-500g', 'dry-fig-honey-infusion-500g', 'royal-estate-coffee-100g', 'traditional-cow-ghee-500ml', 'bold-black-pepper-100g', 'pure-turmeric-powder-250g'];
    const harvestProds = harvestSlugs.map(s => products.find(p => p.slug === s)).filter(Boolean);
    fr.innerHTML = harvestProds.length ? harvestProds.map(pcardHTML).join('') : products.slice(0, 6).map(pcardHTML).join('');
  }
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
  const hdr = document.getElementById('header');
  bar.classList.add('open');
  hdr.classList.add('search-open');
  if(nav) nav.style.display = 'none';
  if(btn) btn.style.display = 'none';
  setTimeout(() => { _srchOpen = true; }, 150);
  document.getElementById('srch-in').focus();
}

function closeSearch() {
  _srchOpen = false;
  const bar = document.getElementById('nav-search-bar');
  const nav = document.getElementById('desktop-nav');
  const btn = document.getElementById('search-icon-btn');
  const hdr = document.getElementById('header');
  bar.classList.remove('open');
  hdr.classList.remove('search-open');
  if(nav) nav.style.display = '';
  if(btn) btn.style.display = '';
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
  
  // Auth state listener
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    user = session?.user || null;
    if (user) {
      await fetchUserProfile();
      updateUserState('in');
      if (curPage === 'login') {
        const target = redirAfterLogin || 'home';
        redirAfterLogin = null;
        showPage(target);
      }
    } else {
      profile = null;
      updateUserState('out');
    }
  });

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
  const { data: prodData, error: prodErr } = await supabaseClient.from('products').select('*, categories (name)');
  if (prodErr) console.error("Products Error", prodErr);
  if (prodData && prodData.length > 0) {
    products = prodData.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
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
  const { data: prodData, error: prodErr } = await supabaseClient.from('products').select('*, categories (name)');
  if (prodErr) return;
  if (prodData) {
    products = prodData.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
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

let activeCoupon = null;
async function loadCoupons() {
  const { data } = await supabaseClient.from('coupons').select('*').eq('active', true).limit(1);
  if (data && data.length > 0) {
    activeCoupon = data[0];
    const ob = document.getElementById('offer-banner');
    const bts = document.querySelectorAll('.banner-msg');
    if (ob && bts.length) {
      ob.style.display = 'flex';
      bts.forEach(bt => {
        bt.innerHTML = `Pure. Natural. Honest. — From Our Farm To Your Family` + (activeCoupon.code ? ` (Use code <span class="promo-code" onclick="showCouponInfo()">${activeCoupon.code}</span> )` : '');
      });
    }
  }
}

function showCouponInfo() {
  if (activeCoupon) {
    const msg = activeCoupon.description || `${activeCoupon.code}: Enjoy special discount on your order!`;
    showToast(msg);
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
    .subscribe();

  supabaseClient
    .channel('banners-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => loadBanners())
    .subscribe();

  supabaseClient
    .channel('categories-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategories())
    .subscribe();

  supabaseClient
    .channel('coupons-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => loadCoupons())
    .subscribe();

  // Watch for real-time order updates for the logged-in user
  supabaseClient
    .channel('user-orders')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (p) => {
      if (user && p.new.user_id === user.id) {
        showToast('Order #' + p.new.id.slice(0,8) + ' status updated to ' + p.new.status);
        if (curPage === 'account') initAccount();
      }
    })
    .subscribe();

  setInterval(loadProducts, 20000); // Polling as fallback
});

// ===== AUTH LOGIC =====
function showLoading(show) { document.getElementById('loader').style.display = show ? 'flex' : 'none'; }

function switchAuth(tab) {
  document.getElementById('auth-main').style.display = (tab === 'login' || tab === 'signup') ? 'block' : 'none';
  document.getElementById('auth-forgot').style.display = tab === 'forgot' ? 'block' : 'none';
  if (tab !== 'forgot') {
    document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
    document.querySelector('.tbtn-' + tab).classList.add('active');
    document.getElementById('lf-login').style.display = tab === 'login' ? 'grid' : 'none';
    document.getElementById('lf-signup').style.display = tab === 'signup' ? 'grid' : 'none';
  }
}

async function handleLogin() {
  const email = document.getElementById('le').value;
  const pass = document.getElementById('lp').value;
  if (!email || !pass) return showToast('Please fill all fields');
  showLoading(true);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  showLoading(false);
  if (error) showToast(error.message);
}

async function handleSignup() {
  const name = document.getElementById('sn').value;
  const phone = document.getElementById('sp').value;
  const email = document.getElementById('se').value;
  const pass = document.getElementById('sw').value;
  const conf = document.getElementById('sc').value;
  if (!name || !phone || !email || !pass) return showToast('Please fill all fields');
  if (pass !== conf) return showToast('Passwords do not match');
  showLoading(true);
  const { data, error } = await supabaseClient.auth.signUp({ email, password: pass });
  if (error) { showLoading(false); return showToast(error.message); }
  if (data.user) {
    const { error: pErr } = await supabaseClient.from('profiles').insert([{ id: data.user.id, full_name: name, phone, email }]);
    showLoading(false);
    if (pErr) showToast('Error saving profile: ' + pErr.message);
    else {
      showToast('Account created! Please verify your email.');
      switchAuth('login');
    }
  }
}

async function handleForgot() {
  const email = document.getElementById('fe').value;
  if (!email) return showToast('Please enter your email');
  showLoading(true);
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  showLoading(false);
  if (error) showToast(error.message); else showToast('Check your email for reset link');
}

async function handleLogout() {
  showLoading(true);
  await supabaseClient.auth.signOut();
  showLoading(false);
  showPage('home');
}

function updateUserState(state) {
  const container = document.getElementById('hdr-user-state');
  if (!container) return;
  if (state === 'in') {
    container.innerHTML = `<div class="usr-drop-wrap" onmouseleave="toggleUsrDrop(false)">
      <div class="usr-btn" onclick="toggleUsrDrop(true)"><div class="usr-name">Hi, ${profile?.full_name?.split(' ')[0] || 'User'}</div><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="usr-drop" id="usr-drop">
        <div class="usr-link" onclick="showPage('account')">My Account</div>
        <div class="usr-link" onclick="setAccTab('orders');showPage('account')">My Orders</div>
        <div class="usr-link logout" onclick="handleLogout()">Logout</div>
      </div>
    </div>`;
  } else {
    container.innerHTML = `<button class="btn-hdr-login" onclick="showPage('login')">Login</button>`;
  }
}

function toggleUsrDrop(show = null) {
  const d = document.getElementById('usr-drop');
  if (!d) return;
  if (show === null) d.classList.toggle('show');
  else d.classList.toggle('show', show);
}

// ===== ACCOUNT FEATURES =====
async function fetchUserProfile() {
  if (!user) return;
  const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
  if (!error) profile = data;
}

function initAccount() {
  if (!user) return showPage('login');
  document.getElementById('prof-name').value = profile?.full_name || '';
  document.getElementById('prof-email').value = profile?.email || '';
  document.getElementById('prof-phone').value = profile?.phone || '';
  renderOrders();
  renderAddresses();
}

function setAccTab(tab) {
  document.querySelectorAll('.acc-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.acc-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('.acc-sec').forEach(s => s.classList.remove('active'));
  document.getElementById('acc-' + tab).classList.add('active');
  if (tab === 'orders') renderOrders();
  if (tab === 'addresses') renderAddresses();
}

async function saveProfile() {
  const name = document.getElementById('prof-name').value;
  const phone = document.getElementById('prof-phone').value;
  showLoading(true);
  const { error } = await supabaseClient.from('profiles').update({ full_name: name, phone }).eq('id', user.id);
  showLoading(false);
  if (error) showToast(error.message); else { showToast('Profile updated!'); profile.full_name = name; profile.phone = phone; updateUserState('in'); }
}

async function renderOrders() {
  const container = document.getElementById('orders-list');
  container.innerHTML = '<p style="text-align:center;padding:40px;color:#888">Loading orders...</p>';
  const { data, error } = await supabaseClient.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return container.innerHTML = '<p>Error loading orders.</p>';
  userOrders = data;
  if (!data.length) return container.innerHTML = '<div style="text-align:center;padding:40px"><p style="color:#aaa;margin-bottom:15px">No orders found.</p><button class="btn btn-green" onclick="showPage(\'shop\')">Go to Shop</button></div>';
  container.innerHTML = data.map(o => {
    const date = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<div class="order-card">
      <div class="ohdr">
        <div><div class="oid-tag">#${o.id.slice(0, 8).toUpperCase()}</div><div class="odate">Placed on ${date}</div></div>
        <div class="ostat ${o.status}">${o.status}</div>
      </div>
      <div class="oitems-sum">${o.items_count} items · Total: ₹${o.total_amount}</div>
      <button class="oview-btn" onclick="viewOrderDetails('${o.id}')">View Details →</button>
    </div>`;
  }).join('');
}

async function viewOrderDetails(oid) {
  const o = userOrders.find(x => x.id === oid);
  if (!o) return;
  const stages = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const curIdx = stages.indexOf(o.status);
  const timelineHTML = stages.map((s, i) => `<div class="step ${i <= curIdx ? 'done' : ''} ${i === curIdx ? 'active' : ''}"><div class="snum">${i + 1}</div><div class="slabel">${s}</div></div>`).join('<div class="sline ' + (curIdx > i ? 'done' : '') + '"></div>');

  document.getElementById('order-details-content').innerHTML = `
    <div class="steps" style="margin-bottom:30px;justify-content:center">${timelineHTML}</div>
    <div style="font-size:.9rem;line-height:1.6">
      <div style="margin-bottom:15px"><strong>Delivery Address:</strong><br>${o.full_name || ''}<br>${o.address_line || ''}, ${o.city || ''}, ${o.state || ''} - ${o.pincode || ''}</div>
      <div style="margin-bottom:15px"><strong>Payment Method:</strong> ${o.payment_method || 'Online'}</div>
      <div style="border-top:1px solid #eee;padding-top:15px"><strong>Summary:</strong><br>Total: ₹${o.total_amount}</div>
    </div>
  `;
  document.getElementById('modal-order').style.display = 'flex';
}

async function renderAddresses() {
  const container = document.getElementById('address-list');
  const { data, error } = await supabaseClient.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
  if (error) return;
  userAddresses = data;
  container.innerHTML = data.map(a => `<div class="addr-card ${a.is_default ? 'default' : ''}">
    ${a.is_default ? '<span class="def-badge">DEFAULT</span>' : ''}
    <div class="aname">${a.full_name}</div><div class="aphone">${a.phone}</div>
    <div class="atext">${a.address_line}<br>${a.city}, ${a.state} - ${a.pincode}</div>
    <div class="actns">
      <button class="actn-btn btn-edit" onclick="openAddrModal('${a.id}')">Edit</button>
      <button class="actn-btn btn-del" onclick="deleteAddress('${a.id}')">Delete</button>
      ${!a.is_default ? `<button class="actn-btn" style="color:#888" onclick="setDefaultAddress('${a.id}')">Set Default</button>` : ''}
    </div>
  </div>`).join('');
}

function openAddrModal(id = null) {
  editingAddrId = id;
  const modal = document.getElementById('modal-addr');
  const title = document.getElementById('addr-modal-title');
  if (id) {
    const a = userAddresses.find(x => x.id === id);
    title.textContent = 'Edit Address';
    document.getElementById('an').value = a.full_name;
    document.getElementById('ap').value = a.phone;
    document.getElementById('al').value = a.address_line;
    document.getElementById('ac').value = a.city;
    document.getElementById('as').value = a.state;
    document.getElementById('az').value = a.pincode;
    document.getElementById('ad').checked = a.is_default;
  } else {
    title.textContent = 'Add New Address';
    document.querySelectorAll('#modal-addr input').forEach(i => i.type === 'checkbox' ? i.checked = false : i.value = '');
  }
  modal.style.display = 'flex';
}

function closeModals() { document.querySelectorAll('.modal-ov').forEach(m => m.style.display = 'none'); }

async function saveAddress() {
  const payload = {
    user_id: user.id,
    full_name: document.getElementById('an').value,
    phone: document.getElementById('ap').value,
    address_line: document.getElementById('al').value,
    city: document.getElementById('ac').value,
    state: document.getElementById('as').value,
    pincode: document.getElementById('az').value,
    is_default: document.getElementById('ad').checked
  };
  if (!payload.full_name || !payload.phone || !payload.address_line) return showToast('Please fill required fields');
  showLoading(true);
  if (payload.is_default) await supabaseClient.from('addresses').update({ is_default: false }).eq('user_id', user.id);
  const { error } = editingAddrId
    ? await supabaseClient.from('addresses').update(payload).eq('id', editingAddrId)
    : await supabaseClient.from('addresses').insert([payload]);
  showLoading(false);
  if (error) showToast(error.message); else { showToast('Address saved!'); closeModals(); renderAddresses(); }
}

async function deleteAddress(id) {
  if (!confirm('Are you sure you want to delete this address?')) return;
  showLoading(true);
  await supabaseClient.from('addresses').delete().eq('id', id);
  showLoading(false);
  renderAddresses();
}

async function setDefaultAddress(id) {
  showLoading(true);
  await supabaseClient.from('addresses').update({ is_default: false }).eq('user_id', user.id);
  await supabaseClient.from('addresses').update({ is_default: true }).eq('id', id);
  showLoading(false);
  renderAddresses();
}

async function handleGoogleLogin() {
  const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  if (error) showToast(error.message);
}
