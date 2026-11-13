"use strict";
// End-to-end smoke test for the original HTTP + WebSocket multiplayer service.
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const PORT = 18787;
const base = `http://127.0.0.1:${PORT}`;
const wsUrl = `ws://127.0.0.1:${PORT}/ws`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer(child) {
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error(`Server exited early (${child.exitCode})`);
    try { const r = await fetch(`${base}/health`); if (r.ok) return; } catch {}
    await sleep(100);
  }
  throw new Error("Server did not become healthy");
}
function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error("WebSocket connection timed out")), 3000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(ws); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket connection failed")); }, { once: true });
  });
}
function nextMessage(ws, expected, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.removeEventListener("message", onMessage); reject(new Error(`Timed out waiting for ${expected}`)); }, timeout);
    function onMessage(event) {
      let data; try { data = JSON.parse(event.data); } catch { return; }
      if (data.type !== expected) return;
      clearTimeout(timer); ws.removeEventListener("message", onMessage); resolve(data);
    }
    ws.addEventListener("message", onMessage);
  });
}
(async () => {
  const child = spawn(process.execPath, ["server.js"], { cwd: __dirname, env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  let host, guest;
  try {
    await waitForServer(child);
    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.ok, true);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Velvet North/i);
    host = await connect();
    const registeredPromise = nextMessage(host, "registered");
    host.send(JSON.stringify({ type: "host", roomCode: "SMOKETEST", name: "Smoke Test Table" }));
    const registered = await registeredPromise;
    assert.equal(registered.roomCode, "SMOKETEST");
    guest = await connect();
    const joinedPromise = nextMessage(guest, "joined");
    const helloPromise = nextMessage(host, "peer-message");
    guest.send(JSON.stringify({ type: "join", roomCode: "SMOKETEST", name: "Guest Tester" }));
    const joined = await joinedPromise;
    const hello = await helloPromise;
    assert.equal(joined.roomCode, "SMOKETEST");
    assert.equal(hello.payload.name, "Guest Tester");
    const directory = await (await fetch(`${base}/api/rooms`)).json();
    assert.equal(directory.rooms.length, 1);
    assert.equal(directory.rooms[0].players, 2);
    console.log("Integration test passed: website HTTP, health, room creation, guest join, host relay, and live directory.");
  } finally {
    if (guest) guest.close();
    if (host) host.close();
    child.kill("SIGTERM");
    await sleep(150);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
