const { fetchHotspotUsers } = require('./mikrotik');
const { formatUptime } = require('./function'); // Removed toGiB as we have a better local function

function userDetail(bot) {
  // 1. Memulai alur dengan perintah /userdetail
  bot.command('userdetail', (ctx) => {
    // Menggunakan session untuk melacak status alur percakapan
    ctx.session = ctx.session || {};
    ctx.session.userDetailFlow = 'awaiting_username';
    ctx.reply('Silakan masukkan nama user yang ingin Anda lihat detailnya.');
  });

  // 2. Menangani input teks dari user
  bot.on('text', async (ctx, next) => {
    // Pastikan user sedang dalam alur 'userdetail'
    if (ctx.session?.userDetailFlow !== 'awaiting_username') {
      return next(); // Jika tidak, lanjutkan ke middleware lain
    }

    const username = ctx.message.text.trim();
    
    try {
      await ctx.reply(`Mencari detail untuk user *${username}*...`, { parse_mode: 'Markdown' });

      // Ambil semua user dan cari yang cocok
      const allUsers = await fetchHotspotUsers();
      const user = allUsers.find(u => u.name === username);

      if (!user) {
        return ctx.reply(`❌ User dengan nama *${username}* tidak ditemukan.`, { parse_mode: 'Markdown' });
      }

      // Helper function to format bytes into a readable string (KB, MB, GB)
      function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }

      // Format detail user untuk ditampilkan
      const details = [
        `👤 *Detail untuk User: ${user.name}*`,
        `-----------------------------------`,
        `*Profil:* ${user.profile || 'default'}`,
        `username: ${user.name || '-'}`,
        `password: ${user.password || '-'}`,
        ``, // empty line for spacing
        `*Batas Waktu (Limit):* ${formatUptime(user.limitUptime) || 'Tidak terbatas'}`,
        `*Batas Kuota (Limit):* ${formatBytes(user.limitBytesTotal) || 'Tidak terbatas'}`,
        ``, // empty line for spacing
        `*Waktu Pemakaian:* ${formatUptime(user.uptime)}`,
        `*Total Kuota digunakan:* ${formatBytes((user.bytesIn || 0) + (user.bytesOut || 0))}`,
        `  - ⬆️ Upload: ${formatBytes(user.bytesOut || 0)}`,
        `  - ⬇️ Download: ${formatBytes(user.bytesIn || 0)}`,
        ``, // empty line for spacing
        `*Alamat IP:* ${user.address || 'Tidak aktif'}`,
        `*Alamat MAC:* ${user['mac-address'] || 'Tidak aktif'}`
      ];

      await ctx.reply(details.join('\n'), { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error fetching user details:', error);
      await ctx.reply('❌ Terjadi kesalahan saat mengambil detail user.');
    } finally {
      // Hapus status alur dari session setelah selesai atau jika terjadi error
      delete ctx.session.userDetailFlow;
    }
  });
}

module.exports = { userDetail };
