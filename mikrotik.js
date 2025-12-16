// mikrotik.js
const { RouterOSClient } = require("node-routeros");

const client = new RouterOSClient({
  host: process.env.MIKROTIK_HOST || "192.168.88.1",
  user: process.env.MIKROTIK_USER || "admin",
  password: process.env.MIKROTIK_PASS || "",
  port: 8728,
  timeout: 5000, // IMPORTANT: prevents NaN timeout error
});

let connected = false;

/**
 * Ensure MikroTik connection
 */
async function connect() {
  if (!connected) {
    await client.connect();
    connected = true;
    console.log("✅ Connected to MikroTik");
  }
}

/**
 * Create Hotspot User
 */
async function createHotspotUser({ username, password, profile }) {
  await connect();

  return client.write("/ip/hotspot/user/add", {
    name: username,
    password,
    profile: profile,
  });
}

/**
 * Remove Hotspot User
 */
async function removeHotspotUser(username) {
  await connect();

  const users = await client.write("/ip/hotspot/user/print", {
    "?name": username,
  });

  if (!users.length) return false;

  return client.write("/ip/hotspot/user/remove", {
    ".id": users[0][".id"],
  });
}

/**
 * Disconnect active Hotspot session
 */
async function disconnectUser(username) {
  await connect();

  const active = await client.write("/ip/hotspot/active/print", {
    "?user": username,
  });

  if (!active.length) return false;

  return client.write("/ip/hotspot/active/remove", {
    ".id": active[0][".id"],
  });
}

/**
 * Close connection safely
 */
async function close() {
  if (connected) {
    await client.close();
    connected = false;
    console.log("🔌 MikroTik connection closed");
  }
}

module.exports = {
  createHotspotUser,
  removeHotspotUser,
  disconnectUser,
  close,
};
