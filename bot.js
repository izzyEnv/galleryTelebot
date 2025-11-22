
const express = require("express");
const { Telegraf, session } = require("telegraf");
const cors = require("cors");
const path = require("path");

// Configuration
const { tokenBot, mikrotik: mikrotikConfig } = require("./config.js");

// Services
const MikrotikService = require("./mikrotik_service.js");

// Command Handlers and Monitors
const HotspotLogMonitor = require("./hotspot_monitor.js");
const InterfaceMonitor = require('./interface_monitor.js');
const AddUserCommands = require('./add_user.js');
const UserDetailCommands = require('./user_detail.js');
const UserListCommands = require('./user_hotspot.js');
const ProfileCommands = require('./profile_commands.js');
const StatusCommands = require('./mikrotik_status.js');
const DeleteUserCommands = require('./delete_user.js');
const ActiveUserCommands = require('./user_active.js');

// ============================================================================
// INITIALIZATION
// ============================================================================

// Services
const mikrotikService = new MikrotikService(mikrotikConfig);

// Bot
const bot = new Telegraf(tokenBot);
bot.use(session());

// Express App
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "src")));

// ============================================================================
// BOT COMMANDS & HANDLERS
// ============================================================================
bot.command("start", async (ctx) => {
  const helpMessage = `Selamat datang di Bot Monitoring Mikrotik!

Berikut adalah daftar perintah yang tersedia:
/start - Menampilkan pesan bantuan ini.
/status - Menampilkan status dan resource dari router Mikrotik.
/interfaces - Memonitor kecepatan interface secara real-time.
/listuser - Menampilkan semua pengguna hotspot.
/useractive - Menampilkan jumlah pengguna hotspot yang sedang aktif.
/userdetail - Mencari dan menampilkan detail seorang pengguna.
/adduser - Menambahkan pengguna hotspot baru secara interaktif.
/deleteuser - Menghapus pengguna hotspot secara interaktif.
/serverprofile - Menampilkan semua server hotspot yang tersedia.
/userprofile - Menampilkan semua user profile hotspot yang tersedia.
/monitor - Mulai monitoring real-time log hotspot (login/logout).
`
  await ctx.reply(helpMessage);
});

// small test command to confirm bot is responding
bot.command('ping', async (ctx) => {
  await ctx.reply('WHAT NIGGA');
});

// Initialize and register all command handlers and monitors
const logMonitor = new HotspotLogMonitor(mikrotikService);
new InterfaceMonitor(bot, mikrotikService);

new AddUserCommands(bot, mikrotikService).register();
new UserDetailCommands(bot, mikrotikService).register();
new UserListCommands(bot, mikrotikService).register();
new ProfileCommands(bot, mikrotikService).register();
new StatusCommands(bot, mikrotikService).register();
new DeleteUserCommands(bot, mikrotikService).register();
new ActiveUserCommands(bot, mikrotikService).register();

// Command untuk mulai monitoring real-time
bot.command("monitor", async (ctx) => {
  try {
    const chatId = ctx.chat.id;

    // Cek status monitoring
    const status = logMonitor.getMonitoringStatus();

    if (status.isMonitoring) {
      await ctx.reply('⚠️ Monitoring sudah aktif!', {
        reply_markup: logMonitor.getMonitoringKeyboard()
      });
      return;
    }

    // Mulai monitoring real-time
    const result = await logMonitor.startRealTimeMonitoring(bot, chatId, {
      interval: 3000,        // Check setiap 3 detik
      maxLogs: 10,           // Maksimal 10 log per check
      filterEvents: ['login', 'logout'],
      includeFailed: true
    });

    if (result.success) {
      console.log(`✅ Monitoring started for chat ${chatId}`);
    } else {
      await ctx.reply(result.message);
    }

  } catch (error) {
    console.error("Error in monitor command:", error);
    await ctx.reply("❌ Gagal memulai monitoring. Silakan coba lagi.");
  }
});

// Handler untuk keyboard callback
bot.on('text', async (ctx) => {
  try {
    const buttonText = ctx.message.text;

    // Cek apakah text adalah button dari keyboard
    if (buttonText.includes('Monitoring') ||
      buttonText.includes('Stop') ||
      buttonText.includes('Status') ||
      buttonText.includes('Bantuan') ||
      buttonText.includes('Start')) {

      await logMonitor.handleKeyboardCallback(bot, ctx, buttonText);
    }

  } catch (error) {
    console.error("Error handling keyboard callback:", error);
  }
});

// ============================================================================
// EXPRESS API ENDPOINTS
// ============================================================================
app.get("/api/active", async (req, res) => {
  try {
    const users = await mikrotikService.fetchActiveHotspotUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Get all hotspot users
app.get("/api/users", async (req, res) => {
  try {
    const users = await mikrotikService.fetchHotspotUsers(req.query.name);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// // Get hotspot profiles
app.get("/api/profile", async (req, res) => {
  try {
    const profiles = await mikrotikService.fetchHotspotProfiles(req.query.name);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// // Get user profiles
app.get("/api/userProfile", async (req, res) => {
  try {
    const userProfiles = await mikrotikService.fetchUserProfiles(req.query.name);
    res.json(userProfiles);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Get system resource status
app.get("/api/status", async (req, res) => {
  try {
    const resource = await mikrotikService.fetchSystemResource();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Add new user endpoint
app.post("/api/addusers", async (req, res) => {
  try {
    const userData = req.body;
    const result = await mikrotikService.addHotspotUser(userData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

app.get("/api/log", async (req, res) => {
  try {
    const log = await mikrotikService.fetchLogs(req.query);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// ============================================================================
// LAUNCH
// ============================================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

bot.launch().then(() => {
  console.log('🤖 Telegram bot is active');
  console.log(`📡 MikroTik connection configured for: ${mikrotikConfig.host}`);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  console.log("\n🛑 Bot stopped gracefully");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  console.log("\n🛑 Bot stopped gracefully");
});
