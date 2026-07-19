/**
 * VELOW Admin — admin.js
 * Mini CRM: login, gestión de stock y pedidos.
 * Toda la data se guarda en localStorage del dispositivo del admin.
 */

// ─── Contraseña del admin ────────────────────────────────────
// Para cambiarla: modificar este valor y subir a GitHub.
const ADMIN_PASSWORD = "velow2025";
const AUTH_KEY       = "velow_admin_auth";
const ORDERS_KEY     = "velow_orders";
const STOCK_KEY      = "velow_stock_override";

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === "ok";
}

function login(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "ok");
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = "index.html";
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
  }
}

// ═══════════════════════════════════════════════════════════════
// STOCK OVERRIDE (persiste en localStorage del admin)
// ═══════════════════════════════════════════════════════════════

function loadStockOverride() {
  try {
    return JSON.parse(localStorage.getItem(STOCK_KEY)) || {};
  } catch { return {}; }
}

function saveStockOverride(data) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(data));
}

// Merge stock from override on top of products.js defaults
function getEffectiveStock(productId, talle, colorId) {
  const override = loadStockOverride();
  const key = `${productId}__${talle}__${colorId}`;
  if (key in override) return override[key];
  const product = VELOW_PRODUCTS?.find(p => p.id === productId);
  return product?.stock?.[talle]?.[colorId] ?? null;
}

function setStockOverride(productId, talle, colorId, qty) {
  const override = loadStockOverride();
  const key = `${productId}__${talle}__${colorId}`;
  override[key] = qty === null ? null : parseInt(qty);
  saveStockOverride(override);
}

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

const STATUSES = ["pendiente", "confirmado", "enviado", "cancelado"];

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function addOrder(order) {
  const orders = loadOrders();
  order.id     = Date.now().toString(36).toUpperCase();
  order.fecha  = new Date().toISOString();
  order.status = "pendiente";
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

function updateOrderStatus(id, status) {
  const orders = loadOrders();
  const idx    = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    saveOrders(orders);
  }
}

function deleteOrder(id) {
  const orders = loadOrders().filter(o => o.id !== id);
  saveOrders(orders);
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════

function adminToast(msg, duration = 2500) {
  let t = document.getElementById("admin-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "admin-toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), duration);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPriceAdmin(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

function stockBadge(qty) {
  if (qty === null || qty === undefined) return `<span class="stock-badge badge-unknown">Sin cargar</span>`;
  if (qty === 0)  return `<span class="stock-badge badge-zero">Sin stock</span>`;
  if (qty <= 2)   return `<span class="stock-badge badge-low">Bajo (${qty})</span>`;
  return `<span class="stock-badge badge-ok">${qty} disp.</span>`;
}

function statusBadge(status) {
  const labels = { pendiente: "Pendiente", confirmado: "Confirmado", enviado: "Enviado", cancelado: "Cancelado" };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT products.js
// ═══════════════════════════════════════════════════════════════

function generateProductsJS() {
  if (!window.VELOW_PRODUCTS) return "";

  const override = loadStockOverride();

  // Deep clone and apply overrides
  const products = VELOW_PRODUCTS.map(p => {
    const newStock = {};
    for (const talle of p.talles) {
      newStock[talle] = {};
      for (const c of p.colores) {
        const key = `${p.id}__${talle}__${c.id}`;
        newStock[talle][c.id] = key in override ? override[key] : p.stock[talle][c.id];
      }
    }
    return { ...p, stock: newStock };
  });

  const configStr = JSON.stringify(VELOW_CONFIG, null, 2)
    .replace(/"([^"]+)":/g, "$1:");

  const productsStr = JSON.stringify(products, null, 2)
    .replace(/"([^"]+)":/g, "$1:");

  return `/**
 * VELOW — Base de datos de productos
 * Generado desde el panel admin el ${new Date().toLocaleString("es-AR")}
 */

const VELOW_CONFIG = ${configStr};

const VELOW_PRODUCTS = ${productsStr};

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
`;
}
