/**
 * VELOW — Base de datos de productos
 * ─────────────────────────────────────────────────────────────
 * Para actualizar el stock:
 *   1. Abrí el panel admin en /admin/
 *   2. Editá el stock desde ahí y exportá el nuevo products.js
 *   3. Reemplazá este archivo y subí el cambio a GitHub
 *      → Cloudflare Pages redeploya automáticamente
 * ─────────────────────────────────────────────────────────────
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

// ─── PRODUCTOS ───────────────────────────────────────────────
// stock: número de unidades. null = no cargado aún (muestra "Consultar disponibilidad")
//        0 = sin stock | 1+ = disponible

const VELOW_PRODUCTS = [
  {
    id: "buzo-clasico-oversize",
    nombre: "Buzo Clásico Oversize",
    precio: 28500,
    descripcion:
      "Buzo de algodón 100% premium con cuello redondo. Corte oversize pensado para el uso diario. Suave al tacto, cálido y atemporal.",
    detalles: [
      "100% algodón premium",
      "Puños y cintura acanalados",
      "Corte oversize",
      "Lavado a máquina en frío",
    ],
    categoria: "buzos",
    nuevo: true,
    destacado: true,
    activo: true,
    colores: [
      { id: "crema",    nombre: "Crema",   hex: "#EDE8DC" },
      { id: "negro",    nombre: "Negro",   hex: "#1A1917" },
      { id: "gris",     nombre: "Gris",    hex: "#B0ACA6" },
      { id: "tostado",  nombre: "Tostado", hex: "#C2A07A" },
    ],
    talles: ["XS", "S", "M", "L", "XL"],
    // Poner 0 si no hay stock. null si todavía no sabés.
    stock: {
      XS: { crema: null, negro: null, gris: null, tostado: null },
      S:  { crema: null, negro: null, gris: null, tostado: null },
      M:  { crema: null, negro: null, gris: null, tostado: null },
      L:  { crema: null, negro: null, gris: null, tostado: null },
      XL: { crema: null, negro: null, gris: null, tostado: null },
    },
  },
  {
    id: "buzo-hoodie-canguro",
    nombre: "Buzo Hoodie Canguro",
    precio: 34000,
    descripcion:
      "Buzo con capucha y bolsillo tipo canguro. Tejido grueso y cálido, ideal para los días más frescos. Versátil y cómodo.",
    detalles: [
      "Mezcla de algodón y poliéster",
      "Capucha con cordón ajustable",
      "Bolsillo frontal tipo canguro",
      "Interior afelpado",
    ],
    categoria: "buzos",
    nuevo: false,
    destacado: true,
    activo: true,
    colores: [
      { id: "negro",       nombre: "Negro",       hex: "#1A1917" },
      { id: "gris-oscuro", nombre: "Gris Oscuro", hex: "#555350" },
      { id: "sage",        nombre: "Verde Sage",  hex: "#8B9E89" },
    ],
    talles: ["XS", "S", "M", "L", "XL"],
    stock: {
      XS: { negro: null, "gris-oscuro": null, sage: null },
      S:  { negro: null, "gris-oscuro": null, sage: null },
      M:  { negro: null, "gris-oscuro": null, sage: null },
      L:  { negro: null, "gris-oscuro": null, sage: null },
      XL: { negro: null, "gris-oscuro": null, sage: null },
    },
  },
  {
    id: "buzo-media-cremallera",
    nombre: "Buzo Media Cremallera",
    precio: 36500,
    descripcion:
      "Buzo con media cremallera metálica y cuello alto. Elegante y funcional, un básico de temporada que combina con todo.",
    detalles: [
      "100% algodón peinado",
      "Cremallera metálica",
      "Cuello alto",
      "Fit relajado",
    ],
    categoria: "buzos",
    nuevo: false,
    destacado: false,
    activo: true,
    colores: [
      { id: "crema",   nombre: "Crema",   hex: "#EDE8DC" },
      { id: "negro",   nombre: "Negro",   hex: "#1A1917" },
      { id: "tostado", nombre: "Tostado", hex: "#C2A07A" },
    ],
    talles: ["XS", "S", "M", "L", "XL"],
    stock: {
      XS: { crema: null, negro: null, tostado: null },
      S:  { crema: null, negro: null, tostado: null },
      M:  { crema: null, negro: null, tostado: null },
      L:  { crema: null, negro: null, tostado: null },
      XL: { crema: null, negro: null, tostado: null },
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
