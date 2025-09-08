const { deleteHotspotUser } = require('./mikrotik');

const deleteUser = (bot) => {
    // Step 1: Ask for the username when /deleteuser is called
    bot.command('deleteuser', (ctx) => {
        // Safely initialize session if it doesn't exist
        ctx.session = ctx.session || {};
        ctx.reply('❓ Silakan masukkan nama user yang ingin Anda hapus:');
        // Set a flag in the session to indicate we are waiting for the username
        ctx.session.step = 'awaiting_delete_username';
    });

    // Step 2: Handle the reply from the user
    bot.on('text', async (ctx, next) => {
        // Safely initialize session if it doesn't exist
        ctx.session = ctx.session || {};
        // Check if the current session step is to delete a user
        if (ctx.session.step === 'awaiting_delete_username') {
            const userName = ctx.message.text;

            // Clear the session step
            ctx.session.step = null;

            if (!userName) {
                return ctx.reply('Penghapusan dibatalkan karena tidak ada nama user yang diberikan.');
            }

            try {
                await ctx.reply(`⏳ Menghapus user hotspot '${userName}'...`);
                const result = await deleteHotspotUser(userName);
                await ctx.reply(`✅ ${result.message}`);
            } catch (error) {
                console.error(error);
                await ctx.reply(`❌ Gagal menghapus user: ${error.message}`);
            }
            // Stop processing other middleware for this message
            return;
        }
        // If it's not the step we're looking for, continue to other middleware
        return next();
    });
};

module.exports = {
    deleteUser
};
