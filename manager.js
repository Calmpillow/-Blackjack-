"use strict";
// Velvet North Control — local-only control center for the self-hosted game server.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const os = require('node:os');
const MANAGER_PORT = Number(process.env.MANAGER_PORT || 8788);
const GAME_PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const LOG = path.join(ROOT, 'server', 'velvet-north-server.log');
let child = null, startedAt = null, lastExit = null, starting = false;
function writeLog(line) { fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${line}\n`); }
function status() {
  const running = !!child && child.exitCode === null && !child.killed;
  return { ok: true, running, starting, port: GAME_PORT, managerPort: MANAGER_PORT, startedAt, lastExit, localGameUrl: `http://127.0.0.1:${GAME_PORT}/`, localManagerUrl: `http://127.0.0.1:${MANAGER_PORT}/`, networkInterfaces: Object.values(os.networkInterfaces()).flat().filter(x => x && x.family === 'IPv4' && !x.internal).map(x => x.address) };
}
function startGame() {
  if (child && child.exitCode === null) return { ok: true, alreadyRunning: true };
  if (starting) return { ok: true, starting: true };
  starting = true; lastExit = null;
  const log = fs.createWriteStream(LOG, { flags: 'a' });
  writeLog('Starting Velvet North Network');
  child = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { cwd: path.join(ROOT, 'server'), env: { ...process.env, PORT: String(GAME_PORT) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  child.once('spawn', () => { starting = false; startedAt = new Date().toISOString(); writeLog(`Game server process started (PID ${child.pid})`); });
  child.once('error', err => { starting = false; lastExit = `Could not start: ${err.message}`; writeLog(lastExit); log.end(); });
  child.once('exit', (code, signal) => { starting = false; lastExit = `Exited (code ${code}, signal ${signal || 'none'})`; writeLog(lastExit); startedAt = null; log.end(); });
  return { ok: true, starting: true };
}
function stopGame() {
  if (!child || child.exitCode !== null) return { ok: true, alreadyStopped: true };
  writeLog('Stop requested from Velvet North Control');
  child.kill('SIGTERM');
  return { ok: true, stopping: true };
}
function restartGame() {
  if (!child || child.exitCode !== null) return startGame();
  const old = child;
  writeLog('Restart requested from Velvet North Control');
  old.once('exit', () => setTimeout(startGame, 250));
  old.kill('SIGTERM');
  return { ok: true, restarting: true };
}
function json(res, code, data) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(data)); }
const app = http.createServer(async (req, res) => {
  const host = String(req.headers.host || '').toLowerCase();
  if (!['127.0.0.1:' + MANAGER_PORT, 'localhost:' + MANAGER_PORT, '[::1]:' + MANAGER_PORT].includes(host)) return json(res, 403, { error: 'local-only' });
  const url = new URL(req.url, `http://127.0.0.1:${MANAGER_PORT}`);
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'GET' && url.pathname === '/api/status') {
      const s = status();
      try { const r = await fetch(`http://127.0.0.1:${GAME_PORT}/health`, { signal: AbortSignal.timeout(900) }); s.health = r.ok ? await r.json() : null; } catch { s.health = null; }
      try { const r = await fetch(`http://127.0.0.1:${GAME_PORT}/api/rooms`, { signal: AbortSignal.timeout(900) }); s.rooms = r.ok ? (await r.json()).rooms : []; } catch { s.rooms = []; }
      return json(res, 200, s);
    }
    if (req.method === 'POST' && req.headers.origin && !['http://127.0.0.1:' + MANAGER_PORT, 'http://localhost:' + MANAGER_PORT].includes(req.headers.origin)) return json(res, 403, { error: 'origin-not-allowed' });
    if (req.method === 'POST' && url.pathname === '/api/start') return json(res, 200, startGame());
    if (req.method === 'POST' && url.pathname === '/api/stop') return json(res, 200, stopGame());
    if (req.method === 'POST' && url.pathname === '/api/restart') return json(res, 200, restartGame());
    if (req.method === 'GET' && url.pathname === '/api/log') {
      let lines = []; try { lines = fs.readFileSync(LOG, 'utf8').split(/\r?\n/).filter(Boolean).slice(-100); } catch {}
      return json(res, 200, { lines });
    }
    return json(res, 404, { error: 'not-found' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method-not-allowed' });
  const page = fs.readFileSync(path.join(ROOT, 'manage.html'));
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(page);
});
app.listen(MANAGER_PORT, '127.0.0.1', () => {
  console.log(`Velvet North Control is available at http://127.0.0.1:${MANAGER_PORT}/`);
  if (process.argv.includes('--open')) {
    const opener = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', `http://127.0.0.1:${MANAGER_PORT}/`] : [`http://127.0.0.1:${MANAGER_PORT}/`];
    const p = spawn(opener, args, { detached: true, stdio: 'ignore' }); p.unref();
  }
});
process.on('SIGINT', () => { stopGame(); app.close(() => process.exit(0)); });
process.on('SIGTERM', () => { stopGame(); app.close(() => process.exit(0)); });
