const { RouterOSAPI } = require("routeros-api");

// Konfigurasi koneksi ke MikroTik
const config = {
    host: "192.168.110.119",
    user: "admin",
    password: ""
};

/**
 * Fungsi sederhana untuk mengambil data /ip/hotspot/server/print dari MikroTik.
 */
async function getHotspotServers() {
    const api = new RouterOSAPI(config);
    try {
        // 1. Terhubung ke router
        await api.connect();
        console.log("Berhasil terhubung ke router.");

        // 2. Menjalankan perintah dan mengambil data
        console.log("Mengambil data /ip/hotspot/server/print...");
        const servers = await api.write("/ip/hotspot/user/profile/print");

        // 3. Menampilkan hasil
        console.log("Data Server Hotspot:");
        console.log(servers);

    } catch (err) {
        // Menangani jika ada error
        console.error("Terjadi kesalahan:", err);
    } finally {
        // 4. Selalu pastikan koneksi ditutup
        if (api.connected) {
            console.log("Menutup koneksi.");
            api.close();
        }
    }
}

// Menjalankan fungsi
//cihuy
getHotspotServers();