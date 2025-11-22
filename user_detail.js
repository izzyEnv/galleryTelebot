const { formatUptime } = require('./function.js');

class UserDetailCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  register() {
    this.bot.command('userdetail', (ctx) => {
      ctx.session = ctx.session || {};
      ctx.session.userDetailFlow = 'awaiting_username';
      ctx.reply('Silakan masukkan nama user yang ingin Anda lihat detailnya.');
    });

    this.bot.on('text', async (ctx, next) => {
      if (ctx.session?.userDetailFlow !== 'awaiting_username') {
        return next();
      }

      const username = ctx.message.text.trim();
      delete ctx.session.userDetailFlow;

      try {
        await ctx.reply(`Mencari detail untuk user *${username}*...`, { parse_mode: 'Markdown' });

        const user = await this.mikrotikService.fetchHotspotUsers(username);

        if (!user) {
          return ctx.reply(`❌ User dengan nama *${username}* tidak ditemukan.`, { parse_mode: 'Markdown' });
        }

        function formatBytes(bytes) {
          if (!bytes || bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        const details = [
          `👤 *Detail untuk User: ${user.name}*`,
          `-----------------------------------`,
          `*Profil:* ${user.profile || 'default'}`,
          `username: ${user.name || '-'}`,
          `password: ${user.password || '-'}`,
          ``,
          `*Batas Waktu (Limit):* ${formatUptime(user.limitUptime) || 'Tidak terbatas'}`,
          `*Batas Kuota (Limit):* ${formatBytes(user.limitBytesTotal) || 'Tidak terbatas'}`,
          ``,
          `*Waktu Pemakaian:* ${formatUptime(user.uptime)}`,
          `*Total Kuota digunakan:* ${formatBytes((user.bytesIn || 0) + (user.bytesOut || 0))}`,
          `  - ⬆️ Upload: ${formatBytes(user.bytesOut || 0)}`,
          `  - ⬇️ Download: ${formatBytes(user.bytesIn || 0)}`,
          ``,
          `*Alamat IP:* ${user.address || 'Tidak aktif'}`,
          `*Alamat MAC:* ${user['mac-address'] || 'Tidak aktif'}`
        ];

        await ctx.reply(details.join('\n'), { parse_mode: 'Markdown' });

      } catch (error) {
        console.error('Error fetching user details:', error);
        await ctx.reply('❌ Terjadi kesalahan saat mengambil detail user.');
      }
    });
  }
}

module.exports = UserDetailCommands;
