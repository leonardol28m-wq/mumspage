/**
 * VELOW - Base de datos de productos
 * 
 * Para actualizar el stock:
 *   1. Abrí el panel admin en /admin/
 *   2. Editá el stock desde ahí y exportá el nuevo products.js
 *   3. Reemplazá este archivo y subí el cambio a GitHub
 *        Cloudflare Pages redeploya automáticamente
 * 
 */

const VELOW_CONFIG = {
  nombre: "Velow",
  whatsapp: "5493876364197",
  instagram: "",
  email: "",
  banco: {
    titular: "",   // Completar cuando estén disponibles
    cbu: "",
    alias: "",
    banco: "",
  },
  envio: {
    texto: "Coordinar envío por WhatsApp",
    gratis_desde: null,
  },
  moneda: "ARS",
  simbolo: "$",
};

// ── PRODUCTOS ──
// stock: número de unidades. null = no cargado aún (muestra "Consultar disponibilidad")
//        0 = sin stock | 1+ = disponible

const VELOW_PRODUCTS = [
  {
    id: "sueter-corazones",
    nombre: "Suéter Corazones",
    precio: 45000,
    descripcion: "Suéter clásico con detalles de corazones. Tejido cálido y suave, ideal para media estación y dar un toque único a tu estilo.",
    detalles: [
      "Tejido suave de primera calidad",
      "Diseño con corazones",
      "Corte clásico al cuerpo",
      "Lavar a mano con agua fría"
    ],
    categoria: "sueteres",
    nuevo: true,
    destacado: true,
    activo: true,
    colores: [
      { 
        id: "azul", nombre: "Azul", hex: "#1F3A5F", 
        imagenPrincipal: "assets/images/sueter-corazones-azul.jpg",
        imagenes: ["assets/images/sueter-corazones-azul.jpg", "assets/images/sueter-corazones-azul-2.jpg", "assets/images/sueter-corazones-azul-3.jpg", "assets/images/sueter-corazones-azul-4.jpg"]
      },
      { 
        id: "bordo", nombre: "Bordó", hex: "#6E2C3B", 
        imagenPrincipal: "assets/images/sueter-corazones-bordo.jpg",
        imagenes: ["assets/images/sueter-corazones-bordo.jpg", "assets/images/sueter-corazones-bordo-2.jpg", "assets/images/sueter-corazones-bordo-3.jpg", "assets/images/sueter-corazones-bordo-4.jpg"]
      },
      { 
        id: "marron", nombre: "Marrón", hex: "#5C4033", 
        imagenPrincipal: "assets/images/sueter-corazones-marron.jpg",
        imagenes: ["assets/images/sueter-corazones-marron.jpg", "assets/images/sueter-corazones-marron-2.jpg", "assets/images/sueter-corazones-marron-3.jpg", "assets/images/sueter-corazones-marron-4.jpg"]
      },
      { 
        id: "turquesa", nombre: "Turquesa", hex: "#30D5C8", 
        imagenPrincipal: "assets/images/sueter-corazones-turquesa.jpg",
        imagenes: ["assets/images/sueter-corazones-turquesa.jpg", "assets/images/sueter-corazones-turquesa-2.jpg", "assets/images/sueter-corazones-turquesa-3.jpg", "assets/images/sueter-corazones-turquesa-4.jpg"]
      },
    ],
    talles: ["S", "M", "L"],
    stock: {
      S: { azul: null, bordo: null, marron: null, turquesa: null },
      M: { azul: null, bordo: null, marron: null, turquesa: null },
      L: { azul: null, bordo: null, marron: null, turquesa: null },
    },
  },
];

// ─── HELPERS ────────────────────────────────────────────────
function getStock(product, talle, colorId) {
  return product.stock?.[talle]?.[colorId] ?? null;
}

function hasAnyStock(product) {
  for (const talle of Object.values(product.stock)) {
    for (const qty of Object.values(talle)) {
      if (qty === null || qty > 0) return true;
    }
  }
  return false;
}

function formatPrice(n) {
  return VELOW_CONFIG.simbolo + n.toLocaleString("es-AR");
}

function getProductById(id) {
  return VELOW_PRODUCTS.find((p) => p.id === id) || null;
}
