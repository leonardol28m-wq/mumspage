const fs = require('fs');
const path = 'c:/Users/Admin/Documents/antigravity/pagina mum/velow/js/main.js';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('function initProductDetail() {');
const endIdx = content.indexOf('function initCheckout() {');

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx);
    
    const newInitProductDetail = `function initProductDetail() {
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
  document.title = \`\${product.nombre} - Velow\`;
  document.getElementById("breadcrumb-product").textContent = product.nombre;
  document.getElementById("prod-category").textContent = product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1);
  document.getElementById("prod-title").textContent    = product.nombre;
  document.getElementById("prod-price").textContent    = formatPrice(product.precio);
  document.getElementById("prod-desc").textContent     = product.descripcion;

  // Details list
  const detailsList = document.getElementById("prod-details");
  if (product.detalles && product.detalles.length) {
    detailsList.innerHTML = product.detalles.map(d => \`<li>\${d}</li>\`).join("");
  }

  // WhatsApp consult
  const wspBtn = document.getElementById("btn-wsp-product");
  if (wspBtn) {
    const msg = encodeURIComponent(\`Hola Velow! Me interesa el *\${product.nombre}*. ¿Me podés dar más info?\`);
    wspBtn.href = \`https://wa.me/\${VELOW_CONFIG.whatsapp}?text=\${msg}\`;
  }

  let selectedColor = null;
  let selectedTalle = null;

  // Color picker
  const colorOpts = document.getElementById("color-options");
  colorOpts.innerHTML = product.colores.map(c => \`
    <button class="color-option" data-color="\${c.id}" title="\${c.nombre}"
            style="background:\${c.hex}" aria-label="Color \${c.nombre}">
    </button>
  \`).join("");

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
        title  = \`Talle \${t} - consultar disponibilidad\`;
      } else if (qty === 0) {
        cls   += " no-stock";
        title  = \`Talle \${t} - sin stock\`;
      } else {
        title  = \`Talle \${t} - \${qty} disponible\${qty > 1 ? "s" : ""}\`;
      }

      return \`<button class="size-option \${cls.replace("size-option ","")}"
                       data-talle="\${t}" data-qty="\${qty}"
                       title="\${title}"
                       \${qty === 0 ? "disabled" : ""}>
                \${t}
              </button>\`;
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
          hint.textContent = \`\${qty} unidad\${qty !== 1 ? "es" : ""} disponible\${qty !== 1 ? "s" : ""}\`;
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
        galleryMain.innerHTML = \`<img src="\${imgs[0]}" alt="\${product.nombre}">\`;
        galleryMain.appendChild(crossImg);
        galleryMain.appendChild(progressBar);
      }
    }

    if (galleryThumbs) {
      galleryThumbs.innerHTML = imgs.map((src, i) => \`
        <button class="gallery-thumb \${i === 0 ? 'active' : ''}" data-idx="\${i}">
          <img src="\${src}" alt="Vista \${i+1}">
        </button>
      \`).join("");

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
        const activeThumb = galleryThumbs.querySelector(\`.gallery-thumb[data-idx="\${currentImgIdx}"]\`);
        if (activeThumb) activeThumb.classList.add("active");
      }
    }
  }

  // Initial gallery setup on page load
  if (product.colores && product.colores.length > 0) {
    renderGallery(product.colores[0]);
  }
}
// 
// 
`;

    const finalContent = before + newInitProductDetail + "\n// \n// CHECKOUT PAGE (checkout.html)\n// \n" + after.replace(/\/\/.*CHECKOUT PAGE.*(\r?\n)*\/\/(\r?\n)*/g, '');
    
    fs.writeFileSync(path, finalContent, 'utf8');
    console.log('Successfully updated initProductDetail');
} else {
    console.log('Could not find start or end bounds');
}
