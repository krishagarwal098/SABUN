// Lather & Lust - Premium E-Commerce & Interactive Logic

document.addEventListener("DOMContentLoaded", () => {
  // Global State
  let cart = [];
  let activeProduct = null;
  let selectedDeliverySpeed = "Standard";
  
  // ---------------------------------------------------
  // Scroll Lock System (counter-based — prevents conflicts
  // between mobile nav, cart drawer, and modals)
  // ---------------------------------------------------
  let scrollLockCount = 0;
  const lockBodyScroll = () => {
    scrollLockCount++;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  };
  const unlockBodyScroll = () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  };
  // Safety reset: if user navigates away and back, clear any stuck locks
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && scrollLockCount > 0) {
      scrollLockCount = 0;
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });
  // Hard reset on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      scrollLockCount = 0;
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });
  
  // DOM Elements
  const productsGrid = document.getElementById("products-catalog-grid");
  const promisesContainer = document.getElementById("promises-container");
  const cartBtn = document.getElementById("cart-btn");
  const cartCounter = document.getElementById("cart-counter");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartDrawer = document.getElementById("cart-drawer");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartSubtotalVal = document.getElementById("cart-subtotal-val");
  const checkoutTriggerBtn = document.getElementById("checkout-trigger-btn");
  
  const quickviewModal = document.getElementById("quickview-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalContentGrid = document.getElementById("modal-content-grid");
  
  const checkoutModal = document.getElementById("checkout-modal");
  const closeCheckoutBtn = document.getElementById("close-checkout-btn");
  const checkoutForm = document.getElementById("checkout-form");
  const checkoutTotalVal = document.getElementById("checkout-total-val");
  const placeOrderBtn = document.getElementById("place-order-btn");
  
  const filterButtons = document.querySelectorAll(".filter-btn");
  const mainHeader = document.getElementById("main-header");
  
  // Load Cart from localStorage
  const initCart = () => {
    const savedCart = localStorage.getItem("lather_lust_cart");
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
        updateCartUI();
      } catch (e) {
        cart = [];
      }
    }
  };
  
  const saveCart = () => {
    localStorage.setItem("lather_lust_cart", JSON.stringify(cart));
  };
  
  // Render Promises Section dynamically
  const renderPromises = () => {
    if (!promisesContainer || !CONFIG.promises) return;
    
    promisesContainer.innerHTML = CONFIG.promises.map(p => `
      <div class="promise-card">
        <div class="promise-icon">${p.icon}</div>
        <h3 class="promise-title">${p.title}</h3>
        <p class="promise-desc">${p.description}</p>
      </div>
    `).join('');
  };
  
  // Render Products Section dynamically
  const renderProducts = () => {
    if (!productsGrid || !CONFIG.products) return;
    
    productsGrid.innerHTML = CONFIG.products.map(p => {
      // Determine unique style configurations
      const filterClass = p.id === "luxury_hamper" ? "bundles" : "singles";
      
      return `
        <div class="product-card ${filterClass}" data-id="${p.id}" style="--card-theme: ${p.themeColor}">
          <div class="product-card-badge">${p.badge}</div>
          <div class="product-image-container">
            <img src="${p.image}" alt="${p.name}" class="product-img">
            <button class="product-quickview-btn" data-id="${p.id}" aria-label="Quick view product details">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
          <div class="product-info">
            <div class="product-meta">
              <span class="product-weight">${p.weight} / ${p.size}</span>
            </div>
            <h3 class="product-card-title">${p.name}</h3>
            <p class="product-tagline">${p.tagline}</p>
            <p class="product-desc-brief">${p.description.substring(0, 100)}...</p>
            <div class="product-pricing">
              <div class="product-price">${CONFIG.currency.symbol}${p.price}</div>
              <button class="btn btn-add-cart" data-id="${p.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Register action listeners on the newly created cards
    document.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        addToCart(id);
      });
    });
    
    document.querySelectorAll(".product-quickview-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        openQuickview(id);
      });
    });
  };
  
  // Filtering Logic
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = btn.getAttribute("data-filter");
      const cards = document.querySelectorAll(".product-card");
      
      cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "scale(0.9) translateY(10px)";
        setTimeout(() => {
          if (filterValue === "all" || card.classList.contains(filterValue)) {
            card.style.display = "flex";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "scale(1) translateY(0)";
            }, 50);
          } else {
            card.style.display = "none";
          }
        }, 300);
      });
    });
  });
  
  // Scrolling Header Blur effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      mainHeader.classList.add("scrolled");
    } else {
      mainHeader.classList.remove("scrolled");
    }
  });
  
  // Cart Actions
  const addToCart = (productId) => {
    const product = CONFIG.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        weight: product.weight,
        quantity: 1
      });
    }
    
    saveCart();
    updateCartUI();
    toggleCartDrawer(true);
    
    // Animate cart trigger badge
    cartBtn.style.transform = "scale(1.2)";
    setTimeout(() => {
      cartBtn.style.transform = "scale(1)";
    }, 200);
  };
  
  const changeQuantity = (productId, delta) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    
    saveCart();
    updateCartUI();
  };
  
  const removeItem = (productId) => {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
  };
  
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const updateCartUI = () => {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    // Update Badge Counter
    if (totalCount > 0) {
      cartCounter.innerText = totalCount;
      cartCounter.classList.add("active");
    } else {
      cartCounter.classList.remove("active");
    }

    // Update Header Count Subtitle dynamically
    const countMsg = document.getElementById("cart-item-count-msg");
    if (countMsg) {
      countMsg.innerText = totalCount === 1 ? "1 item selected" : `${totalCount} items selected`;
    }
    
    // Update Basket list inside Drawer
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-message">
          <div class="cart-empty-icon">🧼</div>
          <h3 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:8px;">Your Basket is Empty</h3>
          <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">Add some artisanal soap bars and let the lather soothe your day.</p>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-img-container">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy">
          </div>
          <div class="cart-item-details">
            <div>
              <h4 class="cart-item-title">${item.name}</h4>
              <span class="cart-item-meta">${item.weight}</span>
            </div>
            <div class="cart-item-bottom">
              <div class="cart-item-quantity-control">
                <button class="btn-qty" onclick="event.stopPropagation(); window.appChangeQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="btn-qty" onclick="event.stopPropagation(); window.appChangeQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
              </div>
              <span class="cart-item-price">${CONFIG.currency.symbol}${item.price * item.quantity}</span>
            </div>
          </div>
          <button class="btn-remove-item" onclick="event.stopPropagation(); window.appRemoveItem('${item.id}')" aria-label="Remove ${item.name} from basket">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `).join('') + `
        <!-- Premium Cross-sell (You May Also Like) -->
        <div class="cart-crosssell" id="cart-crosssell" style="margin-top: 15px; border-radius: 16px; border: 1px solid hsla(340, 45%, 15%, 0.08); background: hsla(340, 40%, 98%, 0.85); flex-shrink: 0;">
          <h4 class="crosssell-title" style="margin-bottom: 8px;">✨ You May Also Like</h4>
          <div class="crosssell-scroll" id="crosssell-scroll">
            <!-- Rendered dynamically by app.js -->
          </div>
        </div>
      `;
    }

    
    // Update Subtotals
    const subtotal = calculateSubtotal();
    const promoSaving = typeof getPromoDiscountAmount === 'function' ? getPromoDiscountAmount(subtotal) : 0;
    const netTotal = subtotal - promoSaving;
    cartSubtotalVal.innerText = `${CONFIG.currency.symbol}${netTotal}`;
    
    // Dynamically keep discount display and values in sync with item list changes
    const dRow = document.getElementById('promo-discount-row');
    const dVal = document.getElementById('promo-discount-val');
    if (dRow && dVal) {
      if (activePromo) {
        dRow.style.display = 'flex';
        dVal.textContent = `-${CONFIG.currency.symbol}${promoSaving}`;
      } else {
        dRow.style.display = 'none';
      }
    }
    
    // Update free shipping bar
    updateShippingBar();
    
    // Update Cross-sell products dynamically inside the scrollable cart list
    updateCrossSell();
  };
  
  // Set global functions for inline onclick operations
  window.appChangeQty = changeQuantity;
  window.appRemoveItem = removeItem;
  
  // Toggle Cart Drawer
  const toggleCartDrawer = (openState) => {
    const fab = document.getElementById('whatsapp-fab');
    if (openState) {
      cartOverlay.classList.add("open");
      cartDrawer.classList.add("open");
      lockBodyScroll();
      // Hide WhatsApp FAB so it doesn't overlap Checkout button
      if (fab) { fab.style.opacity = '0'; fab.style.pointerEvents = 'none'; fab.style.transform = 'scale(0.8)'; }
    } else {
      cartOverlay.classList.remove("open");
      cartDrawer.classList.remove("open");
      unlockBodyScroll();
      // Restore WhatsApp FAB
      if (fab) { fab.style.opacity = ''; fab.style.pointerEvents = ''; fab.style.transform = ''; }
    }
  };
  
  cartBtn.addEventListener("click", () => toggleCartDrawer(true));
  closeCartBtn.addEventListener("click", () => toggleCartDrawer(false));
  cartOverlay.addEventListener("click", () => toggleCartDrawer(false));
  
  // Open Quick View Modal
  const openQuickview = (productId) => {
    const product = CONFIG.products.find(p => p.id === productId);
    if (!product) return;
    
    activeProduct = product;
    
    modalContentGrid.innerHTML = `
      <div class="modal-image-panel">
        <img src="${product.image}" alt="${product.name}" class="modal-product-img">
      </div>
      <div class="modal-content-panel">
        <span class="badge" style="background-color: var(--variant-rose); color: var(--text-primary); border-color: transparent;">${product.badge}</span>
        <h2 class="modal-title">${product.name}</h2>
        <p class="modal-tagline">${product.tagline}</p>
        <p class="modal-description">${product.description}</p>
        
        <div class="modal-ingredients-wrap">
          <h4 class="modal-subtitle">Botanical Ingredients</h4>
          <div class="ingredients-list">
            ${product.ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('')}
          </div>
        </div>
        
        <div class="modal-actions">
          <div class="modal-price">${CONFIG.currency.symbol}${product.price}</div>
          <button class="btn btn-primary btn-add-cart" id="modal-add-btn" style="flex-grow: 1;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add to Basket
          </button>
        </div>
      </div>
    `;
    
    // Add Click listener to modal add button
    document.getElementById("modal-add-btn").addEventListener("click", () => {
      addToCart(activeProduct.id);
      closeQuickview();
    });
    
    quickviewModal.classList.add("open");
    lockBodyScroll();
  };
  
  const closeQuickview = () => {
    quickviewModal.classList.remove("open");
    unlockBodyScroll();
  };
  
  closeModalBtn.addEventListener("click", closeQuickview);
  quickviewModal.addEventListener("click", (e) => {
    if (e.target === quickviewModal) closeQuickview();
  });
  
  // Checkout & Shipping Modal
  const openCheckout = () => {
    if (cart.length === 0) {
      alert("Please add some items to your cart before proceeding to checkout!");
      return;
    }
    toggleCartDrawer(false);
    updateCheckoutTotal();
    checkoutModal.classList.add("open");
    lockBodyScroll();
  };
  
  const closeCheckout = () => {
    checkoutModal.classList.remove("open");
    unlockBodyScroll();
  };
  
  const updateCheckoutTotal = () => {
    const subtotal     = calculateSubtotal();
    const promoSaving  = typeof getPromoDiscountAmount === 'function' ? getPromoDiscountAmount(subtotal) : 0;
    const cb           = document.getElementById('gift-wrap-cb');
    const giftCost     = (cb && cb.checked) ? (CONFIG.giftWrapCost || 30) : 0;
    const shipping     = selectedDeliverySpeed === "Express" ? 50 : 0;
    
    if (checkoutTotalVal) {
      checkoutTotalVal.innerText = `${CONFIG.currency.symbol}${subtotal - promoSaving + giftCost + shipping}`;
    }
  };
  
  checkoutTriggerBtn.addEventListener("click", openCheckout);
  closeCheckoutBtn.addEventListener("click", closeCheckout);
  checkoutModal.addEventListener("click", (e) => {
    if (e.target === checkoutModal) closeCheckout();
  });
  
  // Interactive delivery card selections
  const deliveryCards = document.querySelectorAll(".delivery-card");
  deliveryCards.forEach(card => {
    card.addEventListener("click", () => {
      deliveryCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      
      const speed = card.getAttribute("data-value");
      selectedDeliverySpeed = speed === "express" ? "Express" : "Standard";
      
      // Update check box values
      document.getElementById("speed-standard").checked = speed === "standard";
      document.getElementById("speed-express").checked = speed === "express";
      
      updateCheckoutTotal();
    });
  });
  
  // BUILD WHATSAPP REDIRECTION ORDER
  placeOrderBtn.addEventListener("click", (e) => {
    // Form verification
    if (!checkoutForm.checkValidity()) {
      return; // HTML5 standard check triggers validation bubbles
    }
    
    e.preventDefault();
    
    const custName = document.getElementById("cust-name").value;
    const custPhone = document.getElementById("cust-phone").value;
    const custAddress = document.getElementById("cust-address").value;
    const custCity = document.getElementById("cust-city").value;
    const custZip = document.getElementById("cust-zip").value;
    const custNotes = document.getElementById("cust-notes").value;
    
    const subtotal = calculateSubtotal();
    const promoSaving  = getPromoDiscountAmount(subtotal);
    const giftWrapCb   = document.getElementById('gift-wrap-cb');
    const giftMsg      = document.getElementById('gift-message-input');
    const giftWrapCost = (giftWrapCb && giftWrapCb.checked) ? (CONFIG.giftWrapCost || 30) : 0;
    const shipping     = selectedDeliverySpeed === "Express" ? 50 : 0;
    const grandTotal   = subtotal - promoSaving + giftWrapCost + shipping;
    
    // Format dynamic Order ID for realism
    const orderHash = "LL-" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Construct order items summary list with emojis
    const itemsText = cart.map(item => {
      return `• ${item.quantity}x ${item.name} (${CONFIG.currency.symbol}${item.price * item.quantity})`;
    }).join('\n');
    
    // Construct rich text invoice
    const invoice = `🛁 *LATHER & LUST - ORDER INVOICE* 🛁
------------------------------------------------
*Order ID:* #${orderHash}
*Date:* ${currentDate}

👤 *CUSTOMER DETAILS*
*Name:* ${custName}
*WhatsApp:* ${custPhone}

📍 *DELIVERY DETAILS*
*Address:* ${custAddress}
*City:* ${custCity} - ${custZip}
*Speed:* ${selectedDeliverySpeed} Delivery (${shipping > 0 ? CONFIG.currency.symbol + shipping : 'Free'})

🧼 *ORDERED ITEMS*
${itemsText}

💳 *PRICING SUMMARY*
*Subtotal:* ${CONFIG.currency.symbol}${subtotal}
${promoSaving > 0 ? `*Promo Discount (${activePromo ? activePromo.discount : 0}%):* -${CONFIG.currency.symbol}${promoSaving}\n` : ''}${giftWrapCost > 0 ? `*Gift Wrapping:* +${CONFIG.currency.symbol}${giftWrapCost}\n` : ''}*Shipping:* ${shipping > 0 ? CONFIG.currency.symbol + shipping : 'Free'}
------------------------------------------------
*GRAND TOTAL DUE: ${CONFIG.currency.symbol}${grandTotal}*

${giftWrapCb && giftWrapCb.checked && giftMsg && giftMsg.value ? `🎁 *Gift Message:* "${giftMsg.value}"\n` : ''}${custNotes ? `💬 *Custom Instructions:* "${custNotes}"\n------------------------------------------------` : ''}

Hi *Lather & Lust*! I have built my order on your website. Please verify this receipt so we can finalize payment and proceed with delivery! ✨`;

    // Encode text payload
    const encodedInvoice = encodeURIComponent(invoice);
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedInvoice}`;
    
    // ── SAVE ORDER TO ADMIN PORTAL (localStorage) ─────────────────
    try {
      const orderRecord = {
        orderId:       orderHash,
        timestamp:     new Date().toISOString(),
        customerName:  custName,
        customerPhone: custPhone,
        address:       custAddress,
        city:          custCity,
        pincode:       custZip,
        notes:         custNotes,
        deliverySpeed: selectedDeliverySpeed,
        giftWrap:      !!(giftWrapCb && giftWrapCb.checked),
        giftMessage:   (giftMsg && giftMsg.value) ? giftMsg.value : '',
        items:         cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        subtotal:      subtotal,
        promoDiscount: promoSaving,
        giftWrapCost:  giftWrapCost,
        shipping:      shipping,
        grandTotal:    grandTotal,
        status:        'Pending'
      };
      const existingOrders = JSON.parse(localStorage.getItem('ll_orders') || '[]');
      existingOrders.push(orderRecord);
      localStorage.setItem('ll_orders', JSON.stringify(existingOrders));
    } catch (e) { /* silent fail — don't block checkout */ }
    // ────────────────────────────────────────────────────────────────

    // Clear cart on successful checkout redirect
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckout();
    
    // Open WhatsApp redirect in a new window/tab
    window.open(waUrl, '_blank');
  });
  
  // --- Launch Countdown Timer ---
  const initCountdown = () => {
    // Set your actual launch date here → June 21, 2026 midnight IST (UTC+5:30)
    const launchDate = new Date('2026-06-21T00:00:00+05:30').getTime();
    
    const cdDays  = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins  = document.getElementById('cd-mins');
    const cdSecs  = document.getElementById('cd-secs');
    
    if (!cdDays) return;
    
    const pad = n => String(Math.max(0, n)).padStart(2, '0');
    
    const tick = () => {
      const now  = Date.now();
      const diff = launchDate - now;
      
      if (diff <= 0) {
        cdDays.textContent = '00';
        cdHours.textContent = '00';
        cdMins.textContent = '00';
        cdSecs.textContent = '🎉';
        return;
      }
      
      const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);
      
      const newSecs = pad(secs);
      if (cdSecs.textContent !== newSecs) {
        // Animate seconds on change
        cdSecs.classList.add('tick');
        setTimeout(() => cdSecs.classList.remove('tick'), 150);
      }
      
      cdDays.textContent  = pad(days);
      cdHours.textContent = pad(hours);
      cdMins.textContent  = pad(mins);
      cdSecs.textContent  = newSecs;
    };
    
    tick();
    setInterval(tick, 1000);
  };
  
  // --- FAQ Accordion ---
  const initFAQ = () => {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        const answer = btn.nextElementSibling;
        
        // Close all others
        document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(openBtn => {
          if (openBtn !== btn) {
            openBtn.setAttribute('aria-expanded', 'false');
            openBtn.nextElementSibling.classList.remove('open');
          }
        });
        
        // Toggle current
        btn.setAttribute('aria-expanded', !isOpen);
        answer.classList.toggle('open', !isOpen);
      });
    });
  };
  
  // --- WhatsApp FAB – sync phone number from config ---
  const initWhatsAppFAB = () => {
    const fab = document.getElementById('whatsapp-fab');
    if (fab && CONFIG && CONFIG.whatsappNumber) {
      const msg = encodeURIComponent('Hi Lather & Lust! I want to know more about your soaps 🌹');
      fab.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;
    }
  };
  
  // --- Mobile Hamburger Navigation ---
  const initMobileNav = () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav    = document.getElementById('mobile-nav');
    const backdrop     = document.getElementById('mobile-nav-backdrop');
    const closeBtn     = document.getElementById('mobile-nav-close');
    if (!hamburgerBtn || !mobileNav || !backdrop || !closeBtn) return;

    const openNav = () => {
      mobileNav.classList.add('open');
      backdrop.classList.add('open');
      hamburgerBtn.classList.add('open');
      lockBodyScroll();
    };
    const closeNav = () => {
      mobileNav.classList.remove('open');
      backdrop.classList.remove('open');
      hamburgerBtn.classList.remove('open');
      unlockBodyScroll();
    };

    hamburgerBtn.addEventListener('click', openNav);
    closeBtn.addEventListener('click', closeNav);
    backdrop.addEventListener('click', closeNav);

    // Close nav when any link is clicked
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', closeNav);
    });
    
    // Close nav on Shop Now button (null-safe)
    const shopBtn = mobileNav.querySelector('.btn-gold');
    if (shopBtn) shopBtn.addEventListener('click', closeNav);
  };

  // --- Free Shipping Progress Bar ---
  const updateShippingBar = () => {
    const wrap    = document.getElementById('shipping-bar-wrap');
    const msg     = document.getElementById('shipping-bar-msg');
    const need    = document.getElementById('shipping-bar-need');
    const fill    = document.getElementById('shipping-bar-fill');
    if (!wrap) return;

    const threshold = CONFIG.freeExpressThreshold || 499;
    // FIX: cart items store 'quantity' not 'qty'
    const total     = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const pct       = Math.min(100, Math.round((total / threshold) * 100));
    const remaining = threshold - total;

    fill.style.width = pct + '%';

    if (total === 0) {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = 'block';

    if (remaining <= 0) {
      msg.innerHTML = '🎉 <strong>Free Express Shipping unlocked!</strong> You\'re all set!';
      msg.classList.add('unlocked');
    } else {
      msg.innerHTML = `Add <strong>${CONFIG.currency.symbol}${remaining}</strong> more for <strong>Free Express Shipping!</strong> 🚀`;
      msg.classList.remove('unlocked');
    }
  };

  // --- Promo Code System ---
  let activePromo = null; // { discount: 20, label: '...' } or null

  const getPromoDiscountAmount = (subtotal) => {
    if (!activePromo) return 0;
    return Math.round(subtotal * activePromo.discount / 100);
  };

  const initPromoCode = () => {
    const promoInput      = document.getElementById('promo-input');
    const applyBtn        = document.getElementById('apply-promo-btn');
    const promoStatus     = document.getElementById('promo-status');
    const discountRow     = document.getElementById('promo-discount-row');
    const discountVal     = document.getElementById('promo-discount-val');
    
    // Wire up elegant promo slide toggle drawer
    const promoToggleBtn  = document.getElementById('promo-toggle-btn');
    const promoDrawer     = document.getElementById('promo-drawer');
    if (promoToggleBtn && promoDrawer) {
      promoToggleBtn.addEventListener('click', () => {
        const isOpen = promoDrawer.classList.toggle('open');
        promoToggleBtn.classList.toggle('open', isOpen);
      });
    }

    if (!applyBtn) return;

    const applyPromo = () => {
      const code = (promoInput.value || '').trim().toUpperCase();
      const promos = CONFIG.promoCodes || {};

      if (!code) {
        promoStatus.textContent = '⚠️ Please enter a promo code.';
        promoStatus.className = 'promo-status error';
        promoInput.className = 'promo-input error';
        return;
      }

      if (promos[code]) {
        activePromo = promos[code];
        const subtotal = calculateSubtotal();
        const saving   = getPromoDiscountAmount(subtotal);
        promoStatus.textContent = `✅ ${activePromo.label}`;
        promoStatus.className = 'promo-status success';
        promoInput.className = 'promo-input success';
        discountRow.style.display = 'flex';
        discountVal.textContent = `-${CONFIG.currency.symbol}${saving}`;
        updateCartUI();
      } else {
        activePromo = null;
        promoStatus.textContent = '❌ Invalid code. Try LAUNCH20, SWEET10 or SWISS15.';
        promoStatus.className = 'promo-status error';
        promoInput.className = 'promo-input error';
        discountRow.style.display = 'none';
        updateCartUI();
      }
    };

    applyBtn.addEventListener('click', applyPromo);
    promoInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyPromo(); });
  };

  // --- Cross-sell in Cart ---
  const updateCrossSell = () => {
    const container = document.getElementById('cart-crosssell');
    const scroll    = document.getElementById('crosssell-scroll');
    if (!container || !scroll) return;

    const cartIds    = new Set(cart.map(i => i.id));
    const notInCart  = CONFIG.products.filter(p => !cartIds.has(p.id));

    if (notInCart.length === 0 || cart.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    scroll.innerHTML = notInCart.map(p => `
      <div class="crosssell-card">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="crosssell-card-name">${p.name}</div>
        <div class="crosssell-card-price">${CONFIG.currency.symbol}${p.price}</div>
        <button class="crosssell-add-btn" data-id="${p.id}">+ Add</button>
      </div>
    `).join('');

    scroll.querySelectorAll('.crosssell-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(btn.getAttribute('data-id'));
        btn.textContent = '✓ Added!';
        btn.style.background = 'hsl(140,55%,40%)';
        setTimeout(() => { updateCrossSell(); }, 600);
      });
    });
  };

  // --- Pincode Serviceability Checker ---
  const initPincodeChecker = () => {
    const pinInput  = document.getElementById('pin-check-input');
    const checkBtn  = document.getElementById('check-pin-btn');
    const pinResult = document.getElementById('pin-result');
    if (!checkBtn) return;

    // Non-serviceable PIN prefixes (example list - update per your logistics)
    const nonServiceable = ['37', '39', '79', '89', '97'];

    checkBtn.addEventListener('click', () => {
      const pin = (pinInput.value || '').trim();
      if (!/^[0-9]{6}$/.test(pin)) {
        pinResult.textContent = '⚠️ Please enter a valid 6-digit PIN code.';
        pinResult.className = 'pin-result error';
        return;
      }

      checkBtn.textContent = 'Checking...';
      checkBtn.disabled = true;

      // Simulate API call with a brief delay
      setTimeout(() => {
        const prefix = pin.substring(0, 2);
        if (nonServiceable.includes(prefix)) {
          pinResult.textContent = '❌ Sorry, delivery is not available to this PIN code yet.';
          pinResult.className = 'pin-result error';
        } else {
          pinResult.textContent = `✅ Delivery available to ${pin}! Estimated: 3–5 business days.`;
          pinResult.className = 'pin-result success';
        }
        checkBtn.textContent = 'Check';
        checkBtn.disabled = false;
      }, 900);
    });
  };

  // --- Gift Wrap Toggle ---
  const initGiftWrap = () => {
    const cb      = document.getElementById('gift-wrap-cb');
    const msgArea = document.getElementById('gift-msg-area');
    if (!cb) return;
    cb.addEventListener('change', () => {
      msgArea.classList.toggle('open', cb.checked);
      // Recalculate checkout total using centralized function
      updateCheckoutTotal();
    });
  };

  // --- WhatsApp Share on Product Cards ---
  const addShareButtons = () => {
    document.querySelectorAll('.product-card').forEach(card => {
      if (card.querySelector('.btn-share-wa')) return; // avoid duplicates
      const id  = card.getAttribute('data-id');
      const p   = CONFIG.products.find(x => x.id === id);
      if (!p) return;

      const shareMsg = encodeURIComponent(
        `✨ Check out *${p.name}* by Lather & Lust!\n` +
        `${p.tagline} • ${p.weight} • ${CONFIG.currency.symbol}${p.price}\n` +
        `100% Vegan | Swiss Formula | SLS-Free 🇨🇭\n` +
        `Order via WhatsApp: https://wa.me/${CONFIG.whatsappNumber}`
      );
      const btn = document.createElement('a');
      btn.href   = `https://wa.me/?text=${shareMsg}`;
      btn.target = '_blank';
      btn.rel    = 'noopener';
      btn.className = 'btn-share-wa';
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="13" height="13" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z"/></svg> Share`;
      card.querySelector('.product-pricing').after(btn);
    });
  };

  // --- Back to Top Button ---
  const initBackToTop = () => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // --- Cookie Consent ---
  const initCookieConsent = () => {
    const banner  = document.getElementById('cookie-banner');
    const accept  = document.getElementById('cookie-accept');
    const decline = document.getElementById('cookie-decline');
    if (!banner) return;

    // Don't show if already responded
    if (localStorage.getItem('ll_cookie_consent')) return;

    // Slide in after 1.5 seconds
    setTimeout(() => banner.classList.add('visible'), 1500);

    const dismiss = (choice) => {
      localStorage.setItem('ll_cookie_consent', choice);
      banner.classList.remove('visible');
    };

    accept.addEventListener('click',  () => dismiss('accepted'));
    decline.addEventListener('click', () => dismiss('declined'));
  };

  // --- Dynamic Canvas Lather & Lust Interactive Romantic Particle System ---
  const initCanvas = () => {


    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    let animationId = null;
    let particlesArray = [];
    let pendingParticles = []; // Buffer for particles spawned mid-frame (fixes reassignment bug)
    
    const setDimensions = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    setDimensions();
    window.addEventListener("resize", setDimensions);
    
    // Mouse & Touch Coordinates for hovering pop
    const mouse = {
      x: null,
      y: null,
      radius: 60
    };
    
    const updateCoordinates = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    };
    
    // Bind cursor actions specifically inside hero section
    const heroSection = document.getElementById("hero-section");
    heroSection.addEventListener("mousemove", (e) => {
      updateCoordinates(e.clientX, e.clientY);
    });
    
    heroSection.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });
    
    // Tactile Touch Support for 98% Mobile Traffic
    heroSection.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    
    heroSection.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    
    heroSection.addEventListener("touchend", () => {
      mouse.x = null;
      mouse.y = null;
    });
    
    heroSection.addEventListener("touchcancel", () => {
      mouse.x = null;
      mouse.y = null;
    });
    
    // Spark Particle (Explosive Rose-Gold Sparkle Shard when bubble pops)
    class Spark {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1; // 1px to 3px
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 3 + 1.5; // Explosive release velocity
        this.speedX = Math.cos(this.angle) * this.speed;
        this.speedY = Math.sin(this.angle) * this.speed;
        this.gravity = 0.06; // Mild downward gravity drag
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.015; // Elegant fadeout rate
        this.isDead = false;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity; // Gravity pull
        this.alpha -= this.decay;
        if (this.alpha <= 0) {
          this.alpha = 0;
          this.isDead = true;
        }
      }
      
      draw() {
        ctx.save();
        ctx.beginPath();
        // Create glowing radial glow for spark
        ctx.fillStyle = `hsla(38, 85%, 65%, ${this.alpha})`;
        ctx.shadowColor = `hsla(38, 85%, 65%, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Bubble Particle (Rising Lather)
    class Bubble {
      constructor() {
        this.reset();
        // Scatter initial bubbles vertically
        this.y = Math.random() * canvas.height;
      }
      
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.size = Math.random() * 15 + 5; // Radius
        this.speedY = Math.random() * 0.8 + 0.2; // Slowly rise
        this.speedX = Math.random() * 0.4 - 0.2; // Gentle horizontal drift
        this.color = `hsla(340, 65%, 68%, ${Math.random() * 0.22 + 0.08})`; // Deeper rose visible on light bg
        this.strokeColor = `hsla(340, 60%, 50%, ${Math.random() * 0.35 + 0.12})`; // Rich rose stroke
        this.isPopping = false;
        this.popFrame = 0;
      }
      
      update() {
        if (this.isPopping) {
          this.popFrame++;
          if (this.popFrame > 10) {
            this.reset();
          }
          return;
        }
        
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.02) * 0.15; // Fluid wobble
        
        // Wrap edges
        if (this.y < -this.size || this.x < -this.size || this.x > canvas.width + this.size) {
          this.reset();
        }
        
        // Mouse/Touch Hover Pop Collision Check
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.size + mouse.radius && Math.random() < 0.06) {
            // High-probability pop!
            this.isPopping = true;
            this.popFrame = 0;
            
            // Buffer sparks to pendingParticles to avoid losing them during filter() reassignment
            for (let i = 0; i < 8; i++) {
              pendingParticles.push(new Spark(this.x, this.y));
            }
          }
        }
      }
      
      draw() {
        ctx.beginPath();
        if (this.isPopping) {
          // Render dynamic expanding popping ripples (rose-tinted)
          ctx.strokeStyle = `rgba(212, 175, 55, ${1 - this.popFrame / 10})`;
          ctx.lineWidth = 1;
          ctx.arc(this.x, this.y, this.size + this.popFrame * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw mini bubble shards
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const shardX = this.x + Math.cos(angle) * (this.size + this.popFrame);
            const shardY = this.y + Math.sin(angle) * (this.size + this.popFrame);
            ctx.fillStyle = `rgba(212, 175, 55, ${0.8 - this.popFrame / 10})`;
            ctx.beginPath();
            ctx.arc(shardX, shardY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Render elegant gradient bubble
          const gradient = ctx.createRadialGradient(
            this.x - this.size * 0.3,
            this.y - this.size * 0.3,
            this.size * 0.1,
            this.x,
            this.y,
            this.size
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
          gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, this.color);
          
          ctx.fillStyle = gradient;
          ctx.strokeStyle = this.strokeColor;
          ctx.lineWidth = 0.5;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Highlight shine reflect
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Rose Petal Particle (Falling Romance)
    class Petal {
      constructor() {
        this.reset();
        // Scatter initial petals vertically
        this.y = Math.random() * canvas.height;
      }
      
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20 - Math.random() * 100;
        this.size = Math.random() * 8 + 4; // Radius
        this.speedY = Math.random() * 0.7 + 0.3; // Gentle downward speed
        this.speedX = Math.random() * 0.4 - 0.2; // Gentle horizontal sway
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.015 - 0.0075;
        this.color = `hsla(${Math.random() * 20 + 335}, 75%, ${Math.random() * 12 + 55}%, ${Math.random() * 0.35 + 0.2})`; // Deeper rose petals visible on light bg
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = Math.random() * 0.02 + 0.01;
      }
      
      update() {
        this.y += this.speedY;
        this.oscillation += this.oscillationSpeed;
        this.x += this.speedX + Math.sin(this.oscillation) * 0.3;
        this.rotation += this.rotationSpeed;
        
        // Reset if falls past bottom
        if (this.y > canvas.height + this.size || this.x < -this.size || this.x > canvas.width + this.size) {
          this.reset();
        }
      }
      
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Elegant 3D flip tumbling effect by scale oscillation
        this.scaleX = Math.cos(this.rotation);
        ctx.scale(this.scaleX, 1);
        
        // Petal Shape path (heart-like curve)
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = `hsla(340, 65%, 45%, 0.2)`; // Slightly more visible vein on light bg
        ctx.lineWidth = 0.5;
        
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size * 1.2, -this.size * 0.8, this.size * 0.8, this.size * 0.5);
        ctx.quadraticCurveTo(0, this.size * 1.1, -this.size * 0.8, this.size * 0.5);
        ctx.quadraticCurveTo(-this.size * 1.2, -this.size * 0.8, 0, -this.size);
        
        ctx.fill();
        ctx.stroke();
        
        // Central leaf vein
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.moveTo(0, -this.size * 0.8);
        ctx.lineTo(0, this.size * 0.5);
        ctx.stroke();
        
        ctx.restore();
      }
    }
    
    // Spawn initial particle list (50% bubbles, 50% rose petals) - throttled dynamically for mobile performance
    const isMobile = window.innerWidth <= 768;
    const spawnCount = isMobile ? 25 : 60;
    for (let i = 0; i < spawnCount; i++) {
      if (i % 2 === 0) {
        particlesArray.push(new Bubble());
      } else {
        particlesArray.push(new Petal());
      }
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update & draw all particles, filter out dead sparks
      particlesArray = particlesArray.filter(p => {
        p.update();
        p.draw();
        return !(p instanceof Spark && p.isDead);
      });
      
      // Merge any particles spawned mid-frame (e.g. sparks from bubble pops)
      // Must happen AFTER filter reassignment or newly pushed items get lost
      if (pendingParticles.length > 0) {
        particlesArray.push(...pendingParticles);
        pendingParticles = [];
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // App Setup Initializations
  initCart();
  renderPromises();
  renderProducts();
  initCountdown();
  initFAQ();
  initWhatsAppFAB();
  initMobileNav();
  initPromoCode();
  initPincodeChecker();
  initGiftWrap();
  initBackToTop();
  initCookieConsent();
  initCanvas();
  initOrderTracking();
});

// ============================================================
//  ORDER TRACKING MODAL
// ============================================================
function initOrderTracking() {
  const modal        = document.getElementById('track-order-modal');
  const navBtn       = document.getElementById('track-order-nav-btn');
  const mobileBtn    = document.getElementById('mobile-track-btn');
  const closeBtn     = document.getElementById('close-track-modal-btn');
  const searchBtn    = document.getElementById('track-search-btn');
  const inputEl      = document.getElementById('track-order-input');
  const errorEl      = document.getElementById('track-error');
  const searchPhase  = document.getElementById('track-search-phase');
  const resultPhase  = document.getElementById('track-result-phase');
  const backBtn      = document.getElementById('track-back-btn');
  const timelineEl   = document.getElementById('track-timeline');
  const summaryEl    = document.getElementById('track-order-summary');
  const resultIdEl   = document.getElementById('track-result-id');

  if (!modal) return;

  // Status pipeline — order of progression
  const STATUS_STEPS = [
    {
      key:  'Pending',
      icon: '📝',
      label: 'Order Placed',
      desc: 'Your order has been received and is awaiting confirmation from our team.'
    },
    {
      key:  'Confirmed',
      icon: '✅',
      label: 'Order Confirmed',
      desc: 'We have confirmed your order. Our artisans are preparing your bars.'
    },
    {
      key:  'Shipped',
      icon: '🚚',
      label: 'Out for Delivery',
      desc: 'Your package has been dispatched and is on its way to you!'
    },
    {
      key:  'Delivered',
      icon: '🎉',
      label: 'Delivered',
      desc: 'Your order has been delivered. Enjoy your Lather & Lust experience!'
    }
  ];

  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Reset to search phase
    showSearchPhase();
    setTimeout(() => inputEl && inputEl.focus(), 300);
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showSearchPhase() {
    searchPhase.style.display = 'block';
    resultPhase.style.display = 'none';
    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.value = '';
  }

  function showResultPhase() {
    searchPhase.style.display = 'none';
    resultPhase.style.display = 'block';
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem('ll_orders') || '[]'); }
    catch { return []; }
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  function searchOrder() {
    const query = (inputEl.value || '').trim().toUpperCase().replace(/\s/g, '');
    if (!query) {
      errorEl.textContent = 'Please enter your Order ID (e.g. LL-382910).';
      return;
    }

    const orders = getOrders();
    const order  = orders.find(o =>
      (o.orderId || '').toUpperCase().replace(/\s/g, '') === query ||
      (o.orderId || '').toUpperCase().replace(/\s/g, '') === query.replace('LL', 'LL-')
    );

    if (!order) {
      errorEl.textContent = '❌ Order not found. Please check your Order ID and try again.';
      return;
    }

    errorEl.textContent = '';
    renderResult(order);
    showResultPhase();
  }

  function renderResult(order) {
    // Header
    resultIdEl.innerHTML = `
      Order <span style="color:var(--accent-gold);font-style:italic;">#${order.orderId}</span>
      &nbsp;<span style="font-size:0.75rem;color:var(--text-secondary);font-family:var(--font-sans);font-weight:500;">${formatDateShort(order.timestamp)}</span>
    `;

    // ── Build timeline ──
    const currentStatus  = order.status || 'Pending';
    const isCancelled    = currentStatus === 'Cancelled';
    const currentIdx     = STATUS_STEPS.findIndex(s => s.key === currentStatus);

    let timelineHTML = '';
    if (isCancelled) {
      timelineHTML = `
        <div class="track-step">
          <div class="track-step-indicator">
            <div class="track-step-dot cancelled">❌</div>
          </div>
          <div class="track-step-content">
            <div class="track-step-label" style="color:hsl(0,65%,52%);">Order Cancelled</div>
            <div class="track-step-desc">This order has been cancelled. Please contact us on WhatsApp for more details.</div>
          </div>
        </div>`;
    } else {
      STATUS_STEPS.forEach((step, idx) => {
        const isDone    = idx < currentIdx || currentStatus === 'Delivered';
        const isActive  = idx === currentIdx && currentStatus !== 'Delivered';
        const isPending = idx > currentIdx;

        let dotClass  = isPending ? '' : isDone ? 'done' : isActive ? 'active' : '';
        let labelClass = isPending ? '' : isDone ? 'done' : isActive ? 'active' : '';
        let dotIcon   = isPending ? '○' : isDone ? '✓' : step.icon;
        let lineClass  = isDone ? 'done' : '';

        timelineHTML += `
          <div class="track-step">
            <div class="track-step-indicator">
              <div class="track-step-dot ${dotClass}">${dotIcon}</div>
              <div class="track-step-line ${lineClass}"></div>
            </div>
            <div class="track-step-content">
              <div class="track-step-label ${labelClass}">${step.label}</div>
              ${isActive || isDone ? `<div class="track-step-desc">${step.desc}</div>` : ''}
              ${isActive && order.timestamp ? `<div class="track-step-time">In Progress</div>` : ''}
              ${isDone && idx === 0 && order.timestamp ? `<div class="track-step-time">${formatDateShort(order.timestamp)}</div>` : ''}
            </div>
          </div>`;
      });
    }
    timelineEl.innerHTML = timelineHTML;

    // ── Build order summary ──
    const items   = order.items || [];
    const itemsHtml = items.map(i =>
      `<li>${i.quantity}× ${i.name} — ₹${i.price * i.quantity}</li>`
    ).join('');

    const waMsg = encodeURIComponent(
      `Hi Lather & Lust! I have a query about my order #${order.orderId}. Can you help me please? 🙏`
    );
    const waNumber = (() => {
      try { return (JSON.parse(localStorage.getItem('ll_admin_settings') || '{}')).whatsappNumber || '919876543210'; }
      catch { return '919876543210'; }
    })();

    summaryEl.innerHTML = `
      <div class="track-summary-title">📋 Order Summary</div>
      <div class="track-summary-row">
        <span class="track-summary-key">Customer</span>
        <span class="track-summary-val">${order.customerName || '—'}</span>
      </div>
      <div class="track-summary-row">
        <span class="track-summary-key">Delivery To</span>
        <span class="track-summary-val">${order.city || '—'}${order.pincode ? ' - ' + order.pincode : ''}</span>
      </div>
      <div class="track-summary-row">
        <span class="track-summary-key">Delivery Speed</span>
        <span class="track-summary-val">${order.deliverySpeed || 'Standard'}</span>
      </div>
      <div class="track-summary-row">
        <span class="track-summary-key">Items</span>
        <span class="track-summary-val">
          <ul class="track-items-list">${itemsHtml}</ul>
        </span>
      </div>
      <div class="track-summary-row" style="border-top:1px solid var(--bg-tertiary);margin-top:6px;padding-top:10px;">
        <span class="track-summary-key" style="font-weight:700;color:var(--text-primary);">Total Paid</span>
        <span class="track-summary-val track-summary-total">₹${order.grandTotal || 0}</span>
      </div>
      <a class="track-whatsapp-cta" href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" rel="noopener">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="white">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
        Contact Us on WhatsApp
      </a>`;
  }

  // Event bindings
  if (navBtn)    navBtn.addEventListener('click', openModal);
  if (mobileBtn) mobileBtn.addEventListener('click', e => { e.preventDefault(); openModal(); });
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (backBtn)   backBtn.addEventListener('click', showSearchPhase);
  if (searchBtn) searchBtn.addEventListener('click', searchOrder);
  if (inputEl) {
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') searchOrder(); });
    inputEl.addEventListener('input', () => { if (errorEl) errorEl.textContent = ''; });
  }
  // Close on overlay click
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  // Escape key handled by existing global handler in app.js
}

