const { Markup } = require('telegraf');
const { fetchHotspotUsers } = require('./mikrotik');

const PAGE_SIZE = 5;

function generateUserListPage(users, page = 0) {
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  const startIndex = page * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageUsers = users.slice(startIndex, endIndex);

  // Create the list of usernames for the current page
  const userListText = pageUsers.map((user, index) => `${startIndex + index + 1}. ${user.name}`).join('\n');

  const text = [
    `👥 *Daftar User Hotspot*`,
    `*Total User:* ${totalUsers}`,
    `-----------------------------------`,
    userListText || 'Tidak ada user di halaman ini.',
    `-----------------------------------`,
    `Halaman ${page + 1} dari ${totalPages}`
  ].join('\n');

  // Create the pagination buttons
  const buttons = [];
  if (page > 0) {
    buttons.push(Markup.button.callback('⬅️ Sebelumnya', `listuser_page_${page - 1}`));
  }
  if (endIndex < users.length) {
    buttons.push(Markup.button.callback('Selanjutnya ➡️', `listuser_page_${page + 1}`));
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  return { text, keyboard };
}


function listHotspotUsers(bot) {
  // 1. Handle the /listuser command
  bot.command('listuser', async (ctx) => {
    try {
      const users = await fetchHotspotUsers();
      if (!users || users.length === 0) {
        return ctx.reply('Tidak ada user hotspot yang ditemukan.');
      }

      const { text, keyboard } = generateUserListPage(users, 0);
      await ctx.reply(text, { ...keyboard, parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error in /listuser command:', error);
      await ctx.reply('❌ Terjadi kesalahan saat mengambil daftar user.');
    }
  });

  // 2. Handle pagination button clicks
  bot.on('callback_query', async (ctx, next) => {
    const callbackData = ctx.callbackQuery.data;

    if (!callbackData.startsWith('listuser_page_')) {
      return next();
    }

    try {
      const page = parseInt(callbackData.replace('listuser_page_', ''), 10);
      
      const users = await fetchHotspotUsers();
       if (!users || users.length === 0) {
        return ctx.editMessageText('Tidak ada user hotspot yang ditemukan.');
      }

      const { text, keyboard } = generateUserListPage(users, page);
      
      await ctx.editMessageText(text, { ...keyboard, parse_mode: 'Markdown' });
      await ctx.answerCbQuery();

    } catch (error) {
      console.error('Error in listuser pagination:', error);
      await ctx.answerCbQuery('Gagal memuat halaman baru.');
    }
  });
}

module.exports = { listHotspotUsers };
