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
cd monitoring-project
```

### 3. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal semua paket yang dibutuhkan.
```bash
npm install
```

### 4. Konfigurasi Environment
Buat file bernama `.env` di direktori utama proyek, lalu salin dan isi variabel berikut sesuai dengan konfigurasi Anda.

```env
# Token Bot Telegram Anda (dapatkan dari @BotFather)
BOT_TOKEN=your_telegram_bot_token

# Detail Login API MikroTik
IP_MTK=your_mikrotik_ip
USER_MTK=your_mikrotik_api_username
PASS_MTK=your_mikrotik_api_password
```

## 🚀 Menjalankan Proyek

Setelah konfigurasi selesai, jalankan perintah berikut untuk memulai bot dan server API.

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


## 🤝 Kontribusi

Kontribusi, isu, dan permintaan fitur sangat diterima! Jangan ragu untuk membuat *issue* atau *pull request*.
