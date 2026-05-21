// Lather & Lust — Admin Portal Logic

(function () {
  'use strict';

  // ======================================================
  // CONSTANTS & DEFAULTS
  // ======================================================
  const LS = {
    ORDERS:   'll_orders',
    PRODUCTS: 'll_admin_products',
    PROMOS:   'll_admin_promos',
    SETTINGS: 'll_admin_settings',
    SESSION:  'll_admin_session',
    PASSWORD: 'll_admin_password',
  };

  const DEFAULT_PASSWORD = 'admin@latherlust';
  const STATUS_LIST = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  // ======================================================
  // HELPERS
  // ======================================================
  const $  = (id) => document.getElementById(id);
  const el = (sel) => document.querySelector(sel);

  function ls_get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  function ls_set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function formatCurrency(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function showConfirm(title, message, onYes) {
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-modal').classList.add('open');
    $('confirm-yes').onclick = () => {
      $('confirm-modal').classList.remove('open');
      onYes();
    };
    $('confirm-no').onclick = () => $('confirm-modal').classList.remove('open');
  }

  // ======================================================
  // AUTH
  // ======================================================
  function getPassword() {
    return ls_get(LS.PASSWORD) || DEFAULT_PASSWORD;
  }

  function isLoggedIn() {
    return sessionStorage.getItem(LS.SESSION) === 'true';
  }

  function login(pass) {
    if (pass === getPassword()) {
      sessionStorage.setItem(LS.SESSION, 'true');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(LS.SESSION);
    showLogin();
  }

  function showLogin() {
    $('login-overlay').style.display = 'flex';
    $('admin-shell').style.display = 'none';
  }

  function showAdmin() {
    $('login-overlay').style.display = 'none';
    $('admin-shell').style.display = 'flex';
    initDashboard();
  }

  // ======================================================
  // DATA ACCESS
  // ======================================================
  function getOrders() {
    return ls_get(LS.ORDERS, []);
  }

  function saveOrders(orders) {
    ls_set(LS.ORDERS, orders);
  }

  function getProducts() {
    // Prefer admin overrides, fallback to CONFIG
    const overrides = ls_get(LS.PRODUCTS, null);
    if (overrides) return overrides;
    // Deep clone from CONFIG
    return JSON.parse(JSON.stringify(CONFIG.products));
  }

  function saveProducts(products) {
    ls_set(LS.PRODUCTS, products);
  }

  function getPromos() {
    const stored = ls_get(LS.PROMOS, null);
    if (stored) return stored;
    // Init from CONFIG
    const codes = [];
    for (const [code, data] of Object.entries(CONFIG.promoCodes || {})) {
      codes.push({ code, discount: data.discount, label: data.label, active: true });
    }
    return codes;
  }

  function savePromos(promos) {
    ls_set(LS.PROMOS, promos);
  }

  function getSettings() {
    const defaults = {
      whatsappNumber:       CONFIG.whatsappNumber || '919876543210',
      freeExpressThreshold: CONFIG.freeExpressThreshold || 499,
      giftWrapCost:         CONFIG.giftWrapCost || 30,
    };
    return Object.assign({}, defaults, ls_get(LS.SETTINGS, {}));
  }

  function saveSettings(settings) {
    ls_set(LS.SETTINGS, settings);
  }

  // ======================================================
  // SECTION NAVIGATION
  // ======================================================
  const SECTIONS = ['dashboard', 'orders', 'products', 'promos', 'settings'];

  function switchSection(name) {
    SECTIONS.forEach(s => {
      const sec = $('section-' + s);
      const nav = $('nav-' + s);
      if (sec) sec.classList.toggle('active', s === name);
      if (nav) nav.classList.toggle('active', s === name);
    });
    // Re-render the active section
    if (name === 'dashboard') renderDashboard();
    if (name === 'orders')    renderOrders();
    if (name === 'products')  renderProducts();
    if (name === 'promos')    renderPromos();
    if (name === 'settings')  renderSettings();
    // Close mobile sidebar
    closeSidebar();
  }

  // ======================================================
  // DASHBOARD
  // ======================================================
  function initDashboard() {
    renderDashboard();
  }

  function renderDashboard() {
    const orders = getOrders();
    const totalOrders  = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const pending      = orders.filter(o => o.status === 'Pending').length;

    // Product sales count
    const productSales = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 1);
      });
    });
    const topEntry = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    const topProduct = topEntry ? topEntry[0].split(' ')[0] : '—';

    // Stats
    $('stat-total-orders').textContent = totalOrders;
    $('stat-revenue').textContent = formatCurrency(totalRevenue);
    $('stat-pending').textContent  = pending;
    $('stat-top-product').textContent = topProduct;

    // Pending badge in sidebar
    const badge = $('nav-orders-badge');
    if (badge) {
      badge.textContent = pending;
      badge.style.display = pending > 0 ? 'flex' : 'none';
    }

    // Product bars
    const barsEl = $('product-bars');
    const maxSales = Math.max(1, ...Object.values(productSales));
    if (Object.keys(productSales).length === 0) {
      barsEl.innerHTML = '<p class="empty-msg">No orders yet.</p>';
    } else {
      barsEl.innerHTML = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .map(([name, qty]) => `
          <div class="product-bar-item">
            <div class="product-bar-label">
              <span>${name}</span>
              <span>${qty} sold</span>
            </div>
            <div class="product-bar-track">
              <div class="product-bar-fill" style="width:${Math.round(qty/maxSales*100)}%"></div>
            </div>
          </div>`).join('');
    }

    // Recent orders
    const recentEl = $('recent-orders-list');
    const recent = [...orders].reverse().slice(0, 6);
    if (recent.length === 0) {
      recentEl.innerHTML = '<p class="empty-msg">No orders yet.</p>';
    } else {
      recentEl.innerHTML = recent.map(o => `
        <div class="recent-order-item">
          <div>
            <div class="recent-order-id">#${o.orderId || '—'}</div>
            <div class="recent-order-name">${o.customerName || '—'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;">${formatCurrency(o.grandTotal || 0)}</div>
            <span class="status-badge status-${o.status || 'Pending'}">${o.status || 'Pending'}</span>
          </div>
        </div>`).join('');
    }
  }

  // ======================================================
  // ORDERS
  // ======================================================
  let currentOrderFilter = 'all';

  function renderOrders() {
    const all = getOrders();
    const filter = $('orders-filter') ? $('orders-filter').value : 'all';
    const filtered = filter === 'all' ? all : all.filter(o => o.status === filter);

    const tbody = $('orders-table-body');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-msg">No orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = [...filtered].reverse().map((o, idx) => {
      const realIdx = all.length - 1 - (filter === 'all' ? idx : all.indexOf(o));
      const itemsSummary = (o.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ');
      const statusOptions = STATUS_LIST.map(s =>
        `<option value="${s}" ${(o.status || 'Pending') === s ? 'selected' : ''}>${s}</option>`
      ).join('');
      return `
        <tr>
          <td class="order-id-cell">${o.orderId || '—'}</td>
          <td style="white-space:nowrap;font-size:0.75rem;">${formatDate(o.timestamp)}</td>
          <td style="font-weight:600;">${o.customerName || '—'}</td>
          <td>${o.customerPhone || '—'}</td>
          <td>${o.city || '—'}</td>
          <td style="max-width:180px;font-size:0.75rem;color:var(--text-secondary);">${itemsSummary || '—'}</td>
          <td style="font-weight:700;">${formatCurrency(o.grandTotal || 0)}</td>
          <td style="font-size:0.75rem;">${o.deliverySpeed || 'Standard'}</td>
          <td><span class="status-badge status-${o.status || 'Pending'}">${o.status || 'Pending'}</span></td>
          <td>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <select class="table-action-select" onchange="window.adminUpdateStatus(${findOrderIndex(all, o)}, this.value)">
                ${statusOptions}
              </select>
              <button class="btn-admin btn-sm btn-secondary" onclick="window.adminViewOrder(${findOrderIndex(all, o)})">View</button>
              <button class="btn-admin btn-sm btn-danger" onclick="window.adminDeleteOrder(${findOrderIndex(all, o)})">✕</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function findOrderIndex(all, o) {
    return all.indexOf(o);
  }

  window.adminUpdateStatus = function(idx, status) {
    const orders = getOrders();
    if (orders[idx]) {
      orders[idx].status = status;
      saveOrders(orders);
      renderOrders();
      renderDashboard();
    }
  };

  window.adminDeleteOrder = function(idx) {
    showConfirm('Delete Order', 'This will permanently remove this order. Are you sure?', () => {
      const orders = getOrders();
      orders.splice(idx, 1);
      saveOrders(orders);
      renderOrders();
      renderDashboard();
    });
  };

  window.adminViewOrder = function(idx) {
    const orders = getOrders();
    const o = orders[idx];
    if (!o) return;

    const itemsHtml = (o.items || []).map(i => `
      <li>
        <span>${i.quantity}× ${i.name}</span>
        <span style="font-weight:600;">${formatCurrency((i.price || 0) * (i.quantity || 1))}</span>
      </li>`).join('');

    $('order-detail-body').innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:500;">Order #${o.orderId || '—'}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">${formatDate(o.timestamp)}</div>
        <span class="status-badge status-${o.status || 'Pending'}" style="margin-top:8px;display:inline-block;">${o.status || 'Pending'}</span>
      </div>
      <div class="order-detail-section">
        <h4>Customer Details</h4>
        <div class="order-detail-row"><span class="order-detail-key">Name:</span><span class="order-detail-val">${o.customerName || '—'}</span></div>
        <div class="order-detail-row"><span class="order-detail-key">WhatsApp:</span><span class="order-detail-val">${o.customerPhone || '—'}</span></div>
      </div>
      <div class="order-detail-section">
        <h4>Delivery Details</h4>
        <div class="order-detail-row"><span class="order-detail-key">Address:</span><span class="order-detail-val">${o.address || '—'}</span></div>
        <div class="order-detail-row"><span class="order-detail-key">City:</span><span class="order-detail-val">${o.city || '—'} - ${o.pincode || '—'}</span></div>
        <div class="order-detail-row"><span class="order-detail-key">Speed:</span><span class="order-detail-val">${o.deliverySpeed || 'Standard'}</span></div>
        ${o.giftWrap ? `<div class="order-detail-row"><span class="order-detail-key">Gift Wrap:</span><span class="order-detail-val">Yes — "${o.giftMessage || ''}"</span></div>` : ''}
        ${o.notes ? `<div class="order-detail-row"><span class="order-detail-key">Notes:</span><span class="order-detail-val">${o.notes}</span></div>` : ''}
      </div>
      <div class="order-detail-section">
        <h4>Ordered Items</h4>
        <ul class="order-items-list">${itemsHtml}</ul>
      </div>
      <div class="order-detail-section">
        <h4>Pricing Summary</h4>
        <div class="order-detail-row"><span class="order-detail-key">Subtotal:</span><span class="order-detail-val">${formatCurrency(o.subtotal || 0)}</span></div>
        ${o.promoDiscount > 0 ? `<div class="order-detail-row"><span class="order-detail-key">Promo Disc:</span><span class="order-detail-val" style="color:var(--accent-green);">-${formatCurrency(o.promoDiscount)}</span></div>` : ''}
        ${o.giftWrapCost > 0 ? `<div class="order-detail-row"><span class="order-detail-key">Gift Wrap:</span><span class="order-detail-val">+${formatCurrency(o.giftWrapCost)}</span></div>` : ''}
        <div class="order-detail-row"><span class="order-detail-key">Shipping:</span><span class="order-detail-val">${o.shipping > 0 ? formatCurrency(o.shipping) : 'Free'}</span></div>
        <div class="order-detail-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;">
          <span class="order-detail-key" style="font-weight:700;color:var(--text-primary);">Grand Total:</span>
          <span class="order-detail-val" style="font-weight:700;font-size:1.05rem;">${formatCurrency(o.grandTotal || 0)}</span>
        </div>
      </div>
      <div style="margin-top:20px;">
        <label style="display:block;font-size:0.68rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-secondary);margin-bottom:8px;">Update Status</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${STATUS_LIST.map(s => `
            <button class="btn-admin btn-sm ${(o.status||'Pending')===s ? 'btn-primary' : 'btn-secondary'}"
              onclick="window.adminUpdateStatus(${idx},'${s}'); window.adminViewOrder(${idx});"
            >${s}</button>`).join('')}
        </div>
      </div>`;
    $('order-detail-modal').classList.add('open');
  };

  function exportCSV() {
    const orders = getOrders();
    if (!orders.length) { alert('No orders to export.'); return; }

    const headers = ['Order ID','Date','Customer','Phone','Address','City','Pincode','Items','Subtotal','Promo Disc','Gift Wrap','Shipping','Grand Total','Delivery','Status'];
    const rows = orders.map(o => [
      o.orderId || '',
      formatDate(o.timestamp),
      o.customerName || '',
      o.customerPhone || '',
      (o.address || '').replace(/,/g, ';'),
      o.city || '',
      o.pincode || '',
      (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(' | '),
      o.subtotal || 0,
      o.promoDiscount || 0,
      o.giftWrapCost || 0,
      o.shipping || 0,
      o.grandTotal || 0,
      o.deliverySpeed || 'Standard',
      o.status || 'Pending'
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ll-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ======================================================
  // PRODUCTS
  // ======================================================
  function renderProducts() {
    const products = getProducts();
    const grid = $('products-admin-grid');
    grid.innerHTML = products.map((p, idx) => `
      <div class="product-admin-card" data-idx="${idx}">
        <div class="product-admin-img-wrap">
          <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
        </div>
        <div class="product-admin-badge">${p.badge || 'Product'}</div>
        <div class="product-admin-name">${p.name}</div>
        <div class="product-admin-fields">
          <div class="product-admin-field">
            <label>Product Name</label>
            <input type="text" class="prod-field" data-field="name" data-idx="${idx}" value="${p.name || ''}">
          </div>
          <div class="product-admin-field">
            <label>Tagline</label>
            <input type="text" class="prod-field" data-field="tagline" data-idx="${idx}" value="${p.tagline || ''}">
          </div>
          <div class="product-admin-row">
            <div class="product-admin-field">
              <label>Price (₹)</label>
              <input type="number" class="prod-field" data-field="price" data-idx="${idx}" value="${p.price || 0}" min="0">
            </div>
            <div class="product-admin-field">
              <label>Weight</label>
              <input type="text" class="prod-field" data-field="weight" data-idx="${idx}" value="${p.weight || ''}">
            </div>
          </div>
          <div class="product-admin-field">
            <label>Badge Label</label>
            <input type="text" class="prod-field" data-field="badge" data-idx="${idx}" value="${p.badge || ''}">
          </div>
          <div class="product-admin-field">
            <label>Description</label>
            <input type="text" class="prod-field" data-field="description" data-idx="${idx}" value="${(p.description || '').replace(/"/g, '&quot;')}">
          </div>
        </div>
      </div>`).join('');
  }

  function saveProductsFromUI() {
    const products = getProducts();
    document.querySelectorAll('.prod-field').forEach(input => {
      const idx   = parseInt(input.dataset.idx);
      const field = input.dataset.field;
      if (!isNaN(idx) && field && products[idx] !== undefined) {
        products[idx][field] = field === 'price' ? Number(input.value) : input.value;
      }
    });
    saveProducts(products);
    // Flash success
    const btn = $('save-products-btn');
    const orig = btn.textContent;
    btn.textContent = '✅ Saved!';
    btn.style.background = 'var(--accent-green)';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
  }

  // ======================================================
  // PROMOS
  // ======================================================
  function renderPromos() {
    const promos = getPromos();
    const tbody  = $('promos-table-body');
    if (!promos.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No promo codes found.</td></tr>';
      return;
    }
    tbody.innerHTML = promos.map((p, idx) => `
      <tr>
        <td style="font-family:monospace;font-weight:700;font-size:0.9rem;color:var(--accent-gold);">${p.code}</td>
        <td><span class="status-badge status-Delivered">${p.discount}% OFF</span></td>
        <td style="color:var(--text-secondary);font-size:0.8rem;">${p.label || '—'}</td>
        <td>
          <span class="status-badge ${p.active !== false ? 'status-Delivered' : 'status-Cancelled'}">
            ${p.active !== false ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-admin btn-sm btn-secondary" onclick="window.adminTogglePromo(${idx})">
              ${p.active !== false ? '⏸ Disable' : '▶ Enable'}
            </button>
            <button class="btn-admin btn-sm btn-danger" onclick="window.adminDeletePromo(${idx})">✕ Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }

  window.adminTogglePromo = function(idx) {
    const promos = getPromos();
    if (promos[idx]) {
      promos[idx].active = !promos[idx].active;
      savePromos(promos);
      renderPromos();
    }
  };

  window.adminDeletePromo = function(idx) {
    showConfirm('Delete Promo Code', 'This will permanently remove this promo code.', () => {
      const promos = getPromos();
      promos.splice(idx, 1);
      savePromos(promos);
      renderPromos();
    });
  };

  function addPromoCode() {
    const code     = ($('new-promo-code').value || '').trim().toUpperCase();
    const discount = parseInt($('new-promo-discount').value) || 0;
    const label    = ($('new-promo-label').value || '').trim();
    const errEl    = $('promo-add-error');

    if (!code)             { errEl.textContent = 'Please enter a promo code.'; return; }
    if (discount < 1 || discount > 99) { errEl.textContent = 'Discount must be between 1% and 99%.'; return; }
    if (!label)            { errEl.textContent = 'Please enter a label for this code.'; return; }

    const promos = getPromos();
    if (promos.find(p => p.code === code)) { errEl.textContent = 'This code already exists.'; return; }

    promos.push({ code, discount, label, active: true });
    savePromos(promos);
    $('new-promo-code').value = '';
    $('new-promo-discount').value = '';
    $('new-promo-label').value = '';
    errEl.textContent = '';
    renderPromos();
  }

  // ======================================================
  // SETTINGS
  // ======================================================
  function renderSettings() {
    const s = getSettings();
    $('setting-wa-number').value    = s.whatsappNumber || '';
    $('setting-free-shipping').value= s.freeExpressThreshold || 499;
    $('setting-gift-wrap').value    = s.giftWrapCost || 30;
    $('setting-new-password').value = '';
    $('setting-confirm-password').value = '';
    $('password-change-msg').textContent = '';
  }

  function saveAllSettings() {
    const waNumber  = ($('setting-wa-number').value || '').trim();
    const freeShip  = parseInt($('setting-free-shipping').value) || 499;
    const giftWrap  = parseInt($('setting-gift-wrap').value) || 30;
    const newPass   = $('setting-new-password').value;
    const confPass  = $('setting-confirm-password').value;
    const msgEl     = $('settings-save-msg');
    const passMsg   = $('password-change-msg');

    // Password change
    if (newPass || confPass) {
      if (newPass !== confPass) {
        passMsg.textContent = '❌ Passwords do not match.';
        passMsg.style.color = 'var(--accent-red)';
        return;
      }
      if (newPass.length < 6) {
        passMsg.textContent = '❌ Password must be at least 6 characters.';
        passMsg.style.color = 'var(--accent-red)';
        return;
      }
      ls_set(LS.PASSWORD, newPass);
      passMsg.textContent = '✅ Password updated!';
      passMsg.style.color = 'var(--accent-green)';
      $('setting-new-password').value = '';
      $('setting-confirm-password').value = '';
    }

    saveSettings({ whatsappNumber: waNumber, freeExpressThreshold: freeShip, giftWrapCost: giftWrap });

    msgEl.textContent = '✅ Settings saved! Refresh the storefront to apply changes.';
    setTimeout(() => { msgEl.textContent = ''; }, 4000);
  }

  // ======================================================
  // MOBILE SIDEBAR
  // ======================================================
  let sidebarOpen = false;
  let sidebarOverlay = null;

  function openSidebar() {
    $('sidebar').classList.add('open');
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
    }
    sidebarOverlay.classList.add('visible');
    sidebarOverlay.onclick = closeSidebar;
    sidebarOpen = true;
  }

  function closeSidebar() {
    $('sidebar').classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
    sidebarOpen = false;
  }

  // ======================================================
  // SEED DEMO ORDERS (for fresh installs with no real orders)
  // ======================================================
  function seedDemoOrdersIfEmpty() {
    const existing = getOrders();
    if (existing.length > 0) return;

    const demoOrders = [
      {
        orderId: 'LL-382910',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        customerName: 'Priya Sharma',
        customerPhone: '+91 98765 43210',
        address: 'Flat 402, Sunrise Towers, MG Road',
        city: 'Mumbai',
        pincode: '400001',
        items: [
          { name: 'Lavender Calm', price: 129, quantity: 2 },
          { name: 'Rose Milk', price: 129, quantity: 1 }
        ],
        subtotal: 387,
        promoDiscount: 0,
        giftWrapCost: 30,
        shipping: 0,
        grandTotal: 417,
        deliverySpeed: 'Standard',
        giftWrap: true,
        giftMessage: 'Happy Birthday Maa!',
        notes: '',
        status: 'Pending'
      },
      {
        orderId: 'LL-495021',
        timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
        customerName: 'Rohan Mehta',
        customerPhone: '+91 87654 32109',
        address: 'B-12, Green Colony, Sector 14',
        city: 'Delhi',
        pincode: '110001',
        items: [
          { name: 'Neem Tea Tree', price: 119, quantity: 1 },
          { name: 'Turmeric Honey', price: 119, quantity: 2 }
        ],
        subtotal: 357,
        promoDiscount: 71,
        giftWrapCost: 0,
        shipping: 0,
        grandTotal: 286,
        deliverySpeed: 'Express',
        giftWrap: false,
        giftMessage: '',
        notes: 'Leave at gate',
        status: 'Confirmed'
      },
      {
        orderId: 'LL-601874',
        timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
        customerName: 'Ananya Kapoor',
        customerPhone: '+91 76543 21098',
        address: '23, Jacaranda Lane, Indiranagar',
        city: 'Bangalore',
        pincode: '560038',
        items: [
          { name: 'Lather & Lust Gift Hamper', price: 479, quantity: 1 }
        ],
        subtotal: 479,
        promoDiscount: 0,
        giftWrapCost: 30,
        shipping: 0,
        grandTotal: 509,
        deliverySpeed: 'Standard',
        giftWrap: true,
        giftMessage: 'Gift for my sister',
        notes: '',
        status: 'Delivered'
      }
    ];
    saveOrders(demoOrders);
  }

  // ======================================================
  // INIT
  // ======================================================
  function init() {
    // Check session
    if (isLoggedIn()) {
      seedDemoOrdersIfEmpty();
      showAdmin();
    } else {
      showLogin();
    }

    // Login form
    $('login-btn').addEventListener('click', () => {
      const pass = $('admin-pass').value;
      if (login(pass)) {
        $('login-error').classList.remove('visible');
        $('admin-pass').value = '';
        seedDemoOrdersIfEmpty();
        showAdmin();
      } else {
        $('login-error').classList.add('visible');
        $('admin-pass').focus();
      }
    });
    $('login-form').addEventListener('submit', e => {
      e.preventDefault();
      $('login-btn').click();
    });

    // Logout
    $('logout-btn').addEventListener('click', logout);
    $('logout-btn-mobile').addEventListener('click', logout);

    // Nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        switchSection(item.dataset.section);
      });
    });

    // Mobile sidebar toggle
    $('sidebar-toggle').addEventListener('click', () => {
      sidebarOpen ? closeSidebar() : openSidebar();
    });

    // Orders filter
    $('orders-filter').addEventListener('change', renderOrders);

    // Export CSV
    $('export-csv-btn').addEventListener('click', exportCSV);

    // Clear all orders
    $('clear-orders-btn').addEventListener('click', () => {
      showConfirm('Clear All Orders', 'This will permanently delete ALL orders. This cannot be undone!', () => {
        saveOrders([]);
        renderOrders();
        renderDashboard();
      });
    });

    // Save products
    $('save-products-btn').addEventListener('click', saveProductsFromUI);

    // Reset products
    $('reset-products-btn').addEventListener('click', () => {
      showConfirm('Reset Products', 'This will reset all product changes to the original defaults.', () => {
        localStorage.removeItem(LS.PRODUCTS);
        renderProducts();
      });
    });

    // Add promo
    $('add-promo-btn').addEventListener('click', addPromoCode);

    // Save settings
    $('save-settings-btn').addEventListener('click', saveAllSettings);

    // Close modals
    $('close-order-modal').addEventListener('click', () => $('order-detail-modal').classList.remove('open'));
    $('order-detail-modal').addEventListener('click', e => {
      if (e.target === $('order-detail-modal')) $('order-detail-modal').classList.remove('open');
    });
    $('confirm-modal').addEventListener('click', e => {
      if (e.target === $('confirm-modal')) $('confirm-modal').classList.remove('open');
    });

    // Keyboard close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        $('order-detail-modal').classList.remove('open');
        $('confirm-modal').classList.remove('open');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
