/**
 * VELOW — Carrito de compras
 * Persistencia en localStorage. Maneja color + talle por item.
 */

const Cart = (() => {
  const KEY = "velow_cart";
  let items = [];

  // ── Persistencia ──────────────────────────────────────────
  function load() {
    try {
      items = JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      items = [];
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(items));
    dispatchUpdate();
  }

  function dispatchUpdate() {
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items, count: getCount(), total: getTotal() } }));
  }

  // ── Agregar ───────────────────────────────────────────────
  function add(product, colorId, talle, qty = 1) {
    const stockQty = getStock(product, talle, colorId);

    if (stockQty !== null && stockQty <= 0) {
      return { ok: false, msg: "Sin stock disponible para esa combinación." };
    }

    const existing = items.find(
      (i) => i.productId === product.id && i.colorId === colorId && i.talle === talle
    );

    if (existing) {
      const newQty = existing.qty + qty;
      if (stockQty !== null && newQty > stockQty) {
        return { ok: false, msg: `Solo quedan ${stockQty} unidades disponibles.` };
      }
      existing.qty = newQty;
    } else {
      const color = product.colores.find((c) => c.id === colorId);
      items.push({
        productId:   product.id,
        nombre:      product.nombre,
        precio:      product.precio,
        colorId,
        colorNombre: color?.nombre || colorId,
        colorHex:    color?.hex || "#888",
        talle,
        qty,
      });
    }

    save();
    return { ok: true };
  }

  // ── Eliminar ──────────────────────────────────────────────
  function remove(productId, colorId, talle) {
    items = items.filter(
      (i) => !(i.productId === productId && i.colorId === colorId && i.talle === talle)
    );
    save();
  }

  // ── Cambiar cantidad ──────────────────────────────────────
  function setQty(productId, colorId, talle, qty) {
    const item = items.find(
      (i) => i.productId === productId && i.colorId === colorId && i.talle === talle
    );
    if (!item) return;
    if (qty <= 0) {
      remove(productId, colorId, talle);
    } else {
      item.qty = qty;
      save();
    }
  }

  // ── Vaciar ────────────────────────────────────────────────
  function clear() {
    items = [];
    save();
  }

  // ── Totales ───────────────────────────────────────────────
  function getTotal() {
    return items.reduce((s, i) => s + i.precio * i.qty, 0);
  }

  function getCount() {
    return items.reduce((s, i) => s + i.qty, 0);
  }

  function getItems() {
    return [...items];
  }

  // ── WhatsApp order message ────────────────────────────────
  function buildWhatsAppMessage(customerData) {
    const lines = ["🛍️ *Nuevo pedido — Velow*\n"];

    items.forEach((item) => {
      lines.push(
        `• ${item.nombre} | ${item.colorNombre} | Talle ${item.talle} | x${item.qty} — ${formatPrice(item.precio * item.qty)}`
      );
    });

    lines.push(`\n*Total: ${formatPrice(getTotal())}*\n`);

    if (customerData) {
      lines.push("📋 *Datos del comprador:*");
      if (customerData.nombre) lines.push(`Nombre: ${customerData.nombre}`);
      if (customerData.email)  lines.push(`Email: ${customerData.email}`);
      if (customerData.tel)    lines.push(`Teléfono: ${customerData.tel}`);
      if (customerData.dir)    lines.push(`Dirección: ${customerData.dir}`);
      if (customerData.ciudad) lines.push(`Ciudad: ${customerData.ciudad}`);
      if (customerData.prov)   lines.push(`Provincia: ${customerData.prov}`);
    }

    lines.push("\n_Adjunto comprobante de transferencia._");

    return encodeURIComponent(lines.join("\n"));
  }

  // ── Init ──────────────────────────────────────────────────
  load();

  return { add, remove, setQty, clear, getTotal, getCount, getItems, buildWhatsAppMessage, load };
})();
