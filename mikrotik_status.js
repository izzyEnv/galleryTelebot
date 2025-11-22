const { formatUptime, toMiB } = require('./function.js');

class StatusCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  async getStatusMessage() {
    const [data] = await this.mikrotikService.fetchSystemResource();
    return `
🖥️ MikroTik System Status

📌 Host / Platform: ${data.platform}
🔢 Version: ${data.version}
🕒 Uptime: ${formatUptime(data.uptime)}
🧠 Memory/Ram: ${toMiB(data.freeMemory)} MiB / ${toMiB(data.totalMemory)} MiB
💾 Disk/Penyimpanan: ${toMiB(data.freeHddSpace)} MiB / ${toMiB(data.totalHddSpace)} MiB
⚙️ CPU specification: ${data.cpu} (${data.cpuCount} cores @ ${data.cpuFrequency}MHz)
🔺 CPU Load: ${data.cpuLoad}%`;
  }

  register() {
    this.bot.command('status', async (ctx) => {
      try {
        const text = await this.getStatusMessage();
        await ctx.reply(text);
      } catch (err) {
        console.error('Error in /status command:', err);
        await ctx.reply('❌ Gagal mengambil status.');
      }
    });
  }
}

module.exports = StatusCommands;