
const express = require("express");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { Markup } = require("telegraf");
const cors = require("cors");
const path = require("path");
const { session } = require('telegraf');


const {
  fetchHotspotProfile,
  fetchHotspotUsers,
  fetchUserProfile,
  fetchSystemResource,
  addUser,
  detailHotspotProfile,
  fetchInterface,
  fetchUserActive,
  fetchppp,
  monitorHotspotUserActivity
} = require("./mikrotik");

const HotspotLogMonitor = require("./hotpot_monitor");

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "src")));


const { tokenBot } = require("./config.js")
const bot = new Telegraf(tokenBot)
bot.use(session());
const { mikrotik } = require("./config.js")

// Inisialisasi monitor log hotspot
const logMonitor = new HotspotLogMonitor();

bot.command("start", async (ctx) => {
  const helpMessage = `Selamat datang di Bot Monitoring Mikrotik!

Berikut adalah daftar perintah yang tersedia:
/start - Menampilkan pesan bantuan ini.
/status - Menampilkan status dan resource dari router Mikrotik.
/listuser - Menampilkan semua pengguna hotspot.
/useractive - Menampilkan jumlah pengguna hotspot yang sedang aktif.
/userdetail - Mencari dan menampilkan detail seorang pengguna.
/adduser - Menambahkan pengguna hotspot baru secara interaktif.
/deleteuser - Menghapus pengguna hotspot secara interaktif.
/serverprofile - Menampilkan semua server hotspot yang tersedia.
/monitor - Mulai monitoring real-time log hotspot (login/logout).
`

  await ctx.reply(helpMessage);
})




const { addMikrotikUser } = require('./addUser');
addMikrotikUser(bot);

// register /userdetail handler from detailUser.js
const { userDetail } = require('./userDetail');
userDetail(bot);

// register /listuser handler from userHotspot.js
const { listHotspotUsers } = require('./userHotspot');
listHotspotUsers(bot);


// register handlers (before launching the bot)
const { registerProfiles } = require('./reply');
registerProfiles(bot);

// register /status handler from mikrotikStatus
const { mikrotikStatus } = require('./mikrotikStatus');
mikrotikStatus(bot);

// register /deleteuser handler from deleteUser.js
const { deleteUser } = require('./deleteUser');
deleteUser(bot);

// register /useractive handler from userActive.js
const { userActive } = require('./userActive');
userActive(bot);

// register /interfaces handler from interface.js
const { interfaceMonitor } = require('./monitor_interface.js');
interfaceMonitor(bot);


// small test command to confirm bot is responding
bot.command('ping', async (ctx) => {
  await ctx.reply('WHAT NIGGA');
});

// ============================================================================
// MONITORING COMMANDS
// ============================================================================

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

// Launch bot after all handlers are registered
bot.launch();

app.get("/api/active", async (req, res) => {
  try {
    const users = await fetchUserActive();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Get all hotspot users
app.get("/api/users", async (req, res) => {
  try {
    const users = await fetchHotspotUsers("kono");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// // Get hotspot profiles
app.get("/api/profile", async (req, res) => {
  try {
    const profiles = await fetchHotspotProfile("dazai");
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// // Get user profiles
app.get("/api/userProfile", async (req, res) => {
  try {
    const userProfiles = await fetchUserProfile("24-jam");
    res.json(userProfiles);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Get system resource status
app.get("/api/status", async (req, res) => {
  try {
    const resource = await fetchSystemResource();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

// Add new user endpoint
app.post("/api/addusers", async (req, res) => {
  try {
    const userData = req.body;
    const result = await addUser(mikrotik, userData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

const { fetchLog } = require("./mikrotik");
app.get("/api/log", async (req, res) => {
  try {
    const log = await fetchLog();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 Telegram bot is active`);
  console.log(`📡 MikroTik connection configured for: ${mikrotik.host}`);
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


