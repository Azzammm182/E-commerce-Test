# 🛍️ LokaMart — E-Commerce Tanpa Database

Aplikasi e-commerce modern berbasis **browser saja** (HTML + CSS + Vanilla JavaScript).
**Tanpa database, tanpa server, tanpa framework** — seluruh data tersimpan aman di
`localStorage` perangkat pengguna.

## ✨ Fitur

- 🏠 Halaman beranda dengan hero section, kategori, dan produk terlaris
- 🔍 Pencarian real-time dan filter kategori
- ↕️ Sorting: populer, harga, rating, diskon
- 🛒 Keranjang belanja (drawer) dengan progress **gratis ongkir**
- ❤️ Wishlist / produk favorit
- 📦 Detail produk (modal) dengan pilih jumlah
- 💳 Checkout lengkap: form alamat + pilihan pembayaran (Transfer Bank, COD, E-Wallet)
- 🧾 Riwayat pesanan dengan status
- 🌙 Mode gelap / terang (tersimpan otomatis)
- 📱 Responsif (mobile & desktop)
- 🔌 Bisa dibuka **offline** — gambar produk memakai fallback emoji bila tidak ada internet

## 🚀 Cara Menjalankan

**Cara paling mudah (tanpa server):**

1. Buka folder `D:\project\ecommerce-browser`
2. Klik dua kali file `index.html`

> `localStorage` tetap berfungsi saat dibuka via `file://` di Chrome, Edge, dan Firefox.

**Opsional — jalankan lewat server lokal:**

```bash
cd /d/project/ecommerce-browser
python -m http.server 8000
# buka http://localhost:8000
```

## 🧠 Cara Kerja Penyimpanan

| Data        | Kunci localStorage      |
|-------------|-------------------------|
| Produk      | `lokamart_products_v1`  |
| Keranjang   | `lokamart_cart_v1`      |
| Favorit     | `lokamart_wishlist_v1`  |
| Pesanan     | `lokamart_orders_v1`    |
| Tema        | `lokamart_theme_v1`     |

Data produk di-seed pertama kali dari `js/data.js`, lalu disimpan di localStorage.
Untuk mengembalikan ke kondisi awal, klik **"Muat Ulang Data Demo"** di footer.

## 📁 Struktur Project

```
ecommerce-browser/
├── index.html          # Halaman utama & semua markup
├── css/
│   └── style.css       # Styling lengkap (light + dark mode)
├── js/
│   ├── data.js         # Seed data produk & kategori
│   └── app.js          # Seluruh logika aplikasi (localStorage)
└── README.md
```

## 🛠️ Teknologi

- HTML5, CSS3 (custom properties, grid, flexbox, animasi)
- JavaScript ES6+ (module-less, delegasi event, localStorage)
- Google Fonts: Plus Jakarta Sans (fallback ke font sistem bila offline)
