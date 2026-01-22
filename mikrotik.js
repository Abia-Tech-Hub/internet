// mikrotik.js
import { RouterOSClient } from "node-routeros";

const client = new RouterOSClient({
  host: process.env.MIKROTIK_HOST || "192.168.88.1",
  user: process.env.MIKROTIK_USER || "admin",
  password: process.env.MIKROTIK_PASS || "",
  port: 8728,
  timeout: 5000,
});

let connected = false;

async function connect() {
  if (!connected) {
    await client.connect();
    connected = true;
    console.log("✅ Connected to MikroTik");
  }
}

export async function createHotspotUser({ username, password, profile }) {
  await connect();
  console.log("Creating MikroTik user:", username);
  return client.write("/ip/hotspot/user/add", { name: username, password, profile });
}

export async function removeHotspotUser(username) {
  await connect();
  const users = await client.write("/ip/hotspot/user/print", { "?name": username });
  if (!users.length) return false;
  return client.write("/ip/hotspot/user/remove", { ".id": users[0][".id"] });
}

export async function disconnectUser(username) {
  await connect();
  const active = await client.write("/ip/hotspot/active/print", { "?user": username });
  if (!active.length) return false;
  return client.write("/ip/hotspot/active/remove", { ".id": active[0][".id"] });
}

export async function close() {
  if (connected) {
    await client.close();
    connected = false;
    console.log("🔌 MikroTik connection closed");
  }
}
