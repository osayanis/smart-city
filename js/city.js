(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!window.THREE) { $('#nogl').hidden = false; return; }
const T = THREE;

/* ------------------------------------------------------------------ content */
const ACTS = [
  { label: 'Act I', q: 'Which problems can it solve?' },
  { label: 'Act II', q: 'Is the data safe?' },
  { label: 'Act III', q: 'How do we convince people?' },
  { label: 'Verdict', q: 'My advice to the mayor' },
];
const INTRO_NOTES = "Good morning. Today I am the IT technician of our town hall. The mayor wants to turn our town into a smart city, and he needs my advice to make the best decision. I built this model to answer his three questions: which problems a smart city can solve, how to keep the data safe, and how to convince people. First, look at our town as it is today.";

const STOPS = [
  { short: 'Crossroads', act: 0, title: 'The crossroads', key: 'Document C · key 4 · Urban mobility',
    anchor: [0, 3.2, 0], view: { t: [0, 0, 0], az: 38, el: 36, d: 30 },
    today: 'The lights run on timers. They turn red even when the other street is empty, so queues grow for nothing and engines keep running.',
    answer: '<p>Sensors in the road count the cars that are waiting. Each light gives green to the busiest direction and tells the next crossroads what is coming.</p>',
    watch: 'Switch modes and look at the queues. The dashboard counts the cars waiting right now.',
    proof: 'In Pittsburgh, adaptive lights called Surtrac cut travel time by about 25% and waiting at red lights by about 40%.',
    src: 'Figures reported by the Carnegie Mellon team for the first pilot.',
    notes: "First problem: traffic. Today our traffic lights run on a timer, so cars wait at a red light even when nobody is crossing. With sensors, the lights adapt to the real traffic. In Pittsburgh, adaptive lights cut travel time by about 25 percent. Less waiting also means less pollution." },
  { short: 'Bus line', act: 0, title: 'The bus line', key: 'Document C · key 4 · Sustainable public transport',
    anchor: [14, 3, 4], view: { t: [13.5, 1, 3], az: 62, el: 24, d: 17 },
    today: 'Nobody knows when the bus will come. People wait in the cold, then give up and take the car.',
    answer: '<p>Every bus shares its position. The stop shows the real waiting time, the app tells you when to leave home, and the lights let the bus go first.</p>',
    watch: 'In smart mode the screen at the stop counts down, and the lights turn green when the bus arrives.',
    notes: "If we want fewer cars, the bus must be reliable. With GPS on every bus, the stop shows the real waiting time, and the traffic lights let the bus go first. A bus that is on time is the best argument against the car." },
  { short: 'Bins', act: 0, title: 'The bins', key: 'Document C · key 5 · Smart waste management',
    anchor: [-3.3, 2.6, 8.2], view: { t: [-3.2, 0.5, 8.4], az: 74, el: 30, d: 16 },
    today: 'The truck follows the same round every day. It stops at half-empty bins and comes too late for the full ones.',
    answer: '<p>A small sensor measures how full each bin is. The truck only stops where it is needed. Fewer trips, less fuel, cleaner streets.</p>',
    watch: 'The lids show how full each bin is: green, amber, red. In ordinary mode the truck stops at every bin. In smart mode it skips the empty ones.',
    notes: "Waste is a problem everybody can see. Today the truck stops at every bin, full or not, and it comes too late for the full ones. With a fill sensor, it only goes where it is needed. It saves fuel and time, and the street stays clean." },
  { short: 'Streetlights', act: 0, title: 'The streetlights', key: 'Document C · keys 2 and 6 · Automation and environment',
    anchor: [0, 4.4, -24], view: { t: [0, 1, -23], az: 8, el: 20, d: 20 },
    today: 'Every lamp burns at full power from dusk to dawn, even on an empty street at three in the morning.',
    answer: '<p>LED lamps stay dimmed when nobody is around and light up when a car or a walker passes. A broken lamp reports itself.</p>',
    watch: 'Look along the avenue in smart mode: the light follows the cars. The dashboard shows the power used by street lighting.',
    proof: 'In 2017, Dijon Métropole signed a 12-year, 105 million euro contract to run its 23 towns from one control centre. Its target: 65% less energy for street lighting.',
    src: 'The 65% is a target written in the contract, not a measured result.',
    notes: "Street lighting is a big part of a town's electricity bill. With LED and presence detection, the light is there when people need it and dimmed when the street is empty. In France, Dijon set a target of 65 percent energy savings on public lighting." },
  { short: 'Rooftops', act: 0, title: 'The rooftops', key: 'Document C · key 6 · Environmental sustainability',
    anchor: [-24, 5, 24], view: { t: [-24, 1.5, 24], az: -38, el: 34, d: 25 },
    today: 'The town buys all its energy from outside, and nobody measures the air people breathe.',
    answer: '<p>Solar panels on roofs, a wind turbine, and a smart grid that sends energy where it is needed. Air sensors warn people with asthma on bad days.</p>',
    watch: 'Panels appear on the roofs in smart mode. On the dashboard, the air index follows the number of cars waiting with their engine on.',
    notes: "A smart city also produces and saves energy: solar panels, a smart grid, and air quality sensors. The data helps us act. On a polluted day, we can warn people and change the traffic." },
  { short: 'School', act: 0, title: 'The school', key: 'Document C · key 8 · Technologies applied to education',
    anchor: [24, 5.4, 25], view: { t: [24, 1.5, 24], az: -140, el: 30, d: 21 },
    today: 'Some pupils have a computer and fast internet at home. Others do not.',
    answer: '<p>Fast Wi-Fi in every classroom, a digital workspace shared with parents, and laptops lent to the families who need them.</p>',
    watch: 'The rings above the school show the connected classrooms in smart mode.',
    notes: "In education, the goal is equality. Every pupil gets the same access: Wi-Fi at school, a digital workspace shared with the parents, and laptops lent to families. The school can also teach children how their data is used." },
  { short: 'Hospital', act: 0, title: 'The hospital', key: 'Document C · key 9 · Technologies applied to health',
    anchor: [24.5, 7.2, -25.5], view: { t: [24.5, 2.5, -24], az: -40, el: 40, d: 34 },
    today: 'Long waits, and elderly people travel far for a simple check-up.',
    answer: '<p>Video consultations, and connected devices that send a heart rate or a blood sugar level to the doctor. Patients stay home, and the emergency room stays free for emergencies.</p>',
    watch: 'In smart mode, links connect the hospital to the homes nearby. Health data is the most sensitive data a town can touch. That leads to the second question.',
    notes: "Health: video consultations and remote monitoring help elderly people stay at home. But health data is very sensitive. And that brings me to the second question: how can we be sure the data is safe?" },
  { short: 'Server room', act: 1, title: 'The server room', key: 'My job: IT technician, BTS CIEL',
    anchor: [-24.5, 4.6, -24.5], view: { t: [-24, 2, -24], az: 48, el: 30, d: 30 },
    labA: 'The risk', labB: 'How I protect it',
    today: 'A smart city collects data all day long. If an attacker gets in, they can switch off the streetlights, block the traffic lights or read people’s data.',
    answer: '<ul><li><b>Encrypt everything.</b> Data travels over TLS and is stored encrypted.</li><li><b>Separate the networks.</b> Sensors live on their own network, behind a firewall. A hacked bin cannot reach the town hall.</li><li><b>Control access.</b> Each employee sees only what their job needs, with two-factor login.</li><li><b>Patch, test, back up.</b> Update every device, pay for regular penetration tests, keep offline backups.</li><li><b>Stay in Europe.</b> Host the data in the EU, under the GDPR.</li></ul>',
    special: 'attack',
    watch: 'Run the attack in both modes. Without the firewall, it reaches the servers.',
    notes: "This is the part I study in my BTS CIEL: cybersecurity. My five rules: encrypt the data, separate the networks, control who has access, update and test everything, and keep the data in Europe under the GDPR. Let me show you an attack. Without protection, it reaches the servers. With the firewall and a separate network, it is blocked." },
  { short: 'Sensor', act: 1, title: 'The sensor box', key: 'Privacy by design',
    anchor: [2.7, 3.8, 2.7], view: { t: [2.7, 2.6, 2.7], az: 45, el: 12, d: 8 },
    labA: 'The fear', labB: 'My rule: count, don’t film',
    today: 'People are afraid of being watched. A camera on every corner looks like surveillance, even when it is not.',
    answer: '<p>Collect only what we need. This sensor counts cars. It does not film faces or read number plates. The data is made anonymous inside the box, before it leaves the street, and the raw data is deleted after 30 days.</p>',
    special: 'json',
    proof: 'The GDPR (2018) makes this the law: collect the minimum, say why, and delete on time. In France, the CNIL can check us.',
    proofLab: 'The law',
    notes: "Security is one thing, privacy is another. My rule is: count, don't film. This sensor sends a number, not a picture. Here is exactly what it sends: a number of cars, a time and a direction. Nothing about a person. The GDPR says the same: minimum data, a clear purpose, and a limited time." },
  { short: 'Town hall', act: 2, title: 'The town hall', key: 'Document C · keys 11 and 12 · Transparency and open data',
    anchor: [-8.5, 8.6, -8], view: { t: [-6, 2.6, -9.5], az: 96, el: 14, d: 17 },
    labA: 'The problem', labB: 'Show everything',
    today: 'When people don’t know what is collected, they imagine the worst.',
    answer: '<p>Everything the town measures is published as open data, live, like the screen in front of the town hall. Every sensor carries a QR code: scan it to see what it measures, why, and who uses the data.</p>',
    watch: 'In ordinary mode the screen shows opening hours. In smart mode it shows the live data of the town.',
    proof: 'Toronto, 2020: Sidewalk Labs, a sister company of Google, dropped its smart neighbourhood project. It blamed the economy, but the project had faced years of criticism about privacy and data control.',
    proofLab: 'The counter-example',
    notes: "Third question: how do we convince people? First, with transparency. If people don't know what we collect, they imagine the worst. So we publish everything: open data, live, on a public dashboard. Every sensor has a QR code that explains what it does. Toronto is the counter-example: a smart district project was dropped in 2020 after years of criticism about privacy." },
  { short: 'Main square', act: 2, title: 'The main square', key: 'Document C · key 7 · Concern for the social environment',
    anchor: [8, 3, -8], view: { t: [8, 0.5, -8], az: 140, el: 38, d: 19 },
    labA: 'The risk', labB: 'Do it with people',
    today: 'A project decided without the citizens is a project they will reject.',
    answer: '<p>Start small: one pilot district for one year. Then show the results in everyday words, like "twelve minutes less in traffic", not "throughput +23%". Let people report a pothole or vote on the next project in an app, and keep a phone line and a desk at the town hall for those who are not online.</p>',
    watch: 'In smart mode, the hearts rising from the square are votes on the next project.',
    notes: "Then, we involve people. We start with a pilot in one district, we measure, and we explain the results in simple words. Citizens can vote and report problems in an app. And we never forget people who are not comfortable with digital tools: there is always a human at the town hall." },
  { short: 'My advice', act: 3, title: 'My advice', key: 'To the mayor',
    anchor: [8, 19.5, -24], view: { t: [0, -2, 0], az: -32, el: 36, d: 100 },
    special: 'advice',
    notes: "To conclude, my advice to the mayor: yes, but step by step. Start with traffic and lighting, protect the data from day one, and stay transparent. For me, a smart city is not a city full of sensors. It is a city that listens to its people, and protects what it hears. Thank you. Do you have any questions?" },
];

/* ------------------------------------------------------------------ helpers */
const css = n => getComputedStyle(root).getPropertyValue(n).trim();
const col = n => new T.Color(css(n) || '#ff00ff').convertSRGBToLinear();
const num = n => parseFloat(css(n)) || 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
const D2R = Math.PI / 180;
let seed = 20261031;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rr = (a, b) => a + (b - a) * rnd();
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ------------------------------------------------------------------ renderer */
const canvas = $('#scene');
let renderer;
try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) { $('#nogl').hidden = false; return; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new T.Scene();
scene.fog = new T.Fog(0x2a1a12, 60, 200);
const camera = new T.PerspectiveCamera(36, 1, 0.5, 500);

const hemi = new T.HemisphereLight(0xffffff, 0x000000, .8);
scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 1.2);
sun.position.set(-42, 40, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 160 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

/* ------------------------------------------------------------------ textures */
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function ctex(c, srgb = true) { const t = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }

const winTex = (() => {
  const S = 512, [c, g] = cnv(S, S), [e, h] = cnv(S, S), cell = S / 8;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  h.fillStyle = '#000000'; h.fillRect(0, 0, S, S);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const ww = cell * .5, wh = cell * .48, ox = i * cell + (cell - ww) / 2, oy = j * cell + cell * .2;
    g.fillStyle = '#4b4f58'; g.fillRect(ox, oy, ww, wh);
    g.fillStyle = '#d8d0c4'; g.fillRect(ox - 3, oy + wh, ww + 6, 4);
    if (rnd() < .44) {
      const v = Math.round(rr(150, 255));
      const gr = h.createLinearGradient(0, oy, 0, oy + wh);
      gr.addColorStop(0, `rgb(${v},${v},${v})`); gr.addColorStop(1, `rgb(${v * .6 | 0},${v * .6 | 0},${v * .6 | 0})`);
      h.fillStyle = gr; h.fillRect(ox, oy, ww, wh);
      g.fillStyle = '#8a8070'; g.fillRect(ox, oy, ww, wh);
    }
  }
  const map = ctex(c), emi = ctex(e);
  for (const t of [map, emi]) { t.wrapS = t.wrapT = T.RepeatWrapping; }
  return { map, emi };
})();
const glowTex = (() => {
  const [c, g] = cnv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c, false);
})();
const ringTex = (() => {
  const [c, g] = cnv(128, 128); g.strokeStyle = '#fff'; g.lineWidth = 7; g.shadowColor = '#fff'; g.shadowBlur = 10;
  g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.stroke(); return ctex(c, false);
})();
const heartTex = (() => {
  const [c, g] = cnv(64, 64); g.fillStyle = '#fff'; g.beginPath();
  g.moveTo(32, 54); g.bezierCurveTo(4, 36, 6, 10, 22, 10); g.bezierCurveTo(28, 10, 32, 15, 32, 19);
  g.bezierCurveTo(32, 15, 36, 10, 42, 10); g.bezierCurveTo(58, 10, 60, 36, 32, 54); g.fill(); return ctex(c, false);
})();
const flagTex = (() => { const [c, g] = cnv(96, 64); ['#2b4aa0', '#f4f1ea', '#d2373c'].forEach((f, i) => { g.fillStyle = f; g.fillRect(i * 32, 0, 32, 64); }); return ctex(c); })();
const heliTex = (() => {
  const [c, g] = cnv(128, 128); g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.strokeStyle = '#f2efe8'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke();
  g.fillStyle = '#f2efe8'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 64, 68); return ctex(c);
})();
const qrTex = (() => {
  const [c, g] = cnv(84, 84); g.fillStyle = '#fff'; g.fillRect(0, 0, 84, 84); g.fillStyle = '#111';
  for (let i = 0; i < 21; i++) for (let j = 0; j < 21; j++) if (rnd() < .45) g.fillRect(i * 4, j * 4, 4, 4);
  for (const [x, y] of [[0, 0], [56, 0], [0, 56]]) { g.fillStyle = '#111'; g.fillRect(x, y, 28, 28); g.fillStyle = '#fff'; g.fillRect(x + 4, y + 4, 20, 20); g.fillStyle = '#111'; g.fillRect(x + 8, y + 8, 12, 12); }
  const t = ctex(c); t.magFilter = T.NearestFilter; return t;
})();
const [clockC, clockG] = cnv(128, 128); const clockTex = ctex(clockC);
function drawClock() {
  const g = clockG, d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, m = d.getMinutes();
  g.fillStyle = '#f6efe2'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.strokeStyle = '#2a2018'; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); g.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54); g.stroke(); }
  const hand = (a, l, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(a) * l, 64 - Math.cos(a) * l); g.stroke(); };
  hand(h / 12 * Math.PI * 2, 30, 6); hand(m / 60 * Math.PI * 2, 44, 4); clockTex.needsUpdate = true;
}
drawClock(); setInterval(drawClock, 30000);

/* ------------------------------------------------------------------ materials (themed) */
const themed = [];
function tm(token, opts = {}, prop = 'color') {
  const m = new T.MeshStandardMaterial(Object.assign({ roughness: .9, metalness: 0 }, opts));
  themed.push([m, prop, token]); return m;
}
const M = {
  edge: tm('--s-edge'), base: tm('--s-base'), grass: tm('--s-grass'), walk: tm('--s-walk'), pave: tm('--s-pave'), road: tm('--s-road', { roughness: .95 }),
  mark: tm('--s-mark', { roughness: .6 }), stone: tm('--s-stone'), white: tm('--s-white'), dark: tm('--s-dark', { roughness: .6 }),
  roof: tm('--s-roof'), tile: tm('--s-tile'), tree: tm('--s-tree'), trunk: tm('--s-trunk'), court: tm('--s-court'),
  panel: tm('--s-panel', { roughness: .35, metalness: .4 }), bin: tm('--s-bin', { roughness: .6 }),
  water: tm('--s-water', { roughness: .15, metalness: .2 }), b1: tm('--s-b1'), b3: tm('--s-b3'),
};
const glowMats = [];
const sideMats = {};
function sideMat(token) {
  if (sideMats[token]) return sideMats[token];
  const m = tm(token, { map: winTex.map, emissiveMap: winTex.emi, emissive: new T.Color(1, 1, 1), roughness: .85 });
  themed.push([m, 'emissive', '--s-window']); glowMats.push(m);
  return (sideMats[token] = m);
}
const accentMats = [];
function am(mat) { accentMats.push(mat); return mat; }
const addMatAccent = (opts = {}) => am(new T.MeshBasicMaterial(Object.assign({ transparent: true, depthWrite: false, toneMapped: false }, opts)));
const spriteAccent = (opts = {}) => am(new T.SpriteMaterial(Object.assign({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }, opts)));

/* ------------------------------------------------------------------ geometry helpers */
function mbox(w, h, d, mat, x, y, z, parent = scene, shadow = true) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function mcyl(rt, rb, h, seg, mat, x, y, z, parent = scene, shadow = true) {
  const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y + h / 2, z);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function addBuilding(x, z, w, d, h, token, base = .25, parent = scene) {
  const geo = new T.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const ou = Math.floor(rnd() * 8) / 8, ov = Math.floor(rnd() * 4) / 8;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 16 + ou, uv.getY(i) * dims[f][1] / 20.8 + ov);
  }
  geo.translate(0, h / 2, 0);
  const s = sideMat(token), m = new T.Mesh(geo, [s, s, M.roof, M.roof, s, s]);
  m.position.set(x, base, z); m.castShadow = m.receiveShadow = true; parent.add(m);
  return m;
}
function gable(x, y, z, len, width, height, mat, alongX = true) {
  const sh = new T.Shape(); sh.moveTo(-width / 2, 0); sh.lineTo(width / 2, 0); sh.lineTo(0, height); sh.lineTo(-width / 2, 0);
  const geo = new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2);
  if (alongX) geo.rotateY(Math.PI / 2);
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}
const TREES = [];
const addTree = (x, z, s = 1, y = .25) => TREES.push([x, z, s * rr(.8, 1.2), y]);

/* ------------------------------------------------------------------ the tile */
const ROADS = [-16, 0, 16], HALF = 36, BLOCK = [-24, -8, 8, 24];
{
  const top = new T.Mesh(new T.BoxGeometry(72, 4, 72), [M.edge, M.edge, M.grass, M.edge, M.edge, M.edge]);
  top.position.y = -2; top.receiveShadow = true; scene.add(top);
  mbox(75, .8, 75, M.base, 0, -4.8, 0, scene, false);
  for (const r of ROADS) {
    mbox(72, .04, 4, M.road, 0, 0, r, scene, false);
    mbox(4, .04, 72, M.road, r, .001, 0, scene, false);
  }
  const dashes = [];
  for (const r of ROADS) for (let s = -34.8; s <= 35; s += 2.4) {
    if (ROADS.some(q => Math.abs(s - q) < 3)) continue;
    dashes.push([s, r, true], [r, s, false]);
  }
  const cross = [];
  for (const ix of ROADS) for (const iz of ROADS) for (let k = -3; k <= 3; k++) {
    const o = k * .52;
    cross.push([ix + o, iz - 2.8, false], [ix + o, iz + 2.8, false], [ix - 2.8, iz + o, true], [ix + 2.8, iz + o, true]);
  }
  const im = new T.InstancedMesh(new T.BoxGeometry(.14, .02, 1.1), M.mark, dashes.length);
  const ic = new T.InstancedMesh(new T.BoxGeometry(.28, .02, 1.3), M.mark, cross.length);
  const o = new T.Object3D();
  dashes.forEach(([x, z, alongX], i) => { o.position.set(x, .05, z); o.rotation.set(0, alongX ? Math.PI / 2 : 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  cross.forEach(([x, z, alongX], i) => { o.position.set(x, .05, z); o.rotation.set(0, alongX ? Math.PI / 2 : 0, 0); o.updateMatrix(); ic.setMatrixAt(i, o.matrix); });
  im.receiveShadow = ic.receiveShadow = true; scene.add(im, ic);
  for (const bx of BLOCK) for (const bz of BLOCK) mbox(12, .25, 12, M.walk, bx, 0, bz, scene, false);
  for (let s = -34; s <= 34; s += 2.8) {
    if (ROADS.some(r => Math.abs(s - r) < 3.2)) continue;
    addTree(s, 33.4, .9, 0); addTree(s, -33.4, .9, 0); addTree(33.4, s, .9, 0); addTree(-33.4, s, .9, 0);
  }
}

/* ------------------------------------------------------------------ ordinary blocks */
const GEN = [[-24, -8, 4, 11], [-24, 8, 4, 10], [24, -8, 5, 12], [24, 8, 4, 10], [-8, -24, 8, 19], [8, -24, 7, 17], [-8, 24, 4, 9], [8, 24, 4, 9]];
const TOKENS = ['--s-b1', '--s-b2', '--s-b3', '--s-b1', '--s-b2'];
for (const [cx, cz, hmin, hmax] of GEN) {
  if (hmax > 15 && rnd() < .7) {
    const h = Math.round(rr(hmax * .8, hmax) / 2.6) * 2.6;
    addBuilding(cx - 1.8, cz, 6, 9, h, '--s-b2');
    addBuilding(cx + 3.2, cz - 2.4, 3.6, 4.2, Math.round(rr(hmin, hmax * .6) / 2.6) * 2.6, '--s-b1');
    addTree(cx + 3.4, cz + 3.4, 1);
    mbox(1.2, .5, 1.2, M.roof, cx - 2.6, .25 + h, cz + 2, scene);
    continue;
  }
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = cx + dx * 2.7, z = cz + dz * 2.7;
    if (rnd() < .14) { addTree(x - .8, z, 1); addTree(x + .9, z + .6, .9); continue; }
    const w = rr(3.6, 4.8), d = rr(3.6, 4.8), h = Math.max(2.6, Math.round(rr(hmin, hmax) / 2.6) * 2.6);
    addBuilding(x, z, w, d, h, TOKENS[Math.floor(rnd() * TOKENS.length)]);
    if (h > 7 && rnd() < .6) mbox(rr(.8, 1.4), .45, rr(.8, 1.4), M.roof, x + rr(-.8, .8), .25 + h, z + rr(-.8, .8));
    if (h > 9 && rnd() < .4) mcyl(.45, .45, .9, 10, M.dark, x - w * .25, .25 + h, z - d * .25);
  }
}

/* ------------------------------------------------------------------ landmarks */
const HIT = [];
function hitbox(i, x, y, z, w, h, d) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ visible: false }));
  m.position.set(x, y + h / 2, z); m.userData.stop = i; scene.add(m); HIT.push(m);
}

// town hall (-8,-8)
mbox(9.4, .45, 8, M.stone, -8.9, .25, -8);
addBuilding(-9.6, -8, 5.6, 6.2, 3.9, '--s-stone', .7);
for (let k = 0; k < 6; k++) mcyl(.2, .22, 3.2, 10, M.stone, -5.6, .7, -10.6 + k * 1.04);
mbox(1.3, .7, 6.6, M.stone, -5.9, 3.9, -8);
gable(-8.9, 4.6, -8, 7.6, 6.8, 1.4, M.roof, true);
mbox(1.9, 2.6, 1.9, M.stone, -9.6, 4.6, -8);
mbox(2.1, .2, 2.1, M.roof, -9.6, 7.2, -8);
{
  const dome = new T.Mesh(new T.SphereGeometry(.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.roof); dome.position.set(-9.6, 7.4, -8); dome.castShadow = true; scene.add(dome);
  const face = new T.Mesh(new T.CircleGeometry(.6, 32), new T.MeshBasicMaterial({ map: clockTex, toneMapped: false }));
  face.position.set(-8.62, 6, -8); face.rotation.y = Math.PI / 2; scene.add(face);
  mcyl(.03, .03, 1.7, 6, M.dark, -9.6, 8.3, -8);
  const flag = new T.Mesh(new T.PlaneGeometry(.9, .6), new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: .9 }));
  flag.position.set(-9.15, 9.65, -8); scene.add(flag); window.__flag1 = flag;
}
mbox(1.1, .3, 4.4, M.stone, -4.75, .25, -8);
// open data screen
const hallScreen = (() => {
  const [c, g] = cnv(640, 360), tex = ctex(c);
  mbox(.18, 1.2, .18, M.dark, -2.75, .25, -13.1); mbox(.18, 1.2, .18, M.dark, -2.75, .25, -10.1);
  mbox(.22, 2.3, 4, M.dark, -2.78, 1.3, -11.6);
  const p = new T.Mesh(new T.PlaneGeometry(3.7, 2.08), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
  p.position.set(-2.66, 2.45, -11.6); p.rotation.y = Math.PI / 2; scene.add(p);
  return { c, g, tex };
})();
hitbox(9, -8.2, .25, -8.6, 12, 8, 10);

// main square (8,-8)
mbox(11.4, .06, 11.4, M.pave, 8, .25, -8, scene, false);
mcyl(1.85, 1.95, .45, 28, M.stone, 8, .3, -8);
mcyl(1.6, 1.6, .05, 28, M.water, 8, .68, -8, scene, false);
mcyl(.5, .6, .5, 14, M.stone, 8, .3, -8);
const jet = new T.Sprite(spriteAccent({ opacity: .0 }));
jet.position.set(8, 1.4, -8); jet.scale.set(1, 1.6, 1); scene.add(jet);
for (const [x, z, r] of [[4.4, -8, 0], [11.6, -8, 0], [8, -4.4, 1], [8, -11.6, 1]]) { const b = mbox(1.5, .3, .45, M.trunk, x, .3, z); b.rotation.y = r * Math.PI / 2; }
for (const [x, z] of [[3.6, -3.6], [12.4, -3.6], [3.6, -12.4], [12.4, -12.4]]) addTree(x, z, 1.1, .3);
hitbox(10, 8, .25, -8, 11, 4, 11);

// server room (-24,-24)
const ledMat = new T.MeshStandardMaterial({ color: 0x111111, emissive: new T.Color(1, .5, .7), emissiveIntensity: 1.4, roughness: .4 });
const fans = [];
{
  mbox(9, 2.8, 6.4, M.dark, -24.6, .25, -24.6);
  mbox(9.06, .12, 6.46, ledMat, -24.6, 1.05, -24.6, scene, false);
  mbox(9.06, .12, 6.46, ledMat, -24.6, 2.05, -24.6, scene, false);
  for (let k = 0; k < 3; k++) {
    const x = -27.6 + k * 3;
    mbox(1.6, .5, 1.6, M.roof, x, 3.05, -24.6);
    const f = mcyl(.6, .6, .06, 14, M.dark, x, 3.56, -24.6, scene, false); fans.push(f);
  }
  mbox(3, 1.7, 3.2, M.dark, -20.2, .25, -20.8);
  mcyl(.07, .1, 4, 6, M.dark, -28.2, 3.05, -27.2);
}
const mastLight = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xff4a3a, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
mastLight.position.set(-28.2, 7.15, -27.2); mastLight.scale.setScalar(1.2); scene.add(mastLight);
const DC = new T.Vector3(-24.4, 1.6, -24.4);
const shield = new T.Group(); shield.position.set(-24.4, .25, -24.4); scene.add(shield);
const shieldWireMat = addMatAccent({ wireframe: true, opacity: .35 });
const shieldSkinMat = addMatAccent({ opacity: .07, side: T.DoubleSide });
shield.add(new T.Mesh(new T.IcosahedronGeometry(8.2, 2), shieldWireMat));
shield.add(new T.Mesh(new T.SphereGeometry(8.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), shieldSkinMat));
shield.scale.setScalar(.001);
hitbox(7, -24.4, .25, -24.4, 11, 6, 9);

// hospital (24,-24)
addBuilding(25.2, -26, 8, 5.2, 6.2, '--s-white');
addBuilding(22, -20.6, 4.8, 4.6, 3.1, '--s-white');
const crossMat = new T.MeshStandardMaterial({ color: 0xd2373c, emissive: 0xd2373c, emissiveIntensity: .6 });
mbox(2.2, .2, .62, crossMat, 25.2, 6.45, -26); mbox(.62, .2, 2.2, crossMat, 25.2, 6.45, -26);
{
  const h = new T.Mesh(new T.CircleGeometry(1.7, 32), new T.MeshStandardMaterial({ map: heliTex, roughness: .9 }));
  h.rotation.x = -Math.PI / 2; h.position.set(22, 3.37, -20.6); h.receiveShadow = true; scene.add(h);
  mbox(1.1, 1.05, 2.3, M.white, 28.6, .25, -19.4); mbox(1.12, .16, 2.32, crossMat, 28.6, .9, -19.4, scene, false);
}
hitbox(6, 24.5, .25, -24, 11, 7, 11);

// school (24,24)
addBuilding(25, 27.4, 10, 4, 3.5, '--s-b3');
mbox(7.4, .03, 4.6, M.court, 23.6, .25, 21, scene, false);
mbox(7, .02, .08, M.mark, 23.6, .29, 21, scene, false); mbox(.08, .02, 4.2, M.mark, 23.6, .29, 21, scene, false);
mcyl(.04, .05, 4.2, 6, M.dark, 19.2, .25, 27.6);
{
  const f = new T.Mesh(new T.PlaneGeometry(1, .66), new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: .9 }));
  f.position.set(19.72, 4.05, 27.6); scene.add(f); window.__flag2 = f;
}
addTree(28.6, 20, 1.1); addTree(29, 23, .9); addTree(19.6, 19.8, 1);
const wifi = [];
for (let k = 0; k < 3; k++) {
  const m = new T.Mesh(new T.TorusGeometry(.55 + k * .5, .07, 6, 32, Math.PI * .6), addMatAccent({ opacity: 0 }));
  m.rotation.z = Math.PI * .2; m.position.set(25, 4.3, 26.5); m.rotation.y = -Math.PI / 4;
  scene.add(m); wifi.push(m);
}
hitbox(5, 24, .25, 24.5, 11, 5, 11);

// homes + turbine (-24,24)
const PANELS = [];
function solar(x, y, z, w, d, tilt = 0, rotY = 0) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.set(tilt, rotY, 0, 'YXZ');
  const p = new T.Mesh(new T.BoxGeometry(w, .07, d), M.panel); p.castShadow = true; g.add(p);
  g.scale.setScalar(.001); g.userData.delay = rnd() * .35; scene.add(g); PANELS.push(g);
}
{
  let k = 0;
  for (const z of [20.4, 27.6]) for (const x of [-28, -24, -20]) {
    mbox(2.8, 1.9, 2.6, k % 2 ? M.b3 : M.b1, x, .25, z);
    gable(x, 2.15, z, 3.1, 2.9, .85, M.tile, true);
    solar(x, 2.62, z + .72, 2.1, .95, .5);
    if (k % 2 === 0) addTree(x + 1.7, z - 2.3, .7);
    k++;
  }
}
const rotor = new T.Group();
{
  mcyl(.12, .24, 9, 10, M.white, -29.3, .25, 29.3);
  const nac = new T.Group(); nac.position.set(-29.3, 9.3, 29.3); nac.rotation.y = 3 * Math.PI / 4; scene.add(nac);
  const nb = new T.Mesh(new T.BoxGeometry(.45, .45, 1.1), M.white); nb.castShadow = true; nac.add(nb);
  rotor.position.set(0, 0, .62); nac.add(rotor);
  for (let k = 0; k < 3; k++) {
    const b = new T.Mesh(new T.BoxGeometry(.2, 3.4, .06), M.white); b.geometry.translate(0, 1.7, 0);
    b.rotation.z = k * Math.PI * 2 / 3; b.castShadow = true; rotor.add(b);
  }
}
solar(22.5, 6.42, -26, 1.2, 3.8, 0, 0); solar(27.9, 6.42, -26, 1.2, 3.8, 0, 0);
solar(22.5, 3.85, 27.4, 3.2, 1.3, .3); solar(27.5, 3.85, 27.4, 3.2, 1.3, .3);
hitbox(4, -24, .25, 24, 12, 10, 12);

// park, bus stop, sensor (8,8)
mbox(11.2, .04, 11.2, M.grass, 8, .25, 8, scene, false);
mbox(11.2, .05, 1, M.walk, 8, .25, 8, scene, false); mbox(1, .05, 11.2, M.walk, 8, .25, 8, scene, false);
{ const p = mcyl(2, 2, .05, 32, M.water, 11.2, .27, 11.4, scene, false); p.scale.z = .7; }
for (const [x, z] of [[4, 4.4], [5.6, 6.2], [4.2, 11.6], [6.2, 12.6], [11, 4.2], [12.8, 5.8], [10.2, 6.4], [3.8, 9.6], [13, 9], [6, 3.6]]) addTree(x, z, 1);
const busScreen = (() => {
  mcyl(.05, .05, 2.2, 6, M.dark, 13.3, .25, 3); mcyl(.05, .05, 2.2, 6, M.dark, 13.3, .25, 5.2);
  mbox(1.3, .08, 2.6, M.dark, 13.2, 2.45, 4.1);
  const glass = new T.Mesh(new T.BoxGeometry(.04, 1.6, 2.2), new T.MeshStandardMaterial({ color: 0x9fc4d6, transparent: true, opacity: .25, roughness: .1 }));
  glass.position.set(12.7, 1.3, 4.1); scene.add(glass);
  mbox(.4, .4, 1.8, M.trunk, 12.95, .25, 4.1);
  const [c, g] = cnv(256, 128), tex = ctex(c);
  mcyl(.05, .05, 2.4, 6, M.dark, 13.75, .25, 6.4);
  const p = new T.Mesh(new T.PlaneGeometry(1.3, .65), new T.MeshBasicMaterial({ map: tex, toneMapped: false, side: T.DoubleSide }));
  p.position.set(13.82, 2.25, 6.4); p.rotation.y = Math.PI / 2; scene.add(p);
  return { c, g, tex };
})();
hitbox(1, 13.4, .25, 4.6, 2.4, 3, 4.6);
{
  mcyl(.06, .08, 3.6, 8, M.dark, 2.7, .25, 2.7);
  mbox(.5, .38, .34, M.white, 2.7, 2.6, 2.7);
  const qr = new T.Mesh(new T.PlaneGeometry(.36, .36), new T.MeshBasicMaterial({ map: qrTex }));
  qr.position.set(2.77, 1.55, 2.77); qr.rotation.y = Math.PI / 4; scene.add(qr);
}
const sensorLed = new T.Sprite(spriteAccent({ opacity: .9 }));
sensorLed.position.set(2.95, 2.85, 2.95); sensorLed.scale.setScalar(.5); scene.add(sensorLed);
const sensorRings = [0, 1].map(() => { const s = new T.Sprite(spriteAccent({ map: ringTex, opacity: 0 })); s.position.set(2.7, 2.8, 2.7); scene.add(s); return s; });
hitbox(8, 2.7, .25, 2.7, 1.4, 4, 1.4);

// bins block (-8,8)
addBuilding(-10.2, 5.4, 6, 5, 7.8, '--s-b1');
addBuilding(-9.8, 11.4, 6.6, 4.6, 10.4, '--s-b2');
addTree(-5.2, 3.2, .9); addTree(-4.8, 13, .8);
const BINS = [4.2, 5.8, 7.4, 9, 10.6, 12.2].map((z, i) => {
  mcyl(.3, .27, .74, 12, M.bin, -3.3, .25, z);
  const lidMat = new T.MeshStandardMaterial({ color: 0x55aa77, emissive: 0x55aa77, emissiveIntensity: .35, roughness: .5 });
  const lid = mcyl(.34, .34, .08, 12, lidMat, -3.3, .99, z);
  const beam = mcyl(.05, .05, 5, 6, addMatAccent({ opacity: 0, blending: T.AdditiveBlending }), -3.3, 1.05, z, scene, false);
  const bags = new T.Group(); bags.position.set(-3.3, .25, z); scene.add(bags);
  for (const [dx, dz, s] of [[.42, .3, .26], [.5, -.25, .22], [.2, .5, .2]]) {
    const b = new T.Mesh(new T.SphereGeometry(s, 8, 6), M.dark); b.position.set(dx, s * .8, dz); b.castShadow = true; bags.add(b);
  }
  bags.scale.setScalar(.001);
  return { z, fill: rr(.1, .7), rate: [.05, .016, .03, .055, .02, .04][i], lidMat, lid, beam, bags, pass: -1, flash: 0 };
});
hitbox(2, -3.5, .25, 8.2, 3, 2.5, 10);

// crossroads + streetlights hitboxes
hitbox(0, 0, 0, 0, 6, 3, 6);
hitbox(3, 0, 0, -24, 6, 5, 12);

/* trees (instanced) */
{
  const n = TREES.length;
  const trunk = new T.InstancedMesh(new T.CylinderGeometry(.1, .14, 1, 6), M.trunk, n);
  const crown = new T.InstancedMesh(new T.IcosahedronGeometry(.8, 0), M.tree, n);
  const o = new T.Object3D(), c = new T.Color();
  TREES.forEach(([x, z, s, y], i) => {
    o.position.set(x, y + .5 * s, z); o.rotation.set(0, rnd() * 6, 0); o.scale.set(s, s, s); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    o.position.set(x, y + 1.45 * s, z); o.scale.set(s, s * rr(1, 1.35), s); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
    const v = rr(.8, 1.15); crown.setColorAt(i, c.setRGB(v, v * rr(.95, 1.05), v));
  });
  trunk.castShadow = crown.castShadow = true; crown.receiveShadow = true; scene.add(trunk, crown);
}

/* ------------------------------------------------------------------ streetlights */
const LAMPS = [];
{
  const poleGeo = new T.CylinderGeometry(.05, .07, 3.3, 6), armGeo = new T.BoxGeometry(.8, .06, .06), headGeo = new T.BoxGeometry(.45, .12, .26);
  const poolGeo = new T.PlaneGeometry(5, 5); poolGeo.rotateX(-Math.PI / 2);
  const add = (x, z, hx, hz) => {
    const pole = new T.Mesh(poleGeo, M.dark); pole.position.set(x, .25 + 1.65, z); scene.add(pole);
    const arm = new T.Mesh(armGeo, M.dark); arm.position.set((x + hx) / 2, 3.5, (z + hz) / 2); arm.rotation.y = Math.atan2(hz - z, hx - x) * -1; scene.add(arm);
    const hm = new T.MeshStandardMaterial({ color: 0x222222, emissive: new T.Color(1, .8, .5), emissiveIntensity: 1.5 });
    const head = new T.Mesh(headGeo, hm); head.position.set(hx, 3.45, hz); head.rotation.y = arm.rotation.y; scene.add(head);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    glow.position.set(hx, 3.3, hz); glow.scale.setScalar(2.2); scene.add(glow);
    const pool = new T.Mesh(poolGeo, new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    pool.position.set(hx, .08, hz); scene.add(pool);
    LAMPS.push({ x: hx, z: hz, i: 1, hm, glow, pool });
  };
  for (let s = -31.2; s <= 31.2; s += 5.2) {
    if (ROADS.some(r => Math.abs(s - r) < 3.6)) continue;
    add(2.45, s, 1.7, s); add(-2.45, s + 2.6, -1.7, s + 2.6);
    add(s, 2.45, s, 1.7); add(s + 2.6, -2.45, s + 2.6, -1.7);
  }
}

/* ------------------------------------------------------------------ traffic */
const IMAP = new Map(), INTERS = [];
const lightGeo = new T.SphereGeometry(.17, 10, 8), tlPole = new T.CylinderGeometry(.05, .05, 2.4, 6);
const RED = new T.Color('#ff3b2f').convertSRGBToLinear(), GREEN = new T.Color('#3ddc84').convertSRGBToLinear(), AMBER = new T.Color('#ffb020').convertSRGBToLinear();
const loopMat = addMatAccent({ map: ringTex, opacity: 0 });
for (const ix of ROADS) for (const iz of ROADS) {
  const I = { x: ix, z: iz, g: rnd() < .5 ? 'x' : 'z', phase: 'green', t: rr(0, 8), q: { x: 0, z: 0 }, bus: null, mats: {} };
  for (const ax of ['x', 'z']) I.mats[ax] = new T.MeshStandardMaterial({ color: 0x111111, emissive: RED.clone(), emissiveIntensity: 2.2 });
  for (const [dx, dz, ax] of [[2.4, 2.4, 'x'], [-2.4, -2.4, 'x'], [-2.4, 2.4, 'z'], [2.4, -2.4, 'z']]) {
    const p = new T.Mesh(tlPole, M.dark); p.position.set(ix + dx, .25 + 1.2, iz + dz); scene.add(p);
    const l = new T.Mesh(lightGeo, I.mats[ax]); l.position.set(ix + dx, 2.75, iz + dz); scene.add(l);
  }
  const ring = new T.Mesh(new T.PlaneGeometry(8, 8), loopMat); ring.rotation.x = -Math.PI / 2; ring.position.set(ix, .07, iz); scene.add(ring);
  INTERS.push(I); IMAP.set(ix + ',' + iz, I);
}
const CAR_COLORS = ['#d9c7b0', '#8a9bb0', '#b8574a', '#e0a458', '#6b7f6a', '#cfcfcf', '#3d4a5c', '#a26c8f', '#efe6d6', '#5b6b8c'];
const BUS_LANES = new Set(['x|-16|1', 'z|16|1', 'x|16|-1', 'z|-16|-1']);
const CARS = [];
for (const axis of ['x', 'z']) for (const road of ROADS) for (const dir of [1, -1]) {
  const key = axis + '|' + road + '|' + dir;
  if (BUS_LANES.has(key)) continue;
  const n = road === 0 ? 5 : 3;
  for (let k = 0; k < n; k++) CARS.push({ axis, road, dir, key, s: -HALF + (k + rnd() * .5) * 72 / n, v: 4, len: 1.9, pass: 0 });
}
const truck = { axis: 'z', road: 0, dir: 1, key: 'z|0|1', s: -20, v: 3, len: 2.9, truck: true, pass: 0, dwell: 0 };
CARS.push(truck);
const carBody = new T.InstancedMesh(new T.BoxGeometry(.95, .5, 1.9).translate(0, .42, 0), new T.MeshStandardMaterial({ roughness: .45, metalness: .2 }), CARS.length);
const carCab = new T.InstancedMesh(new T.BoxGeometry(.82, .38, 1).translate(0, .85, -.1), new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: .2, metalness: .5 }), CARS.length);
carBody.castShadow = carCab.castShadow = true;
{ const c = new T.Color(); CARS.forEach((car, i) => carBody.setColorAt(i, c.set(CAR_COLORS[i % CAR_COLORS.length]).convertSRGBToLinear())); }
scene.add(carBody, carCab);
const truckMesh = new T.Group();
{
  const cab = new T.Mesh(new T.BoxGeometry(1.05, 1, .9), new T.MeshStandardMaterial({ color: 0xe8e2d4, roughness: .5 })); cab.position.set(0, .7, 1); cab.castShadow = true;
  const box = new T.Mesh(new T.BoxGeometry(1.1, 1.25, 1.9), new T.MeshStandardMaterial({ color: 0x4f7a5a, roughness: .6 })); box.position.set(0, .82, -.45); box.castShadow = true;
  truckMesh.add(cab, box); scene.add(truckMesh);
}
const bus = { p: 2, v: 0, dwell: 0, served: false, x: -15, z: -15, axis: 'x' };
const busMesh = new T.Group();
{
  const body = new T.Mesh(new T.BoxGeometry(1.2, 1.25, 3.8), new T.MeshStandardMaterial({ color: 0xf1cf74, roughness: .45 })); body.position.y = .8; body.castShadow = true;
  const band = new T.Mesh(new T.BoxGeometry(1.22, .38, 3.5), new T.MeshStandardMaterial({ color: 0x23262c, roughness: .15, metalness: .4 })); band.position.y = 1.05;
  busMesh.add(body, band);
  const beacon = new T.Sprite(spriteAccent({ opacity: 0 })); beacon.position.set(0, 1.9, 0); beacon.scale.setScalar(1.6); busMesh.add(beacon); busMesh.userData.beacon = beacon;
  scene.add(busMesh);
}
const BUS_PATH = [[-15, -15], [15, -15], [15, 15], [-15, 15]], BUS_LEN = 120, STOP_P = 49;
function busAt(p) {
  p = ((p % BUS_LEN) + BUS_LEN) % BUS_LEN;
  const k = Math.floor(p / 30), f = (p - k * 30) / 30, a = BUS_PATH[k], b = BUS_PATH[(k + 1) % 4];
  return { x: lerp(a[0], b[0], f), z: lerp(a[1], b[1], f), dx: Math.sign(b[0] - a[0]), dz: Math.sign(b[1] - a[1]) };
}
const BUS_INTERS = [0, 15, 30, 45, 60, 75, 90, 105].map(p => {
  const at = busAt(p), prev = busAt(p - 1), I = IMAP.get(Math.round(at.x / 16) * 16 + ',' + Math.round(at.z / 16) * 16);
  return { p, I, axis: prev.dx !== 0 ? 'x' : 'z' };
});

/* people */
const ZONES = [
  { x0: 3.4, x1: 12.6, z0: -12.6, z1: -3.4, ax: 8, az: -8, ar: 2.4, n: 22 },
  { x0: 3.5, x1: 12.8, z0: 3.4, z1: 12.8, ax: 11.2, az: 11.4, ar: 2.3, n: 6 },
];
const PEOPLE = [];
for (const Z of ZONES) for (let k = 0; k < Z.n; k++) {
  const p = { Z, x: rr(Z.x0, Z.x1), z: rr(Z.z0, Z.z1), tx: 0, tz: 0, sp: rr(.6, 1.1), wait: rr(0, 3), ph: rr(0, 6) };
  pickTarget(p); PEOPLE.push(p);
}
for (let k = 0; k < 10; k++) PEOPLE.push({ walker: true, x: k % 2 ? 3.1 : -3.1, z: rr(-30, 30), dir: rnd() < .5 ? 1 : -1, sp: rr(1, 1.4), ph: rr(0, 6) });
function pickTarget(p) {
  const Z = p.Z;
  for (let i = 0; i < 10; i++) { p.tx = rr(Z.x0, Z.x1); p.tz = rr(Z.z0, Z.z1); if (Math.hypot(p.tx - Z.ax, p.tz - Z.az) > Z.ar) break; }
}
const PCOL = ['#c96f53', '#3e5c76', '#e3c08d', '#6d8a6a', '#8a5a7c', '#d9d2c5', '#4a4a52', '#b6863c'];
const pBody = new T.InstancedMesh(new T.CylinderGeometry(.15, .19, .6, 8).translate(0, .3, 0), new T.MeshStandardMaterial({ roughness: .8 }), PEOPLE.length);
const pHead = new T.InstancedMesh(new T.SphereGeometry(.13, 10, 8).translate(0, .74, 0), new T.MeshStandardMaterial({ color: 0xd9b48f, roughness: .7 }), PEOPLE.length);
pBody.castShadow = true;
{ const c = new T.Color(); PEOPLE.forEach((p, i) => pBody.setColorAt(i, c.set(PCOL[i % PCOL.length]).convertSRGBToLinear())); }
scene.add(pBody, pHead);

/* hearts (votes) */
const HEARTS = Array.from({ length: 14 }, () => {
  const s = new T.Sprite(am(new T.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })));
  s.scale.setScalar(.55); s.visible = false; scene.add(s); return { s, t: 9 };
});

/* network arcs */
const ARCS = [];
function arc(a, b, lift, speed = .3) {
  const A = new T.Vector3(...a), B = new T.Vector3(...b), mid = A.clone().add(B).multiplyScalar(.5);
  mid.y += lift ?? (5 + A.distanceTo(B) * .3);
  const curve = new T.QuadraticBezierCurve3(A, mid, B);
  const line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(48)), am(new T.LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false })));
  scene.add(line);
  const packets = [0, .5].map(o => { const s = new T.Sprite(spriteAccent({ opacity: 0 })); s.scale.setScalar(.75); scene.add(s); return { s, t: o + rnd() * .2 }; });
  const A_ = { curve, line, packets, speed: speed * rr(.8, 1.2), group: 'net' }; ARCS.push(A_); return A_;
}
const DCP = [-24.4, 3.4, -24.4];
for (const src of [[0, 2.8, 0], [2.7, 3, 2.7], [-3.3, 1.1, 8.2], [13.8, 2.3, 6.4], [24.5, 6.6, -25.5], [24, 4.2, 25], [-24, 3, 24], [0, 3.4, -18.4], [0, 3.4, 23], [-16, 2.8, 0], [16, 2.8, 16], [16, 2.8, -16], [8, 1, 8]]) arc(src, DCP);
arc(DCP, [-2.66, 3.4, -11.6], 9, .35);
for (const t of [[22, 4, -9], [26.8, 4, -6.2], [21.4, 3.2, -2.4]]) arc([24.5, 6.5, -25], t, 4, .4).group = 'health';

/* pulse ring */
const pulse = new T.Mesh(new T.RingGeometry(.94, 1, 96), addMatAccent({ opacity: 0, side: T.DoubleSide }));
pulse.rotation.x = -Math.PI / 2; pulse.position.set(-8, .45, -8); scene.add(pulse); pulse.userData.t = 9;

/* attacks */
const ATTACKS = [], BURSTS = [];
let attackRun = null, dcAlarm = 0, shieldFlash = 0;

/* ------------------------------------------------------------------ state */
let smart = false, smartK = 0, current = -1, G = 1;
const seen = new Set(store.get('city-seen') || []);
const hist = { wait: [], light: [], bins: [], air: [] };
let metrics = { wait: 0, light: 100, bins: 0, air: 0 }, idleEMA = 0;

/* ------------------------------------------------------------------ palette */
const fogA = new T.Color(), fogB = new T.Color(), accentCol = new T.Color(), lampCol = new T.Color(), warnCol = new T.Color(), goodCol = new T.Color(), badCol = new T.Color();
function applyPalette() {
  for (const [m, prop, tok] of themed) m[prop].copy(col(tok));
  fogA.copy(col('--s-fog')); fogB.copy(col('--s-smog'));
  hemi.color.copy(col('--s-hemi-sky')); hemi.groundColor.copy(col('--s-hemi-ground')); hemi.intensity = num('--s-hemi-i');
  sun.color.copy(col('--s-sun')); sun.intensity = num('--s-sun-i');
  accentCol.copy(col('--accent')); lampCol.copy(col('--s-lamp'));
  goodCol.copy(col('--good')); warnCol.copy(col('--warn')); badCol.copy(col('--bad'));
  for (const m of accentMats) if (m.color) m.color.copy(accentCol);
  G = num('--s-glow');
  for (const m of glowMats) m.emissiveIntensity = .9 * G + .1;
  for (const L of LAMPS) { L.glow.material.color.copy(lampCol); L.pool.material.color.copy(lampCol); L.hm.emissive.copy(lampCol); }
  drawHall(); drawBus();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyPalette);
new MutationObserver(applyPalette).observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });

/* ------------------------------------------------------------------ screens */
function drawHall() {
  const { g, c, tex } = hallScreen, W = c.width, H = c.height;
  g.fillStyle = '#120c0a'; g.fillRect(0, 0, W, H);
  const acc = css('--accent') || '#f472b6';
  if (smartK < .5) {
    g.fillStyle = '#c9b9a1'; g.font = '600 26px "JetBrains Mono", monospace'; g.fillText('TOWN HALL', 36, 66);
    g.fillStyle = '#f1ece2'; g.font = '44px "Instrument Serif", Georgia, serif';
    g.fillText('Opening hours', 36, 150); g.fillText('9:00 – 17:00', 36, 204);
    g.fillStyle = '#8d8679'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText('For information, ask at the desk.', 36, 290);
  } else {
    g.fillStyle = acc; g.font = '600 24px "JetBrains Mono", monospace'; g.fillText('● OPEN DATA · LIVE', 36, 58);
    const rows = [['Cars waiting now', metrics.wait], ['Street lighting', metrics.light + ' %'], ['Bins overflowing', metrics.bins + ' / 6'], ['Air pollution index', metrics.air]];
    rows.forEach(([k, v], i) => {
      const y = 116 + i * 56;
      g.fillStyle = '#bdb6a8'; g.font = '25px "Bricolage Grotesque", sans-serif'; g.fillText(k, 36, y);
      g.fillStyle = '#f1ece2'; g.font = '600 32px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.fillText(String(v), W - 36, y); g.textAlign = 'left';
      g.fillStyle = '#ffffff14'; g.fillRect(36, y + 18, W - 72, 2);
    });
    g.fillStyle = '#8d8679'; g.font = '20px "Bricolage Grotesque", sans-serif'; g.fillText('Every number on this screen is public.', 36, H - 22);
  }
  tex.needsUpdate = true;
}
function drawBus() {
  const { g, c, tex } = busScreen, W = c.width, H = c.height;
  g.fillStyle = '#0f0d0c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f1cf74'; g.font = '600 22px "JetBrains Mono", monospace'; g.fillText('LINE 1', 16, 34);
  if (smartK < .5) {
    g.fillStyle = '#c9b9a1'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText('Timetable: 18:40', 16, 74);
    g.fillStyle = '#8d8679'; g.fillText('Next bus: unknown', 16, 106);
  } else {
    const d = ((STOP_P - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN, eta = bus.dwell > 0 ? 0 : Math.max(1, Math.round(d / 9));
    g.fillStyle = '#f1ece2'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText('Next bus', 16, 74);
    g.fillStyle = css('--accent') || '#f472b6'; g.font = '600 38px "JetBrains Mono", monospace';
    g.fillText(bus.dwell > 0 ? 'NOW' : eta + ' min', 16, 116);
  }
  tex.needsUpdate = true;
}

/* ------------------------------------------------------------------ simulation */
function nextInter(c) {
  let best = null, bd = 1e9;
  for (const r of ROADS) { const d = (r - 3 * c.dir - c.s) * c.dir; if (d > -.6 && d < bd) { bd = d; best = r; } }
  if (best === null) return null;
  return { I: c.axis === 'x' ? IMAP.get(best + ',' + c.road) : IMAP.get(c.road + ',' + best), d: bd };
}
const busIn = I => Math.abs(bus.x - I.x) < 3.2 && Math.abs(bus.z - I.z) < 3.2;
function stepLights(dt) {
  for (const I of INTERS) {
    I.t += dt;
    if (I.phase === 'green') {
      let go = false;
      if (!smart) go = I.t > 9;
      else {
        const o = I.g === 'x' ? 'z' : 'x', qg = I.q[I.g], qo = I.q[o];
        if (I.bus) go = I.bus !== I.g && I.t > 1.2;
        else go = (I.t > 2 && qo > 0 && qg === 0) || (I.t > 11 && qo > 0) || (I.t > 4 && qo >= qg + 3);
      }
      if (go) { I.phase = 'clear'; I.t = 0; }
    } else if (I.t > (smart ? .9 : 1.4)) { I.g = I.g === 'x' ? 'z' : 'x'; I.phase = 'green'; I.t = 0; }
    I.green = I.phase === 'green' ? I.g : null;
    for (const ax of ['x', 'z']) I.mats[ax].emissive.copy(I.green === ax ? GREEN : (I.phase === 'clear' && I.g === ax ? AMBER : RED));
    I.q.x = I.q.z = 0; I.bus = null;
  }
}
const lanes = new Map();
for (const c of CARS) { if (!lanes.has(c.key)) lanes.set(c.key, []); lanes.get(c.key).push(c); }
function stepCars(dt) {
  const vmax = smart ? 7 : 5.8;
  for (const arr of lanes.values()) {
    arr.sort((a, b) => a.s * a.dir - b.s * b.dir);
    const n = arr.length;
    for (let k = 0; k < n; k++) {
      const c = arr[k], L = arr[(k + 1) % n];
      let tgt = vmax * (c.truck ? .8 : 1);
      if (n > 1) { const gap = (((L.s - c.s) * c.dir) % 72 + 72) % 72 - (c.len + L.len) / 2; tgt = Math.min(tgt, Math.max(0, gap - .7) * 2.2); }
      const ni = nextInter(c);
      if (ni) {
        const ok = ni.I.green === c.axis && !busIn(ni.I);
        if (!ok && ni.d < 16) tgt = Math.min(tgt, Math.max(0, ni.d - .1) * 1.7);
        if (ni.d < 14) ni.I.q[c.axis]++;
      }
      if (c.truck) {
        if (c.dwell > 0) { c.dwell -= dt; tgt = 0; }
        else for (const b of BINS) {
          const d = (b.z - c.s) * c.dir;
          if (d > -.2 && d < 1.6 && b.pass !== c.pass) {
            const need = smart ? b.fill > .42 : true;
            if (!need) { if (d < .1) b.pass = c.pass; continue; }
            tgt = Math.min(tgt, Math.max(0, d) * 3);
            if (d < .12) { c.dwell = 1.4; b.fill = 0; b.pass = c.pass; b.flash = 1; }
          }
        }
      }
      c.v = tgt < c.v ? lerp(c.v, tgt, damp(10, dt)) : Math.min(tgt, c.v + 5 * dt);
      c.s += c.v * dt * c.dir;
      if (c.s > HALF) { c.s -= 72; c.pass++; } else if (c.s < -HALF) { c.s += 72; c.pass++; }
    }
  }
}
function stepBus(dt) {
  let tgt = smart ? 6.4 : 5;
  const dStop = ((STOP_P - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN;
  if (bus.dwell > 0) { bus.dwell -= dt; tgt = 0; }
  else if (dStop < 9 && !bus.served) { tgt = Math.min(tgt, Math.max(0, dStop) * 1.5); if (dStop < .1) { bus.dwell = 3; bus.served = true; } }
  if (dStop > 30 && dStop < 90) bus.served = false;
  let best = null, bd = 1e9;
  for (const B of BUS_INTERS) { const d = ((B.p - 3.2 - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN; if (d < bd) { bd = d; best = B; } }
  if (best && bd < 15) {
    if (smart) best.I.bus = best.axis;
    best.I.q[best.axis] += 2;
    if (best.I.green !== best.axis) tgt = Math.min(tgt, Math.max(0, bd - .1) * 1.6);
  }
  bus.v = tgt < bus.v ? lerp(bus.v, tgt, damp(8, dt)) : Math.min(tgt, bus.v + 3.5 * dt);
  bus.p = (bus.p + bus.v * dt) % BUS_LEN;
  const at = busAt(bus.p); bus.x = at.x; bus.z = at.z;
  busMesh.position.set(at.x, .04, at.z);
  const ang = Math.atan2(at.dx, at.dz);
  busMesh.rotation.y += wrapPi(ang - busMesh.rotation.y) * damp(9, dt);
}
const O = new T.Object3D();
function carPose(c) {
  const x = c.axis === 'x' ? c.s : c.road - c.dir, z = c.axis === 'x' ? c.road + c.dir : c.s;
  const sc = clamp((HALF - Math.abs(c.s)) / 2.5, .001, 1);
  O.position.set(x, .04, z); O.rotation.set(0, c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI), 0); O.scale.setScalar(sc);
}
function renderCars() {
  CARS.forEach((c, i) => {
    carPose(c);
    if (c.truck) { truckMesh.position.copy(O.position); truckMesh.rotation.copy(O.rotation); truckMesh.scale.copy(O.scale); O.scale.setScalar(.001); }
    O.updateMatrix(); carBody.setMatrixAt(i, O.matrix); carCab.setMatrixAt(i, O.matrix);
  });
  carBody.instanceMatrix.needsUpdate = carCab.instanceMatrix.needsUpdate = true;
}
function stepPeople(dt, time) {
  PEOPLE.forEach((p, i) => {
    let moving = true;
    if (p.walker) { p.z += p.dir * p.sp * dt; if (p.z > 31) p.z = -31; if (p.z < -31) p.z = 31; }
    else if (p.wait > 0) { p.wait -= dt; moving = false; }
    else {
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
      if (d < .2) { p.wait = rr(1, 5); pickTarget(p); } else { p.x += dx / d * p.sp * dt; p.z += dz / d * p.sp * dt; }
    }
    const bob = moving ? Math.abs(Math.sin(time * 7 + p.ph)) * .05 : 0;
    O.position.set(p.x, .27 + bob + (p.Z && p.Z === ZONES[0] ? .04 : 0), p.z); O.rotation.set(0, 0, 0); O.scale.setScalar(1); O.updateMatrix();
    pBody.setMatrixAt(i, O.matrix); pHead.setMatrixAt(i, O.matrix);
  });
  pBody.instanceMatrix.needsUpdate = pHead.instanceMatrix.needsUpdate = true;
}
function stepLamps(dt) {
  const movers = [];
  for (const c of CARS) { carPose(c); movers.push(O.position.x, O.position.z); }
  movers.push(bus.x, bus.z);
  for (const p of PEOPLE) if (p.walker) movers.push(p.x, p.z);
  let sum = 0;
  for (const L of LAMPS) {
    let tgt = 1;
    if (smart) {
      tgt = .16;
      for (let k = 0; k < movers.length; k += 2) { const dx = movers[k] - L.x, dz = movers[k + 1] - L.z; if (dx * dx + dz * dz < 11) { tgt = 1; break; } }
    }
    L.i = lerp(L.i, tgt, damp(tgt > L.i ? 7 : 2.2, dt)); sum += L.i;
    L.hm.emissiveIntensity = (.25 + L.i * 1.6);
    L.glow.material.opacity = L.i * .9 * (G * .8 + .2);
    L.glow.scale.setScalar(1.2 + L.i * 1.4);
    L.pool.material.opacity = L.i * .55 * G;
  }
  return Math.round(sum / LAMPS.length * 100);
}
function stepBins(dt) {
  for (const b of BINS) {
    b.fill = Math.min(1, b.fill + b.rate * dt);
    const c = b.fill >= .85 ? badCol : b.fill >= .5 ? warnCol : goodCol;
    b.lidMat.color.copy(c); b.lidMat.emissive.copy(c);
    b.flash = Math.max(0, b.flash - dt * 2);
    b.lidMat.emissiveIntensity = .3 + b.flash * 2;
    b.lid.position.y = .99 + .04 + b.flash * .25;
    b.beam.material.opacity = smartK * (b.fill > .42 ? .55 + Math.sin(performance.now() / 200) * .2 : 0);
    const bs = b.bags.scale.x, bt = b.fill >= 1 ? 1 : .001;
    b.bags.scale.setScalar(lerp(bs, bt, damp(4, dt)));
  }
}

/* attacks */
function launchAttack() {
  if (attackRun) return;
  attackRun = { blocked: 0, breach: 0, total: 3 };
  Sound.alarm();
  for (let k = 0; k < 3; k++) setTimeout(() => {
    const a = rr(-.35, 1.9), s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xff3b2f, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    s.scale.setScalar(1.6); s.position.set(DC.x + Math.cos(a) * 30, rr(7, 13), DC.z + Math.sin(a) * 30); scene.add(s);
    const trail = Array.from({ length: 5 }, (_, j) => { const t = new T.Sprite(s.material.clone()); t.material.opacity = .5 - j * .09; t.scale.setScalar(1.2 - j * .18); t.position.copy(s.position); scene.add(t); return t; });
    ATTACKS.push({ s, trail, hist: [] });
  }, k * 650);
}
function burst(pos, color) {
  const s = new T.Sprite(new T.SpriteMaterial({ map: ringTex, color, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
  s.position.copy(pos); scene.add(s); BURSTS.push({ s, t: 0 });
}
function stepAttacks(dt) {
  for (let i = ATTACKS.length - 1; i >= 0; i--) {
    const A = ATTACKS[i], dir = DC.clone().sub(A.s.position), dist = dir.length();
    A.hist.unshift(A.s.position.clone()); if (A.hist.length > 12) A.hist.pop();
    A.trail.forEach((t, j) => { const h = A.hist[Math.min(A.hist.length - 1, (j + 1) * 2)]; if (h) t.position.copy(h); });
    A.s.position.add(dir.normalize().multiplyScalar(13 * dt));
    let done = null;
    if (smartK > .8 && dist < 8.6) done = 'blocked';
    else if (dist < 2.2) done = 'breach';
    if (done) {
      scene.remove(A.s); A.trail.forEach(t => scene.remove(t)); ATTACKS.splice(i, 1);
      if (done === 'blocked') { burst(A.s.position, accentCol); shieldFlash = 1; attackRun.blocked++; Sound.thud(); }
      else { burst(A.s.position, new T.Color(0xff3b2f)); dcAlarm = 3.5; attackRun.breach++; Sound.buzz(); }
      if (attackRun.blocked + attackRun.breach === attackRun.total) {
        const r = attackRun; attackRun = null;
        if (r.breach) toast(`${r.breach} of 3 attacks reached the servers. Turn smart mode on and try again.`, 'bad');
        else toast('3 of 3 attacks stopped by the firewall. The servers never saw them.', 'good');
      }
    }
  }
  for (let i = BURSTS.length - 1; i >= 0; i--) {
    const B = BURSTS[i]; B.t += dt; B.s.scale.setScalar(1 + B.t * 9); B.s.material.opacity = Math.max(0, 1 - B.t / .7);
    if (B.t > .7) { scene.remove(B.s); BURSTS.splice(i, 1); }
  }
}

/* ------------------------------------------------------------------ camera */
const cam = { t: new T.Vector3(0, 0, 0), az: .72, el: .6, d: 80 };
const goal = { t: new T.Vector3(0, 0, 0), az: .72, el: .6, d: 80 };
let lastInput = -1e9, dragging = false, viewX = 0, viewY = 0, W = 1, H = 1;
const narrowF = () => { const a = W / H; return a < 1 ? Math.pow(1.05 / a, .85) : 1; };
function overview() { return { t: [0, -2, 0], az: 42, el: 38, d: 112 }; }
function setGoal(v, instant) {
  goal.t.set(...v.t); goal.el = v.el * D2R; goal.d = v.d * narrowF();
  goal.az = cam.az + wrapPi(v.az * D2R - cam.az);
  if (instant || reduced) { cam.t.copy(goal.t); cam.az = goal.az; cam.el = goal.el; cam.d = goal.d; }
}
function updateCamera(dt) {
  const k = dragging ? 14 : 2.4;
  cam.t.lerp(goal.t, damp(k, dt)); cam.az = lerp(cam.az, goal.az, damp(k, dt)); cam.el = lerp(cam.el, goal.el, damp(k, dt)); cam.d = lerp(cam.d, goal.d, damp(k, dt));
  const ce = Math.cos(cam.el);
  camera.position.set(cam.t.x + cam.d * ce * Math.sin(cam.az), cam.t.y + cam.d * Math.sin(cam.el), cam.t.z + cam.d * ce * Math.cos(cam.az));
  camera.lookAt(cam.t);
  const panelOpen = current >= 0, mobile = W <= 720;
  const tx = panelOpen && !mobile ? Math.min(240, W * .26) : 0, ty = panelOpen && mobile ? Math.min(H * .3, 280) : 0;
  viewX = lerp(viewX, tx, damp(4, dt)); viewY = lerp(viewY, ty, damp(4, dt));
  camera.setViewOffset(W, H, viewX, viewY, W, H);
}
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  if (current < 0) setGoal(overview()); else setGoal(STOPS[current].view);
}
addEventListener('resize', resize);

/* pointer */
const pointers = new Map(); let downAt = null, pinchD = 0;
const ray = new T.Raycaster(), ndc = new T.Vector2();
function pick(x, y) {
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(HIT, false)[0]; return hit ? hit.object.userData.stop : -1;
}
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  downAt = { x: e.clientX, y: e.clientY, b: e.button, shift: e.shiftKey }; dragging = true; canvas.classList.add('drag'); lastInput = performance.now();
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) {
    const i = pick(e.clientX, e.clientY); canvas.classList.toggle('hot', i >= 0);
    PINS.forEach((p, k) => p.el.classList.toggle('hover', k === i)); return;
  }
  const prev = pointers.get(e.pointerId), dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastInput = performance.now();
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD) goal.d = clamp(goal.d * pinchD / d, 6, 170); pinchD = d; return;
  }
  if (downAt && (downAt.b === 2 || downAt.shift)) {
    const s = goal.d * .0016, ca = Math.cos(cam.az), sa = Math.sin(cam.az);
    goal.t.x = clamp(goal.t.x - (dx * ca + dy * sa) * s, -34, 34); goal.t.z = clamp(goal.t.z - (-dx * sa + dy * ca) * s, -34, 34);
  } else { goal.az -= dx * .0055; goal.el = clamp(goal.el + dy * .004, .1, 1.45); }
});
const endPtr = e => {
  pointers.delete(e.pointerId); if (pointers.size) return;
  dragging = false; canvas.classList.remove('drag'); pinchD = 0;
  if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && e.type === 'pointerup') {
    const i = pick(e.clientX, e.clientY); if (i >= 0) goTo(i);
  }
  downAt = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.d = clamp(goal.d * Math.exp(e.deltaY * .0012), 6, 170); lastInput = performance.now(); }, { passive: false });

/* ------------------------------------------------------------------ sound */
const Sound = {
  ctx: null, on: false, master: null, fx: null,
  init() {
    if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    this.fx = ctx.createGain(); this.fx.gain.value = 0; this.fx.connect(ctx.destination);
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
    this.noise = buf;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const hg = ctx.createGain(); hg.gain.value = .55; src.connect(lp).connect(hg).connect(this.master); src.start();
    [110, 164.81, 220, 277.18].forEach((f, k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = .03 / (k + 1);
      const l = ctx.createOscillator(); l.frequency.value = .05 + k * .031; const lg = ctx.createGain(); lg.gain.value = .022 / (k + 1);
      l.connect(lg).connect(g.gain); o.connect(g).connect(this.master); o.start(); l.start();
    });
  },
  toggle() {
    this.init(); if (!this.ctx) return; this.on = !this.on; this.ctx.resume?.();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.on ? .55 : 0, t, .5); this.fx.gain.setTargetAtTime(this.on ? .9 : 0, t, .05);
    return this.on;
  },
  tone(f, dur = 1.4, type = 'sine', vol = .12, at = 0, slide) {
    if (!this.on) return; const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(this.fx); o.start(t); o.stop(t + dur + .05);
  },
  chime() { this.tone(880, 1.6, 'sine', .09); this.tone(1318.5, 1.8, 'sine', .07, .09); },
  thud() { this.tone(120, .35, 'sine', .25, 0, 40); this.tone(1760, .5, 'triangle', .04); },
  buzz() { this.tone(110, .5, 'sawtooth', .07, 0, 90); this.tone(104, .5, 'sawtooth', .06, .05, 80); },
  alarm() { this.tone(660, .18, 'square', .03); this.tone(660, .18, 'square', .03, .25); },
  whoosh(up) {
    if (!this.on) return; const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(up ? 250 : 2200, t); bp.frequency.exponentialRampToValueAtTime(up ? 2600 : 200, t + 1.3);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .3); g.gain.exponentialRampToValueAtTime(.001, t + 1.5);
    s.connect(bp).connect(g).connect(this.fx); s.start(t); s.stop(t + 1.6);
    if (up) [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => this.tone(f, 1.6, 'sine', .05, .25 + k * .08));
  },
};

/* ------------------------------------------------------------------ UI */
const body = document.body, panel = $('#panel'), pbody = $('#p-body');
const PINS = STOPS.map((s, i) => {
  const el = document.createElement('button'); el.className = 'pin'; el.type = 'button';
  el.innerHTML = `<span class="n">${i + 1}</span><span class="lbl">${s.short}</span>`;
  el.setAttribute('aria-label', `Stop ${i + 1}: ${s.title}`);
  el.addEventListener('click', () => goTo(i)); $('#pins').appendChild(el);
  return { el, v: new T.Vector3(...s.anchor) };
});
function updatePins() {
  const v = new T.Vector3();
  PINS.forEach((p, i) => {
    v.copy(p.v).project(camera);
    const off = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1;
    p.el.style.visibility = off ? 'hidden' : 'visible';
    if (!off) p.el.style.transform = `translate(${(v.x * .5 + .5) * W - 14}px, ${(-v.y * .5 + .5) * H - 14}px)`;
  });
}
function refreshSeen() {
  $('#seen').textContent = seen.size; $('#seenbar').style.width = (seen.size / STOPS.length * 100) + '%';
  PINS.forEach((p, i) => { p.el.classList.toggle('seen', seen.has(i)); p.el.classList.toggle('on', i === current); });
}
function panelHTML(i) {
  const s = STOPS[i], A = ACTS[s.act];
  let h = `<p class="eyebrow"><b>${A.label}</b> · ${A.q}</p><h2 class="ptitle">${s.title}</h2><p class="key">${s.key}</p>`;
  if (s.special === 'advice') {
    h += `<section class="blk"><h3 class="lab"><i class="dot acc"></i>Mr. Mayor, my advice</h3>
      <ol class="advice">
        <li><span>Say yes, step by step. Start with one district and the two problems people feel every day, traffic and street lighting. They show results quickly.</span></li>
        <li><span>Put cybersecurity in the budget from day one, not after the first attack.</span></li>
        <li><span>Be open. Publish the data, ask the citizens, and keep a human answer behind every service.</span></li>
      </ol></section>
      <section class="blk proof"><h3 class="lab">What a smart city is, for me</h3>
      <p class="def">Not a city full of sensors. A city that listens to its people, and protects what it hears.</p><p class="def-by">Yanis</p></section>
      <section class="blk"><div class="seg" role="group" aria-label="City mode"><button data-mode="0">Ordinary</button><button data-mode="1">Smart</button></div></section>`;
    return h;
  }
  h += `<section class="blk"><h3 class="lab"><i class="dot bad"></i>${s.labA || 'Today'}</h3><p>${s.today}</p></section>`;
  h += `<section class="blk"><h3 class="lab"><i class="dot acc"></i>${s.labB || 'With a smart city'}</h3>${s.answer}</section>`;
  if (s.special === 'json') h += `<section class="blk"><h3 class="lab">Everything this box sends, live</h3>
    <pre class="json">{
  <span class="k">"sensor"</span>: <span class="s">"crossroads-01"</span>,
  <span class="k">"time"</span>: <span class="s">"<span id="j-time">18:42:07</span>"</span>,
  <span class="k">"cars_waiting"</span>: <span class="n" id="j-cars">0</span>,
  <span class="k">"green_for"</span>: <span class="s">"<span id="j-green">north-south</span>"</span>
}</pre><p class="cap">No face. No number plate. No name. Nothing that points to a person.</p></section>`;
  if (s.special === 'attack') h += `<section class="blk"><h3 class="lab">Try it</h3><div class="attack"><button class="cta" data-attack>Simulate an attack</button><kbd>A</kbd></div></section>`;
  if (s.watch) h += `<section class="blk"><h3 class="lab"><i class="dot good"></i>Watch the model</h3><p>${s.watch}</p><div class="seg" role="group" aria-label="City mode"><button data-mode="0">Ordinary</button><button data-mode="1">Smart</button></div></section>`;
  if (s.proof) h += `<section class="blk proof"><h3 class="lab">${s.proofLab || 'Real example'}</h3><p>${s.proof}</p>${s.src ? `<p class="src">${s.src}</p>` : ''}</section>`;
  return h;
}
function syncSeg() { for (const b of document.querySelectorAll('.seg button')) b.setAttribute('aria-pressed', String((b.dataset.mode === '1') === smart)); }
pbody.addEventListener('click', e => {
  const m = e.target.closest('[data-mode]'); if (m) setSmart(m.dataset.mode === '1');
  if (e.target.closest('[data-attack]')) launchAttack();
});
function goTo(i) {
  if (i < 0 || i >= STOPS.length) return;
  if (!$('#letter').classList.contains('gone')) enter();
  current = i; const s = STOPS[i];
  pbody.innerHTML = panelHTML(i); pbody.scrollTop = 0; syncSeg();
  $('#p-step').textContent = `Stop ${i + 1} of ${STOPS.length}`; $('#p-pos').textContent = `${i + 1} / ${STOPS.length}`;
  $('#p-prev').disabled = false; $('#p-next').textContent = i === STOPS.length - 1 ? 'Back to the town ↺' : 'Next →';
  panel.dataset.open = 'true'; body.classList.add('panel-open');
  setGoal(s.view);
  if (!seen.has(i)) { seen.add(i); store.set('city-seen', [...seen]); Sound.chime(); } else Sound.tone(660, .6, 'sine', .04);
  refreshSeen(); updateNotes();
  if (s.special === 'advice' && !smart) setTimeout(() => current === i && setSmart(true), 1100);
  $('#book').hidden = true;
}
function closePanel() {
  current = -1; panel.dataset.open = 'false'; body.classList.remove('panel-open'); setGoal(overview()); refreshSeen(); updateNotes();
}
const next = () => current < 0 ? goTo(0) : current < STOPS.length - 1 ? goTo(current + 1) : closePanel();
const prev = () => current <= 0 ? closePanel() : goTo(current - 1);
$('#p-close').onclick = closePanel; $('#p-next').onclick = next; $('#p-prev').onclick = prev;

function setSmart(v) {
  if (v === smart) { syncSeg(); return; }
  smart = v;
  const sw = $('#sw'); sw.setAttribute('aria-checked', String(v)); sw.classList.remove('nudge');
  $('#mode-t').textContent = v ? 'Smart town' : 'Ordinary town';
  $('#mode-d').textContent = v ? 'Sensors on, data protected, everything published' : 'Timers, fixed rounds, lights always on';
  if (v) { pulse.userData.t = 0; }
  Sound.whoosh(v); syncSeg();
}
$('#sw').onclick = () => setSmart(!smart);

let toastTimer;
function toast(msg, kind = 'good') {
  document.querySelector('.toast')?.remove(); clearTimeout(toastTimer);
  const t = document.createElement('div'); t.className = 'toast glass'; t.setAttribute('role', 'status');
  t.innerHTML = `<i class="dot ${kind}"></i><span></span>`; t.lastChild.textContent = msg; body.appendChild(t);
  toastTimer = setTimeout(() => t.remove(), 4200);
}

/* notes */
const notesEl = $('#notes');
function updateNotes() {
  $('#n-where').textContent = current < 0 ? 'Introduction' : `${current + 1}. ${STOPS[current].title}`;
  $('#n-text').textContent = current < 0 ? INTRO_NOTES : STOPS[current].notes;
}
function toggleNotes() { notesEl.hidden = !notesEl.hidden; $('#b-notes').setAttribute('aria-pressed', String(!notesEl.hidden)); updateNotes(); }
$('#b-notes').onclick = toggleNotes;

/* notebook */
function buildBook() {
  const wrap = $('#book-acts'); wrap.innerHTML = '';
  ACTS.forEach((A, a) => {
    const d = document.createElement('div'); d.className = 'act';
    d.innerHTML = `<h3><b>${A.label}</b> · ${A.q}</h3><ul></ul>`;
    STOPS.forEach((s, i) => {
      if (s.act !== a) return;
      const li = document.createElement('li');
      li.innerHTML = `<button type="button"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="tt">${s.title}<small>${s.today || 'Three recommendations and my own definition.'}</small></span><span class="ck">${seen.has(i) ? 'visited' : ''}</span></button>`;
      li.firstChild.onclick = () => goTo(i); d.lastChild.appendChild(li);
    });
    wrap.appendChild(d);
  });
}
function openBook() { buildBook(); $('#book').hidden = false; $('#book-close').focus(); }
$('#b-book').onclick = openBook; $('#book-close').onclick = () => { $('#book').hidden = true; };
$('#book').addEventListener('click', e => { if (e.target.id === 'book') $('#book').hidden = true; });

$('#b-tour').onclick = () => goTo(current < 0 ? 0 : current);
$('#b-sound').onclick = () => { const on = Sound.toggle(); $('#b-sound').setAttribute('aria-pressed', String(!!on)); };
$('#b-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.().catch(() => {}); };

function enter() { $('#letter').classList.add('gone'); lastInput = performance.now() - 3000; }
$('#enter').onclick = enter;

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const letterOpen = !$('#letter').classList.contains('gone');
  if (letterOpen) { if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); enter(); } return; }
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
  else if (k === 'Escape') { if (!$('#book').hidden) $('#book').hidden = true; else closePanel(); }
  else if (k === 's' || k === 'S') setSmart(!smart);
  else if (k === 'n' || k === 'N') toggleNotes();
  else if (k === 'c' || k === 'C') { if ($('#book').hidden) openBook(); else $('#book').hidden = true; }
  else if (k === 'a' || k === 'A') launchAttack();
  else if (k === 'm' || k === 'M') $('#b-sound').click();
  else if (k === 'f' || k === 'F') $('#b-full').click();
  else if (k === 'Home') closePanel();
});

/* sparklines + metrics */
function spark(id, data, max, color) {
  const c = document.getElementById(id); if (!c || !c.offsetWidth) return;
  const r = Math.min(2, devicePixelRatio), w = c.offsetWidth, h = c.offsetHeight;
  if (c.width !== w * r) { c.width = w * r; c.height = h * r; }
  const g = c.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h);
  if (data.length < 2) return;
  const X = i => i / (60 - 1) * w, Y = v => h - 2 - clamp(v / max, 0, 1) * (h - 5);
  g.beginPath(); data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)));
  g.strokeStyle = color; g.lineWidth = 1.5; g.lineJoin = 'round'; g.stroke();
  g.lineTo(X(data.length - 1), h); g.lineTo(0, h); g.closePath(); g.globalAlpha = .14; g.fillStyle = color; g.fill(); g.globalAlpha = 1;
  g.beginPath(); g.arc(X(data.length - 1), Y(data[data.length - 1]), 2.4, 0, 7); g.fillStyle = color; g.fill();
}
let lastLight = 100;
function tickMetrics() {
  const waiting = CARS.filter(c => c.v < .4).length;
  idleEMA = lerp(idleEMA, waiting, .12);
  metrics = { wait: waiting, light: lastLight, bins: BINS.filter(b => b.fill >= 1).length, air: Math.round(14 + idleEMA * 2.6 + (1 - smartK) * 6) };
  $('#m-wait').textContent = metrics.wait; $('#m-light').textContent = metrics.light; $('#m-bins').textContent = metrics.bins; $('#m-air').textContent = metrics.air;
  for (const k in hist) { hist[k].push(metrics[k]); if (hist[k].length > 60) hist[k].shift(); }
  const acc = css('--accent'), mut = css('--muted'), c = smart ? acc : mut;
  spark('sp-wait', hist.wait, 24, c); spark('sp-light', hist.light, 100, c); spark('sp-bins', hist.bins, 6, c); spark('sp-air', hist.air, 80, c);
  const jc = document.getElementById('j-cars');
  if (jc) {
    const I = IMAP.get('0,0');
    jc.textContent = I.q.x + I.q.z;
    const d = new Date(); $('#j-time').textContent = d.toTimeString().slice(0, 8);
    $('#j-green').textContent = I.green === 'x' ? 'east-west' : I.green === 'z' ? 'north-south' : 'changing';
  }
  drawHall(); drawBus();
}

/* ------------------------------------------------------------------ loop */
const clock = new T.Clock(); let mt = 0, heartT = 0;
const tmpV = new T.Vector3();
function frame() {
  const dt = Math.min(.05, clock.getDelta()), time = clock.elapsedTime;
  smartK = lerp(smartK, smart ? 1 : 0, damp(1.6, dt));
  const sk = ease(clamp(smartK, 0, 1));

  if (current < 0 && !dragging && performance.now() - lastInput > 4000 && !reduced) goal.az += .035 * dt;

  stepLights(dt); stepCars(dt); stepBus(dt); stepPeople(dt, time); stepBins(dt); stepAttacks(dt);
  renderCars();
  // lamps: lights may update at every frame, the count is stored for metrics
  lastLight = stepLamps(dt);

  // fog / smog
  scene.fog.color.copy(fogB).lerp(fogA, sk); scene.fog.near = cam.d * lerp(.55, .95, sk); scene.fog.far = cam.d * lerp(1.9, 2.9, sk) + 20;
  // smart visuals
  loopMat.opacity = sk * (.25 + .15 * Math.sin(time * 3));
  const netFocus = current === 7 ? 2 : 1;
  for (const A of ARCS) {
    const vis = A.group === 'health' ? sk * (current === 6 ? 2 : 1) : sk * netFocus;
    A.line.material.opacity = .16 * vis;
    for (const p of A.packets) { p.t = (p.t + dt * A.speed) % 1; A.curve.getPoint(p.t, p.s.position); p.s.material.opacity = Math.min(1, .85 * vis); }
  }
  shield.scale.setScalar(Math.max(.001, ease(clamp(smartK * 1.2 - .1, 0, 1))));
  shield.rotation.y += dt * .08; shieldFlash = Math.max(0, shieldFlash - dt * 1.8);
  shieldWireMat.opacity = .22 + shieldFlash * .7; shieldSkinMat.opacity = .05 + shieldFlash * .2;
  dcAlarm = Math.max(0, dcAlarm - dt);
  if (dcAlarm > 0) ledMat.emissive.setRGB(Math.sin(time * 20) > 0 ? 1 : .2, .02, .02);
  else ledMat.emissive.copy(fogB).lerp(accentCol, sk).multiplyScalar(.5 + sk * .8);
  mastLight.material.opacity = (Math.sin(time * 3) > .6 ? 1 : .15) * (G * .7 + .3);
  for (const f of fans) f.rotation.y += dt * 8;
  rotor.rotation.z += dt * (.7 + sk * 1.6);
  for (const P of PANELS) P.scale.setScalar(Math.max(.001, ease(clamp(smartK * 1.5 - P.userData.delay, 0, 1))));
  wifi.forEach((m, k) => { m.material.opacity = sk * (.25 + .75 * Math.max(0, Math.sin(time * 3 - k * .9))); });
  sensorRings.forEach((s, k) => { const t = (time * .7 + k * .5) % 1; s.scale.setScalar(.3 + t * 3); s.material.opacity = sk * (1 - t) * .8; });
  sensorLed.material.opacity = .3 + sk * .7 * (.6 + .4 * Math.sin(time * 6));
  jet.material.opacity = (.35 + .1 * Math.sin(time * 4)) * (G * .6 + .2);
  busMesh.userData.beacon.material.opacity = sk * (.6 + .4 * Math.sin(time * 5));
  if (window.__flag1) { window.__flag1.rotation.y = Math.sin(time * 2) * .25; window.__flag2.rotation.y = Math.sin(time * 2.3 + 1) * .25; }
  // pulse
  if (pulse.userData.t < 2.6) { pulse.userData.t += dt; const t = pulse.userData.t / 2.6; pulse.scale.setScalar(1 + ease(t) * 52); pulse.material.opacity = (1 - t) * .9; }
  else pulse.material.opacity = 0;
  // hearts
  heartT += dt;
  if (smart && heartT > .45) {
    heartT = 0; const h = HEARTS.find(h => h.t > 2.2), p = PEOPLE[Math.floor(rnd() * ZONES[0].n)];
    if (h) { h.t = 0; h.s.visible = true; h.s.position.set(p.x, 1.3, p.z); }
  }
  for (const h of HEARTS) if (h.s.visible) {
    h.t += dt; h.s.position.y += dt * 1.3; h.s.material.opacity = Math.max(0, Math.sin(Math.min(1, h.t / 2.2) * Math.PI)) * sk;
    if (h.t > 2.2) h.s.visible = false;
  }

  updateCamera(dt);
  renderer.render(scene, camera);
  updatePins();
  mt += dt; if (mt > .25) { mt = 0; tickMetrics(); }
  requestAnimationFrame(frame);
}

applyPalette(); resize(); setGoal(overview(), true); refreshSeen(); updateNotes();
renderCars();
// warm the simulation so the first frame shows real traffic
for (let i = 0; i < 240; i++) { stepLights(1 / 30); stepCars(1 / 30); stepBus(1 / 30); stepBins(1 / 60); }
tickMetrics();
requestAnimationFrame(frame);
setTimeout(() => $('#enter').focus({ preventScroll: true }), 400);
})();
