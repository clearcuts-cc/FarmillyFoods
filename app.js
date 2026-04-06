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
  const totalPrice = cart.reduce((s, i) => {
    const p = products.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const el = document.getElementById('cart-count');
  const m = document.getElementById('mob-cnt');
  const fBar = document.getElementById('floating-cart-bar');
  const fCount = document.getElementById('f-cart-count');
  const fPrice = document.getElementById('f-cart-price');
  
  const btns = [document.getElementById('cart-btn'), document.getElementById('mob-cart-btn')].filter(Boolean);
  
  if (n > 0) {
    if (fBar) fBar.classList.add('show');
    if (fCount) fCount.textContent = `${n} item${n > 1 ? 's' : ''}`;
    if (fPrice) fPrice.textContent = `₹${totalPrice}`;
    btns.forEach(b => {
      b.classList.remove('cart-pop');
      void b.offsetWidth;
      b.classList.add('cart-pop');
    });
  } else {
    if (fBar) fBar.classList.remove('show');
  }

  if (el) { el.textContent = n; n > 0 ? el.classList.add('show') : el.classList.remove('show'); }
  if (m) { m.textContent = n; n > 0 ? m.classList.add('show') : m.classList.remove('show'); }
  refreshCurrentView();
}

function rmCart(id) {
  const ex = cart.find(x => x.id === id);
  if (ex) {
    ex.qty--;
    if (ex.qty <= 0) cart = cart.filter(x => x.id !== id);
    saveCart();
  }
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || !p.inStock) return;
  const ex = cart.find(x => x.id === id);
  if (ex) ex.qty++; else cart.push({ id, qty: 1 });
  saveCart();
}

function handleCrateAddToCart(size, weight, price) {
  let p = products.find(x => x.id === 100);
  if (!p) {
    p = { 
      id: 100, name: 'Custom Heritage Mango Crate', 
      price: price, wt: size + 'KG Mix', 
      img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80', 
      inStock: true 
    };
    products.push(p);
  } else {
    p.price = price;
    p.wt = size + 'KG Mix';
  }
  
  const ex = cart.find(x => x.id === 100);
  if (ex) ex.qty++; else cart.push({ id: 100, qty: 1 });
  
  saveCart();
  showToast(`${size}KG Heritage Crate added!`);
  refreshCurrentView();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
}

// ===== ROUTING =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); prevPage = curPage; curPage = page; window.scrollTo(0, 0); }
  updateNav(page);
  if (page === 'home') renderHome();
  if (page === 'shop') renderShop();
  if (page === 'cart') renderCart();
  if (page === 'corporate') {
    // Reset the live preview to defaults when visiting the corporate page
    const prevLogo = document.getElementById('corp-prev-logo');
    const prevMsg = document.getElementById('corp-prev-msg');
    if (prevLogo && !document.getElementById('corp-company-name')?.value) prevLogo.innerText = 'YOUR BRAND';
    if (prevMsg && !document.getElementById('corp-heritage-msg')?.value) prevMsg.innerText = '"Your personalized message will appear here, printed on 350 GSM archival paper with a hand-pressed gold foil borders..."';
  }
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
  
  if (page === 'track') renderRecentHistory();
  
  // Clear tracking search if leaving track page
  if (page !== 'track') {
    const ti = document.getElementById('tr-oid') || document.getElementById('track-id');
    const tr = document.getElementById('tr-res') || document.getElementById('track-res');
    if (ti) ti.value = '';
    if (tr) { tr.innerHTML = ''; tr.style.display = 'none'; }
  }
}

function refreshCurrentView() {
  if (curPage === 'home') renderHome();
  else if (curPage === 'shop') filterProds();
  else if (curPage === 'cart') renderCart();
  else if (curPage === 'product') {
    if (curProd) openProduct(curProd.id);
  }
}

function goBack() { showPage(prevPage === 'product' ? 'shop' : prevPage); }

// ===== STARS =====
function stars(r) { return '<span style="color:var(--secondary)">' + String.fromCharCode(9733).repeat(Math.floor(r)) + String.fromCharCode(9734).repeat(5 - Math.floor(r)) + '</span>'; }

// ===== PRODUCT CARD HTML ====
function pcardHTML(p) {
  const ex = cart.find(x => x.id === p.id);
  const qty = ex ? ex.qty : 0;
  const inCartClass = qty > 0 ? 'in-cart' : '';
  const disc = Math.round((1 - p.price / p.orig) * 100);
  const bClass = p.badge === 'New Harvest' ? 'bn' : (p.badge === 'Best Seller' ? 'bb' : 'bo');

  return `<div class="pcard glass" onclick="openProduct(${p.id})">
    <div class="ci-wrap">
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      ${p.badge ? `<span class="pbadge ${bClass}">${p.badge}</span>` : ''}
    </div>
    <div class="pbody">
      <div class="pname">${p.name}</div>
      <div class="pwt">${p.wt}</div>
      <div class="pstars">${stars(p.rating)}<span class="rv">(${p.revs})</span></div>
      <div class="pprices">
        <span class="pp">₹${p.price}</span>
        <span class="pop">₹${p.orig}</span>
        <span class="pdisc">${disc}% off</span>
      </div>
      <div class="btn-add-wrap ${inCartClass}" onclick="event.stopPropagation()">
        <button class="btn-add" onclick="addToCart(${p.id})">ADD</button>
        <div class="btn-qty-ctrl">
          <button class="qty-btn" onclick="rmCart(${p.id})">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" onclick="addToCart(${p.id})">+</button>
        </div>
      </div>
    </div>
  </div>`;
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
    // FOCUS MODE: Show only Mango products in featured row
    const mangoProds = products.filter(p => p.name.toLowerCase().includes('mango')).slice(0, 8);
    fr.innerHTML = mangoProds.length ? mangoProds.map(pcardHTML).join('') : '<p style="text-align:center;width:100%;color:#888;">Harvesting fresh mangoes for you...</p>';
  }
}

function filterBycat(cat) { activeFilter = cat; showPage('shop'); }

// ===== SHOP =====
// FOCUS MODE: Restricted categories
const allCats = ['All', 'Mangoes'];

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
  const btn = document.getElementById('det-add-btn');
  btn.textContent = 'Added!';
  setTimeout(() => { refreshCurrentView(); }, 800);
}

// ===== UTILS & SCRIPTS =====
function initSlider(id, callback) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const handle = wrap.querySelector('.slide-handle');
  const bg = wrap.querySelector('.slide-bg');
  const max = wrap.offsetWidth - 52;
  let startX = 0, currentX = 0, active = false;

  const start = (e) => {
    active = true;
    startX = (e.type === 'mousedown') ? e.pageX : e.touches[0].pageX;
    handle.style.transition = 'none';
    bg.style.transition = 'none';
  };
  const move = (e) => {
    if (!active) return;
    const x = (e.type === 'mousemove') ? e.pageX : e.touches[0].pageX;
    currentX = Math.max(0, Math.min(x - startX, max));
    handle.style.left = (currentX + 4) + 'px';
    bg.style.width = (currentX + 26) + 'px';
  };
  const end = () => {
    if (!active) return;
    active = false;
    if (currentX >= max - 10) {
      handle.style.left = (max + 4) + 'px';
      bg.style.width = '100%';
      wrap.classList.add('completed');
      setTimeout(callback, 300);
    } else {
      handle.style.transition = 'left .3s ease';
      bg.style.transition = 'width .3s ease';
      handle.style.left = '4px';
      bg.style.width = '0';
    }
    currentX = 0;
  };
  handle.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  handle.addEventListener('touchstart', start, {passive:true});
  window.addEventListener('touchmove', move, {passive:false});
  window.addEventListener('touchend', end);
}

let lastScroll = 0;
window.addEventListener('scroll', () => {
  const current = window.pageYOffset;
  const hdr = document.getElementById('header');
  if (!hdr) return;
  if (current > lastScroll && current > 120) hdr.classList.add('hdr-hidden');
  else hdr.classList.remove('hdr-hidden');
  lastScroll = current;
}, {passive:true});

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
      '<button class="ci-rm" onclick="deleteFromCart(' + p.id + ')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div></div></div>';
  }).join('');
  const del = sub >= 499 ? '<span class="free-del">Free</span>' : '<span>' + R + '49</span>';
  const total = sub >= 499 ? sub : sub + 49;
  el.innerHTML = '<div class="clist">' + items + '</div>' +
    '<div class="csummary">' +
    '<div class="srow"><span>Subtotal</span><span>' + R + sub + '</span></div>' +
    '<div class="srow"><span>Delivery</span>' + del + '</div>' +
    '<div class="srow total"><span>Total</span><span>' + R + total + '</span></div>' +
    '<div id="co-tot" style="display:none">' + total + '</div>' + 
    '<div class="slide-wrap" id="cart-slider"><div class="slide-bg"></div><div class="slide-text">Slide to Pay</div><div class="slide-handle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div></div></div>';
  initSlider('cart-slider', placeOrder);
}

function updCart(id, d) {
  const ci = cart.find(x => x.id === id);
  if (!ci) return;
  ci.qty += d;
  if (ci.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart(); refreshCurrentView();
}

function deleteFromCart(id) { 
  cart = cart.filter(x => x.id !== id); 
  saveCart(); 
  refreshCurrentView(); 
}

function placeOrder() {
  const totText = document.getElementById('co-tot')?.textContent || '0';
  const tot = parseInt(totText.replace(/[^0-9]/g, ''));

  const options = {
    "key": "rzp_test_SYaf8btoC5VUyk",
    "amount": tot * 100,
    "currency": "INR",
    "name": "Farmmily Foods",
    "description": "Organic Purchase",
    "image": "assets/farmmily logo.png",
    "handler": async function (response) {
      const oidString = 'FM-' + Math.floor(1000000 + Math.random() * 9000000);
      const elOid = document.getElementById('succ-oid');
      if (elOid) elOid.textContent = oidString;

      const currentTot = parseInt((document.getElementById('co-tot')?.textContent || '0').replace(/[^0-9]/g, ''));
      
      // SAVE TO BACKEND (Supabase)
      try {
        // 1. Insert into 'orders' table
        // Note: 'order_number' is auto-generated by the DB if not provided, 
        // but we'll use the one we generated to match the success screen.
        const { data: orderRecord, error: orderError } = await supabaseClient
          .from('orders')
          .insert([{
            order_number: oidString,
            total: currentTot,
            subtotal: currentTot, 
            delivery_charge: 0,
            discount: 0,
            status: 'pending', // Correcting status to 'pending'
            payment_method: 'upi'
          }])
          .select();

        if (orderError) throw orderError;
        
        const internalId = orderRecord[0].id;

        // Also save payment details to the payments table
        await supabaseClient.from('payments').insert([{
           order_id: internalId,
           razorpay_order_id: response.razorpay_order_id,
           razorpay_payment_id: response.razorpay_payment_id,
           amount: currentTot,
           status: 'paid'
        }]);


        // 2. Prepare and Insert into 'order_items' table
        const orderItems = cart.map(i => {
          const p = products.find(x => x.id === i.id);
          const price = p?.price || 0;
          return {
            order_id: internalId,
            product_id: i.id,
            product_name: p?.name || 'Unknown',
            product_image: p?.img || '',
            weight: p?.wt || '',
            unit_price: price,
            quantity: i.qty,
            total_price: price * i.qty
          };
        });

        const { error: itemsError } = await supabaseClient
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        showToast('Order saved successfully!');
      } catch (err) {
        console.error('Final Save Error:', err);
        showToast('DB Error: ' + (err.message || 'Check connection'));
      }

      saveToHistory(oidString);
      cart = []; saveCart();
      showPage('success');
    },
    "theme": { "color": "#3A6B35" }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// ===== TRACKING & COPY =====
function copyOrderId() {
  const el = document.getElementById('succ-oid');
  if (!el) return;
  const oid = el.textContent;
  navigator.clipboard.writeText(oid).then(() => {
    showToast('Order ID copied: ' + oid);
  }).catch(() => {
    showToast('Failed to copy. Please select and copy manually.');
  });
}

async function handleTrack() {
  const idInput = document.getElementById('tr-oid') || document.getElementById('track-id');
  const res = document.getElementById('tr-res') || document.getElementById('track-res');
  if (!idInput || !res) return;
  
  const id = idInput.value.trim().toUpperCase();
  if (!id) { showToast('Please enter an Order ID'); return; }
  
  saveToHistory(id);
  renderRecentHistory();
  
  res.style.display = 'block';
  res.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:15px;color:#888">Fetching status for ' + id + '...</p></div>';
  
  try {
    // 1. Try Retail Order first
    let { data, error } = await supabaseClient.from('orders').select('*').eq('order_number', id).maybeSingle();

    if (error) throw error;

    // 2. If not found, try Corporate Order
    if (!data) {
      const { data: corpData, error: corpError } = await supabaseClient
        .from('corporate_orders')
        .select('*')
        .eq('enquiry_ref', id)
        .maybeSingle();
      
      if (corpError) throw corpError;
      
      if (corpData) {
        // FOUND CORPORATE ORDER - Use corporate layout
        const statusColors = { new:'#888', contacted:'#D4A017', confirmed:'#3A6B35', fulfilled:'#1b3b1b', cancelled:'#e74c3c' };
        const statusLabels = { new:'🕐 Received', contacted:'📞 Contacted', confirmed:'✅ Confirmed', fulfilled:'🎁 Fulfilled', cancelled:'❌ Cancelled' };
        const sc = statusColors[corpData.status] || '#888';
        const sl = statusLabels[corpData.status] || corpData.status;
        const date = new Date(corpData.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

        res.innerHTML = `
          <div style="background:#fff;border-radius:16px;padding:24px;border:1.5px solid #f0ece4;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <div>
                <div style="font-size:1.2rem;font-weight:700;color:var(--primary);">${corpData.enquiry_ref}</div>
                <div style="font-size:.7rem;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Corporate B2B Order</div>
              </div>
              <div style="background:${sc}18;color:${sc};padding:4px 12px;border-radius:10px;font-size:.75rem;font-weight:800;">${corpData.status.toUpperCase()}</div>
            </div>
            <div style="font-size:.85rem;color:#444;line-height:1.8;border-top:1px solid #f5f0e8;padding-top:16px;">
              <div><strong>Company:</strong> ${corpData.company_name}</div>
              <div><strong>Size:</strong> ${corpData.total_units} × ${corpData.crate_size}KG Mix</div>
              <div><strong>Status:</strong> ${sl}</div>
              <div><strong>Date:</strong> ${date}</div>
            </div>
          </div>`;
        return;
      }
    }

    if (!data) {
      res.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Order Reference not found.</p></div>';
      return;
    }

    // 3. RETAIL ORDER LAYOUT (Existing Timeline)
    const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(data.status);
    const steps = [
      { t: 'Order Received', d: 'We have received your order.' },
      { t: 'Confirmed', d: 'Confirmed by our farm.' },
      { t: 'Processing', d: 'Picking and packing.' },
      { t: 'Shipped', d: 'Express Delivery.' },
      { t: 'Delivered', d: 'Thank you!' }
    ];

    let html = '<h3 style="margin-bottom:20px;color:var(--primary);font-size:1.1rem">Retail Order: ' + id + '</h3>';
    steps.forEach((step, idx) => {
      let state = idx < currentIdx ? 'done' : (idx === currentIdx ? 'active' : 'pending');
      const icon = state === 'done' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : (state === 'active' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' : '');
      html += `<div class="track-step ${state}"><div class="ts-icon">${icon}</div><div class="ts-info"><h4>${step.t}</h4><p>${state === 'done' ? 'Completed' : (state === 'active' ? 'In Progress' : 'Pending')}</p></div></div>`;
    });
    res.innerHTML = html;
  } catch (err) {
    console.error('Tracking fatal error:', err);
    showToast('Failed to track. Try again later.');
  }
}

function saveToHistory(id) {
  if (!id || id.length < 5) return;
  let hist = JSON.parse(localStorage.getItem('ff_track_hist') || '[]');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' + 
                  now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Deduplicate: same ID should only appear once (at top)
  hist = hist.filter(x => (typeof x === 'string' ? x : x.id) !== id);
  hist.unshift({ id, date: dateStr });
  if (hist.length > 5) hist.pop();
  localStorage.setItem('ff_track_hist', JSON.stringify(hist));
}

function renderRecentHistory() {
  const listEl = document.getElementById('recent-list');
  const wrap = document.getElementById('tr-recent') || document.getElementById('track-recent');
  if (!listEl || !wrap) return;
  
  const hist = JSON.parse(localStorage.getItem('ff_track_hist') || '[]');
  if (hist.length > 0) {
    wrap.style.display = 'block';
    listEl.innerHTML = hist.map(item => {
      const id = typeof item === 'string' ? item : item.id;
      const dateStr = typeof item === 'string' ? 'Past Order' : item.date;
      return `<div class="recent-item" onclick="handleRecentClick('${id}')">
                <span>${id}</span>
                <span class="r-date">${dateStr}</span>
              </div>`;
    }).join('');
  } else {
    wrap.style.display = 'none';
  }
}

function handleRecentClick(id) {
  const inp = document.getElementById('track-id');
  if (inp) inp.value = id;
  handleTrack();
}

// ===== SEARCH =====
let _srchOpen = false;
function openSearch() {
  const bar = document.getElementById('nav-search-bar');
  const hdr = document.getElementById('header');
  if(bar) bar.classList.add('open');
  if(hdr) hdr.classList.add('search-open');
  setTimeout(() => { _srchOpen = true; }, 150);
  document.getElementById('srch-in').focus();
}

function closeSearch() {
  _srchOpen = false;
  const bar = document.getElementById('nav-search-bar');
  const hdr = document.getElementById('header');
  if(bar) bar.classList.remove('open');
  if(hdr) hdr.classList.remove('search-open');
  document.getElementById('srch-in').value = '';
  const res = document.getElementById('srch-res');
  if(res) { res.innerHTML = ''; res.classList.remove('open'); }
}

function liveSearch(q) {
  const res = document.getElementById('srch-res');
  if (!res) return;
  const R = String.fromCharCode(8377);
  if (!q) { res.innerHTML = ''; res.classList.remove('open'); return; }
  const list = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) || (p.cat && p.cat.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 6);
  res.innerHTML = list.length
    ? list.map(p =>
      '<div class="sri" onclick="closeSearch();openProduct(' + p.id + ')">' +
      '<img src="' + p.img + '" alt="' + p.name + '"><div>' +
      '<div class="sri-name">' + p.name + '</div>' +
      '<div class="sri-price">' + R + p.price + ' · ' + p.wt + '</div></div></div>'
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
  if(m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function closeMob() { 
  const m = document.getElementById('mob-menu');
  if(m) m.style.display = 'none'; 
}

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

// ===== SCROLL EVENTS =====
function scrollToSection(id) {
  showPage('home');
  setTimeout(() => {
    const el = document.getElementById(id);
    if(el) {
      const headerHeight = document.getElementById('header').offsetHeight || 60;
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elTop - headerHeight, behavior: 'smooth' });
    }
  }, 100);
}

window.addEventListener('scroll', () => {
  const bt = document.getElementById('back-top');
  if (bt) window.scrollY > 300 ? bt.classList.add('show') : bt.classList.remove('show');
});

// ===== INIT & DATA FETCH =====
const svgMap = {
  'Ghee & Oils': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l1 3H8L9 3z"/><path d="M7 6h10l-1 14H8L7 6z"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>',
  'Honey & Jaggery': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4v2h-4z"/><path d="M8 5h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>',
  'Millets & Grains': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V9"/><path d="M9 18c1-1.5 2-2 3-2s2 .5 3 2"/><path d="M8 13c1.3-1.5 2.3-2 4-2s2.7.5 4 2"/><path d="M12 9c0-2 1-5 3-7"/><path d="M12 9c0-2-1-5-3-7"/></svg>',
  'Spices': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="17" rx="8" ry="4"/><path d="M4 17V9a8 4 0 0116 0v8"/><path d="M12 13V5"/><path d="M9 8c1-2 4-2 6 0"/></svg>',
  'Flours': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l2 6H4L6 2z"/><path d="M4 8h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"/><path d="M9 12h6"/><path d="M12 12v4"/></svg>',
  'Dry Fruits': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h16"/><path d="M5 13c0 4 3.1 7 7 7s7-3 7-7"/><ellipse cx="9" cy="8" rx="2.5" ry="3.5"/><ellipse cx="15" cy="8" rx="2.5" ry="3.5"/></svg>'
};

async function loadCategories() {
  const { data } = await supabaseClient.from('categories').select('*');
  if (data) {
    const rawCats = data.map(c => ({ name: c.name, svg: svgMap[c.name] || svgMap['Spices'] }));
    
    // FOCUS MODE: Only show Mango-related categories
    cats = rawCats.filter(c => c.name.toLowerCase().includes('mango'));
    
    // If no mango category in DB, add a virtual one for the focus period
    if (cats.length === 0) {
        cats = [{ name: 'Mangoes', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>' }];
    }

    const dc = document.getElementById('desk-cat-drop');
    if (dc) dc.innerHTML = cats.map(c => '<a style="display:block;padding:10px 16px;font-size:.85rem;color:var(--text);cursor:pointer;" onclick="filterBycat(\'' + c.name + '\')">' + c.name + '</a>').join('');
    const mc = document.getElementById('mob-cat-list');
    if (mc) mc.innerHTML = cats.map(c => '<a style="display:block;padding:8px 0;font-size:.88rem;color:#666;cursor:pointer;" onclick="filterBycat(\'' + c.name + '\');closeMobCatAndMenu()">' + c.name + '</a>').join('');
    renderHome();
  }
}

async function loadProducts() {
  const { data } = await supabaseClient.from('products').select('*, categories (name)');
  if (data) {
    const raw = data.map(p => ({
      id: p.id, name: p.name, slug: p.slug, cat: p.categories?.name,
      price: p.price, orig: p.original_price, wt: p.weight, rating: p.rating,
      revs: p.review_count, badge: p.badge || '', desc: p.description,
      benefits: p.benefits || [], img: p.image_url, inStock: p.in_stock
    }));
    
    // FOCUS MODE: Only show mango related items
    products = raw.filter(p => 
      p.name.toLowerCase().includes('mango') || 
      (p.cat && p.cat.toLowerCase().includes('mango')) ||
      ['Imam', 'Alphonso', 'Bang', 'Sent', 'Crate'].some(v => 
        p.name.includes(v) || (p.cat && p.cat.includes(v))
      )
    );
    
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
  if (activeCoupon) showToast(activeCoupon.description || `${activeCoupon.code}: Active discount on your order!`);
}

async function initApp() {
  updateCartCount();
  await loadCategories();
  await loadProducts();
  updateCartCount(); // refresh price now that products are loaded
  await loadBanners();
  await loadCoupons();
}

initApp().then(() => {
  // Realtime listeners
  supabaseClient.channel('public-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts).on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, loadBanners).on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadCategories).on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, loadCoupons).subscribe();
  setInterval(loadProducts, 30000);
});

// ===== CORPORATE ORDER SUBMISSION WITH RAZORPAY =====
async function submitCorpOrder() {
  const companyName = (document.getElementById('corp-company-name')?.value || '').trim();
  const heritageMsg = (document.getElementById('corp-heritage-msg')?.value || '').trim();
  const totalUnits  = Math.max(15, parseInt(document.getElementById('corp-total-units')?.value || 15));
  const contactEmail = (document.getElementById('corp-email')?.value || '').trim();
  const contactPhone = (document.getElementById('corp-phone')?.value || '').trim();

  if (!companyName) { showToast('Please enter your company name.'); return; }
  if (!contactPhone) { showToast('Please enter a contact phone number.'); return; }

  // ---- Price calculation ----
  const rates = { imam: 349, alph: 299, bang: 259, sent: 239 };
  const crateSize = corpLimit || 3;
  let pricePerCrate = 0;
  let totalKg = 0;
  for (const v of ['imam','alph','bang','sent']) {
    const qty = corpCounts?.[v] || 0;
    pricePerCrate += qty * rates[v];
    totalKg += qty;
  }
  
  if (totalKg !== crateSize) {
    showToast(`Your mix total (${totalKg}kg) must exactly match the selected crate size (${crateSize}kg)!`, 'error');
    return;
  }

  const totalAmount = pricePerCrate * totalUnits; // total for all crates

  // Generate enquiry reference number
  const enquiryRef = 'CE-' + Math.floor(1000000 + Math.random() * 9000000);

  // ---- Open Razorpay TEST checkout ----
  const options = {
    key: 'rzp_test_SYaf8btoC5VUyk',        // TEST key
    amount: totalAmount * 100,              // paise
    currency: 'INR',
    name: 'Farmmily Executive B2B',
    description: `${totalUnits} × ${crateSize}KG Corporate Mango Crates`,
    image: 'assets/farmmily logo.png',
    prefill: { contact: contactPhone, email: contactEmail },
    theme: { color: '#1b391b' },
    handler: async function(response) {
      // ---- Save to Supabase after successful payment ----
      const obj = {
        company_name: companyName,
        crate_size:   crateSize,
        imam_qty:     corpCounts?.imam || 0,
        alph_qty:     corpCounts?.alph || 0,
        bang_qty:     corpCounts?.bang || 0,
        sent_qty:     corpCounts?.sent || 0,
        total_units:  totalUnits,
        heritage_message: heritageMsg,
        total_amount: totalAmount,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        razorpay_payment_id: response.razorpay_payment_id || '',
        razorpay_order_id: response.razorpay_order_id || '',
        enquiry_ref: enquiryRef,
        status: 'confirmed'
      };
      try {
        const { data, error } = await supabaseClient
          .from('corporate_orders').insert([obj]).select();
        if (error) throw error;

        const ref = data[0]?.enquiry_ref || enquiryRef;

        // Show success overlay
        const overlay = document.getElementById('corp-success-overlay');
        const refEl   = document.getElementById('corp-enquiry-ref');
        if (overlay) overlay.style.display = 'flex';
        if (refEl)   refEl.textContent = ref;

        // Reset form
        document.getElementById('corp-company-name').value = '';
        document.getElementById('corp-heritage-msg').value = '';
        document.getElementById('corp-total-units').value  = 15;
        if (document.getElementById('corp-phone')) document.getElementById('corp-phone').value = '';
        if (document.getElementById('corp-email')) document.getElementById('corp-email').value = '';
        resetCorpCounts();

      } catch(err) {
        console.error('Corp order DB error:', err);
        showToast('Payment received but record failed. Call +91 77088 47977 with your payment ID: ' + response.razorpay_payment_id);
      }
    },
    modal: {
      ondismiss: () => showToast('Payment cancelled. You can try again anytime.')
    }
  };
  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch(e) {
    console.error('Razorpay error:', e);
    showToast('Payment gateway error. Please try WhatsApp instead.');
  }
}

// ===== CHECK CORPORATE ENQUIRY STATUS =====
async function checkCorpStatus() {
  const inp = document.getElementById('corp-status-inp');
  const res = document.getElementById('corp-status-res');
  if (!inp || !res) return;
  const ref = inp.value.trim().toUpperCase();
  if (!ref) { showToast('Please enter your Enquiry Reference number (e.g. CE-1234567)'); return; }

  res.innerHTML = '<div style="text-align:center;padding:20px"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:12px;color:#888;font-size:.85rem">Looking up ' + ref + '...</p></div>';
  res.style.display = 'block';

  try {
    const { data, error } = await supabaseClient
      .from('corporate_orders')
      .select('enquiry_ref, company_name, status, total_units, crate_size, total_amount, created_at, imam_qty, alph_qty, bang_qty, sent_qty')
      .eq('enquiry_ref', ref)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.innerHTML = '<div style="text-align:center;padding:20px;color:#e74c3c"><p>Enquiry not found. Please check your reference number.</p></div>';
      return;
    }

    const statusColors = { new:'#888', contacted:'#D4A017', confirmed:'#3A6B35', fulfilled:'#1b6b5b', cancelled:'#e74c3c' };
    const statusLabels = { new:'🕐 Received — Our team will contact you within 2 hours', contacted:'📞 Contacted — Our agent has reached out to you', confirmed:'✅ Confirmed — Your crate order is confirmed', fulfilled:'🎁 Fulfilled — Shipped & Delivered', cancelled:'❌ Cancelled' };
    const sc = statusColors[data.status] || '#888';
    const sl = statusLabels[data.status] || data.status;
    const date = new Date(data.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

    const mixArr = [];
    if (data.imam_qty) mixArr.push(`Imam: ${data.imam_qty}kg`);
    if (data.alph_qty) mixArr.push(`Alph: ${data.alph_qty}kg`);
    if (data.bang_qty) mixArr.push(`Bang: ${data.bang_qty}kg`);
    if (data.sent_qty) mixArr.push(`Sent: ${data.sent_qty}kg`);
    const mixString = mixArr.join(' • ');

    res.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.07);border:1px solid #f0ece4;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <div style="font-size:.7rem;font-weight:800;letter-spacing:3px;color:#aaa;text-transform:uppercase;margin-bottom:4px;">Enquiry Reference</div>
            <div style="font-size:1.4rem;font-family:'Playfair Display',serif;font-weight:700;color:#1b391b;">${data.enquiry_ref}</div>
          </div>
          <div style="background:${sc}18;border:1px solid ${sc};color:${sc};padding:6px 14px;border-radius:20px;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:2px;">${data.status}</div>
        </div>
        <div style="font-size:.85rem;color:#555;line-height:1.8;border-top:1px solid #f5f0e8;padding-top:16px;">
          <div><strong>Company:</strong> ${data.company_name}</div>
          <div><strong>Order:</strong> ${data.total_units} × ${data.crate_size}KG Crates</div>
          ${mixString ? `<div style="margin-top:6px;padding-left:12px;border-left:2px solid #e0dfd5;font-size:0.8rem;color:#777">Mix: ${mixString}</div>` : ''}
          ${data.total_amount ? `<div style="margin-top:6px"><strong>Amount Paid:</strong> ₹${data.total_amount.toLocaleString('en-IN')}</div>` : ''}
          <div><strong>Submitted:</strong> ${date}</div>
        </div>
        <div style="margin-top:16px;padding:14px;background:${sc}0d;border-radius:12px;font-size:.82rem;font-weight:600;color:${sc};">${sl}</div>
        <div style="margin-top:16px;text-align:center;">
          <a href="https://wa.me/917708847977?text=Hi%2C%20my%20Corporate%20Enquiry%20ref%20is%20${data.enquiry_ref}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:#25D366;font-size:.8rem;font-weight:700;text-decoration:none;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat on WhatsApp with your ref
          </a>
        </div>
      </div>`;
  } catch(err) {
    console.error('Corp status error:', err);
    res.innerHTML = '<div style="text-align:center;padding:20px;color:#e74c3c"><p>Error fetching status. Please try again.</p></div>';
  }
}

// Alias so the HTML button onclick="trackOrder()" works
const trackOrder = handleTrack;
