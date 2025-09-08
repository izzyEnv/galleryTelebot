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
    const all = await menu.getAll();
    if (name) {
      return all.find(p => p && p.name === name) || null;
    }
    return all;
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
    return { message: `User '${trimmed}' deleted successfully.`, user: found };
  } finally {
    try { await api.close(); } catch {}
  }
}



module.exports = {
  fetchUserProfile,
  fetchHotspotProfile,
  fetchHotspotUsers,
  fetchSystemResource,
  addHotspotUser,
  deleteHotspotUser
};
