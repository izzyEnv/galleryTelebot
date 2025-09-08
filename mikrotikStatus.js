const {fetchSystemResource} = require('./mikrotik');
const {formatUptime, toMiB, toGiB} = require('./function');


// tampilan pesan telegram bot
async function statusMessage() {
  // mengambil data resource mikrotik
  const [data] = await fetchSystemResource();
  return `
🖥️ MikroTik System Status

📌 Host / Platform: ${data.platform}
🔢 Version: ${data.version}
🕒 Uptime: ${formatUptime(data.uptime)}
🧠 Memory/Ram: ${toMiB(data.freeMemory)} MiB / ${toMiB(data.totalMemory)} MiB
💾 Disk/Penyimpanan: ${toGiB(data.freeHddSpace)} GiB / ${toGiB(data.totalHddSpace)} GiB
⚙️ CPU specification: ${data.cpu} (${data.cpuCount} cores @ ${data.cpuFrequency}MHz)
🔺 CPU Load: ${data.cpuLoad}%`;
}

// Register the /status command on a Telegraf bot instance
function mikrotikStatus(bot) {
  bot.command('status', async (ctx) => {
    console.log('/status command received from', ctx.from && ctx.from.username);
    try {
      const text = await statusMessage();
      await ctx.reply(text);
    } catch (err) {
      console.error('registerStatusCommand error:', err && err.stack ? err.stack : err);
      await ctx.reply('❌ Gagal mengambil status.');
    }
  });
}

module.exports = {mikrotikStatus};