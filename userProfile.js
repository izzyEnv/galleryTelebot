const { Markup } = require("telegraf");
const { fetchUserProfile } = require("./mikrotik");

function messageUser(profile) {
  const data = profile;
  return `📄 User Profile: ${data.name}
  speed limit: ${data.rateLimit || '-'}
  queue: ${data.parentQueue || '-'}
⏱️Idle Timeout: ${data.idleTimeout}
🫀 Keepalive Timeout: ${data.keepaliveTimeout}
🔄 Status Autorefresh: ${data.statusAutorefresh}
👥 Shared Users: ${data.sharedUsers}`;
}

function userProfile(bot) {
 bot.command('userprofile', async (ctx) => {
        try {
          const profiles = await fetchUserProfile();
          if (!profiles?.length) return ctx.reply('Tidak ada profil hotspot.');

          const names = profiles.map(p => p.name ?? p['name']).filter(Boolean);
          const rows = names.map(n => [n]);
          rows.push(['❌ kembali']);

          ctx.session = ctx.session || {};
          ctx.session.awaitingProfile = true;
          ctx.session.lastMenu = 'userProfile';

          await ctx.reply('Pilih salah satu user profil:', Markup.keyboard(rows).resize().oneTime(true));
        } catch (err) {
          console.error('userprofile command error:', err);
          await ctx.reply('❌ Gagal memuat daftar profil.');
        }
    });
}

module.exports = { messageUser, userProfile };
