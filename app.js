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
  if (!p || p.inStock === false) return;
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
window.getWeightMultiplier = function(wt) {
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

window.getUnitPrice = function(price, wt) {
  const pVal = parseFloat(price || 0);
  const mult = window.getWeightMultiplier(wt);
  const rate = mult > 0 ? Math.round(pVal / mult) : pVal;
  const w = (wt || '').toLowerCase();
  const unit = (w.includes('l') && !w.includes('ml')) || w.includes('lit') || w.includes('ml') ? 'L' : 'kg';
  return { rate, unit };
};

window.getItemPrice = function(price, qty) {
  // Price is total for 1 unit. qty is count in basket.
  return price * Number(qty || 1);
};

// ===== PRODUCT CARD HTML ====
function pcardHTML(p) {
  const variants = p.variants || [];
  const hasOptions = variants.length > 1;
  const v0 = hasOptions ? variants[0] : p;
  
  // High-precision unit price calculation
  const unitInfo = window.getUnitPrice(v0.price || p.price, v0.wt || p.wt);
  const rate = unitInfo.rate;
  const unitLabel = unitInfo.unit;

  // Cart quantity
  let gQty = 0;
  if (typeof window.cart !== 'undefined') {
    if (hasOptions) {
      variants.forEach(v => { const ex = window.cart.find(x => x.id === v.id); if (ex) gQty += ex.qty; });
    } else {
      const ex = window.cart.find(x => x.id === p.id); if (ex) gQty = ex.qty;
    }
  }

  const isOutOfStock = p.in_stock === false;
  const bg = getProductBG(p);
  const action = isOutOfStock ? `
    <div class="m-add-btn-image" style="background: #94a3b8 !important; color: white !important; cursor: not-allowed; opacity: 0.7;" onclick="event.stopPropagation()">
        SOLD OUT
    </div>` : `
    <div class="m-add-btn-image" onclick="event.stopPropagation();openVariantSheet('${p.name.replace(/'/g, "\\'")}')">
        ADD
    </div>`;

  return `
    <div class="premium-mango-card" onclick="showProduct(${v0.id})">
        <div class="m-img-wrap" style="background: ${bg}">
            <img src="${p.img}" alt="${p.name}" loading="lazy">
            ${action}
        </div>
        <div class="m-info">
            <div class="m-top-row">
                <div class="m-stats">
                    <div class="m-stars">★★★★★</div>
                    <span class="m-rating-val">${p.rating || '5.0'}</span>
                </div>
                <div class="m-wt-tag" style="display:inline-block !important;">${v0.wt}</div>
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
                <div style="font-size:11px; color:#6b7280; font-weight:600; margin-top:6px;">Total: ₹${v0.price} for ${v0.wt}</div>
            </div>
        </div>
    </div>
  `;
}

window.getUnitLabel = function(wt) {
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
  
  // Category based defaults
  if (c.includes('ghee') || c.includes('oil')) return '#FFFDE7';
  if (c.includes('honey')) return '#FFF8E1';
  if (c.includes('spice')) return '#FBE9E7';
  if (c.includes('bee')) return '#FFF9C4';
  if (c.includes('beverage')) return '#E0F2F1';
  if (c.includes('mango')) return '#F9FBE7';
  
  return '#f5f8f5';
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
    const baseList = window.displayProducts || window.products;
    const featuredProds = baseList.filter(p => p.isFeatured).slice(0, 8);
    const displayProds = featuredProds.length ? featuredProds : baseList.slice(0, 8);
    fr.innerHTML = displayProds.length ? displayProds.map(pcardHTML).join('') : '<p style="text-align:center;width:100%;color:#888;">Harvesting fresh products for you...</p>';
  }
}

function filterBycat(cat) { activeFilter = cat; showPage('shop'); }

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

function setFilter(cat) { activeFilter = cat; renderShop(); }

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
    const itemTotal = p.price * ci.qty;
    sub += itemTotal;
    return `
      <div class="citem">
        <img src="${p.img}">
        <div>
          <div class="ci-name">${p.name}</div>
          <div class="ci-wt">${p.wt} <span style="color:#22c55e; font-weight:700; margin-left:8px;">(₹${window.getUnitPrice(p.price, p.wt)}/${window.getUnitLabel(p.wt)})</span></div>
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

function filterBycat(c) {
  activeFilter = c;
  showPage('shop');
  const chips = document.querySelectorAll('.chip');
  chips.forEach(ch => {
    if (ch.innerText === c) ch.classList.add('active');
    else ch.classList.remove('active');
  });
}
window.filterBycat = filterBycat;

// ===== SHOP =====
function renderShop() {
  const chips = document.getElementById('shop-cats-row');
  if (chips) {
    const list = ['All', ...cats.map(c => c.name)];
    chips.innerHTML = list.map(c =>
      '<div class="chip' + (c === activeFilter ? ' active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</div>'
    ).join('');
    chips.style.display = 'flex'; 
  }
  filterProds();
}

async function loadProducts() {
  if (!supabaseClient) { handleRawProducts([]); return; }
  // Only load products that are active (not hidden)
  const { data } = await supabaseClient.from('products').select('*').neq('is_active', false);
  handleRawProducts(data || []);
}

function handleRawProducts(data) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const assetMap = { 'imam': 'assets/imam.png', 'alph': 'assets/alphonso.png', 'bang': 'assets/banganapalli.png', 'sent': 'assets/senthura.png' };
  
  const allProds = (data || []).map(p => {
    let img = p.image_url;
    const low = (p.name||'').toLowerCase();
    for (const k in assetMap) if (low.includes(k)) img = assetMap[k];
    const category = cats.find(c => c.id === p.category_id)?.name || 'Products';

    return { 
       id: p.id, name: cap(p.name), price: Number(p.price), wt: p.weight, 
       img: img || 'assets/placeholder.png', inStock: p.in_stock, cat: category,
       rating: p.rating || 5.0, revs: p.review_count || 10, desc: p.description,
       isFeatured: p.is_featured, rawName: p.name
    };
  });
  
  window.products = allProds;

  const grouped = {};
  allProds.forEach(p => {
    const isMango = (p.cat === 'Heritage Mangoes' || (p.name||'').toLowerCase().includes('mango'));
    if (isMango) {
      const baseName = p.name.replace(/\(.*\)/, '').replace(/ mangoes/i, '').trim();
      if (!grouped[baseName]) {
        grouped[baseName] = { ...p, name: baseName, variants: [] };
      }
      grouped[baseName].variants.push(p);
    } else {
      // Show non-mangoes individually
      grouped['u_' + p.id] = { ...p, variants: [p] };
    }
  });

  Object.values(grouped).forEach(g => {
    g.variants.sort((a,b) => a.price - b.price);
    if (g.variants.length > 0) g.img = g.variants[0].img;
  });

  window.displayProducts = Object.values(grouped);
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

async function initApp() {
  updateCartCount();
  await loadCategories();
  await loadProducts();

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

function liveSearch(q) {
  const res = document.getElementById('srch-res');
  if (!res) return;
  if (!q.trim()) { res.style.display = 'none'; return; }

  const list = (window.products || []).filter(p => 
    p.name.toLowerCase().includes(q.toLowerCase()) || 
    p.cat.toLowerCase().includes(q.toLowerCase())
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

initApp();
window.handleTrack = handleTrack;
window.trackOrder = trackOrder;
window.updCart = updCart;
window.addToCartAndFeedback = function(b, id) { addToCart(id); refreshCurrentView(); };

window.showProduct = function(id) {
  const p = (window.products || []).find(x => Number(x.id) === Number(id));
  if (!p) return;
  
  // ALWAYS open detail view when clicking the card body
  if (typeof window.showPremiumDetail === 'function') {
    window.showPremiumDetail(p.name);
  }
};
