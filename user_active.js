class ActiveUserCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  register() {
    this.bot.command('useractive', async (ctx) => {
      try {
        const activeUsers = await this.mikrotikService.fetchActiveHotspotUsers();
        const totalActive = activeUsers.length;

        if (totalActive === 0) {
          return ctx.reply('✅ Tidak ada pengguna hotspot yang aktif saat ini.');
        }

        let message = `*Total Pengguna Aktif: ${totalActive}*\n\n`;

        activeUsers.forEach(user => {
          const userName = user.user || 'N/A';
          const userAddress = user.address || 'N/A';
          const userUptime = user.uptime || 'N/A';

          message += `*User:* ${userName}\n*IP:* ${userAddress}\n*Uptime:* ${userUptime}\n\n`;
        });

        await ctx.reply(message, { parse_mode: 'Markdown' });

      } catch (error) {
        console.error('Error fetching active users:', error);
        await ctx.reply(`❌ Gagal mengambil data pengguna aktif.\nError: ${error.message}`);
      }
    });
  }
}

module.exports = ActiveUserCommands;