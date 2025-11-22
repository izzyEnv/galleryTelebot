

// Fungsi untuk format waktu dari "2h17m34s" menjadi "2 hari, 22 jam, 50 menit"
function formatUptime(uptime) {
  if (!uptime) return "Unknown";

  const result = [];
  const h = uptime.match(/(\d+)h/)?.[1];
  const m = uptime.match(/(\d+)m/)?.[1];
  const s = uptime.match(/(\d+)s/)?.[1];

  if (h) {
    const hours = parseInt(h);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (days > 0) result.push(`${days} hari`);
      if (remainingHours > 0) result.push(`${remainingHours} jam`);
    } else {
      result.push(`${hours} jam`);
    }
  }

  if (m) result.push(`${m} menit`);
  if (s) result.push(`${s} detik`);

  return result.length > 0 ? result.join(", ") : "0 detik";
}

// ini kita ada beken ba ini format akan dpe GiB
function toMiB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

function toGiB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(1);
}


async function generateVoucher(mikrotikService) {
  try {
    const listUser = await mikrotikService.fetchHotspotUsers();
    const existingVouchers = listUser
      .filter(user => user.name?.startsWith('GC'))
      .map(user => user.name);

    let newVoucher;
    do {
      const prefix = "GC";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const suffix = Array.from({ length: 4 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("");

      newVoucher = prefix + suffix;
    } while (existingVouchers.includes(newVoucher));

    return newVoucher;

  } catch (error) {
    console.error('Error generating voucher:', error);
    throw error;
  }
}


async function createVoucher(mikrotikService, profile) {
    try {
        // 1) buat username/password dan comment
        const username = await generateVoucher(mikrotikService); // menghasilkan string unik GCxxxx
        const pwd = username;
        // const commentStr = await comment();

        // 2) panggil addHotspotUser yang ada di mikrotik.js
        const created = await mikrotikService.addHotspotUser({
            name: username,
            password: pwd,
            profile: profile,
            comment: 'Created by Bot'
        });
        // 3) sukses: kembalikan hasil (created is the response from the API call)
        console.log("User voucher berhasil dibuat:", created);
        return created;
    } catch (err) {
        console.error("Gagal membuat user voucher:", err);
    }
}


module.exports = {
  formatUptime,
  toMiB,
  toGiB,
  createVoucher
};
