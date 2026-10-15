# Ruang Kreasi Kayu — Toko Web

Website toko online sederhana untuk tugas Personal Lab 1. Implementasi memakai React, React Router, Axios, Node.js, Express, dan MongoDB sesuai brief tugas dan materi LN Specialized Platform Development. Konsep toko menampilkan figur hewan dan karakter cerita dari kayu yang dipahat tangan, dengan warna cerah dan serat kayu alami.

## Fitur

- Beranda, katalog produk, dan detail produk dengan navigasi React Router.
- Tampilan katalog memakai CSS Grid, ditambah layout fleksibel untuk navigasi, toolbar, dan detail produk.
- Pencarian nama dan filter kategori di katalog.
- Data katalog dibaca dari REST API menggunakan Axios. Jika API belum tersedia, frontend menampilkan data contoh agar halaman tetap dapat ditinjau.
- Express API dengan daftar dan detail produk, filter kategori, pencarian, dan 24 produk contoh.
- Registrasi dan login dengan kata sandi yang di-hash menggunakan `scrypt`, token JWT berlaku 7 hari, dan token dikirim melalui header `Authorization`.
- Route `/akun` dilindungi; wishlist dan daftar pesanan akun disimpan di MongoDB melalui API yang memeriksa JWT. Endpoint pengelolaan produk hanya dapat dipanggil oleh pengguna dengan role `admin`.
- Google Analytics 4 mengirim page view dan event login/registrasi setelah Measurement ID diatur.
- API daftar dan detail tetap bisa dipakai saat MongoDB mati. Perubahan data lewat CRUD perlu MongoDB berjalan.
- Layout responsif, semantik HTML, label aksesibel, dan dukungan gerakan yang dikurangi.

## Menjalankan aplikasi

### Prasyarat

- Node.js 18 atau lebih baru dan npm.
- MongoDB lokal atau Docker Desktop untuk menjalankan MongoDB dari Compose.

### Instalasi

Dari folder utama project, gunakan npm atau pnpm:

```bash
npm install
cp backend/.env.example backend/.env
```

Atau `pnpm install` bila menggunakan pnpm.

Nilai `MONGODB_URI` contoh mengarah ke MongoDB lokal pada port standar. Untuk menyalakan MongoDB dengan Docker, jalankan `docker compose up -d mongodb` dari folder project. Pada komputer pengembang saat ini, MongoDB Community lokal juga dapat dijalankan dengan `bash scripts/start-mongodb.sh` dan biarkan terminal tersebut terbuka. Script ini memakai instalasi lokal di komputer tersebut; untuk komputer lain, gunakan Docker atau instal MongoDB Community sendiri.

### Jalankan mode pengembangan

Jalankan dari folder utama:

```bash
npm run dev
```

Dengan pnpm, jalankan `pnpm run dev`.

Frontend: <http://localhost:5173>  
API: <http://localhost:4000/api>  
Cek status API: <http://localhost:4000/api/health>

Perintah `dev` menjalankan frontend dan API sekaligus. Untuk menyimpan akun dan produk secara permanen, nyalakan MongoDB lebih dulu dengan Docker (`docker compose up -d mongodb`) atau script lokal (`bash scripts/start-mongodb.sh`). Untuk menjalankan salah satu bagian saja, gunakan `npm run dev:web` atau `npm run dev:api` (dengan pnpm: `pnpm run dev:web` atau `pnpm run dev:api`).

Jika API memakai host/port berbeda, buat `frontend/.env` dari `frontend/.env.example`, lalu ubah `VITE_API_URL` (contoh: `http://localhost:4000/api`). Restart Vite setelah mengubah file `.env`.

## Autentikasi

Buat akun di `/register`, lalu masuk di `/login`. Setelah berhasil, frontend menyimpan JWT di `localStorage` dan API client mengirimkannya sebagai `Authorization: Bearer <token>`. Token berlaku selama tujuh hari. Endpoint `GET /api/auth/me` memeriksa token, sedangkan halaman `/akun` mengarahkan pengunjung yang belum masuk ke halaman login.

Jika lupa kata sandi, pilih **Lupa kata sandi?** di halaman masuk. Sistem mengirim tautan reset ke email; tautan berlaku 30 menit dan hanya bisa dipakai sekali. Untuk mengaktifkan email reset, buat API key di Resend, verifikasi domain/alamat pengirim, lalu isi `RESEND_API_KEY` dan `EMAIL_FROM` pada environment backend (lokal: `backend/.env`; Render: Environment). `EMAIL_FROM` harus memakai alamat pada domain pengirim yang telah diverifikasi di Resend. Atur `CLIENT_ORIGIN` ke URL frontend agar tautan email kembali ke website yang benar. Bila konfigurasi email belum tersedia, halaman akan memberi tahu bahwa fitur belum aktif.

Untuk produksi, atur `JWT_SECRET` dengan nilai acak yang kuat dan gunakan `MONGODB_URI` dari database MongoDB Atlas agar akun tetap tersimpan setelah server dimulai ulang. Jangan memasukkan rahasia ke repository. Password disimpan sebagai hash `scrypt`, bukan teks asli. Buat admin secara manual di database dengan mengubah field `role` menjadi `admin`; role tersebut diperlukan untuk operasi tambah, ubah, dan hapus produk.

## Google Analytics

Buat properti Google Analytics 4 dan Web data stream, lalu salin Measurement ID dengan format `G-XXXXXXXXXX`. Atur `VITE_GA_MEASUREMENT_ID` di environment frontend dan jalankan ulang build. Aplikasi mengirim event `page_view`, `login`, dan `sign_up` tanpa menyertakan email atau kata sandi. Dashboard laporan tersedia di Google Analytics setelah data diterima. Tanpa Measurement ID, tracking tidak berjalan.

## Deployment publik

Konfigurasi deployment sudah disiapkan untuk Render (backend) dan Vercel (frontend). Link publik belum tersedia sampai project dihubungkan ke repository Git dan deploy diselesaikan pada akun penyedia hosting.

1. Push folder project ini ke repository GitHub milik Anda.
2. Buat database MongoDB Atlas dan salin connection string-nya.
3. Di Render, buat Blueprint dari repository ini menggunakan `render.yaml`. Isi `MONGODB_URI` dengan connection string Atlas dan `CLIENT_ORIGIN` dengan URL frontend Vercel. `CLIENT_ORIGIN` harus sama persis dengan alamat frontend (tanpa garis miring di akhir); beberapa alamat yang dipisahkan koma juga didukung. Render membuat `JWT_SECRET` secara otomatis. API akan tersedia pada alamat `https://<nama-service>.onrender.com`.
4. Di Vercel, import repository yang sama dan set **Root Directory** menjadi `frontend`. Sebelum deploy, tambahkan `VITE_API_URL=https://<nama-service>.onrender.com/api` dan `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`, lalu deploy ulang setiap kali URL API berubah. Build production sengaja gagal bila `VITE_API_URL` belum diatur supaya frontend tidak diam-diam mencoba mengakses localhost. File `frontend/vercel.json` menjaga route React Router tetap bisa dibuka langsung.
5. Setelah mendapat URL Vercel, perbarui `CLIENT_ORIGIN` pada Render dengan URL tersebut lalu deploy ulang backend.
6. Coba daftar akun, keluar, masuk, dan buka `/akun`. Periksa `/api/health` untuk memastikan backend aktif; cek Google Analytics Realtime setelah membuka frontend.

Render Blueprint reference: https://render.com/docs/blueprint-spec
Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
Google Analytics event setup: https://developers.google.com/analytics/devguides/collection/ga4/events

## REST API

Semua endpoint memakai prefiks `/api`. Operasi produk `POST`, `PUT`, dan `DELETE` memerlukan token JWT admin.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/auth/register` | Membuat akun dan mengembalikan JWT |
| POST | `/auth/login` | Memverifikasi email/kata sandi dan mengembalikan JWT |
| GET | `/auth/me` | Mengembalikan data akun dari JWT; perlu login |
| GET | `/account/orders` | Daftar pesanan akun; perlu login |
| POST | `/account/orders` | Menyimpan pesanan baru dengan status `processing`; perlu login |
| GET | `/account/wishlist` | Membaca wishlist dari akun; perlu login |
| PUT | `/account/wishlist` | Menyimpan daftar ID produk wishlist; perlu login |
| GET | `/products` | Daftar produk; menerima `category`, `q`, dan `limit` |
| GET | `/products/:id` | Detail produk berdasarkan MongoDB ID atau slug |
| POST | `/products` | Membuat produk |
| PUT | `/products/:id` | Memperbarui produk berdasarkan MongoDB ID |
| DELETE | `/products/:id` | Menghapus produk berdasarkan MongoDB ID |

Contoh body untuk `POST /api/products`:

```json
{
  "name": "Mangkuk Pagi",
  "slug": "mangkuk-pagi",
  "category": "Peralatan makan",
  "price": 120000,
  "description": "Mangkuk keramik buatan tangan untuk penggunaan sehari-hari.",
  "image": "https://example.com/mangkuk.jpg",
  "badge": "Handmade",
  "stock": 10
}
```

## Struktur project

```text
backend/   Express server, routes, Mongoose model, dan seed produk
frontend/  React app, halaman, API client Axios, dan stylesheet
shared/    Data produk tambahan yang dipakai frontend dan backend
```

## Catatan demonstrasi

Foto studio dan ilustrasi figur dibuat khusus untuk konsep toko kayu ini. Formulir “Order Now” menyimpan produk, jumlah, dan total ke database setelah dikirim. Alamat, nomor telepon, checkout, dan pembayaran belum terhubung ke sistem transaksi. Status pesanan dimulai sebagai `processing`; ubah menjadi `shipped` atau `received` di MongoDB untuk melihat status pengiriman pada akun. Akun lokal tanpa MongoDB hanya disimpan di memori; untuk deploy, gunakan MongoDB Atlas.
