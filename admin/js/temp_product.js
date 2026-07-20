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

  // ── Color picker ──────────────────────────────────────────
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
