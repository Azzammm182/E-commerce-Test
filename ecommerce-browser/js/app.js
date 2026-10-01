/* =========================================================
   LokaMart — Logika Aplikasi (Vanilla JS, tanpa database)
   Penyimpanan: localStorage browser
   Fitur: keranjang, wishlist, checkout, voucher, stok,
   ulasan produk, pencarian riwayat, filter harga,
   pagination, ekspor pesanan, validasi form, profil.
   ========================================================= */
'use strict';

/* ---------- Kunci penyimpanan ---------- */
const LS_KEYS = {
  products: 'lokamart_products_v1',
  cart: 'lokamart_cart_v1',
  wishlist: 'lokamart_wishlist_v1',
  orders: 'lokamart_orders_v1',
  theme: 'lokamart_theme_v1',
  profile: 'lokamart_profile_v1',
  reviews: 'lokamart_reviews_v1',
  recent: 'lokamart_recent_v1'
};

/* ---------- State global ---------- */
const state = {
  products: [],
  cart: {},
  wishlist: [],
  orders: [],
  reviews: {},
  recent: [],
  profile: null,
  category: 'semua',
  sort: 'populer',
  search: '',
  minPrice: '',
  maxPrice: '',
  appliedVoucher: null,
  catalogLimit: 8,
  currentView: 'home',
  detailId: null,
  detailQty: 1,
  reviewRating: 5
};

let searchTimer = null;

/* =========================================================
   UTIL
   ========================================================= */
function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const val = JSON.parse(raw);
    return val ?? fallback;
  } catch (err) {
    return fallback;
  }
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatRupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

function categoryLabel(id) {
  const c = CATEGORIES.find(x => x.id === id);
  return c ? c.label : id;
}

function discountOf(p) {
  return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}

function getProduct(id) {
  return state.products.find(p => p.id === id);
}

function isOutOfStock(p) {
  return Number(p.stock) <= 0;
}

function getReviews(id) {
  return state.reviews[id] || [];
}

function safeFind(selector) {
  return document.querySelector(selector);
}

/* =========================================================
   FILTER & SORT (termasuk harga + stok)
   ========================================================= */
function filteredProducts() {
  let list = [...state.products];
  const q = state.search.trim().toLowerCase();
  if (q) {
    list = list.filter(p => (p.name + ' ' + p.category + ' ' + categoryLabel(p.category)).toLowerCase().includes(q));
  }
  if (state.category !== 'semua') {
    list = list.filter(p => p.category === state.category);
  }
  const min = Number(state.minPrice);
  const max = Number(state.maxPrice);
  if (state.minPrice !== '' && !isNaN(min)) {
    list = list.filter(p => p.price >= min);
  }
  if (state.maxPrice !== '' && !isNaN(max)) {
    list = list.filter(p => p.price <= max);
  }
  switch (state.sort) {
    case 'termurah': list.sort((a, b) => a.price - b.price); break;
    case 'termahal': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'diskon': list.sort((a, b) => discountOf(b) - discountOf(a)); break;
    default: list.sort((a, b) => b.sold - a.sold);
  }
  return list;
}

/* =========================================================
   KERANJANG
   ========================================================= */
function cartItems() {
  return Object.entries(state.cart)
    .map(([id, qty]) => ({ p: getProduct(id), qty }))
    .filter(x => x.p);
}

function cartCount() {
  return Object.values(state.cart).reduce((a, b) => a + b, 0);
}

function cartSubtotal() {
  return cartItems().reduce((sum, x) => sum + x.p.price * x.qty, 0);
}

function cartShipping() {
  const sub = cartSubtotal();
  if (sub === 0) return 0;
  if (state.appliedVoucher && state.appliedVoucher.type === 'shipping') return 0;
  return sub >= 500000 ? 0 : 25000;
}

function voucherDiscount(subtotal) {
  const v = state.appliedVoucher;
  if (!v || !VOUCHERS[v.code]) return 0;
  const def = VOUCHERS[v.code];
  if (def.type === 'percent') return Math.min(Math.floor(subtotal * def.value / 100), def.max || Infinity);
  if (def.type === 'fixed') return Math.min(def.value, subtotal);
  return 0;
}

function cartTotal() {
  const sub = cartSubtotal();
  return sub - voucherDiscount(sub) + cartShipping();
}

function saveCart() {
  saveLS(LS_KEYS.cart, state.cart);
}

function addToCart(id, qty = 1) {
  const p = getProduct(id);
  if (!p) return;
  if (isOutOfStock(p)) {
    toast(p.name + ' — stok habis', '⚠️');
    return;
  }
  const maxAdd = p.stock - (state.cart[id] || 0);
  if (maxAdd <= 0) {
    toast(p.name + ' — stok di keranjang sudah maksimal', '⚠️');
    return;
  }
  const finalQty = Math.min(qty, maxAdd);
  state.cart[id] = (state.cart[id] || 0) + finalQty;
  saveCart();
  updateCartBadge();
  if (safeFind('#cartDrawer') && safeFind('#cartDrawer').classList.contains('open')) renderCart();
  const note = finalQty < qty
    ? 'Stok terbatas — hanya ' + finalQty + ' yang ditambahkan: '
    : 'Ditambahkan ke keranjang: ';
  toast(note + p.name, '🛒');
}

function changeQty(id, delta) {
  const p = getProduct(id);
  const current = state.cart[id] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete state.cart[id];
    toast('Produk dihapus dari keranjang', '🗑️');
  } else {
    if (p && next > p.stock) {
      toast('Stok ' + p.name + ' maksimal ' + p.stock, '⚠️');
      return;
    }
    state.cart[id] = next;
  }
  saveCart();
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  updateCartBadge();
  renderCart();
  toast('Produk dihapus dari keranjang', '🗑️');
}

function updateCartBadge() {
  const el = safeFind('#cartBadge');
  if (el) el.textContent = cartCount();
}

function updateWishlistBadge() {
  const el = safeFind('#wishlistBadge');
  if (el) el.textContent = state.wishlist.length;
}

/* =========================================================
   FAVORIT
   ========================================================= */
function toggleWish(id) {
  const idx = state.wishlist.indexOf(id);
  const p = getProduct(id);
  if (!p) return;
  if (idx >= 0) {
    state.wishlist.splice(idx, 1);
    toast('Dihapus dari favorit', '🤍');
  } else {
    state.wishlist.push(id);
    toast('Ditambahkan ke favorit', '❤️');
  }
  saveLS(LS_KEYS.wishlist, state.wishlist);
  updateWishlistBadge();
  renderCurrentView();
}

/* =========================================================
   RENDER: KARTU PRODUK
   ========================================================= */
function productCardHTML(p) {
  const wished = state.wishlist.includes(p.id);
  const disc = discountOf(p);
  const out = isOutOfStock(p);
  const low = !out && p.stock <= 10;
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.remove()" />` : '';
  return `
    <article class="product-card">
      <div class="product-media grad-${p.category} ${out ? 'is-out' : ''}" data-open="${p.id}">
        <span class="product-emoji">${p.emoji}</span>
        ${img}
        ${disc ? `<span class="tag tag-discount">-${disc}%</span>` : ''}
        ${p.badge ? `<span class="tag tag-new">${p.badge}</span>` : ''}
        ${out ? `<span class="tag tag-sold">HABIS</span>` : (low ? `<span class="tag tag-low">Sisa ${p.stock}</span>` : '')}
        <button class="wish-btn ${wished ? 'active' : ''}" data-wish="${p.id}" aria-label="Favorit">${wished ? '❤️' : '🤍'}</button>
      </div>
      <div class="product-body">
        <span class="product-cat">${categoryLabel(p.category)}</span>
        <h3 class="product-name" data-open="${p.id}">${p.name}</h3>
        <div class="product-meta">
          <span class="stars">★ ${p.rating}</span>
          <span>${p.sold.toLocaleString('id-ID')} terjual</span>
        </div>
        <div class="product-price-row">
          <div>
            <span class="price">${formatRupiah(p.price)}</span>
            ${p.oldPrice ? `<span class="old-price">${formatRupiah(p.oldPrice)}</span>` : ''}
          </div>
          <button class="add-btn ${out ? 'disabled' : ''}" data-add="${p.id}" aria-label="Tambah ke keranjang" ${out ? 'disabled' : ''}>🛒</button>
        </div>
      </div>
    </article>`;
}

function emptyHTML(emoji, title, sub) {
  return `<div class="empty-state"><div class="empty-emoji">${emoji}</div><h3>${title}</h3><p>${sub}</p></div>`;
}

function renderCategoryChips(containerId) {
  const el = safeFind('#' + containerId);
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <button class="chip ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}">
      ${c.emoji} ${c.label}
    </button>`).join('');
}

function renderGrid(containerId, list, empty) {
  const el = safeFind('#' + containerId);
  if (!el) return;
  el.innerHTML = list.length ? list.map(productCardHTML).join('') : empty;
}

/* =========================================================
   RENDER: HALAMAN
   ========================================================= */
function renderHome() {
  renderCategoryChips('homeCats');
  const featured = [...state.products].sort((a, b) => b.sold - a.sold).slice(0, 8);
  renderGrid('featuredGrid', featured, emptyHTML('🛍️', 'Belum ada produk', 'Muat ulang data demo di footer.'));
}

function renderCatalog() {
  renderCategoryChips('catalogCats');
  const sortEl = safeFind('#sortSelect');
  if (sortEl) sortEl.value = state.sort;

  const minEl = safeFind('#minPrice');
  const maxEl = safeFind('#maxPrice');
  if (minEl) minEl.value = state.minPrice;
  if (maxEl) maxEl.value = state.maxPrice;

  const list = filteredProducts();
  const visible = list.slice(0, state.catalogLimit);
  const countEl = safeFind('#resultCount');
  if (countEl) countEl.textContent = list.length + ' produk ditemukan';

  const empty = emptyHTML('🔍', 'Produk tidak ditemukan', 'Coba kata kunci, kategori, atau rentang harga lain.')
    + `<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" data-action="reset-filter">↺ Reset Filter</button></div>`;

  renderGrid('catalogGrid', visible, empty);

  const loadWrap = safeFind('#loadMoreWrap');
  if (loadWrap) loadWrap.style.display = list.length > state.catalogLimit ? 'block' : 'none';
}

function renderRecentSearches() {
  const box = safeFind('#recentSearches');
  if (!box) return;
  if (!state.recent.length) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = '<span class="recent-label">🕘 Terakhir dicari:</span> ' + state.recent.map((q, i) =>
    `<button class="chip mini" data-action="recent-search" data-index="${i}">${q}</button>`
  ).join('');
}

function renderWishlist() {
  const list = state.wishlist.map(getProduct).filter(Boolean);
  const empty = emptyHTML('🤍', 'Belum ada favorit', 'Klik ikon hati pada produk untuk menyimpannya di sini.')
    + `<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" data-nav="catalog">Jelajahi Produk</button></div>`;
  renderGrid('wishlistGrid', list, empty);
}

function renderOrders() {
  const box = safeFind('#ordersList');
  if (!box) return;
  if (!state.orders.length) {
    box.innerHTML = emptyHTML('📦', 'Belum ada pesanan', 'Pesanan yang Anda buat akan tampil di sini.')
      + `<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" data-nav="catalog">Mulai Belanja</button></div>`;
    return;
  }
  const sorted = [...state.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  box.innerHTML = sorted.map(orderHTML).join('');
}

function orderHTML(o) {
  const items = o.items.map(i => `
    <div class="order-item">
      <span class="cart-emoji">${i.emoji}</span>
      <div class="order-item-info"><strong>${i.name}</strong><small>${i.qty} × ${formatRupiah(i.price)}</small></div>
      <span class="order-item-total">${formatRupiah(i.price * i.qty)}</span>
    </div>`).join('');
  const statusClass = o.status.toLowerCase().replace(/[^a-z]/g, '');
  return `
    <article class="order-card">
      <header class="order-head">
        <div><strong>${o.id}</strong><small>${new Date(o.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</small></div>
        <span class="status ${statusClass}">${o.status}</span>
      </header>
      <div class="order-items">${items}</div>
      <footer class="order-foot">
        <span>${o.payment}</span>
        <span>Ongkir: ${o.shipping === 0 ? 'GRATIS' : formatRupiah(o.shipping)}</span>
        ${o.discount ? `<span>Hemat: -${formatRupiah(o.discount)}</span>` : ''}
        <span>Total: <strong>${formatRupiah(o.total)}</strong></span>
      </footer>
    </article>`;
}

function renderCurrentView() {
  if (state.currentView === 'home') renderHome();
  else if (state.currentView === 'catalog') renderCatalog();
  else if (state.currentView === 'orders') renderOrders();
  else if (state.currentView === 'wishlist') renderWishlist();
}

/* =========================================================
   NAVIGASI
   ========================================================= */
function showView(name) {
  state.currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = safeFind('#view-' + name);
  if (target) target.classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === name);
  });
  renderCurrentView();
  if (name === 'catalog') renderRecentSearches();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================
   DRAWER KERANJANG
   ========================================================= */
function openCart() {
  renderCart();
  safeFind('#cartDrawer').classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeCart() {
  safeFind('#cartDrawer').classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function renderCart() {
  const items = cartItems();
  const box = safeFind('#cartItems');
  const empty = safeFind('#cartEmpty');
  const foot = safeFind('#cartFoot');
  if (!box || !empty || !foot) return;

  if (!items.length) {
    box.innerHTML = '';
    empty.style.display = 'block';
    foot.style.display = 'none';
  } else {
    empty.style.display = 'none';
    foot.style.display = 'block';
    box.innerHTML = items.map(({ p, qty }) => `
      <div class="cart-item">
        <div class="cart-emoji grad-${p.category}">${p.emoji}</div>
        <div class="cart-info">
          <h4>${p.name}</h4>
          <span class="cart-price">${formatRupiah(p.price)} ${p.stock <= 5 ? '<em class="low-stock">(Sisa ' + p.stock + ')</em>' : ''}</span>
          <div class="qty-row">
            <button class="qty-btn" data-action="dec" data-id="${p.id}" aria-label="Kurangi">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${p.id}" aria-label="Tambah">+</button>
          </div>
        </div>
        <div class="cart-right">
          <strong>${formatRupiah(p.price * qty)}</strong>
          <button class="link-btn" data-action="remove" data-id="${p.id}">Hapus</button>
        </div>
      </div>`).join('');
  }

  const sub = cartSubtotal();
  const disc = voucherDiscount(sub);
  const ship = cartShipping();
  safeFind('#cartSubtotal').textContent = formatRupiah(sub);
  safeFind('#cartShipping').textContent = ship === 0 ? 'GRATIS' : formatRupiah(ship);
  safeFind('#cartTotal').textContent = formatRupiah(sub - disc + ship);

  const prog = safeFind('#fsProgress');
  const txt = safeFind('#fsText');
  const rem = 500000 - sub;
  if (sub <= 0) {
    prog.style.width = '0%';
    txt.textContent = 'Gratis ongkir untuk belanja minimal Rp500.000 🚚';
  } else if (ship === 0) {
    prog.style.width = '100%';
    txt.textContent = 'Selamat! Anda mendapat GRATIS ongkir 🎉';
  } else if (rem > 0) {
    prog.style.width = Math.min(100, (sub / 500000) * 100) + '%';
    txt.textContent = 'Belanja ' + formatRupiah(rem) + ' lagi untuk GRATIS ongkir 🚚';
  } else {
    prog.style.width = '100%';
    txt.textContent = 'Selamat! Anda mendapat GRATIS ongkir 🎉';
  }
}

/* =========================================================
   MODAL
   ========================================================= */
function openModal(id) {
  const el = safeFind('#' + id);
  if (el) el.classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  document.body.classList.remove('no-scroll');
}

function openProduct(id) {
  state.detailId = id;
  state.detailQty = 1;
  state.reviewRating = 5;
  renderDetail();
  openModal('detailModal');
}

function renderDetail() {
  const p = getProduct(state.detailId);
  if (!p) return;
  const disc = discountOf(p);
  const out = isOutOfStock(p);
  const low = !out && p.stock <= 10;
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.remove()" />` : '';
  const reviews = getReviews(p.id);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : p.rating;

  const stars = [1, 2, 3, 4, 5].map(n =>
    `<button class="star-btn" data-review-star="${n}" aria-label="Beri ${n} bintang">☆</button>`
  ).join('');

  const reviewList = reviews.length
    ? reviews.map(r => `<div class="review"><strong>${r.rating}⭐ ${r.name}</strong><p>${r.text}</p></div>`).join('')
    : '<p class="small">Belum ada ulasan. Jadilah yang pertama! ✍️</p>';

  safeFind('#detailContent').innerHTML = `
    <div class="detail-media grad-${p.category} ${out ? 'is-out' : ''}">
      <span class="detail-emoji">${p.emoji}</span>
      ${img}
      ${disc ? `<span class="tag tag-discount">-${disc}%</span>` : ''}
      ${out ? `<span class="tag tag-sold">HABIS</span>` : (low ? `<span class="tag tag-low">Sisa ${p.stock}</span>` : '')}
    </div>
    <div class="detail-info">
      <span class="product-cat">${categoryLabel(p.category)}</span>
      <h2>${p.name}</h2>
      <div class="product-meta">
        <span class="stars">★ ${avg}</span>
        <span>${p.sold.toLocaleString('id-ID')} terjual</span>
        <span>Stok: ${out ? 'Habis' : p.stock}</span>
      </div>
      <div class="detail-price">${formatRupiah(p.price)} ${p.oldPrice ? `<span class="old-price">${formatRupiah(p.oldPrice)}</span>` : ''}</div>
      <p class="detail-desc">${p.desc}</p>
      <div class="qty-row big">
        <button class="qty-btn" data-action="detail-dec" aria-label="Kurangi">−</button>
        <span class="qty-val" id="detailQty">${state.detailQty}</span>
        <button class="qty-btn" data-action="detail-inc" aria-label="Tambah">+</button>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" data-action="detail-add" ${out ? 'disabled' : ''}>🛒 Tambah ke Keranjang</button>
        <button class="btn btn-ghost" data-action="detail-buy" ${out ? 'disabled' : ''}>⚡ Beli Sekarang</button>
      </div>
      <div class="review-box">
        <h4>Ulasan Produk</h4>
        <div class="review-form">
          <input id="reviewName" placeholder="Nama Anda" maxlength="30" />
          <div class="review-stars">${stars}</div>
          <textarea id="reviewText" placeholder="Tulis ulasan..." maxlength="250"></textarea>
          <small class="char-count">0/250</small>
          <button class="btn btn-primary btn-sm" data-action="submit-review">Kirim Ulasan</button>
        </div>
        <div class="review-list">${reviewList}</div>
      </div>
    </div>`;
}

function detailQty(delta) {
  const p = getProduct(state.detailId);
  if (!p) return;
  let next = state.detailQty + delta;
  if (next < 1) next = 1;
  if (next > p.stock) next = p.stock;
  state.detailQty = next;
  const el = safeFind('#detailQty');
  if (el) el.textContent = state.detailQty;
}

function submitReview() {
  const p = getProduct(state.detailId);
  if (!p) return;
  const name = (safeFind('#reviewName').value || '').trim() || 'Anonim';
  const text = (safeFind('#reviewText').value || '').trim();
  if (!text) {
    toast('Tulis dulu ulasan Anda', '⚠️');
    return;
  }
  if (!state.reviews[p.id]) state.reviews[p.id] = [];
  state.reviews[p.id].unshift({
    name,
    text,
    rating: state.reviewRating || 5,
    date: new Date().toISOString()
  });
  saveLS(LS_KEYS.reviews, state.reviews);
  toast('Ulasan terkirim!', '⭐');
  state.reviewRating = 5;
  renderDetail();
}

/* =========================================================
   CHECKOUT + VALIDASI + VOUCHER + PROFIL
   ========================================================= */
function openCheckout() {
  if (!cartCount()) {
    toast('Keranjang masih kosong', '⚠️');
    return;
  }
  renderCheckoutSummary();
  openModal('checkoutModal');
}

function renderCheckoutSummary() {
  const items = cartItems();
  safeFind('#checkoutSummary').innerHTML = items.map(({ p, qty }) => `
    <div class="sum-item"><span>${p.emoji} ${p.name} × ${qty}</span><strong>${formatRupiah(p.price * qty)}</strong></div>`).join('');
  const sub = cartSubtotal();
  const disc = voucherDiscount(sub);
  const ship = cartShipping();
  safeFind('#checkoutSubtotal').textContent = formatRupiah(sub);
  const discRow = safeFind('#checkoutDiscountRow');
  if (disc > 0) {
    discRow.style.display = 'flex';
    safeFind('#checkoutDiscountLabel').textContent = 'Diskon ' + state.appliedVoucher.code;
    safeFind('#checkoutDiscount').textContent = '-' + formatRupiah(disc);
  } else {
    discRow.style.display = 'none';
  }
  safeFind('#checkoutShipping').textContent = ship === 0 ? 'GRATIS' : formatRupiah(ship);
  safeFind('#checkoutGrand').textContent = formatRupiah(cartTotal());
}

function applyPromo() {
  const code = (safeFind('#promoInput').value || '').trim().toUpperCase();
  const note = safeFind('#promoNote');
  if (!code) {
    note.textContent = 'Masukkan kode promo terlebih dahulu.';
    note.className = 'promo-note error';
    return;
  }
  if (!VOUCHERS[code]) {
    state.appliedVoucher = null;
    note.textContent = 'Kode promo tidak valid. Coba: ' + Object.keys(VOUCHERS).join(', ');
    note.className = 'promo-note error';
  } else {
    state.appliedVoucher = { code };
    note.textContent = '✅ Voucher ' + code + ' diterapkan: ' + VOUCHERS[code].label;
    note.className = 'promo-note';
    toast('Voucher diterapkan', '🎟️');
  }
  renderCheckoutSummary();
}

function useSavedProfile() {
  if (!state.profile) {
    toast('Belum ada profil tersimpan', '📋', '⚠️');
    return;
  }
  const f = safeFind('#checkoutForm');
  const p = state.profile;
  f.nama.value = p.nama || '';
  f.email.value = p.email || '';
  f.telepon.value = p.telepon || '';
  f.kota.value = p.kota || '';
  f.alamat.value = p.alamat || '';
  f.kodepos.value = p.kodepos || '';
  toast('Profil tersimpan diisi', '📋');
}

function setFieldError(input, msg) {
  const field = input.closest('.field');
  if (field) {
    field.classList.add('error');
    const old = field.querySelector('.err-msg');
    if (old) old.remove();
    const small = document.createElement('small');
    small.className = 'err-msg';
    small.textContent = msg;
    field.appendChild(small);
  }
}

function handleCheckout(e) {
  e.preventDefault();
  if (!cartCount()) {
    closeModal();
    toast('Keranjang masih kosong', '⚠️');
    return;
  }

  const form = safeFind('#checkoutForm');
  const fields = {
    nama: form.nama, email: form.email, telepon: form.telepon,
    kota: form.kota, alamat: form.alamat, kodepos: form.kodepos
  };
  let valid = true;
  form.querySelectorAll('.field.error').forEach(f => f.classList.remove('error'));
  form.querySelectorAll('.err-msg').forEach(e => e.remove());

  const val = input => (input.value || '').trim();
  if (val(fields.nama).length < 3) { setFieldError(fields.nama, 'Nama minimal 3 karakter'); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val(fields.email))) { setFieldError(fields.email, 'Format email tidak valid'); valid = false; }
  if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(val(fields.telepon).replace(/[\s-]/g, ''))) { setFieldError(fields.telepon, 'Format telepon tidak valid (contoh: 08123456789)'); valid = false; }
  if (val(fields.kota).length < 2) { setFieldError(fields.kota, 'Kota wajib diisi'); valid = false; }
  if (val(fields.alamat).length < 10) { setFieldError(fields.alamat, 'Alamat minimal 10 karakter'); valid = false; }
  if (!/^[0-9]{5}$/.test(val(fields.kodepos))) { setFieldError(fields.kodepos, 'Kode pos harus 5 digit angka'); valid = false; }

  if (!valid) {
    toast('Periksa kembali isian form', '❌');
    const firstErr = form.querySelector('.field.error input, .field.error textarea');
    if (firstErr) firstErr.focus();
    return;
  }

  const items = cartItems().map(x => ({
    id: x.p.id, name: x.p.name, emoji: x.p.emoji, price: x.p.price, qty: x.qty
  }));
  const subtotal = cartSubtotal();
  const discount = voucherDiscount(subtotal);
  const shipping = cartShipping();
  const order = {
    id: 'LM-' + Date.now().toString(36).toUpperCase(),
    date: new Date().toISOString(),
    customer: { nama: val(fields.nama), email: val(fields.email), telepon: val(fields.telepon), kota: val(fields.kota), alamat: val(fields.alamat), kodepos: val(fields.kodepos) },
    payment: form.payment.value,
    voucher: state.appliedVoucher ? state.appliedVoucher.code : null,
    items,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    status: 'Diproses'
  };

  state.orders.unshift(order);
  saveLS(LS_KEYS.orders, state.orders);

  // Kurangi stok
  items.forEach(i => {
    const p = getProduct(i.id);
    if (p) p.stock = Math.max(0, p.stock - i.qty);
  });
  saveLS(LS_KEYS.products, state.products);

  // Simpan profil bila dicentang
  if (form.saveProfile && form.saveProfile.checked) {
    state.profile = { ...order.customer };
    saveLS(LS_KEYS.profile, state.profile);
  }

  state.cart = {};
  state.appliedVoucher = null;
  saveCart();
  updateCartBadge();
  renderCart();

  safeFind('#successOrderId').textContent = order.id;
  safeFind('#successTotal').textContent = formatRupiah(order.total);
  const discNote = safeFind('#successDiscountNote');
  if (discount > 0) {
    discNote.style.display = 'block';
    safeFind('#successDiscount').textContent = formatRupiah(discount);
  } else {
    discNote.style.display = 'none';
  }

  form.reset();
  const promoInput = safeFind('#promoInput');
  if (promoInput) promoInput.value = '';
  const promoNote = safeFind('#promoNote');
  if (promoNote) promoNote.textContent = '';
  closeModal();
  openModal('successModal');
}

/* =========================================================
   EKSPOR PESANAN
   ========================================================= */
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportOrdersJSON() {
  if (!state.orders.length) {
    toast('Belum ada pesanan untuk diekspor', '⚠️');
    return;
  }
  download('lokamart-orders.json', JSON.stringify(state.orders, null, 2), 'application/json');
  toast('Pesanan diekspor ke JSON', '⬇️');
}

function exportOrdersCSV() {
  if (!state.orders.length) {
    toast('Belum ada pesanan untuk diekspor', '⚠️');
    return;
  }
  const head = 'ID,Tanggal,Nama,Email,Telepon,Kota,Alamat,KodePos,Metode,Subtotal,Diskon,Ongkir,Total,Status,Produk\n';
  const rows = state.orders.map(o => {
    const produk = o.items.map(i => i.name + ' x' + i.qty).join('|');
    const c = o.customer || {};
    return [o.id, o.date, c.nama, c.email, c.telepon, c.kota, (c.alamat || '').replace(/\n/g, ' '), c.kodepos, o.payment, o.subtotal, o.discount, o.shipping, o.total, o.status, produk]
      .map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',');
  });
  download('lokamart-orders.csv', '\uFEFF' + head + rows.join('\n'), 'text/csv');
  toast('Pesanan diekspor ke CSV', '⬇️');
}

/* =========================================================
   TOAST
   ========================================================= */
function toast(msg, icon = '✅') {
  const box = safeFind('#toast');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span>' + icon + '</span> ' + msg;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

/* =========================================================
   TEMA
   ========================================================= */
function applyTheme(theme) {
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  const icon = safeFind('#themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  saveLS(LS_KEYS.theme, next);
  applyTheme(next);
}

/* =========================================================
   PENCARIAN + RIWAYAT
   ========================================================= */
function applySearch() {
  const q = (safeFind('#searchInput').value || '').trim();
  state.search = q;
  state.catalogLimit = 8;
  if (q) {
    const seen = state.recent.filter(x => x.toLowerCase() !== q.toLowerCase());
    state.recent = [q, ...seen].slice(0, 5);
    saveLS(LS_KEYS.recent, state.recent);
  }
  showView('catalog');
}

function clearSearch() {
  const input = safeFind('#searchInput');
  if (input) input.value = '';
  state.search = '';
  state.catalogLimit = 8;
  if (state.currentView === 'catalog') renderCatalog();
}

/* =========================================================
   RESET
   ========================================================= */
function resetAll() {
  if (confirm('Muat ulang data demo? Keranjang, favorit, pesanan, ulasan, dan profil Anda akan dihapus.')) {
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  }
}

function resetFilter() {
  state.search = '';
  state.category = 'semua';
  state.minPrice = '';
  state.maxPrice = '';
  state.sort = 'populer';
  state.catalogLimit = 8;
  const si = safeFind('#searchInput');
  if (si) si.value = '';
  if (state.currentView !== 'catalog') showView('catalog');
  else renderCatalog();
}

/* =========================================================
   AKSI GLOBAL (delegasi event)
   ========================================================= */
function handleAction(action, el) {
  switch (action) {
    case 'cart': openCart(); break;
    case 'close-cart': closeCart(); break;
    case 'theme': toggleTheme(); break;
    case 'wishlist': showView('wishlist'); break;
    case 'search': applySearch(); break;
    case 'clear-search': clearSearch(); break;
    case 'checkout': closeCart(); openCheckout(); break;
    case 'close-modal': closeModal(); break;
    case 'continue': closeModal(); showView('catalog'); break;
    case 'inc': changeQty(el.dataset.id, 1); break;
    case 'dec': changeQty(el.dataset.id, -1); break;
    case 'remove': removeFromCart(el.dataset.id); break;
    case 'detail-inc': detailQty(1); break;
    case 'detail-dec': detailQty(-1); break;
    case 'detail-add': addToCart(state.detailId, state.detailQty); break;
    case 'detail-buy': closeModal(); addToCart(state.detailId, state.detailQty); openCheckout(); break;
    case 'submit-review': submitReview(); break;
    case 'apply-promo': applyPromo(); break;
    case 'use-profile': useSavedProfile(); break;
    case 'export-json': exportOrdersJSON(); break;
    case 'export-csv': exportOrdersCSV(); break;
    case 'load-more': state.catalogLimit += 8; renderCatalog(); break;
    case 'recent-search': {
      const q = state.recent[Number(el.dataset.index)];
      if (q) {
        const si = safeFind('#searchInput');
        if (si) si.value = q;
        applySearch();
      }
      break;
    }
    case 'reset-filter': resetFilter(); break;
    case 'reset': resetAll(); break;
  }
}

function handleClick(e) {
  const star = e.target.closest('[data-review-star]');
  if (star) {
    const n = Number(star.dataset.reviewStar);
    state.reviewRating = n;
    const row = star.parentElement;
    if (row) {
      row.querySelectorAll('.star-btn').forEach((b, i) => {
        b.textContent = i < n ? '⭐' : '☆';
      });
    }
    return;
  }
  const el = e.target.closest('[data-nav],[data-cat],[data-open],[data-add],[data-wish],[data-action]');
  if (!el) return;
  const { nav, cat, open, add, wish, action } = el.dataset;
  if (nav !== undefined) { e.preventDefault(); showView(nav); return; }
  if (cat !== undefined) { state.category = cat; state.catalogLimit = 8; showView('catalog'); return; }
  if (open !== undefined) { openProduct(open); return; }
  if (add !== undefined) { addToCart(add); return; }
  if (wish !== undefined) { toggleWish(wish); return; }
  if (action !== undefined) { handleAction(action, el); }
}

/* =========================================================
   EVENT BINDING
   ========================================================= */
function bindEvents() {
  document.addEventListener('click', handleClick);

  const sortEl = safeFind('#sortSelect');
  if (sortEl) sortEl.addEventListener('change', e => { state.sort = e.target.value; renderCatalog(); });

  const minEl = safeFind('#minPrice');
  const maxEl = safeFind('#maxPrice');
  if (minEl) minEl.addEventListener('input', () => { state.minPrice = minEl.value; renderCatalog(); });
  if (maxEl) maxEl.addEventListener('input', () => { state.maxPrice = maxEl.value; renderCatalog(); });

  const form = safeFind('#checkoutForm');
  if (form) form.addEventListener('submit', handleCheckout);

  const si = safeFind('#searchInput');
  if (si) {
    si.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = si.value.trim();
        state.catalogLimit = 8;
        if (state.currentView === 'catalog') { renderCatalog(); renderRecentSearches(); }
        else showView('catalog');
      }, 300);
    });
    si.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer);
        applySearch();
      }
    });
  }

  // Escape menutup modal & drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const drawer = safeFind('#cartDrawer');
      if (drawer && drawer.classList.contains('open')) { closeCart(); return; }
      if (document.querySelector('.modal.open')) { closeModal(); return; }
    }
  });

  // Live validasi: hapus error saat user mengetik
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'reviewText') {
      const cc = e.target.parentElement.querySelector('.char-count');
      if (cc) cc.textContent = e.target.value.length + '/250';
    }
    if (e.target.closest && e.target.closest('.field.error')) {
      e.target.closest('.field.error').classList.remove('error');
      const msg = e.target.closest('.field').querySelector('.err-msg');
      if (msg) msg.remove();
    }
  });

  // Tombol kembali ke atas
  const topBtn = safeFind('#backTop');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      topBtn.classList.toggle('show', window.scrollY > 500);
    });
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
}

/* =========================================================
   INIT
   ========================================================= */
function init() {
  state.products = loadLS(LS_KEYS.products, null);
  const needsMigration = !Array.isArray(state.products) || !state.products.length
    || state.products.some(p => typeof p.stock === 'undefined');
  if (needsMigration) {
    state.products = SEED_PRODUCTS;
    saveLS(LS_KEYS.products, state.products);
  }
  state.cart = loadLS(LS_KEYS.cart, {}) || {};
  state.wishlist = loadLS(LS_KEYS.wishlist, []) || [];
  state.orders = loadLS(LS_KEYS.orders, []) || [];
  state.reviews = loadLS(LS_KEYS.reviews, {}) || {};
  state.recent = loadLS(LS_KEYS.recent, []) || [];
  state.profile = loadLS(LS_KEYS.profile, null);

  applyTheme(loadLS(LS_KEYS.theme, null));
  const yearEl = safeFind('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  updateCartBadge();
  updateWishlistBadge();
  bindEvents();
  showView('home');
}

document.addEventListener('DOMContentLoaded', init);
