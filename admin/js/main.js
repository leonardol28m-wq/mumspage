// ────────────────────────────────────────────────────────────
// UTILS  (formatPrice viene de products.js)
// ────────────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ────────────────────────────────────────────────────────────
// STICKY HEADER
// ────────────────────────────────────────────────────────────

function initStickyHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
}

// ────────────────────────────────────────────────────────────
// HAMBURGER MENU
// ────────────────────────────────────────────────────────────

function initHamburger() {
  const btnHamburger      = document.getElementById("btn-hamburger");
  const btnCloseMobileNav = document.getElementById("btn-close-mobile-nav");
  const mobileNav         = document.getElementById("mobile-nav");
  const mobileNavOverlay  = document.getElementById("mobile-nav-overlay");
  if (!btnHamburger || !mobileNav) return;

  function openMobileNav() {
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    if (mobileNavOverlay) {
      mobileNavOverlay.classList.add("open");
      mobileNavOverlay.setAttribute("aria-hidden", "false");
    }
    btnHamburger.classList.add("open");
    btnHamburger.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function closeMobileNav() {
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    if (mobileNavOverlay) {
      mobileNavOverlay.classList.remove("open");
      mobileNavOverlay.setAttribute("aria-hidden", "true");
    }
    btnHamburger.classList.remove("open");
    btnHamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }

  btnHamburger.addEventListener("click", openMobileNav);
  if (btnCloseMobileNav) btnCloseMobileNav.addEventListener("click", closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener("click", closeMobileNav);

  // Cerrar al hacer click en un link interno del menú
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

// ────────────────────────────────────────────────────────────
// CART DRAWER
// ────────────────────────────────────────────────────────────

function initCartDrawer() {
  const cartIcon    = document.getElementById("btn-cart");
  const cartDrawer  = document.getElementById("cart-drawer");
  const cartClose   = document.getElementById("btn-close-cart");
  const cartOverlay = document.getElementById("cart-overlay");

  if (!cartIcon || !cartDrawer) return;

  function openCart() {
    cartDrawer.classList.add("open");
    if (cartOverlay) cartOverlay.classList.add("open");
    document.body.classList.add("no-scroll");
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    if (cartOverlay) cartOverlay.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });

  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  // Actualizar badge del carrito
  function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = Cart.getCount();
    badge.textContent = count > 0 ? count : "";
    badge.style.display = count > 0 ? "flex" : "none";
  }

  // Actualizar items del cart drawer
  function renderCartItems() {
    const itemsEl  = document.getElementById("cart-items");
    const footerEl = document.getElementById("cart-footer");
    const emptyEl  = document.getElementById("cart-empty");
    const totalEl  = document.getElementById("cart-total-amount");
    const items    = Cart.getItems();

    if (items.length === 0) {
      if (emptyEl)  emptyEl.style.display  = "block";
      if (itemsEl)  itemsEl.style.display  = "none";
      if (footerEl) footerEl.style.display = "none";
      return;
    }

    if (emptyEl)  emptyEl.style.display  = "none";
    if (itemsEl)  itemsEl.style.display  = "block";
    if (footerEl) footerEl.style.display = "block";

    if (itemsEl) {
      itemsEl.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-name">${item.nombre}</p>
            <p class="cart-item-meta">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.colorHex};margin-right:4px;vertical-align:middle;border:1px solid #ccc"></span>
              ${item.colorNombre} &middot; Talle ${item.talle}
            </p>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${formatPrice(item.precio * item.qty)}</span>
            <button class="btn-remove-cart" data-id="${item.productId}" data-color="${item.colorId}" data-talle="${item.talle}" aria-label="Eliminar">&times;</button>
          </div>
        </div>
      `).join("");

      itemsEl.querySelectorAll(".btn-remove-cart").forEach(btn => {
        btn.addEventListener("click", () => {
          Cart.remove(btn.dataset.id, btn.dataset.color, btn.dataset.talle);
        });
      });
    }

    if (totalEl) totalEl.textContent = formatPrice(Cart.getTotal());
  }

  window.addEventListener("cart:updated", () => {
    updateCartBadge();
    renderCartItems();
  });

  // Botón "Ver productos" en carrito vacío
  const keepShoppingBtn = document.getElementById("btn-keep-shopping");
  if (keepShoppingBtn) keepShoppingBtn.addEventListener("click", closeCart);

  // Inicializar badge y items
  updateCartBadge();
  renderCartItems();
}

// ────────────────────────────────────────────────────────────
// CATALOG (index.html)
// ────────────────────────────────────────────────────────────

function initCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  let activeFilter = "all";

  function renderGrid() {
    let html = "";
    VELOW_PRODUCTS.forEach(p => {
      if (activeFilter !== "all" && p.categoria !== activeFilter) return;

      const imgSrc = p.colores[0]?.imagenPrincipal || "";
      const hoverSwatches = p.colores.map(c => 
        `<span class="color-swatch-sm" style="background:${c.hex}" title="${c.nombre}"></span>`
      ).join("");

      html += `
        <a href="producto.html?id=${p.id}" class="product-card group">
          <div class="product-img-wrapper">
            <img src="${imgSrc}" alt="${p.nombre}" class="product-img" loading="lazy">
            <div class="product-colors-hover">
              ${hoverSwatches}
            </div>
          </div>
          <div class="product-info-card">
            <h3 class="product-title">${p.nombre}</h3>
            <p class="product-price">${formatPrice(p.precio)}</p>
          </div>
        </a>
      `;
    });
    grid.innerHTML = html;
  }

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

function initStickyAddBar() {
  const bar = document.getElementById("sticky-add-bar");
  const trigger = document.getElementById("product-info");
  if (!bar || !trigger) return;
  
  const observer = new IntersectionObserver(entries => {
    if (entries[0].boundingClientRect.top < 0 && !entries[0].isIntersecting) {
      bar.classList.add("visible");
    } else {
      bar.classList.remove("visible");
    }
  });
  observer.observe(trigger);
}

// ────────────────────────────────────────────────────────────
// PRODUCT DETAIL PAGE (producto.html)
// ────────────────────────────────────────────────────────────

function initProductDetail() {
  if (!document.getElementById("product-detail-grid")) return;

  const params  = new URLSearchParams(window.location.search);
  const id      = params.get("id");
  const product = id ? getProductById(id) : null;

  if (!product) {
    document.title = "Producto no encontrado - Velow";
    document.getElementById("prod-title").textContent = "Producto no encontrado";
    document.getElementById("prod-price").textContent = "";
    return;
  }

  // Meta
  document.title = `${product.nombre} - Velow`;
  document.getElementById("breadcrumb-product").textContent = product.nombre;
  document.getElementById("prod-category").textContent = product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1);
  document.getElementById("prod-title").textContent    = product.nombre;
  document.getElementById("prod-price").textContent    = formatPrice(product.precio);
  document.getElementById("prod-desc").textContent     = product.descripcion;

  // Details list
  const detailsList = document.getElementById("prod-details");
  if (product.detalles && product.detalles.length) {
    detailsList.innerHTML = product.detalles.map(d => `<li>${d}</li>`).join("");
  }

  // WhatsApp consult
  const wspBtn = document.getElementById("btn-wsp-product");
  if (wspBtn) {
    const msg = encodeURIComponent(`Hola Velow! Me interesa el *${product.nombre}*. ¿Me podés dar más info?`);
    wspBtn.href = `https://wa.me/${VELOW_CONFIG.whatsapp}?text=${msg}`;
  }

  let selectedColor = null;
  let selectedTalle = null;

  // Color picker
  const colorOpts = document.getElementById("color-options");
  colorOpts.innerHTML = product.colores.map(c => `
    <button class="color-option" data-color="${c.id}" title="${c.nombre}"
            style="background:${c.hex}" aria-label="Color ${c.nombre}">
    </button>
  `).join("");

  colorOpts.querySelectorAll(".color-option").forEach(btn => {
    btn.addEventListener("click", () => {
      colorOpts.querySelectorAll(".color-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedColor = btn.dataset.color;
      document.getElementById("selected-color-name").textContent =
        product.colores.find(c => c.id === selectedColor)?.nombre || selectedColor;
      selectedTalle = null;
      renderSizes();
      updateAddButton();
      
      const colorObj = product.colores.find(c => c.id === selectedColor);
      if (colorObj) {
        renderGallery(colorObj);
      }
    });
  });

  // Size picker
  function renderSizes() {
    const sizeOpts = document.getElementById("size-options");
    const hint     = document.getElementById("stock-hint");

    sizeOpts.innerHTML = product.talles.map(t => {
      let cls    = "size-option";
      let title  = "";
      const qty  = selectedColor ? getStock(product, t, selectedColor) : null;

      if (qty === null) {
        cls   += " consult";
        title  = `Talle ${t} - consultar disponibilidad`;
      } else if (qty === 0) {
        cls   += " no-stock";
        title  = `Talle ${t} - sin stock`;
      } else {
        title  = `Talle ${t} - ${qty} disponible${qty > 1 ? "s" : ""}`;
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

  // Add to cart button
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

  // GALERIA CINEMATICA & THUMBNAILS
  const galleryMain = document.getElementById("gallery-main");
  const galleryThumbs = document.getElementById("gallery-thumbs");
  
  let currentImages = [];
  let currentImgIdx = 0;

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

  const FADE_SPEED = 600;

  function gallerySetImageCinema(src) {
    if (!galleryMain) return;
    const mainImg = galleryMain.querySelector("img:not(.img-crossfade)");
    if (!mainImg) return;
    
    if (mainImg.src.endsWith(src)) return;

    crossImg.src = src;
    crossImg.classList.add("visible");
    setTimeout(() => {
      mainImg.src = src;
      crossImg.classList.remove("visible");
    }, FADE_SPEED);
  }

  function renderGallery(colorObj) {
    if (!colorObj) return;
    const imgs = colorObj.imagenes && colorObj.imagenes.length ? colorObj.imagenes : [colorObj.imagenPrincipal].filter(Boolean);
    if (imgs.length === 0) return;
    
    currentImages = imgs;
    currentImgIdx = 0;

    if (galleryMain) {
      const mainImg = galleryMain.querySelector("img:not(.img-crossfade)");
      if (mainImg) {
        gallerySetImageCinema(imgs[0]);
      } else {
        // Initial setup
        galleryMain.innerHTML = `<img src="${imgs[0]}" alt="${product.nombre}">`;
        galleryMain.appendChild(crossImg);
        galleryMain.appendChild(progressBar);
      }
    }

    if (galleryThumbs) {
      galleryThumbs.innerHTML = imgs.map((src, i) => `
        <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
          <img src="${src}" alt="Vista ${i+1}">
        </button>
      `).join("");

      galleryThumbs.querySelectorAll(".gallery-thumb").forEach(btn => {
        btn.addEventListener("click", () => {
          galleryThumbs.querySelectorAll(".gallery-thumb").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const idx = parseInt(btn.dataset.idx, 10);
          currentImgIdx = idx;
          gallerySetImageCinema(currentImages[idx]);
        });
      });
    }

    // Click en la imagen principal abre el lightbox
    if (galleryMain && window._openLightbox) {
      const existingHandler = galleryMain._lbHandler;
      if (existingHandler) galleryMain.removeEventListener("click", existingHandler);

      galleryMain._lbHandler = (e) => {
        const clickedImg = e.target.closest("img:not(.img-crossfade)");
        if (clickedImg) {
          window._openLightbox(currentImages, currentImgIdx);
        }
      };
      galleryMain.addEventListener("click", galleryMain._lbHandler);
    }
  }

  // Touch swipe logic for currentImages
  if (galleryMain) {
    let touchStartX = 0;
    let touchEndX = 0;

    galleryMain.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    galleryMain.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, {passive: true});

    function handleSwipe() {
      if (currentImages.length < 2) return;
      const swipeThreshold = 40; // px
      if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left (next)
        currentImgIdx = (currentImgIdx + 1) % currentImages.length;
        updateGalleryToCurrentIdx();
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right (prev)
        currentImgIdx = (currentImgIdx - 1 + currentImages.length) % currentImages.length;
        updateGalleryToCurrentIdx();
      }
    }

    function updateGalleryToCurrentIdx() {
      gallerySetImageCinema(currentImages[currentImgIdx]);
      if (galleryThumbs) {
        galleryThumbs.querySelectorAll(".gallery-thumb").forEach(b => b.classList.remove("active"));
        const activeThumb = galleryThumbs.querySelector(`.gallery-thumb[data-idx="${currentImgIdx}"]`);
        if (activeThumb) activeThumb.classList.add("active");
      }
    }
  }

  // Initial gallery setup on page load
  if (product.colores && product.colores.length > 0) {
    renderGallery(product.colores[0]);
  }
}

// ────────────────────────────────────────────────────────────
// CHECKOUT PAGE (checkout.html)
// ────────────────────────────────────────────────────────────

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
          ${item.colorNombre} | Talle ${item.talle} | x${item.qty}
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
      banco.cbu ? `
        <div class="transfer-field">
          <span class="transfer-label">CBU/CVU</span>
          <span class="transfer-value">${banco.cbu}</span>
        </div>` : "",
      banco.alias ? `
        <div class="transfer-field">
          <span class="transfer-label">Alias</span>
          <span class="transfer-value">${banco.alias}</span>
        </div>` : ""
    ].join("");
  } else {
    transferBox.innerHTML = `<p style="font-size:0.9rem;color:var(--text-light);">Datos bancarios no configurados. Contactate por WhatsApp para coordinar el pago.</p>`;
  }

  // WSP Button
  const btnFinish = document.getElementById("btn-finish-wsp");
  btnFinish.addEventListener("click", () => {
    let msg = `Hola Velow! Quiero confirmar mi pedido:\n\n`;
    items.forEach(i => {
      msg += `- ${i.nombre} (${i.colorNombre}, Talle ${i.talle}) x${i.qty} - ${formatPrice(i.precio * i.qty)}\n`;
    });
    msg += `\n*Total: ${formatPrice(Cart.getTotal())}*`;
    
    // Add WhatsApp API redirect
    window.location.href = `https://wa.me/${VELOW_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  });
}

// ────────────────────────────────────────────────────────────
// BOOT
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// LIGHTBOX FULLSCREEN
// ────────────────────────────────────────────────────────────

function initLightbox() {
  const lightbox     = document.getElementById("lightbox");
  const lbImg        = document.getElementById("lightbox-img");
  const lbClose      = document.getElementById("lightbox-close");
  const lbPrev       = document.getElementById("lightbox-prev");
  const lbNext       = document.getElementById("lightbox-next");
  const lbDots       = document.getElementById("lightbox-dots");
  const lbImgWrap    = document.getElementById("lightbox-img-wrap");

  if (!lightbox || !lbImg) return;

  let lbImages = [];
  let lbIdx    = 0;

  function openLightbox(images, startIdx) {
    lbImages = images;
    lbIdx    = startIdx;
    renderLightbox();
    lightbox.classList.add("open");
    document.body.classList.add("no-scroll");
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  function renderLightbox() {
    lbImg.style.opacity = "0";
    lbImg.src = lbImages[lbIdx];
    lbImg.onload = () => { lbImg.style.opacity = "1"; };

    // Dots
    if (lbDots) {
      lbDots.innerHTML = lbImages.map((_, i) =>
        `<button class="lightbox-dot${i === lbIdx ? " active" : ""}" data-i="${i}" aria-label="Imagen ${i+1}"></button>`
      ).join("");
      lbDots.querySelectorAll(".lightbox-dot").forEach(btn => {
        btn.addEventListener("click", () => {
          lbIdx = parseInt(btn.dataset.i, 10);
          renderLightbox();
        });
      });
    }

    // Flechas
    if (lbPrev) lbPrev.disabled = lbImages.length <= 1;
    if (lbNext) lbNext.disabled = lbImages.length <= 1;
  }

  function goNext() {
    if (lbImages.length <= 1) return;
    lbIdx = (lbIdx + 1) % lbImages.length;
    renderLightbox();
  }

  function goPrev() {
    if (lbImages.length <= 1) return;
    lbIdx = (lbIdx - 1 + lbImages.length) % lbImages.length;
    renderLightbox();
  }

  // Botones
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbNext)  lbNext.addEventListener("click", goNext);
  if (lbPrev)  lbPrev.addEventListener("click", goPrev);

  // Click en el fondo oscuro (fuera de la imagen) cierra
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox || e.target === lbImgWrap) closeLightbox();
  });

  // Teclado
  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape")     closeLightbox();
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft")  goPrev();
  });

  // Swipe táctil
  let swipeStartX = 0;
  lightbox.addEventListener("touchstart", e => {
    swipeStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].screenX - swipeStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goNext(); else goPrev();
    }
  }, { passive: true });

  // Exponer función para que renderGallery pueda conectar el click
  window._openLightbox = openLightbox;
}

document.addEventListener("DOMContentLoaded", () => {
  initStickyHeader();
  initHamburger();
  initCartDrawer();
  initCatalog();
  initLightbox();
  initProductDetail();
  initCheckout();
  initStickyAddBar();
});
