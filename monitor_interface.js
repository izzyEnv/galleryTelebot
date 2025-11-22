
const { Markup } = require('telegraf');

const INTERVAL_MS = 3000; // update interval

class InterfaceMonitor {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
    // activeMonitors: Map<chatId, { timerId, messageId, lastRx, lastTx, ifaceName }>
    this.activeMonitors = new Map();
    this.registerHandlers();
  }

  bytesToMbps(bytesDiff, intervalSeconds) {
    const bps = bytesDiff / intervalSeconds; // bytes per second
    const mbps = (bps * 8) / 1_000_000; // bits to megabits
    return mbps.toFixed(2);
  }

  async safeEditMessageText(ctx, chatId, messageId, text, extra) {
    try {
      await ctx.telegram.editMessageText(chatId, messageId, null, text, extra);
      return true;
    } catch (err) {
      // edit may fail if message deleted or too old
      console.warn('editMessageText failed:', err && err.message ? err.message : err);
      return false;
    }
  }

  async stopMonitor(chatId, ctx) {
    const state = this.activeMonitors.get(chatId);
    if (!state) return false;
    clearInterval(state.timerId);
    this.activeMonitors.delete(chatId);
    try {
      await ctx.telegram.editMessageText(chatId, state.messageId, null, 'Monitoring dihentikan.');
    } catch (err) {
      // ignore edit errors
    }
    return true;
  }

  registerHandlers() {
    this.bot.command('interfaces', async (ctx) => {
      try {
        const list = await this.mikrotikService.fetchInterfaces();
        if (!Array.isArray(list) || list.length === 0) {
          return ctx.reply('Tidak ada interface yang ditemukan.');
        }

        const keyboard = Markup.keyboard(list.map(i => [i.name])).resize();
        await ctx.reply('Pilih interface yang ingin dimonitor kecepatannya:', keyboard);
      } catch (err) {
        console.error('Error /interfaces:', err);
        await ctx.reply('Gagal mengambil daftar interface.');
      }
    });

    this.bot.on('text', async (ctx, next) => {
      const text = (ctx.message && ctx.message.text) ? String(ctx.message.text) : '';
      const chatId = ctx.chat.id;

      try {
        const list = await this.mikrotikService.fetchInterfaces();
        if (!Array.isArray(list)) return await next();

        const iface = list.find(i => i.name === text);
        if (!iface) return await next(); // not an interface selection

        // remove keyboard and acknowledge
        await ctx.reply(`Memulai monitoring untuk ${iface.name}...`, Markup.removeKeyboard());

        // stop existing monitor if any
        if (this.activeMonitors.has(chatId)) {
          await this.stopMonitor(chatId, ctx);
        }

        const initial = await ctx.reply(`Mengumpulkan data untuk ${iface.name}...`);
        const state = {
          messageId: initial.message_id,
          lastRx: iface.rxByte || 0,
          lastTx: iface.txByte || 0,
          timerId: null,
          ifaceName: iface.name
        };

        const intervalSec = INTERVAL_MS / 1000;

        const update = async () => {
          try {
            const current = await this.mikrotikService.fetchInterfaces(iface.name);
            if (!current) {
              await this.stopMonitor(chatId, ctx);
              return;
            }

            const rxDiff = (current.rxByte || 0) - (state.lastRx || 0);
            const txDiff = (current.txByte || 0) - (state.lastTx || 0);

            const rxMbps = this.bytesToMbps(rxDiff, intervalSec);
            const txMbps = this.bytesToMbps(txDiff, intervalSec);

            const textMsg = `🚀 Kecepatan Real-time: [${current.name}]\n` +
              `-------------------------------------\n` +
              `⬇️ Download (RX): ${rxMbps} Mbps\n` +
              `⬆️ Upload (TX):   ${txMbps} Mbps\n` +
              `-------------------------------------\n` +
              `Last update: ${new Date().toLocaleTimeString()}`;

            const kb = Markup.inlineKeyboard([Markup.button.callback('🛑 Berhenti', `stop_mon_${chatId}`)]);
            const edited = await this.safeEditMessageText(ctx, chatId, state.messageId, textMsg, kb);
            if (!edited) {
              await this.stopMonitor(chatId, ctx);
              return;
            }

            state.lastRx = current.rxByte || 0;
            state.lastTx = current.txByte || 0;

          } catch (err) {
            console.error('Update error:', err);
            await this.stopMonitor(chatId, ctx);
            try { await ctx.reply(`Monitoring dihentikan karena error: ${err.message}`); } catch (_) {}
          }
        };

        // first run and schedule
        await update();
        state.timerId = setInterval(update, INTERVAL_MS);
        this.activeMonitors.set(chatId, state);

      } catch (err) {
        console.error('Text handler error:', err);
        await next();
      }
    });

    this.bot.action(/stop_mon_(\d+)/, async (ctx) => {
      const chatId = Number(ctx.match[1]);
      if (!this.activeMonitors.has(chatId)) return ctx.answerCbQuery('Tidak ada monitoring aktif.');
      try {
        await this.stopMonitor(chatId, ctx);
        await ctx.answerCbQuery('Monitoring dihentikan.');
      } catch (err) {
        console.error('Stop action error:', err);
        await ctx.answerCbQuery('Gagal menghentikan monitoring.');
      }
    });
  }
}

module.exports = InterfaceMonitor;