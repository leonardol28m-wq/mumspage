/**
 * VELOW — main.js
 * Lógica de catálogo, producto, checkout y carrito compartido.
 */

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function showToast(msg, duration = 2400) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), duration);
}

// ═══════════════════════════════════════════════════════════════
// CART DRAWER (shared across pages)
// ═══════════════════════════════════════════════════════════════

function initCartDrawer() {
  const btnOpen    = document.getElementById("btn-cart");
  const btnClose   = document.getElementById("btn-close-cart");
  const overlay    = document.getElementById("cart-overlay");
  const drawer     = document.getElementById("cart-drawer");
  const btnKeep    = document.getElementById("btn-keep-shopping");

  function open() {
    drawer.classList.add("open");
    overlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (btnOpen)  btnOpen.addEventListener("click", open);
  if (btnClose) btnClose.addEventListener("click", close);
  if (overlay)  overlay.addEventListener("click", close);
  if (btnKeep)  btnKeep.addEventListener("click", close);

  renderCartDrawer();
  window.addEventListener("cart:updated", () => renderCartDrawer());
}

function renderCartDrawer() {
  const items    = Cart.getItems();
  const count    = Cart.getCount();
  const total    = Cart.getTotal();

  const badge    = document.getElementById("cart-badge");
  const emptyEl  = document.getElementById("cart-empty");
  const itemsEl  = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");
  const totalEl  = document.getElementById("cart-total-amount");

  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
    // Micro-animación: bump al actualizar
    badge.classList.remove("bump");
    void badge.offsetWidth; // reflow para re-triggerear
    if (count > 0) badge.classList.add("bump");
  }

  if (!emptyEl || !itemsEl || !footerEl) return;

  if (items.length === 0) {
    emptyEl.style.display  = "flex";
    itemsEl.style.display  = "none";
    footerEl.style.display = "none";
    return;
  }

  emptyEl.style.display  = "none";
  itemsEl.style.display  = "block";
  footerEl.style.display = "flex";

  if (totalEl) totalEl.textContent = formatPrice(total);

  itemsEl.innerHTML = items.map((item) => `
    <div class="cart-item">
      <div class="cart-item-swatch" style="background:${item.colorHex}"></div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.nombre}</p>
        <p class="cart-item-meta">${item.colorNombre} · Talle ${item.talle}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.productId}','${item.colorId}','${item.talle}',-1)" aria-label="Restar">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.productId}','${item.colorId}','${item.talle}',1)" aria-label="Sumar">+</button>
        </div>
        <button class="btn-remove" onclick="removeFromCart('${item.productId}','${item.colorId}','${item.talle}')">Eliminar</button>
      </div>
      <span class="cart-item-price">${formatPrice(item.precio * item.qty)}</span>
    </div>
  `).join("");
}

function changeQty(productId, colorId, talle, delta) {
  const items = Cart.getItems();
  const item  = items.find(i => i.productId === productId && i.colorId === colorId && i.talle === talle);
  if (item) Cart.setQty(productId, colorId, talle, item.qty + delta);
}

function removeFromCart(productId, colorId, talle) {
  Cart.remove(productId, colorId, talle);
}

// ═══════════════════════════════════════════════════════════════
// CATALOG PAGE (index.html)
// ═══════════════════════════════════════════════════════════════

function initCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  let activeFilter = "all";

  function getProducts() {
    return VELOW_PRODUCTS.filter(p => p.activo && (activeFilter === "all" || p.categoria === activeFilter));
  }

  function renderGrid() {
    const products = getProducts();
    if (products.length === 0) {
      grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;padding:40px 0">No hay productos en esta categoría por el momento.</p>`;
      return;
    }
    grid.innerHTML = products.map((p, i) => buildProductCard(p, i)).join("");
    // Attach click handlers
    grid.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", () => {
        window.location.href = `producto.html?id=${card.dataset.id}`;
      });
    });
  }

  function buildProductCard(p, index) {
    const hasAny   = hasAnyStock(p);
    const delay    = Math.min(index * 60, 400);
    const badgeHtml = p.nuevo
      ? `<span class="card-badge card-badge-nuevo">Nuevo</span>`
      : (!hasAny ? `<span class="card-badge card-badge-agotado">Sin stock</span>` : "");

    const dotsHtml = p.colores.slice(0, 5).map(c =>
      `<span class="color-dot" style="background:${c.hex}" title="${c.nombre}"></span>`
    ).join("");

    return `
      <article class="product-card" data-id="${p.id}" data-cat="${p.categoria}"
               style="animation-delay:${delay}ms" tabindex="0" role="button"
               aria-label="Ver ${p.nombre}">
        <div class="card-image-wrap">
          <div class="card-img-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
            <span>Foto próximamente</span>
          </div>
          ${badgeHtml}
          <div class="card-colors">${dotsHtml}</div>
        </div>
        <div class="card-info">
          <p class="card-category">${p.categoria}</p>
          <p class="card-name">${p.nombre}</p>
          <p class="card-price">${formatPrice(p.precio)}</p>
          <p class="card-consult">Consultá disponibilidad</p>
        </div>
      </article>`;
  }

  // Filters
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  });

  renderGrid();
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL PAGE (producto.html)
// ═══════════════════════════════════════════════════════════════

function initProductDetail() {
  if (!document.getElementById("product-detail-grid")) return;

  const params  = new URLSearchParams(window.location.search);
  const id      = params.get("id");
  const product = id ? getProductById(id) : null;

  if (!product) {
    document.title = "Producto no encontrado — Velow";
    document.getElementById("prod-title").textContent = "Producto no encontrado";
    document.getElementById("prod-price").textContent = "";
    return;
  }

  // Meta
  document.title = `${product.nombre} — Velow`;
  document.getElementById("breadcrumb-product").textContent = product.nombre;
  document.getElementById("prod-category").textContent = product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1);
  document.getElementById("prod-title").textContent    = product.nombre;
  document.getElementById("prod-price").textContent    = fo  colorOpts.querySelectorAll(".color-option").forEach(btn => {
    btn.addEventListener("click", () => {
      colorOpts.querySelectorAll(".color-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedColor = btn.dataset.color;
      document.getElementById("selected-color-name").textContent =
        product.colores.find(c => c.id === selectedColor)?.nombre || selectedColor;
      selectedTalle = null;
      renderSizes();
      updateAddButton();
      // ── Crossfade al imagen del color elegido ────────────────
      const colorObj = product.colores.find(c => c.id === selectedColor);
      if (colorObj?.imagenPrincipal) {
        gallerySetImageCinema(colorObj.imagenPrincipal);
      }
    });
  });

  // ── Size picker ───────────────────────────────────────────
  function renderSizes() {
    const sizeOpts = document.getElementById("size-options");
    const hint     = document.getElementById("stock-hint");

    sizeOpts.innerHTML = product.talles.map(t => {
      let cls    = "size-option";
      let title  = "";
      const qty  = selectedColor ? getStock(product, t, selectedColor) : null;

      if (qty === null) {
        cls   += " consult";
        title  = `Talle ${t} — consultar disponibilidad`;
      } else if (qty === 0) {
        cls   += " no-stock";
        title  = `Talle ${t} — sin stock`;
      } else {
        title  = `Talle ${t} — ${qty} disponible${qty > 1 ? "s" : ""}`;
      }

      return `<button class="size-option ${cls.replace("size-option ","")}"
                       data-talle="${t}" data-qty="${qty}"
                       title="${title}"
                       ${qty === 0 ? "disabled" : ""}>
                ${t}
              </button>`;
    }).join("");

    // Re-attach size listeners
    sizeOpts.querySelectorAll(".size-option:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => {
        sizeOpts.querySelectorAll(".size-option").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedTalle = btn.dataset.talle;
        const qty = parseInt(btn.dataset.qty);
        if (isNaN(qty) || qty === null) {
          hint.textContent = "Disponibilidad a confirmar";
        } else {
          hint.textContent = `${qty} unidad${qty !== 1 ? "es" : ""} disponible${qty !== 1 ? "s" : ""}`;
        }
        updateAddButton();
      });
    });

    if (!selectedColor) {
      hint.textContent = "Seleccioná un color para ver disponibilidad por talle";
    }
  }

  renderSizes();

  // ── Add to cart button ────────────────────────────────────
  function updateAddButton() {
    const btn      = document.getElementById("btn-add-cart");
    const feedback = document.getElementById("add-feedback");
    feedback.className = "add-feedback";

    if (!selectedColor && !selectedTalle) {
      btn.textContent = "Seleccioná color y talle";
      btn.disabled = true;
    } else if (!selectedColor) {
      btn.textContent = "Seleccioná un color";
      btn.disabled = true;
    } else if (!selectedTalle) {
      btn.textContent = "Seleccioná un talle";
      btn.disabled = true;
    } else {
      btn.textContent = "Agregar al carrito";
      btn.disabled = false;
    }
  }

  const addBtn = document.getElementById("btn-add-cart");
  addBtn.addEventListener("click", () => {
    if (!selectedColor || !selectedTalle) return;
    const result = Cart.add(product, selectedColor, selectedTalle);
    const feedback = document.getElementById("add-feedback");

    if (result.ok) {
      feedback.textContent = "✓ Agregado al carrito";
      feedback.className = "add-feedback success";
      showToast("✓ Agregado al carrito");
    } else {
      feedback.textContent = result.msg;
      feedback.className = "add-feedback error";
    }

    setTimeout(() => { feedback.className = "add-feedback"; }, 3000);
  });

  // ══════════════════════════════════════════════════════════
  // GALERÍA CINEMÁTICA — ciclo de imágenes en hover
  // ══════════════════════════════════════════════════════════

  const galleryMain = document.getElementById("gallery-main");

  // Recolectamos TODAS las imágenes del producto (todas las imágenes de todos los colores)
  const allImages = [];
  product.colores.forEach(c => {
    if (c.imagenPrincipal) allImages.push(c.imagenPrincipal);
    if (c.imagenes && Array.isArray(c.imagenes)) {
      c.imagenes.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
    }
  });

  // Precarga de imágenes para que el ciclo sea instantáneo
  allImages.forEach(src => { const img = new Image(); img.src = src; });

  // Crea el elemento de crossfade y la barra de progreso
  const crossImg = document.createElement("img");
  crossImg.className = "img-crossfade";
  crossImg.alt = "";
  const progressBar = document.createElement("div");
  progressBar.className = "gallery-cinema-bar";
  if (galleryMain) {
    galleryMain.appendChild(crossImg);
    galleryMain.appendChild(progressBar);
  }

  let cinemaTimer    = null;
  let progressTimer  = null;
  let cinemaIdx      = 0;
  const CYCLE_DELAY  = 1600; // ms entre imágenes
  const FADE_SPEED   = 600;  // ms del crossfade

  // Cambia la imagen con efecto crossfade cinematográfico
  function gallerySetImageCinema(src) {
    if (!galleryMain) return;
    const mainImg = galleryMain.querySelector("img:not(.img-crossfade)");
    if (!mainImg) return;

    // Coloca la nueva imagen en la capa de crossfade
    crossImg.src = src;
    crossImg.classList.add("visible");

    // Cuando termina el fade, la imagen cruzada se convierte en principal
    setTimeout(() => {
      mainImg.src = src;
      crossImg.classList.remove("visible");
    }, FADE_SPEED);
  }

  // Anima la barra de progreso
  function animateProgressBar(duration) {
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    // Forzar reflow
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = "100%";
  }

  // Ciclo continuo de imágenes
  function startCinemaCycle() {
    if (allImages.length < 2) return;
    cinemaIdx = 0;

    const cycle = () => {
      cinemaIdx = (cinemaIdx + 1) % allImages.length;
      gallerySetImageCinema(allImages[cinemaIdx]);
      animateProgressBar(CYCLE_DELAY);
    };

    animateProgressBar(CYCLE_DELAY);
    cinemaTimer = setInterval(cycle, CYCLE_DELAY);
  }

  function stopCinemaCycle() {
    clearInterval(cinemaTimer);
    clearTimeout(progressTimer);
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    cinemaTimer = null;
  }

  // Touch: ciclo también en mobile pero por tap
  if (galleryMain && allImages.length >= 2) {
    // Hover (desktop)
    galleryMain.addEventListener("mouseenter", startCinemaCycle);
    galleryMain.addEventListener("mouseleave", stopCinemaCycle);

    // Touch (mobile): tap para ir a la siguiente imagen
    let touchIdx = 0;
    galleryMain.addEventListener("touchend", (e) => {
      e.preventDefault();
      touchIdx = (touchIdx + 1) % allImages.length;
      gallerySetImageCinema(allImages[touchIdx]);
    }, { passive: false });
  }
}
��─────
  function updateAddButton() {
    const btn      = document.getElementById("btn-add-cart");
    const feedback = document.getElementById("add-feedback");
    feedback.className = "add-feedback";

    if (!selectedColor && !selectedTalle) {
      btn.textContent = "Seleccioná color y talle";
      btn.disabled = true;
    } else if (!selectedColor) {
      btn.textContent = "Seleccioná un color";
      btn.disabled = true;
    } else if (!selectedTalle) {
      btn.textContent = "Seleccioná un talle";
      btn.disabled = true;
    } else {
      btn.textContent = "Agregar al carrito";
      btn.disabled = false;
    }
  }

  const addBtn = document.getElementById("btn-add-cart");
  addBtn.addEventListener("click", () => {
    if (!selectedColor || !selectedTalle) return;
    const result = Cart.add(product, selectedColor, selectedTalle);
    const feedback = document.getElementById("add-feedback");

    if (result.ok) {
      feedback.textContent = "✓ Agregado al carrito";
      feedback.className = "add-feedback success";
      showToast("✓ Agregado al carrito");
    } else {
      feedback.textContent = result.msg;
      feedback.className = "add-feedback error";
    }

    setTimeout(() => { feedback.className = "add-feedback"; }, 3000);
  });
}

// ═══════════════════════════════════════════════════════════════
// CHECKOUT PAGE (checkout.html)
// ═══════════════════════════════════════════════════════════════

function initCheckout() {
  const grid = document.getElementById("checkout-grid");
  if (!grid) return;

  const items = Cart.getItems();

  if (items.length === 0) {
    document.getElementById("empty-cart-notice").style.display = "block";
    grid.style.display = "none";
    return;
  }

  // Render order summary
  const orderItemsEl = document.getElementById("order-items");
  const orderTotalEl = document.getElementById("order-total");

  orderItemsEl.innerHTML = items.map(item => `
    <div class="order-item">
      <div class="order-item-left">
        <p class="order-item-name">${item.nombre}</p>
        <p class="order-item-meta">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.colorHex};margin-right:5px;vertical-align:middle;border:1px solid var(--border)"></span>
          ${item.colorNombre} · Talle ${item.talle} · x${item.qty}
        </p>
      </div>
      <span class="order-item-price">${formatPrice(item.precio * item.qty)}</span>
    </div>
  `).join("");

  orderTotalEl.textContent = formatPrice(Cart.getTotal());

  // Render bank transfer data
  const transferBox = document.getElementById("transfer-box");
  const banco = VELOW_CONFIG.banco;

  const hasData = banco.cbu || banco.alias || banco.titular;

  if (hasData) {
    transferBox.innerHTML = [
      banco.titular ? `
        <div class="transfer-field">
          <span class="transfer-label">Titular</span>
          <span class="transfer-value">${banco.titular}</span>
        </div>` : "",
      banco.banco ? `
        <div class="transfer-field">
          <span class="transfer-label">Banco</span>
          <span class="transfer-value">${banco.banco}</span>
        </div>` : "",
      banco.cbu ? `
        <div class="transfer-field">
          <span class="transfer-label">CBU / CVU</span>
          <span class="transfer-value" style="font-size:13px;letter-spacing:.05em">${banco.cbu}</span>
        </div>` : "",
      banco.alias ? `
        <div class="transfer-field">
          <span class="transfer-label">Alias</span>
          <span class="transfer-value">${banco.alias}</span>
        </div>` : "",
      `<div class="transfer-field" style="background:var(--surface);border-radius:var(--radius);padding:12px;margin-top:4px">
         <span class="transfer-label">Monto a transferir</span>
         <span class="transfer-value" style="color:var(--text);font-size:18px">${formatPrice(Cart.getTotal())}</span>
       </div>`,
    ].join("");
  } else {
    transferBox.innerHTML = `<p class="transfer-pending">
      Los datos bancarios estarán disponibles próximamente.<br>
      Podés coordinar el pago directamente por WhatsApp.
    </p>`;
  }

  // Confirm order → WhatsApp
  document.getElementById("btn-confirm").addEventListener("click", () => {
    const nombre  = document.getElementById("c-nombre")?.value.trim();
    const tel     = document.getElementById("c-tel")?.value.trim();
    const email   = document.getElementById("c-email")?.value.trim();
    const dir     = document.getElementById("c-dir")?.value.trim();
    const ciudad  = document.getElementById("c-ciudad")?.value.trim();
    const prov    = document.getElementById("c-prov")?.value.trim();

    if (!nombre || !tel) {
      alert("Por favor completá tu nombre y teléfono.");
      return;
    }

    const msg = Cart.buildWhatsAppMessage({ nombre, tel, email, dir, ciudad, prov });
    window.open(`https://wa.me/${VELOW_CONFIG.whatsapp}?text=${msg}`, "_blank", "noopener");
  });
}

// ═══════════════════════════════════════════════════════════════
// STICKY HEADER
// ═══════════════════════════════════════════════════════════════

function initStickyHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
}

// ═══════════════════════════════════════════════════════════════
// HAMBURGER MENU (mobile nav) — compartido entre páginas
// ═══════════════════════════════════════════════════════════════

function initHamburger() {
  const btnHamburger      = document.getElementById("btn-hamburger");
  const btnCloseMobileNav = document.getElementById("btn-close-mobile-nav");
  const mobileNav         = document.getElementById("mobile-nav");
  const mobileNavOverlay  = document.getElementById("mobile-nav-overlay");
  if (!btnHamburger || !mobileNav) return;

  function openMobileNav() {
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    mobileNavOverlay.classList.add("open");
    btnHamburger.classList.add("open");
    btnHamburger.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function closeMobileNav() {
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    mobileNavOverlay.classList.remove("open");
    btnHamburger.classList.remove("open");
    btnHamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }

  btnHamburger.addEventListener("click", () => {
    mobileNav.classList.contains("open") ? closeMobileNav() : openMobileNav();
  });
  if (btnCloseMobileNav) btnCloseMobileNav.addEventListener("click", closeMobileNav);
  if (mobileNavOverlay)  mobileNavOverlay.addEventListener("click", closeMobileNav);

  // Cerrar al tocar cualquier link del nav mobile
  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", closeMobileNav);
  });
}

// ═══════════════════════════════════════════════════════════════
// STICKY ADD-TO-CART BAR (producto.html — solo mobile)
// ═══════════════════════════════════════════════════════════════

function initStickyAddBar() {
  const bar     = document.getElementById("sticky-add-bar");
  const barName = document.getElementById("sticky-bar-name");
  const barPrice= document.getElementById("sticky-bar-price");
  const barBtn  = document.getElementById("sticky-bar-btn");
  if (!bar || !barBtn) return;

  // Sincroniza el botón sticky con el estado actual del selector
  function syncStickyBar() {
    const mainBtn  = document.getElementById("btn-add-cart");
    const prodTitle= document.getElementById("prod-title");
    const prodPrice= document.getElementById("prod-price");

    if (barName && prodTitle) barName.textContent = prodTitle.textContent;
    if (barPrice && prodPrice) barPrice.textContent = prodPrice.textContent;

    if (mainBtn) {
      barBtn.disabled = mainBtn.disabled;
      barBtn.textContent = mainBtn.disabled ? "Elegí color y talle" : "Agregar al carrito";
    }
  }

  // Observamos cambios en el botón principal para reflejarlos en la sticky bar
  const mainBtn = document.getElementById("btn-add-cart");
  if (mainBtn) {
    const observer = new MutationObserver(syncStickyBar);
    observer.observe(mainBtn, { attributes: true, childList: true, characterData: true });
  }

  // El botón sticky ejecuta la misma acción que el principal
  barBtn.addEventListener("click", () => {
    const mainBtn = document.getElementById("btn-add-cart");
    if (mainBtn && !mainBtn.disabled) {
      mainBtn.click();
    }
  });

  // Observar cambios de texto en título y precio
  ["prod-title","prod-price"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const obs = new MutationObserver(syncStickyBar);
      obs.observe(el, { childList: true, characterData: true, subtree: true });
    }
  });

  syncStickyBar();
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  initStickyHeader();
  initHamburger();
  initCartDrawer();
  initCatalog();
  initProductDetail();
  initCheckout();
  initStickyAddBar();
});

