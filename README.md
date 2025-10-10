# Bot Monitoring & Manajemen MikroTik


Bot Telegram yang dirancang untuk mempermudah monitoring dan manajemen pengguna hotspot di router MikroTik Anda, langsung dari Telegram. Proyek ini juga menyediakan REST API sederhana untuk integrasi lebih lanjut.

## ✨ Fitur Utama

### Bot Telegram
- **📊 Status Router**: Lihat status dan sumber daya router secara real-time.
- **👥 Manajemen Pengguna**: Tambah, hapus, dan lihat daftar pengguna hotspot.
- **📄 Detail Pengguna**: Dapatkan informasi mendetail tentang pengguna tertentu.
- **🤖 Interaktif**: Proses tambah dan hapus pengguna dilakukan melalui percakapan interaktif dengan bot.


## 🛠️ Teknologi yang Digunakan

- **Backend**: Node.js
- **Bot Framework**: Telegraf.js
- **Koneksi MikroTik**: `routeros-client`
- **Environment**: `dotenv`

## ⚙️ Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini secara lokal.

### 1. Prasyarat
- Node.js (v18 atau lebih baru direkomendasikan)
- Akses ke router MikroTik dengan user API yang memiliki izin yang cukup.

### 2. Clone Repository
```bash
git clone 
cd monitoring-project-main
```

### 3. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal semua paket yang dibutuhkan.
```bash
npm install
```

### 4. Konfigurasi
edit file bernama `config.js`, dengan token bot dan kredensial mikrotik.



## 🚀 Menjalankan Proyek

Setelah konfigurasi selesai, jalankan perintah berikut untuk memulai bot.

```bash
node bot.js
```

Server akan berjalan dan bot akan aktif. Anda bisa mulai berinteraksi dengannya di Telegram.

## 🤖 Perintah Bot yang Tersedia

- `/start` - Menampilkan pesan selamat datang dan daftar perintah.
- `/status` - Menampilkan status dan resource dari router MikroTik.
- `/listuser` - Menampilkan semua pengguna hotspot.
- `/userdetail` - Mencari dan menampilkan detail seorang pengguna.
- `/adduser` - Menambahkan pengguna hotspot baru secara interaktif.
- `/deleteuser` - Menghapus pengguna hotspot secara interaktif.
- `/ping` - Memeriksa apakah bot aktif dan merespons.
- `/serverprofile` - Menampilkan data server profile hotspot.
- `/userprofile` - Menampilkan data user profile hotspot.
- `/interface` - Menampilkan daftar interface dan kecepatan internet di setiap interface.


## 🤝 Kontribusi

Kontribusi, isu, dan permintaan fitur sangat diterima! Jangan ragu untuk membuat *issue* atau *pull request*.
