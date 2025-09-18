const { fetchUserActive } = require('./mikrotik');

const userActive = (bot) => {
  bot.command('useractive', async (ctx) => {
    try {
      const activeUsers = await fetchUserActive();
      const totalActive = activeUsers.length;

      if (totalActive === 0) {
        return ctx.reply('✅ Tidak ada pengguna hotspot yang aktif saat ini.');
      }

      // Membuat header pesan
      let message = `*Total Pengguna Aktif: ${totalActive}*

`;

      // Menambahkan detail untuk setiap pengguna
      activeUsers.forEach(user => {
        const userName = user.user || 'N/A';
        const userAddress = user.address || 'N/A';
        const userUptime = user.uptime || 'N/A';

        // Format dengan Markdown, tambahkan \n untuk baris baru
        message += ` *User: ${userName}* 
`;
        message += ` *IP: ${userAddress}* 
`;
        message += ` *Uptime: ${userUptime}* 

`;
      });

      // Kirim pesan menggunakan mode Markdown
      await ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error fetching active users:', error);
      await ctx.reply(`❌ Gagal mengambil data pengguna aktif.
Error: ${error.message}`);
    }
  });
};

module.exports = {
  userActive
};