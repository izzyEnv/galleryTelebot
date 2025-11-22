const { Markup } = require('telegraf');

class ProfileCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  // --- Message Formatters ---

  formatServerProfileMessage(data) {
    return `📄 Server Profile: ${data.name}\n` +
      `🏠 Hotspot Address: ${data['hotspot-address'] || 'N/A'}\n` +
      `🌐 DNS Name: ${data['dns-name']}\n` +
      `📁 HTML Directory: ${data['html-directory'] || 'N/A'}\n` +
      `🔐 Login By: ${data['login-by'] || 'N/A'}\n` +
      `📡 Use Radius: ${data['use-radius'] === 'true' ? 'Yes' : 'No'}`;
  }

  formatUserProfileMessage(data) {
    return `📄 User Profile: ${data.name}\n` +
      `⚡️ Speed Limit: ${data['rate-limit'] || '-'}\n` +
      `⏱️ Idle Timeout: ${data['idle-timeout'] || 'none'}\n` +
      `🫀 Keepalive Timeout: ${data['keepalive-timeout'] || 'none'}\n` +
      `🔄 Status Autorefresh: ${data['status-autorefresh'] || 'none'}\n` +
      `👥 Shared Users: ${data['shared-users'] || '1'}`;
  }

  // --- Command Registration ---

  register() {
    this.bot.command('serverprofile', async (ctx) => {
      try {
        const profiles = await this.mikrotikService.fetchHotspotProfiles();
        if (!profiles?.length) return ctx.reply('Tidak ada server profile hotspot.');

        const names = profiles.map(p => p.name).filter(Boolean);
        const rows = names.map(n => [n]);
        rows.push(['❌ kembali']);

        ctx.session = ctx.session || {};
        ctx.session.profileMenu = 'server';

        await ctx.reply('Pilih salah satu server profil:', Markup.keyboard(rows).resize().oneTime(true));
      } catch (err) {
        console.error('serverprofile command error:', err);
        await ctx.reply('❌ Gagal memuat daftar profil.');
      }
    });

    this.bot.command('userprofile', async (ctx) => {
      try {
        const profiles = await this.mikrotikService.fetchUserProfiles();
        if (!profiles?.length) return ctx.reply('Tidak ada user profile hotspot.');

        const names = profiles.map(p => p.name).filter(Boolean);
        const rows = names.map(n => [n]);
        rows.push(['❌ kembali']);

        ctx.session = ctx.session || {};
        ctx.session.profileMenu = 'user';

        await ctx.reply('Pilih salah satu user profil:', Markup.keyboard(rows).resize().oneTime(true));
      } catch (err) {
        console.error('userprofile command error:', err);
        await ctx.reply('❌ Gagal memuat daftar profil.');
      }
    });

    this.bot.on('text', async (ctx, next) => {
      const text = (ctx.message?.text || '').trim();
      const menu = ctx.session?.profileMenu;

      if (text === '❌ kembali') {
        ctx.session.profileMenu = null;
        return ctx.reply('Perintah selesai.', { reply_markup: { remove_keyboard: true } });
      }

      if (!menu) return next();

      ctx.session.profileMenu = null; // Clear menu state

      try {
        let profile, detailMessage;
        if (menu === 'server') {
          profile = await this.mikrotikService.fetchHotspotProfiles(text);
          detailMessage = this.formatServerProfileMessage(profile);
        } else if (menu === 'user') {
          profile = await this.mikrotikService.fetchUserProfiles(text);
          detailMessage = this.formatUserProfileMessage(profile);
        }

        if (!profile) return ctx.reply('⚠️ Profil tidak ditemukan.', { reply_markup: { remove_keyboard: true } });

        return ctx.reply(detailMessage, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
      } catch (err) {
        console.error(`Error fetching ${menu} profile:`, err);
        return ctx.reply('❌ Gagal mengambil detail profil.');
      }
    });
  }
}

module.exports = ProfileCommands;