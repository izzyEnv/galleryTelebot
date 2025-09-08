const { Markup } = require("telegraf");
const { fetchHotspotProfile } = require("./mikrotik");

function messageServer(profile) {
  const data = profile;
  return `📄 Server Profile: ${data.name}
🏠 Hotspot Address: ${data.hotspotAddress}
🌐 DNS Name: ${data.dnsName}
📁 HTML Directory: ${data.htmlDirectory}${data.htmlDirectoryOverride ? `
🗂️ HTML Dir Override: ${data.htmlDirectoryOverride}` : ''}
🧰 Hotspot Queue: ${data.installHotspotQueue === undefined ? '-' : (data.installHotspotQueue ? 'Yes' : 'No')}
🔐 Login By: ${data.loginBy}
📡 Use Radius: ${data.useRadius === undefined ? '-' : (data.useRadius ? 'Yes' : 'No')}`;
}

function serverProfile(bot) {
    bot.command('serverprofile', async (ctx) => {
        try {
            const profiles = await fetchHotspotProfile();
            if (!profiles?.length) return ctx.reply('Tidak ada profil hotspot.');

            const names = profiles.map(p => p.name ?? p['name']).filter(Boolean);
            const rows = names.map(n => [n]);
            rows.push(['❌ kembali']);

            ctx.session = ctx.session || {};
            ctx.session.awaitingServerProfile = true;
            ctx.session.lastMenu = 'serverProfile';

            await ctx.reply('Pilih salah satu server profil:', Markup.keyboard(rows).resize().oneTime(true));
        } catch (err) {
            console.error('serverprofile command error:', err);
            await ctx.reply('❌ Gagal memuat daftar profil.');
        }
    });
}

module.exports = { messageServer, serverProfile };
