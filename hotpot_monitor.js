const { fetchHotspotLog, monitorHotspotUserActivity } = require('./mikrotik.js');

/**
 * Monitor untuk log hotspot yang dapat diintegrasikan dengan bot Telegram
 */
class HotspotLogMonitor {
    constructor() {
        this.lastCheckTime = new Date();
        this.knownLogs = new Set(); // Untuk menghindari duplikasi
        this.activeMonitor = null; // Instance monitor aktif
        this.isMonitoring = false; // Status monitoring
    }

    /**
     * Mendapatkan log hotspot baru sejak terakhir dicek
     */
    async getNewLogs() {
        try {
            const now = new Date();
            const fromTime = this.lastCheckTime.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            }).toLowerCase() + ` ${this.lastCheckTime.toLocaleTimeString('en-GB')}`;

            const logs = await fetchHotspotLog({
                limit: 50,
                fromTime: fromTime
            });

            // Filter log yang belum pernah dilihat
            const newLogs = logs.filter(log => {
                const logId = `${log.time}_${log.message}`;
                if (!this.knownLogs.has(logId)) {
                    this.knownLogs.add(logId);
                    return true;
                }
                return false;
            });

            this.lastCheckTime = now;
            return newLogs;
        } catch (error) {
            console.error('Error getting new logs:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan notifikasi untuk log baru
     */
    async getNotifications() {
        const newLogs = await this.getNewLogs();
        const notifications = [];

        for (const log of newLogs) {
            const message = log.message || '';
            const timestamp = log.time || '';

            if (message.toLowerCase().includes('login')) {
                notifications.push({
                    type: 'login',
                    message: `🔓 User login: ${message}`,
                    timestamp: timestamp,
                    raw: log
                });
            } else if (message.toLowerCase().includes('logout')) {
                notifications.push({
                    type: 'logout',
                    message: `🔒 User logout: ${message}`,
                    timestamp: timestamp,
                    raw: log
                });
            } else if (message.toLowerCase().includes('failed')) {
                notifications.push({
                    type: 'failed',
                    message: `❌ Login failed: ${message}`,
                    timestamp: timestamp,
                    raw: log
                });
            }
        }

        return notifications;
    }

    /**
     * Mendapatkan statistik log dalam periode tertentu
     */
    async getStats(hours = 24) {
        try {
            const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const fromTimeStr = fromTime.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            }).toLowerCase() + ` ${fromTime.toLocaleTimeString('en-GB')}`;

            const summary = await getHotspotLogSummary({
                limit: 500,
                fromTime: fromTimeStr
            });

            return {
                period: `${hours} hours`,
                total: summary.total,
                login: summary.login,
                logout: summary.logout,
                failed: summary.failed,
                successRate: summary.total > 0 ?
                    ((summary.login + summary.logout) / summary.total * 100).toFixed(2) + '%' : '0%'
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan top users yang paling aktif
     */
    async getTopUsers(hours = 24, limit = 10) {
        try {
            const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const fromTimeStr = fromTime.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            }).toLowerCase() + ` ${fromTime.toLocaleTimeString('en-GB')}`;

            const summary = await getHotspotLogSummary({
                limit: 500,
                fromTime: fromTimeStr
            });

            // Count activities per user
            const userActivities = {};

            summary.logs.forEach(log => {
                if (log.username && log.username !== 'unknown') {
                    if (!userActivities[log.username]) {
                        userActivities[log.username] = {
                            username: log.username,
                            login: 0,
                            logout: 0,
                            failed: 0,
                            total: 0
                        };
                    }

                    userActivities[log.username][log.eventType]++;
                    userActivities[log.username].total++;
                }
            });

            // Sort by total activities
            const sortedUsers = Object.values(userActivities)
                .sort((a, b) => b.total - a.total)
                .slice(0, limit);

            return sortedUsers;
        } catch (error) {
            console.error('Error getting top users:', error);
            throw error;
        }
    }

    /**
     * Format notifikasi untuk bot Telegram
     */
    formatNotificationForTelegram(notification) {
        const icon = {
            'login': '🔓',
            'logout': '🔒',
            'failed': '❌'
        }[notification.type] || '📝';

        return `${icon} *${notification.type.toUpperCase()}*\n` +
            `⏰ ${notification.timestamp}\n` +
            `📝 ${notification.message}`;
    }

    /**
     * Format statistik untuk bot Telegram
     */
    formatStatsForTelegram(stats) {
        return `📊 *Hotspot Statistics (${stats.period})*\n\n` +
            `📈 Total Activities: ${stats.total}\n` +
            `🔓 Login: ${stats.login}\n` +
            `🔒 Logout: ${stats.logout}\n` +
            `❌ Failed: ${stats.failed}\n` +
            `✅ Success Rate: ${stats.successRate}`;
    }

    /**
     * Format top users untuk bot Telegram
     */
    formatTopUsersForTelegram(topUsers) {
        let message = `🏆 *Top Active Users*\n\n`;

        topUsers.forEach((user, index) => {
            message += `${index + 1}. **${user.username}**\n`;
            message += `   📊 Total: ${user.total} | 🔓 ${user.login} | 🔒 ${user.logout} | ❌ ${user.failed}\n\n`;
        });

        return message;
    }

    /**
     * Memulai monitoring real-time dengan callback untuk bot Telegram
     */
    async startRealTimeMonitoring(bot, chatId, options = {}) {
        try {
            if (this.isMonitoring) {
                return {
                    success: false,
                    message: '⚠️ Monitoring sudah aktif!'
                };
            }

            const {
                interval = 3000,        // Check setiap 3 detik
                maxLogs = 10,           // Maksimal 10 log per check
                filterEvents = ['login', 'logout'],
                includeFailed = true
            } = options;

            // Kirim pesan konfirmasi
            await bot.telegram.sendMessage(
                chatId,
                '🔍 *Monitoring Hotspot Dimulai*\n\n' +
                '📊 Monitoring akan mengirim notifikasi real-time untuk:\n' +
                '🔓 Login user\n' +
                '🔒 Logout user\n' +
                '❌ Login gagal\n\n' +
                'Gunakan tombol di bawah untuk menghentikan monitoring.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: this.getMonitoringKeyboard()
                }
            );

            // Setup monitoring dengan callback
            this.activeMonitor = await monitorHotspotUserActivity({
                interval,
                maxLogs,
                filterEvents,
                includeFailed,
                callback: async (activities) => {
                    if (activities.length > 0) {
                        for (const activity of activities) {
                            try {
                                const message = this.formatActivityForTelegram(activity);
                                await bot.telegram.sendMessage(chatId, message, {
                                    parse_mode: 'Markdown',
                                    reply_markup: this.getMonitoringKeyboard()
                                });
                            } catch (error) {
                                console.error('Error sending activity notification:', error);
                            }
                        }
                    }
                }
            });

            // Start monitoring
            await this.activeMonitor.start();
            this.isMonitoring = true;

            return {
                success: true,
                message: '✅ Monitoring hotspot dimulai!'
            };

        } catch (error) {
            console.error('Error starting real-time monitoring:', error);
            this.isMonitoring = false;
            this.activeMonitor = null;

            return {
                success: false,
                message: '❌ Gagal memulai monitoring. Silakan coba lagi.'
            };
        }
    }

    /**
     * Menghentikan monitoring real-time
     */
    async stopRealTimeMonitoring(bot, chatId) {
        try {
            if (!this.isMonitoring || !this.activeMonitor) {
                return {
                    success: false,
                    message: '⚠️ Monitoring tidak aktif!'
                };
            }

            // Stop monitoring
            this.activeMonitor.stop();
            this.activeMonitor = null;
            this.isMonitoring = false;

            // Kirim pesan konfirmasi
            await bot.telegram.sendMessage(
                chatId,
                '⏹️ *Monitoring Hotspot Dihentikan*\n\n' +
                'Monitoring real-time telah dihentikan.\n' +
                'Gunakan /monitor untuk memulai kembali.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true }
                }
            );

            return {
                success: true,
                message: '✅ Monitoring hotspot dihentikan!'
            };

        } catch (error) {
            console.error('Error stopping real-time monitoring:', error);
            return {
                success: false,
                message: '❌ Gagal menghentikan monitoring.'
            };
        }
    }

    /**
     * Mendapatkan status monitoring
     */
    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasActiveMonitor: !!this.activeMonitor,
            stats: this.activeMonitor ? this.activeMonitor.getStats() : null
        };
    }

    /**
     * Format aktivitas untuk bot Telegram
     */
    formatActivityForTelegram(activity) {
        const icon = {
            'login': '🔓',
            'logout': '🔒',
            'failed': '❌'
        }[activity.eventType] || '📝';

        const action = {
            'login': 'masuk',
            'logout': 'keluar',
            'failed': 'gagal masuk'
        }[activity.eventType] || 'aktivitas';

        let message = `${icon} *User ${action.toUpperCase()}*\n\n`;
        message += `👤 **Username:** ${activity.username}\n`;
        message += `⏰ **Waktu:** ${activity.timestamp}\n`;

        if (activity.ip) {
            message += `📍 **IP:** ${activity.ip}\n`;
        }

        if (activity.mac) {
            message += `🔗 **MAC:** ${activity.mac}\n`;
        }

        message += `\n📝 **Detail:** ${activity.message}`;

        return message;
    }

    /**
     * Membuat keyboard untuk monitoring
     */
    getMonitoringKeyboard() {
        return {
            keyboard: [
                [
                    { text: '⏹️ Stop Monitoring' },
                    { text: '📊 Status Monitoring' }
                ],
                [
                    { text: '📋 Bantuan' }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        };
    }

    /**
     * Membuat keyboard untuk bantuan monitoring
     */
    getHelpKeyboard() {
        return {
            keyboard: [
                [
                    { text: '🔍 Start Monitoring' },
                    { text: '⏹️ Stop Monitoring' }
                ],
                [
                    { text: '📊 Status' },
                    { text: '📋 Bantuan' }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        };
    }

    /**
     * Handle keyboard callback
     */
    async handleKeyboardCallback(bot, ctx, buttonText) {
        const chatId = ctx.chat.id;

        try {
            switch (buttonText) {
                case '⏹️ Stop Monitoring':
                    const stopResult = await this.stopRealTimeMonitoring(bot, chatId);
                    await ctx.reply(stopResult.message, { reply_markup: { remove_keyboard: true } });
                    break;

                case '📊 Status Monitoring':
                    const status = this.getMonitoringStatus();
                    let statusMessage = '📊 *Status Monitoring Hotspot*\n\n';

                    if (status.isMonitoring) {
                        statusMessage += '🟢 **Status:** Aktif\n';
                        if (status.stats) {
                            statusMessage += `⏱️ **Interval:** ${status.stats.interval}ms\n`;
                            statusMessage += `📝 **Logs Diketahui:** ${status.stats.knownLogsCount}\n`;
                            statusMessage += `🕐 **Terakhir Cek:** ${status.stats.lastCheckTime.toLocaleString()}\n`;
                        }
                    } else {
                        statusMessage += '🔴 **Status:** Tidak Aktif\n';
                    }

                    await ctx.reply(statusMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: this.getMonitoringKeyboard()
                    });
                    break;

                case '📋 Bantuan':
                    const helpMessage = '📋 *Bantuan Monitoring Hotspot*\n\n' +
                        '🔍 **Start Monitoring** - Mulai monitoring real-time\n' +
                        '⏹️ **Stop Monitoring** - Hentikan monitoring\n' +
                        '📊 **Status Monitoring** - Lihat status monitoring\n' +
                        '📋 **Bantuan** - Tampilkan bantuan ini\n\n' +
                        '💡 *Tips:* Monitoring akan mengirim notifikasi untuk setiap login/logout user hotspot.';

                    await ctx.reply(helpMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: this.getHelpKeyboard()
                    });
                    break;

                case '🔍 Start Monitoring':
                    const startResult = await this.startRealTimeMonitoring(bot, chatId);
                    await ctx.reply(startResult.message);
                    break;

                default:
                    await ctx.reply('❓ Tombol tidak dikenali. Gunakan /help untuk bantuan.');
            }
        } catch (error) {
            console.error('Error handling keyboard callback:', error);
            await ctx.reply('❌ Terjadi error. Silakan coba lagi.');
        }
    }
}


module.exports = HotspotLogMonitor;