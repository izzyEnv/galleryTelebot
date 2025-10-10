const { RouterOSClient } = require("routeros-client");
const { mikrotik } = require("./config.js")

const { ip, user, password } = mikrotik


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
  } catch (error) {
    console.error('Error in fetchHotspotProfile:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchHotspotProfile:', closeError);
    }
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
  } catch (error) {
    console.error('Error in fetchHotspotUsers:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchHotspotUsers:', closeError);
    }
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
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchUserProfile:', closeError);
    }
  }
}



async function fetchSystemResource() {
  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const resource = await client.menu("/system/resource").getAll();
    return resource;
  } catch (error) {
    console.error('Error in fetchSystemResource:', error);
    throw error;
  } finally {
    try {
      await api.close();
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
  } catch (error) {
    console.error('Error in addHotspotUser:', error);
    throw error;
  } finally {
    try {
      await api.close();
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

  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    const menu = client.menu('/ip/hotspot/user');

    const [found] = await menu.where('name', trimmed).get();
    if (!found) {
      const error = new Error(`User '${trimmed}' not found.`);
      console.error('Error in deleteHotspotUser - user not found:', error.message);
      throw error;
    }

    await menu.remove(found.id);
    console.log(`User '${trimmed}' deleted successfully.`);

    return { message: `User '${trimmed}' deleted successfully.`, user: found };
  } catch (error) {
    console.error('Error in deleteHotspotUser:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in deleteHotspotUser:', closeError);
    }
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
  } catch (error) {
    console.error('Error in fetchUserActive:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchUserActive:', closeError);
    }
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
  } catch (error) {
    console.error('Error in fetchInterface:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in fetchInterface:', closeError);
    }
  }
}


async function addSimpleQueue(params) {
  // Pastikan params berisi name, target, dan max-limit
  if (!params.name || !params.target || !params['max-limit']) {
    const error = new Error("Parameters 'name', 'target', and 'max-limit' are required.");
    console.error('Error in addSimpleQueue - validation failed:', error.message);
    throw error;
  }

  const api = new RouterOSClient(mikrotik);
  try {
    const client = await api.connect();
    // Menggunakan menu yang benar untuk Simple Queue
    const menu = client.menu("/queue/simple");
    const data = await menu.add(params);
    console.log("Simple Queue added successfully:", data);
    return data;
  } catch (error) {
    console.error('Error in addSimpleQueue:', error);
    throw error;
  } finally {
    try {
      await api.close();
    } catch (closeError) {
      console.error('Error closing API connection in addSimpleQueue:', closeError);
    }
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
