const { Markup } = require('telegraf');
const { createVoucher } = require('./function');

class AddUserCommands {
  constructor(bot, mikrotikService) {
    this.bot = bot;
    this.mikrotikService = mikrotikService;
  }

  register() {
    this.bot.command('adduser', async (ctx) => {
      try {
        ctx.session = {};

        const profiles = await this.mikrotikService.fetchUserProfiles();
        if (!profiles?.length) {
          return ctx.reply('❌ Tidak dapat menemukan user profile di MikroTik.');
        }

        const buttons = profiles.map(p => Markup.button.callback(p.name, `adduser_profile_${p.name}`));
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
          rows.push(buttons.slice(i, i + 2));
        }

        await ctx.reply('Silakan pilih profile untuk user baru.', Markup.inlineKeyboard(rows));
        ctx.session.addUserFlow = 'awaiting_profile';

      } catch (err) {
        console.error('adduser command error:', err);
        await ctx.reply('❌ Gagal memulai proses tambah user.');
        ctx.session = {};
      }
    });

    this.bot.on('callback_query', async (ctx, next) => {
      const callbackData = ctx.callbackQuery.data;
      const addUserFlow = ctx.session?.addUserFlow;

      if (!addUserFlow || !callbackData.startsWith('adduser_')) {
        return next();
      }

      if (addUserFlow === 'awaiting_profile' && callbackData.startsWith('adduser_profile_')) {
        try {
          const profileName = callbackData.replace('adduser_profile_', '');
          ctx.session.newUserProfile = profileName;
          ctx.session.addUserFlow = 'awaiting_creation_type';

          await ctx.answerCbQuery();

          const keyboard = Markup.inlineKeyboard([
            Markup.button.callback('Buat User Manual', 'adduser_method_manual'),
            Markup.button.callback('Generate User Otomatis', 'adduser_method_generate')
          ]);

          await ctx.editMessageText(
            `Profil *${profileName}* dipilih.\n\nSilakan pilih metode pembuatan user:`,
            { ...keyboard, parse_mode: 'Markdown' }
          );

        } catch (error) {
          console.error('Error in adduser profile callback:', error);
          await ctx.reply('❌ Terjadi kesalahan saat memilih profile.');
          ctx.session = {};
        }
        return;
      }

      if (addUserFlow === 'awaiting_creation_type' && callbackData.startsWith('adduser_method_')) {
        try {
          const method = callbackData.replace('adduser_method_', '');

          if (method === 'manual') {
            ctx.session.addUserFlow = 'awaiting_credentials';
            await ctx.answerCbQuery();
            await ctx.editMessageText(
              `Metode: Manual\nProfil: *${ctx.session.newUserProfile}*\n\nSekarang, masukkan username dan password dengan format:\n\n` + '`username,password`',
              { parse_mode: 'Markdown' }
            );
          } else if (method === 'generate') {
            ctx.session.addUserFlow = 'awaiting_generate_count';
            await ctx.answerCbQuery();
            await ctx.editMessageText(
              `Metode: Generate\nProfil: *${ctx.session.newUserProfile}*\n\nBerapa banyak user yang ingin Anda generate? (Kirim angka saja, maks 50)`,
              { parse_mode: 'Markdown' }
            );
          }
        } catch (error) {
          console.error('Error in adduser method callback:', error);
          await ctx.reply('❌ Terjadi kesalahan saat memilih metode.');
          ctx.session = {};
        }
        return;
      }

      return next();
    });

    this.bot.on('text', async (ctx, next) => {
      const addUserFlow = ctx.session?.addUserFlow;

      if (!addUserFlow || !['awaiting_credentials', 'awaiting_generate_count'].includes(addUserFlow)) {
        return next();
      }

      if (addUserFlow === 'awaiting_credentials') {
        try {
          const text = ctx.message.text;
          const [name, password] = text.split(',').map(s => s.trim());
          const profile = ctx.session.newUserProfile;

          if (!name || !password) {
            return ctx.reply('Format salah. Pastikan Anda memberikan `username,password` dipisahkan koma.');
          }

          await this.mikrotikService.addHotspotUser({ name, password, profile });
          await ctx.reply(`✅ User *${name}* dengan profile *${profile}* berhasil ditambahkan!`, { parse_mode: 'Markdown' });

        } catch (error) {
          console.error('Error adding user manually:', error);
          await ctx.reply('❌ Gagal menambahkan user. Terjadi kesalahan pada server.');
        } finally {
          ctx.session = {};
        }
        return;
      }

      if (addUserFlow === 'awaiting_generate_count') {
        try {
          const count = parseInt(ctx.message.text, 10);
          if (isNaN(count) || count <= 0 || count > 50) {
            return ctx.reply('Masukkan tidak valid. Harap kirimkan angka antara 1 dan 50.');
          }

          const profile = ctx.session.newUserProfile;
          await ctx.reply(`⚙️ Oke, akan membuat *${count}* user voucher dengan profile *${profile}*. Mohon tunggu...`, { parse_mode: 'Markdown' });

          let successCount = 0;
          let results = [];

          for (let i = 0; i < count; i++) {
            try {
              const voucher = await createVoucher(this.mikrotikService, profile);
              if (voucher && voucher.name) {
                results.push(`✅ ${i + 1}. ` + '`' + voucher.name + '`');
                successCount++;
              } else {
                results.push(`❌ ${i + 1}. Gagal (tidak ada respons)`);
              }
            } catch (e) {
              console.error(`Voucher creation loop error on item ${i + 1}:`, e);
              results.push(`❌ ${i + 1}. Gagal (${e.message || 'error tidak diketahui'})`);
            }
          }

          await ctx.replyWithHTML(`<b>Selesai!</b>\nBerhasil: ${successCount} dari ${count}\n\n<pre>${results.join('\n')}</pre>`);

        } catch (error) {
          console.error('Error generating users:', error);
          await ctx.reply('❌ Gagal men-generate user. Terjadi kesalahan pada server.');
        } finally {
          ctx.session = {};
        }
        return;
      }

      return next();
    });
  }
}

module.exports = AddUserCommands;
