/* =========================================================
   LokaMart — Data Produk (Seed Data)
   Tidak ada database: data ini hanya dipakai pertama kali,
   setelah itu disimpan & dimodifikasi lewat localStorage.
   ========================================================= */

const CATEGORIES = [
  { id: 'semua', label: 'Semua', emoji: '✨' },
  { id: 'elektronik', label: 'Elektronik', emoji: '📱' },
  { id: 'fashion', label: 'Fashion', emoji: '👕' },
  { id: 'kecantikan', label: 'Kecantikan', emoji: '🧴' },
  { id: 'rumah', label: 'Rumah Tangga', emoji: '🏠' },
  { id: 'olahraga', label: 'Olahraga', emoji: '🏋️' },
  { id: 'aksesoris', label: 'Aksesoris', emoji: '⌚' }
];

const VOUCHERS = {
  HEMAT10: { type: 'percent', value: 10, max: 100000, label: 'Diskon 10% (maks Rp100.000)' },
  LOKA25: { type: 'fixed', value: 25000, label: 'Potongan langsung Rp25.000' },
  GRATISONGKIR: { type: 'shipping', label: 'Bebas ongkir' }
};

const SEED_PRODUCTS = [
  {
    id: 'p01', name: 'Smartphone X Pro 5G 256GB', category: 'elektronik',
    price: 4999000, oldPrice: 5999000, emoji: '📱', rating: 4.9, sold: 1204, stock: 15,
    badge: 'HOT', image: 'https://picsum.photos/seed/lokamart-p01/600/600',
    desc: 'Layar AMOLED 6.7", kamera 108MP, baterai 5000mAh dengan fast charging 67W. Garansi resmi 1 tahun.'
  },
  {
    id: 'p02', name: 'Laptop Ultrabook 14" Core i7', category: 'elektronik',
    price: 12499000, emoji: '💻', rating: 4.8, sold: 356, stock: 8,
    badge: 'TERLARIS', image: 'https://picsum.photos/seed/lokamart-p02/600/600',
    desc: 'Tipis, ringan, dan bertenaga. RAM 16GB, SSD 512GB, cocok untuk produktivitas dan desain.'
  },
  {
    id: 'p03', name: 'Headphone Wireless ANC', category: 'elektronik',
    price: 899000, oldPrice: 1099000, emoji: '🎧', rating: 4.7, sold: 892, stock: 30,
    image: 'https://picsum.photos/seed/lokamart-p03/600/600',
    desc: 'Active Noise Cancelling, baterai 40 jam, koneksi Bluetooth 5.3 yang stabil.'
  },
  {
    id: 'p04', name: 'Smartwatch Seri 8 GPS', category: 'elektronik',
    price: 2799000, emoji: '⌚', rating: 4.6, sold: 547, stock: 20,
    badge: 'BARU', image: 'https://picsum.photos/seed/lokamart-p04/600/600',
    desc: 'Pantau kesehatan 24 jam, GPS presisi, tahan air 5ATM, dan baterai 14 hari.'
  },
  {
    id: 'p05', name: 'Kemeja Flanel Premium', category: 'fashion',
    price: 249000, emoji: '👔', rating: 4.5, sold: 1530, stock: 45,
    image: 'https://picsum.photos/seed/lokamart-p05/600/600',
    desc: 'Bahan katun lembut, jahitan rapi, nyaman dipakai harian maupun acara santai.'
  },
  {
    id: 'p06', name: 'Jaket Denim Classic', category: 'fashion',
    price: 459000, oldPrice: 529000, emoji: '🧥', rating: 4.7, sold: 678, stock: 25,
    image: 'https://picsum.photos/seed/lokamart-p06/600/600',
    desc: 'Denim premium dengan potongan klasik yang tidak lekang oleh waktu. Unisex.'
  },
  {
    id: 'p07', name: 'Sneakers Running Air', category: 'fashion',
    price: 749000, oldPrice: 899000, emoji: '👟', rating: 4.8, sold: 2103, stock: 50,
    badge: 'PROMO', image: 'https://picsum.photos/seed/lokamart-p07/600/600',
    desc: 'Sol empuk dengan teknologi bantalan udara, ringan dan nyaman untuk lari harian.'
  },
  {
    id: 'p08', name: 'Tas Selempang Kulit Sintetis', category: 'fashion',
    price: 329000, emoji: '👜', rating: 4.4, sold: 445, stock: 18,
    image: 'https://picsum.photos/seed/lokamart-p08/600/600',
    desc: 'Desain minimalis, banyak kantong, cocok untuk aktivitas harian dan travelling.'
  },
  {
    id: 'p09', name: 'Serum Vitamin C 20ml', category: 'kecantikan',
    price: 129000, oldPrice: 159000, emoji: '🧴', rating: 4.8, sold: 3210, stock: 60,
    badge: 'HOT', image: 'https://picsum.photos/seed/lokamart-p09/600/600',
    desc: 'Mencerahkan wajah, menyamarkan noda hitam, dan menjaga kelembapan kulit.'
  },
  {
    id: 'p10', name: 'Sunscreen SPF 50 PA++++', category: 'kecantikan',
    price: 89000, emoji: '☀️', rating: 4.7, sold: 2876, stock: 80,
    image: 'https://picsum.photos/seed/lokamart-p10/600/600',
    desc: 'Perlindungan maksimal dari sinar UVA/UVB, tekstur ringan tanpa whitecast.'
  },
  {
    id: 'p11', name: 'Paket Skincare 5 in 1', category: 'kecantikan',
    price: 459000, oldPrice: 599000, emoji: '🧖', rating: 4.9, sold: 987, stock: 40,
    badge: 'PROMO', image: 'https://picsum.photos/seed/lokamart-p11/600/600',
    desc: 'Paket lengkap perawatan wajah: facial wash, toner, serum, moisturizer, dan sunscreen.'
  },
  {
    id: 'p12', name: 'Lipstik Matte Tahan Lama', category: 'kecantikan',
    price: 79000, emoji: '💄', rating: 4.6, sold: 4512, stock: 100,
    image: 'https://picsum.photos/seed/lokamart-p12/600/600',
    desc: 'Warna intens, tahan hingga 12 jam, ringan di bibir dan tidak membuat kering.'
  },
  {
    id: 'p13', name: 'Mesin Kopi Otomatis', category: 'rumah',
    price: 1899000, oldPrice: 2299000, emoji: '☕', rating: 4.8, sold: 234, stock: 10,
    image: 'https://picsum.photos/seed/lokamart-p13/600/600',
    desc: 'Buat espresso, cappuccino, dan latte hanya dengan satu sentuhan. Mudah dibersihkan.'
  },
  {
    id: 'p14', name: 'Lampu Meja Minimalis', category: 'rumah',
    price: 189000, emoji: '💡', rating: 4.5, sold: 765, stock: 0,
    image: 'https://picsum.photos/seed/lokamart-p14/600/600',
    desc: '3 mode pencahayaan, desain ramping, hemat energi dan cocok untuk meja kerja.'
  },
  {
    id: 'p15', name: 'Set Panci Anti Lengket 5 Pcs', category: 'rumah',
    price: 399000, oldPrice: 499000, emoji: '🍳', rating: 4.7, sold: 654, stock: 12,
    image: 'https://picsum.photos/seed/lokamart-p15/600/600',
    desc: 'Lapisan anti lengket food-grade, gagang tahan panas, kompatibel kompor induksi.'
  },
  {
    id: 'p16', name: 'Diffuser Aromaterapi', category: 'rumah',
    price: 159000, emoji: '🌿', rating: 4.6, sold: 1089, stock: 35,
    image: 'https://picsum.photos/seed/lokamart-p16/600/600',
    desc: 'Ultrasonic diffuser dengan 7 warna lampu lembut, membuat ruangan harum dan rileks.'
  },
  {
    id: 'p17', name: 'Sepeda Gunung 27.5"', category: 'olahraga',
    price: 3499000, emoji: '🚴', rating: 4.8, sold: 178, stock: 5,
    badge: 'TERLARIS', image: 'https://picsum.photos/seed/lokamart-p17/600/600',
    desc: 'Frame aluminium ringan, 21 speed, rem cakram ganda, siap medan berat.'
  },
  {
    id: 'p18', name: 'Dumbbell Set 20kg', category: 'olahraga',
    price: 549000, emoji: '🏋️', rating: 4.7, sold: 432, stock: 22,
    image: 'https://picsum.photos/seed/lokamart-p18/600/600',
    desc: 'Sepasang dumbbell adjustable dengan pelat besi, anti karat dan nyaman digenggam.'
  },
  {
    id: 'p19', name: 'Yoga Mat Anti Slip', category: 'olahraga',
    price: 189000, oldPrice: 239000, emoji: '🧘', rating: 4.6, sold: 876, stock: 28,
    image: 'https://picsum.photos/seed/lokamart-p19/600/600',
    desc: 'Tebal 8mm, empuk, anti slip di kedua sisi, lengkap dengan tali pembawa.'
  },
  {
    id: 'p20', name: 'Botol Minum 1L Motivasi', category: 'olahraga',
    price: 99000, emoji: '🥤', rating: 4.5, sold: 2345, stock: 90,
    image: 'https://picsum.photos/seed/lokamart-p20/600/600',
    desc: 'Tritan BPA-free dengan penanda waktu minum, menjaga tubuh tetap terhidrasi.'
  },
  {
    id: 'p21', name: 'Jam Tangan Minimalis', category: 'aksesoris',
    price: 459000, oldPrice: 529000, emoji: '🕰️', rating: 4.7, sold: 543, stock: 3,
    badge: 'PROMO', image: 'https://picsum.photos/seed/lokamart-p21/600/600',
    desc: 'Desain elegan, strap kulit asli, mesin quartz Jepang, tahan percikan air.'
  },
  {
    id: 'p22', name: 'Kacamata UV Protection', category: 'aksesoris',
    price: 219000, emoji: '🕶️', rating: 4.5, sold: 654, stock: 16,
    image: 'https://picsum.photos/seed/lokamart-p22/600/600',
    desc: 'Lensa polarized melindungi dari sinar UV, frame ringan dan nyaman dipakai.'
  },
  {
    id: 'p23', name: 'Dompet Kulit Pria', category: 'aksesoris',
    price: 199000, emoji: '👝', rating: 4.6, sold: 765, stock: 26,
    image: 'https://picsum.photos/seed/lokamart-p23/600/600',
    desc: 'Kulit asli premium, banyak slot kartu, desain tipis muat di saku.'
  },
  {
    id: 'p24', name: 'Cincin Perak Murni', category: 'aksesoris',
    price: 349000, oldPrice: 399000, emoji: '💍', rating: 4.9, sold: 321, stock: 7,
    badge: 'HOT', image: 'https://picsum.photos/seed/lokamart-p24/600/600',
    desc: 'Perak 925 asli, desain elegan untuk wanita maupun pria. Sudah termasuk kotak.'
  }
];
