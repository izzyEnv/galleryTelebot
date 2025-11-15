const { RouterOSAPI } = require("routeros-api");
const { mikrotik } = require("./config.js")

const { ip, user, password } = mikrotik


// ambil data userprofile dari mikrotik
async function fetchHotspotProfile(name) {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const data = await conn.write("/ip/hotspot/profile/print");
    if (name) {
      return data.find(p => p && p.name === name) || null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchHotspotProfile:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchHotspotProfile:', closeError);
    }
  }
}


async function fetchHotspotUsers(name) {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const users = await conn.write("/ip/hotspot/user/print");
    if (name) {
      return users.find(n => n && n.name === name) || null;
    }
    return users;
  } catch (error) {
    console.error('Error in fetchHotspotUsers:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchHotspotUsers:', closeError);
    }
  }
}


async function fetchUserProfile(name) {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const data = await conn.write("/ip/hotspot/user/profile/print");
    if (name) {
      return data.find(p => p && p.name === name) || null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchUserProfile:', closeError);
    }
  }
}



async function fetchSystemResource() {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const resource = await conn.write("/system/resource/print");
    return resource;
  } catch (error) {
    console.error('Error in fetchSystemResource:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchSystemResource:', closeError);
    }
  }
}

async function addHotspotUser(userData) {
  const { name, password, profile, comment } = userData;

  if (!name || !password) {
    const error = new Error('Name and password are required');
    console.error('Error in addHotspotUser - validation failed:', error.message);
    throw error;
  }

  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const newUser = await conn.write('/ip/hotspot/user/add', [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile || 'default'}`,
      `=comment=${comment || 'Added via Telegram Bot'}`,
    ]);
    console.log('User created:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error in addHotspotUser:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in addHotspotUser:', closeError);
    }
  }
}




async function deleteHotspotUser(userName) {
  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    const error = new Error('User name must be a non-empty string.');
    console.error('Error in deleteHotspotUser - validation failed:', error.message);
    throw error;
  }
  const trimmed = userName.trim();

  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();

    const [found] = await conn.write('/ip/hotspot/user/print', [`?name=${trimmed}`]);
    if (!found) {
      const error = new Error(`User '${trimmed}' not found.`);
      console.error('Error in deleteHotspotUser - user not found:', error.message);
      throw error;
    }

    await conn.write('/ip/hotspot/user/remove', [`=.id=${found['.id']}`]);
    console.log(`User '${trimmed}' deleted successfully.`);

    return { message: `User '${trimmed}' deleted successfully.`, user: found };
  } catch (error) {
    console.error('Error in deleteHotspotUser:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in deleteHotspotUser:', closeError);
    }
  }
}

async function fetchUserActive(name) {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const users = await conn.write("/ip/hotspot/active/print");
    if (name) {
      return users.find(n => n && n.name === name) || null;
    }
    return users;
  } catch (error) {
    console.error('Error in fetchUserActive:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchUserActive:', closeError);
    }
  }
}

async function fetchInterface(name) {
  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const data = await conn.write("/interface/print");
    if (name) {
      // Untuk mendapatkan data traffic real-time, Anda mungkin perlu perintah yang berbeda
      return data.find(i => i && i.name === name) || null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchInterface:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchInterface:', closeError);
    }
  }
}
async function fetchLog() {

  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();
    const data = await conn.write("/log/print");
    return data;
  } catch (error) {
    console.error('Error in fetchLog:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchLog:', closeError);
    }
  }
}

// Fungsi untuk mengambil log hotspot (login/logout)
async function fetchHotspotLog(options = {}) {
  const {
    limit = 100,           // Jumlah maksimal log yang diambil
    fromTime,             // Waktu mulai (format: jan/01/2024 10:00:00)
    toTime,               // Waktu akhir
    user,                 // Filter berdasarkan username
    topic                 // Filter berdasarkan topic (hotspot, info, etc.)
  } = options;

  const conn = new RouterOSAPI(mikrotik);
  try {
    await conn.connect();

    const query = ['/log/print'];
    const conditions = [];

    // `routeros-api` tidak mendukung semua parameter query kompleks secara langsung
    // Filtering mungkin perlu dilakukan di sisi client
    if (topic) {
      conditions.push(`?topics=${topic}`);
    }
     if (user) {
      conditions.push(`?user=${user}`);
    }

    const logs = await conn.write(query.concat(conditions));

    // Filter log yang berkaitan dengan hotspot (login/logout)
    const hotspotLogs = logs.filter(log => {
      const message = log.message ? log.message.toLowerCase() : '';
      const topics = log.topics ? log.topics.toLowerCase() : '';

      return (
        topics.includes('hotspot') ||
        message.includes('login') ||
        message.includes('logout') ||
        message.includes('hotspot')
      );
    });

    console.log(`Found ${hotspotLogs.length} hotspot-related logs`);
    return hotspotLogs;

  } catch (error) {
    console.error('Error in fetchHotspotLog:', error);
    throw error;
  } finally {
    try {
      if (conn.connected) conn.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchHotspotLog:', closeError);
    }
  }
}

// Fungsi khusus untuk monitoring real-time log user hotspot (login/logout)
async function monitorHotspotUserActivity(options = {}) {
  const {
    interval = 5000,        // Interval check dalam milliseconds (default: 5 detik)
    maxLogs = 5,           // Maksimal log yang diproses per interval
    callback,               // Callback function untuk notifikasi
    filterEvents = ['login', 'logout'], // Event yang dimonitor
    includeFailed = true   // Include failed login attempts
  } = options;

  let lastCheckTime = new Date();
  let isMonitoring = false;
  let monitorInterval = null;
  let knownLogs = new Set(); // Untuk menghindari duplikasi

  console.log('🔍 Starting hotspot user activity monitoring...');

  const startMonitoring = async () => {
    if (isMonitoring) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    isMonitoring = true;
    console.log(`📊 Monitoring started - checking every ${interval}ms`);

    monitorInterval = setInterval(async () => {
      try {
        await checkForNewActivity();
      } catch (error) {
        console.error('❌ Error in monitoring interval:', error);
      }
    }, interval);
  };

  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
    isMonitoring = false;
    console.log('⏹️ Monitoring stopped');
  };

  const checkForNewActivity = async () => {
    try {
      const now = new Date();
      const fromTime = lastCheckTime.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).toLowerCase() + ` ${lastCheckTime.toLocaleTimeString('en-GB')}`;

      // Ambil log hotspot terbaru
      const logs = await fetchHotspotLog({
        limit: maxLogs,
        fromTime: fromTime
      });

      // Filter log yang belum pernah dilihat
      const newLogs = logs.filter(log => {
        const logId = `${log.time}_${log.message}`;
        if (!knownLogs.has(logId)) {
          knownLogs.add(logId);
          return true;
        }
        return false;
      });

      if (newLogs.length > 0) {
        // Process new logs
        const processedLogs = processUserActivityLogs(newLogs, filterEvents, includeFailed);

        if (processedLogs.length > 0) {
          console.log(`🔔 Found ${processedLogs.length} new user activities`);

          // Call callback if provided
          if (callback && typeof callback === 'function') {
            callback(processedLogs);
          }
        }
      }

      lastCheckTime = now;
    } catch (error) {
      console.error('❌ Error checking for new activity:', error);
    }
  };

  const processUserActivityLogs = (logs, filterEvents, includeFailed) => {
    const processedLogs = [];

    logs.forEach(log => {
      const message = log.message || '';
      const timestamp = log.time || '';
      const topics = log.topics || '';

      // Extract username dari message
      const userMatch = message.match(/user[=:\s]+([^\s,]+)/i);
      const username = userMatch ? userMatch[1] : 'unknown';

      // Determine event type
      let eventType = 'unknown';
      let isRelevant = false;

      if (message.toLowerCase().includes('login') && filterEvents.includes('login')) {
        eventType = 'login';
        isRelevant = true;
      } else if (message.toLowerCase().includes('logout') && filterEvents.includes('logout')) {
        eventType = 'logout';
        isRelevant = true;
      } else if (message.toLowerCase().includes('failed') && includeFailed) {
        eventType = 'failed';
        isRelevant = true;
      }

      if (isRelevant && username !== 'unknown') {
        const processedLog = {
          timestamp,
          username,
          eventType,
          message,
          topics,
          ip: extractIPFromMessage(message),
          mac: extractMacFromMessage(message),
          raw: log,
          formattedMessage: formatActivityMessage(eventType, username, timestamp, message)
        };

        processedLogs.push(processedLog);
      }
    });

    return processedLogs;
  };

  const extractIPFromMessage = (message) => {
    const ipMatch = message.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    return ipMatch ? ipMatch[1] : null;
  };

  const extractMacFromMessage = (message) => {
    const macMatch = message.match(/([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/);
    return macMatch ? macMatch[1] : null;
  };

  const formatActivityMessage = (eventType, username, timestamp, message) => {
    const icon = {
      'login': '🔓',
      'logout': '🔒',
      'failed': '❌'
    }[eventType] || '📝';

    const action = {
      'login': 'logged in',
      'logout': 'logged out',
      'failed': 'login failed'
    }[eventType] || 'activity';

    return `${icon} User **${username}** ${action} at ${timestamp}`;
  };

  // Return monitoring control object
  return {
    start: startMonitoring,
    stop: stopMonitoring,
    isActive: () => isMonitoring,
    getStats: () => ({
      isMonitoring,
      lastCheckTime,
      knownLogsCount: knownLogs.size,
      interval
    }),
    clearHistory: () => {
      knownLogs.clear();
      console.log('🗑️ Monitoring history cleared');
    }
  };
}





module.exports = {
  fetchUserProfile,
  fetchHotspotProfile,
  fetchHotspotUsers,
  fetchSystemResource,
  addHotspotUser,
  deleteHotspotUser,
  fetchUserActive,
  fetchInterface,
  fetchHotspotLog,
  monitorHotspotUserActivity,
  fetchLog,
};
