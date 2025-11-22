class DeleteUserCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  register() {
    this.bot.command('deleteuser', (ctx) => {
      ctx.session = ctx.session || {};
      ctx.reply('❓ Silakan masukkan nama user yang ingin Anda hapus:');
      ctx.session.step = 'awaiting_delete_username';
    });

    this.bot.on('text', async (ctx, next) => {
      ctx.session = ctx.session || {};
      if (ctx.session.step !== 'awaiting_delete_username') {
        return next();
      }

      const userName = ctx.message.text;
      ctx.session.step = null;

      if (!userName) {
        return ctx.reply('Penghapusan dibatalkan karena tidak ada nama user yang diberikan.');
      }

      try {
        await ctx.reply(`⏳ Menghapus user hotspot '${userName}'...`);
        const result = await this.mikrotikService.deleteHotspotUser(userName);
        await ctx.reply(`✅ ${result.message}`);
      } catch (error) {
        console.error(error);
        await ctx.reply(`❌ Gagal menghapus user: ${error.message}`);
      }
    });
  }
}

module.exports = DeleteUserCommands;
