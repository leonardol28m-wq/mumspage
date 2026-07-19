# Velow — Tienda online

Sitio estático listo para deployar en GitHub Pages + Cloudflare.

## 🚀 Deploy en Cloudflare Pages

1. Creá un repositorio en GitHub y subí esta carpeta
2. Andá a [Cloudflare Pages](https://pages.cloudflare.com/)
3. Conectá tu cuenta de GitHub
4. Seleccioná el repositorio → **Framework: None** (sitio estático)
5. Build command: *(dejar vacío)*
6. Output directory: *(dejar vacío o `/`)*
7. ¡Listo! Cloudflare despliega automáticamente con cada push

### Conectar dominio velow.shop
1. En Cloudflare Pages → tu proyecto → **Custom domains**
2. Agregar `velow.shop` y `www.velow.shop`
3. Seguir los pasos de verificación DNS

---

## 📦 Estructura

```
velow/
├── index.html          ← Catálogo (página principal)
├── producto.html       ← Detalle de producto
├── checkout.html       ← Checkout + transferencia bancaria
├── css/
│   └── style.css       ← Design system completo
├── js/
│   ├── products.js     ← Productos + configuración + stock
│   ├── cart.js         ← Carrito (localStorage)
│   └── main.js         ← Lógica de páginas
├── admin/              ← Mini CRM (privado, no indexado)
│   ├── index.html      ← Dashboard + login
│   ├── productos.html  ← Gestión de stock
│   ├── pedidos.html    ← Seguimiento de pedidos
│   ├── css/admin.css
│   └── js/admin.js
└── assets/
    └── images/         ← Fotos de productos (agregar acá)
```

---

## ✏️ Configurar la tienda

### 1. Datos bancarios
Abrí `js/products.js` y completá la sección `VELOW_CONFIG.banco`:

```js
banco: {
  titular: "Nombre Apellido",
  cbu:     "0000000000000000000000",
  alias:   "mi.alias.banco",
  banco:   "Banco Galicia",
},
```

### 2. Agregar fotos de productos
Guardá las imágenes en `assets/images/` y editá `js/products.js`:

```js
// Dentro de cada producto:
imagenes: {
  negro: "assets/images/buzo-clasico-negro.jpg",
  crema: "assets/images/buzo-clasico-crema.jpg",
}
```

Luego en `js/main.js`, en la función `buildProductCard`, reemplazá el placeholder por:
```js
<img src="${p.imagenes?.[p.colores[0].id] || ''}" alt="${p.nombre}" loading="lazy">
```

### 3. Actualizar stock
**Opción A (recomendada):** Panel admin en `/admin/`
1. Editá el stock desde la interfaz
2. Clic en "Exportar products.js"
3. Reemplazá el archivo y subí a GitHub

**Opción B:** Editá directamente los números en `js/products.js`

---

## 🔐 Panel Admin

URL: `https://velow.shop/admin/`

**Contraseña por defecto:** `velow2025`

> Para cambiarla: editá la variable `ADMIN_PASSWORD` en `admin/js/admin.js`

### Funciones del admin:
- **Dashboard:** estadísticas rápidas + alertas de stock
- **Productos y Stock:** editar unidades por color y talle
- **Pedidos:** registrar, hacer seguimiento y actualizar estados

---

## 📱 Flujo de compra

1. Cliente elige productos → carrito
2. Va al checkout → completa sus datos
3. Ve los datos bancarios y transfiere
4. Clic en "Confirmar pedido por WhatsApp" → mensaje automático con detalle
5. Vos recibís el WhatsApp → registrás el pedido en el panel admin
6. Confirmás la transferencia y coordinás el envío

---

## 🛠 Personalización rápida

| Qué cambiar | Dónde |
|-------------|-------|
| Nombre de la tienda | `js/products.js` → `VELOW_CONFIG.nombre` |
| WhatsApp | `js/products.js` → `VELOW_CONFIG.whatsapp` |
| Datos bancarios | `js/products.js` → `VELOW_CONFIG.banco` |
| Agregar productos | `js/products.js` → array `VELOW_PRODUCTS` |
| Colores del sitio | `css/style.css` → sección `:root` |
| Contraseña admin | `admin/js/admin.js` → `ADMIN_PASSWORD` |

---

## 📸 Formato recomendado para fotos

- Tamaño: **800×1067px** (proporción 3:4, vertical)
- Formato: **JPEG** o **WebP** (mejor performance)
- Peso: menos de 200KB por imagen (podés comprimir en [squoosh.app](https://squoosh.app))
