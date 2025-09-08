const { Markup } = require('telegraf');
const { fetchUserProfile, fetchHotspotProfile } = require('./mikrotik');
const { messageUser, userProfile } = require('./userProfile');
const { messageServer, serverProfile } = require('./serverProfile');



function registerProfiles(bot) {
  // userprofile command
  userProfile(bot);

  // serverprofile command
  serverProfile(bot);

  // unified text handler to avoid multiple conflicting listeners
  // call next() when message is not handled so other handlers (registered later)
  // can still process commands like /status or /ping
  bot.on('text', async (ctx, next) => {
    const text = (ctx.message?.text || '').trim();

    // global back button
    if (text === '❌ kembali') {
      ctx.session = ctx.session || {};
      ctx.session.awaitingProfile = false;
      ctx.session.awaitingServerProfile = false;
      ctx.session.lastMenu = null;
      return ctx.reply('perintah selesai', { reply_markup: { remove_keyboard: true } });
    }

    // user profile selection
    if (ctx.session?.awaitingProfile && ctx.session?.lastMenu === 'userProfile') {
      try {
        const profile = await fetchUserProfile(text);
        ctx.session.awaitingProfile = false;
        ctx.session.lastMenu = null;
        if (!profile) return ctx.reply('⚠️ Profil tidak ditemukan.', { reply_markup: { remove_keyboard: true } });
  const detail = messageUser(profile);
  return ctx.reply(detail, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
      } catch (err) {
        console.error('fetchUserProfile error:', err);
        return ctx.reply('❌ Gagal mengambil detail profil.');
      }
    }

    // server profile selection
    if (ctx.session?.awaitingServerProfile && ctx.session?.lastMenu === 'serverProfile') {
      try {
        const profile = await fetchHotspotProfile(text);
        ctx.session.awaitingServerProfile = false;
        ctx.session.lastMenu = null;
        if (!profile) return ctx.reply('⚠️ Profil tidak ditemukan.', { reply_markup: { remove_keyboard: true } });
  const detail = messageServer(profile);
  return ctx.reply(detail, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
      } catch (err) {
        console.error('fetchHotspotProfile error:', err);
        return ctx.reply('❌ Gagal mengambil detail profil.');
      }
    }

  // otherwise ignore and allow other middlewares/handlers to run
  await next();
  });
}

module.exports = { registerProfiles };
