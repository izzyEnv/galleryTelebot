const { RouterOSClient } = require("routeros-client");

const mikrotik = {
  host: process.env.IP_MTK,
  user: process.env.USER_MTK,
  password: process.env.PASS_MTK,
};

// ambil data userprofile dari mikrotik
async function fetchHotspotProfile(name) {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const menu = client.menu("/ip/hotspot/profile");
    const data = await menu.getAll();
    console.log(data);
    if (name) {
      return data.find(p => p && p.name === name) || null;
    }
    return data;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}


async function fetchHotspotUsers(name) {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const users = await client.menu("/ip/hotspot/user").getAll();
    console.log(users);
    if (name) {
      return users.find(n => n && n.name === name) || null;
      
    }
    return users;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}


async function fetchUserProfile(name) {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const menu = client.menu("/ip/hotspot/user/profile");
    const data = await menu.getAll();
    console.log(data);
    if (name) {
      return data.find(p => p && p.name === name) || null;
    }
    return data;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}



async function fetchSystemResource() {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const resource = await client.menu("/system/resource").getAll();
    return resource;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}

async function addHotspotUser(userData) {
  const { name, password, profile, comment } = userData;

  if (!name || !password) {
    throw new Error('Name and password are required');
  }

  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const newUser = await client.menu('/ip/hotspot/user').add({
      name,
      password,
      profile: profile || 'default',
      comment: comment || 'Added via Telegram Bot',
    });
    console.log('User created:', newUser);
    return newUser;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}




async function deleteHotspotUser(userName) {
  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    throw new Error('User name must be a non-empty string.');
  }
  const trimmed = userName.trim();

  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const menu = client.menu('/ip/hotspot/user');

    const [found] = await menu.where('name', trimmed).get();
    if (!found) {
      throw new Error(`User '${trimmed}' not found.`);
    }

    await menu.remove(found.id);
    console.log(`User '${trimmed}' deleted successfully.`);

    return { message: `User '${trimmed}' deleted successfully.`, user: found };
  } finally {
    try { await api.close(); } catch {}
  }
}

async function fetchUserActive(name) {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const users = await client.menu("/ip/hotspot/active").getAll();
    console.log(users);
    if (name) {
      return users.find(n => n && n.name === name) || null;
    }
    return users;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}

async function fetchInterface(name) {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const menu = client.menu("/interface");
    const data = await menu.getAll();
    
    if (name) {
      return data.find(i => i && i.name === name) || null;
    }
    return data;
  } finally {
    try {
      await api.close();
    } catch (_) { }
  }
}


async function addSimpleQueue(params) {
  // Pastikan params berisi name, target, dan max-limit
  if (!params.name || !params.target || !params['max-limit']) {
    console.error("Error: Parameters 'name', 'target', and 'max-limit' are required.");
    return;
  }

  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    // Menggunakan menu yang benar untuk Simple Queue
    const menu = client.menu("/queue/simple"); 
    const data = await menu.add(params);
    console.log("Simple Queue added successfully:", data);
  } catch (err) {
    console.error("Error adding Simple Queue:", err);
  } finally { 
    try {
      await api.close();
    } catch (_) { }
  }
}

module.exports = {
  fetchUserProfile,
  fetchHotspotProfile,
  fetchHotspotUsers,
  fetchSystemResource,
  addHotspotUser,
  deleteHotspotUser,
  fetchUserActive,
  addSimpleQueue,
  fetchInterface,
};
