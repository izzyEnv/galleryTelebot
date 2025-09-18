
const express = require("express");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { Markup } = require("telegraf");
const cors = require("cors");
const path = require("path");
const { session } = require('telegraf');
require("dotenv").config();

const {
  fetchHotspotProfile,
  fetchHotspotUsers,
  fetchUserProfile,
  fetchSystemResource,
  addUser,
  detailHotspotProfile,
  fetchInterface,
  fetchUserActive,
  fetchppp
} = require("./mikrotik");

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "src")));



const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());
const mikrotik = {
  host: process.env.IP_MTK,
  user: process.env.USER_MTK,
  password: process.env.PASS_MTK,
};

const {addMikrotikUser} = require('./addUser');
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
const { interfaceMonitor } = require('./interface');
interfaceMonitor(bot);


// small test command to confirm bot is responding
bot.command('ping', async (ctx) => {
  await ctx.reply('WHAT UP NIGGA');
});


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
/userprofile - Menampilkan semua user profil hotspot yang tersedia.
/interfaces - Menampilkan semua interface yang ada di router.
/ping - Memeriksa apakah bot aktif dan merespons.
/interface - Menampilkan daftar interface dan kecepatan internet di setiap interface`

  await ctx.reply(helpMessage);
})
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


