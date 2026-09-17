# PlusNet Kasir — Aplikasi Kasir (Expo + Supabase)

Aplikasi kasir berbasis **React Native (Expo)** untuk toko kelontong/stationery dengan backend **Supabase**. Dibangun berdasarkan design system *stitch_plusnet_kasir_design_system* (warna emerald, font Manrope).

## Fitur

- 🔐 **Login / Register** dengan Supabase Auth (email + password)
- 💳 **Kasir / Register** — pilih produk, pilih satuan (Biji/Pack), keranjang, total + PPN 11%, cetak struk
- 📊 **Dashboard Beranda** — omzet, transaksi, keuntungan & stok menipis hari ini, tren penjualan
- 🗃️ **Inventory / Stok** — lihat barang, filter kategori, status Aman/Menipis/Habis
- 🧾 **Riwayat Transaksi** — daftar transaksi lengkap dengan detail item
- 📈 **Laporan** — harian/bulanan/tahunan, omzet per kategori, produk terlaris
- ⚙️ **Pengaturan** — profil toko, kategori bisnis, tema, logout
- 🔍 **Detail Produk** — harga, stok, riwayat penjualan, rekap stok, hapus barang

---

## 📁 Struktur Folder

```
plusnet-kasir-app/
├── App.js                     # Entry point (font + navigasi)
├── app.json
├── package.json
├── .env.example               # Template config Supabase
├── src/
│   ├── components/
│   │   └── UI.js              # Button, Input, Card, Badge, EmptyState
│   ├── context/
│   │   └── AuthContext.js     # Status login global
│   ├── navigation/
│   │   ├── AppNavigator.js    # Routing auth ↔ main
│   │   └── MainTabs.js        # Bottom tab (Kasir, Stok, Laporan, Pengaturan, Beranda)
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── SignUpScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── HomeScreen.js
│   │   ├── KasirScreen.js
│   │   ├── InventoryScreen.js
│   │   ├── RiwayatScreen.js
│   │   ├── LaporanScreen.js
│   │   ├── PengaturanScreen.js
│   │   ├── DetailProdukScreen.js
│   │   ├── TambahBarangScreen.js
│   │   └── DetailStrukScreen.js
│   ├── services/
│   │   └── api.js             # Query produk, transaksi, stok
│   ├── theme/
│   │   └── index.js           # Warna, tipografi, spacing (dari design system)
│   └── utils/
│       ├── supabase.js        # Client Supabase
│       └── format.js          # Format Rupiah, tanggal
└── supabase/
    └── schema.sql             # Schema & seed database (jalankan di SQL Editor)
```

---

## 🚀 Cara Menjalankan

### 1. Siapkan Supabase

1. Login ke [supabase.com](https://supabase.com) → **New project**.
2. Pilih nama & region, lalu tunggu database selesai dibuat.
3. Buka menu **SQL Editor** → klik **New query**.
4. Salin & tempel seluruh isi **`supabase/schema.sql`** → klik **Run**.
5. Skrip sudah mengaktifkan RLS & policy untuk semua tabel secara otomatis.

### 2. Isi kredensial

1. Duplikat **`.env.example`** → rename menjadi **`.env`** (di project root).
2. Buka **Project Settings → API** di dashboard Supabase:
   - **Project URL** → isi ke `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → isi ke `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   Isi `.env` menjadi seperti ini:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

> ⚠️ **Penting:** Expo hanya membaca variabel berawalan `EXPO_PUBLIC_`.
> Jangan memakai `SUPABASE_URL`/`SUPABASE_ANON_KEY` biasa kecuali menambahkan loader `.env` manual.

### 3. Install dependensi

Membutuhkan [Node.js](https://nodejs.org) LTS & Expo CLI.

```bash
npm install
```

### 4. Jalankan aplikasi

```bash
npx expo start
```

- Scan QR dengan **Expo Go** di HP, atau tekan `a` untuk Android Emulator.
- Jika mengubah `.env`, jalankan ulang dengan `npx expo start --clear`.

---

## 🔑 Akun & Login

1. Buka app → **Daftar Sekarang**.
2. Isi **Nama**, **Nama Toko**, **Email**, **Password** → **Daftar**.
3. Kembali ke **Masuk** dan login dengan email/password tersebut.
4. Jika email konfirmasi aktif, klik link verifikasi di email dulu sebelum login.

> Ingin akun langsung aktif tanpa verifikasi email? Matikan
> **Authentication → Providers → Email → "Confirm email"**.

---

## 🗄️ Tabel Supabase (ringkasan `schema.sql`)

| Tabel | Keterangan |
|---|---|
| `profiles` | Profil user terhubung `auth.users` (auto trigger) |
| `categories` | Daftar kategori produk |
| `products` | Barang + harga jual/modal, stok biji/pack |
| `transactions` | Transaksi kasir (subtotal, pajak 11%, total, keuntungan) |
| `transaction_items` | Item detail per transaksi |
| `stock_movements` | Rekap masuk/keluar stok |

---

## ✅ Penyelesaian Langkah Cepat

| No | Langkah | Dimana |
|----|---------|--------|
| 1 | Buat project Supabase | supabase.com |
| 2 | Jalankan `supabase/schema.sql` | Supabase SQL Editor |
| 3 | Isi `.env` | project root |
| 4 | `npm install` | terminal |
| 5 | `npx expo start` | terminal |
| 6 | Daftar akun → login → mulai kasir | Expo Go |

Selamat bertransaksi dengan PlusNet Kasir! 🎉