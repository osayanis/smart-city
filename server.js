// Local server for the talk: serves the board (http://localhost:8080) and the phone page (http://<this computer>:8080/phone),
// and keeps them in sync with Server-Sent Events. No dependencies, nothing written to disk: votes live in memory only.
'use strict';
const http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path'), os = require('os'), { execFile } = require('child_process');
const QR = require('./js/qr.js');
const POLLS = require('./js/polls.js');

const PORT = +process.env.PORT || 8080;
const ROOT = __dirname;
const SERVED = ['index.html', 'css/', 'js/', 'vendor/', 'phone/'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const REACTIONS = ['😮', '😤', '😂', '👏', '💡', '❤️'];

/* this computer's addresses: the board must run here, phones reach it on the local network */
function addresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push({ name, ip: a.address });
  const rank = ip => ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : ip.startsWith('172.') ? 2 : 3;
  return out.sort((a, b) => rank(a.ip) - rank(b.ip));
}
const lanIp = () => (addresses()[0] || { ip: 'localhost' }).ip;
const newToken = () => crypto.randomBytes(3).toString('hex');   // 6 characters, in the QR code: a new one every time we start again
const phoneUrl = () => (process.env.PHONE_URL || `http://${lanIp()}:${PORT}/phone/`) + '?s=' + session;
function isThisComputer(req) {
  const ip = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  return ip === '127.0.0.1' || ip === '::1' || addresses().some(a => a.ip === ip);
}

/* shared state */
let session = newToken();   // changes at every restart of the talk: old QR codes and old phones are let go
let state = null;                       // the moment on the board, sent by the board
const votes = new Map();                // poll id -> Map(phone id -> choice)
const lastReact = new Map();            // phone id -> time, to keep reactions reasonable
const phones = new Set(), boards = new Set();

function results() {
  const out = {};
  for (const p of POLLS) {
    const counts = new Array(p.options.length).fill(0), m = votes.get(p.id);
    if (m) for (const c of m.values()) counts[c]++;
    out[p.id] = counts;
  }
  return out;
}
function send(res, event, data) { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) {} }
function broadcast(set, event, data) { for (const res of set) send(res, event, data); }
const counts = () => ({ phones: phones.size });
let resultsTimer = null;
function pushResults() {   // at most every 300 ms, however fast people vote
  if (resultsTimer) return;
  resultsTimer = setTimeout(() => { resultsTimer = null; const r = results(); broadcast(phones, 'results', r); broadcast(boards, 'results', r); }, 300);
}

function readJson(req, max = 4096) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > max) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const validId = s => typeof s === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(s);

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  if (rel === '') rel = 'index.html';
  if (rel === 'phone') { res.writeHead(301, { Location: '/phone/' }); return res.end(); }
  if (rel === 'phone/') rel = 'phone/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || !SERVED.some(p => rel === p || rel.startsWith(p))) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), p = url.pathname;
  try {
    if (p === '/api/events' && req.method === 'GET') {
      const role = url.searchParams.get('role') === 'board' ? 'board' : 'phone';
      if (role === 'board' && !isThisComputer(req)) return json(res, 403, { error: 'The board runs on the presenting computer.' });
      if (phones.size > 400 && role === 'phone') return json(res, 503, { error: 'full' });
      if (role === 'phone' && url.searchParams.get('s') !== session) {   // an old QR code, or a phone that was let go
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
        res.write('retry: 600000\n\n'); send(res, 'ended', {}); return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 2000\n\n');
      const set = role === 'board' ? boards : phones; set.add(res);
      send(res, 'hello', { phoneUrl: phoneUrl(), session });
      if (state) send(res, 'state', state);
      send(res, 'results', results());
      broadcast(boards, 'count', counts());
      const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 20000);
      req.on('close', () => { clearInterval(ping); set.delete(res); broadcast(boards, 'count', counts()); });
      return;
    }
    if (p === '/api/info') return json(res, 200, { phoneUrl: phoneUrl(), phones: phones.size });
    if (p === '/api/qr.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
      return res.end(QR.svg(phoneUrl(), { label: 'QR code to open the phone page' }));
    }
    if (p === '/api/state' && req.method === 'POST') {
      if (!isThisComputer(req)) return json(res, 403, { error: 'Only the board can change the moment.' });
      const b = await readJson(req, 16384);
      state = {
        i: +b.i || 0, n: +b.n || 0, id: String(b.id || ''), part: String(b.part || ''), partName: Array.isArray(b.partName) ? b.partName.map(String) : ['', ''],
        clock: String(b.clock || ''), place: String(b.place || ''), cap: String(b.cap || ''), fr: String(b.fr || ''), src: String(b.src || ''),
        lost: b.lost == null ? null : +b.lost, ids: Array.isArray(b.ids) ? b.ids.map(String) : [], t: Date.now(),
      };
      broadcast(phones, 'state', state); broadcast(boards, 'state', state);
      return json(res, 200, { ok: true });
    }
    if (p === '/api/reset' && req.method === 'POST') {
      if (!isThisComputer(req)) return json(res, 403, { error: 'no' });
      votes.clear(); lastReact.clear(); session = newToken();
      for (const ph of phones) { send(ph, 'ended', {}); try { ph.end(); } catch (e) {} }   // everyone is let go
      phones.clear();
      broadcast(boards, 'reset', { phoneUrl: phoneUrl() }); broadcast(boards, 'results', results()); broadcast(boards, 'count', counts());
      console.log(`\n  Nouvelle session : tout le monde a été déconnecté. Nouveau lien : ${phoneUrl()}\n\n` + QR.terminal(phoneUrl()) + '\n');
      return json(res, 200, { ok: true });
    }
    if (p === '/api/vote' && req.method === 'POST') {
      const b = await readJson(req), poll = POLLS.find(q => q.id === b.poll), c = +b.choice;
      if (b.s !== session) return json(res, 410, { error: 'ended' });
      if (!validId(b.pid) || !poll || !Number.isInteger(c) || c < 0 || c >= poll.options.length) return json(res, 400, { error: 'bad vote' });
      if (!votes.has(poll.id)) votes.set(poll.id, new Map());
      votes.get(poll.id).set(b.pid, c); pushResults();
      return json(res, 200, { ok: true });
    }
    if (p === '/api/react' && req.method === 'POST') {
      const b = await readJson(req), now = Date.now();
      if (b.s !== session) return json(res, 410, { error: 'ended' });
      if (!validId(b.pid) || !REACTIONS.includes(b.emoji)) return json(res, 400, { error: 'bad reaction' });
      if (now - (lastReact.get(b.pid) || 0) < 350) return json(res, 429, { error: 'slow down' });
      lastReact.set(b.pid, now);
      broadcast(boards, 'react', { emoji: b.emoji });
      return json(res, 200, { ok: true });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveStatic(req, res, p);
  } catch (e) {
    json(res, 400, { error: 'bad request' });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  Le port ${PORT} est déjà pris. Fermez l’autre serveur, ou lancez : PORT=8081 npm start\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, '0.0.0.0', () => {
  const url = phoneUrl();
  console.log(`\n  One Day, Two Towns\n\n  Tableau (sur cet ordinateur) :   http://localhost:${PORT}\n  Téléphones (même Wi-Fi) :        ${url}\n`);
  if (addresses().length > 1) console.log('  Autres adresses : ' + addresses().slice(1).map(a => `${a.ip} (${a.name})`).join(', ') + '\n');
  console.log(QR.terminal(url) + '\n');
  console.log('  Si les téléphones n’arrivent pas à se connecter, le Wi-Fi de l’école isole peut-être les appareils.');
  console.log('  Solution : partage de connexion d’un téléphone pour l’ordinateur et le public, puis relancer le serveur.\n');
  console.log('  Ctrl+C pour arrêter.\n');
  if (process.argv.includes('--open') && process.platform === 'darwin') execFile('open', [`http://localhost:${PORT}`]);
});
