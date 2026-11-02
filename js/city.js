(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!window.THREE) { $('#nogl').hidden = false; return; }
const T = THREE;

/* ------------------------------------------------------------------ content */
const ACTS = [
  { label: 'Part I', q: 'A day in your life' },
  { label: 'Part II', q: 'Your fears' },
  { label: 'Part III', q: 'Your say' },
  { label: 'Answer', q: 'How to convince people' },
];
const INTRO = { time: '18:00', tod: 'sunset', notes: "In this situation, I am the IT technician of our town hall. The mayor wants to turn our town into a smart city, and he asked me how to convince people that it is good for their way of life. My answer is simple: don't talk about technology, show people their own day. Here is our town today: grey, polluted, stuck in traffic. Now watch what happens when it becomes smart. [Press S.] Let's follow one resident through a normal day." };

const STOPS = [
  { short: 'Leaving home', act: 0, time: '07:30', tod: 'dawn', title: 'Leaving home', key: 'Document C · key 4 · Urban mobility',
    anchor: [0, 3.2, 0], view: { t: [0, 0, 0], az: 38, el: 36, d: 30 },
    today: 'You drive to work. The light turns red for an empty street, again and again. You arrive late and stressed.',
    smart: 'Sensors count the cars. The lights give green where people are waiting and let the traffic flow in waves.',
    forYou: 'Less time stuck at red lights. More time at home in the morning.',
    proof: 'In Pittsburgh, adaptive lights called Surtrac cut travel time by about 25% and waiting at red lights by about 40%.',
    src: 'Figures reported by the Carnegie Mellon team for the first pilot.',
    notes: "7:30, you leave home and drive to work. Today, you stop at red lights even when nobody is crossing. In a smart city, the lights adapt to the real traffic. In Pittsburgh, people spent about 25 percent less time in their car. That is my first argument for the citizens: time." },
  { short: 'The bus', act: 0, time: '08:10', tod: 'morning', title: 'Catching the bus', key: 'Document C · key 4 · Sustainable public transport',
    anchor: [14, 3, 4], view: { t: [13.5, 1, 3.5], az: 167, el: 27, d: 16 },
    today: 'You don’t know when the bus will come. You wait in the cold, or you give up and take the car.',
    smart: 'The stop and your phone show the real waiting time. The traffic lights let the bus go first.',
    forYou: 'You leave home at the right minute, and the bus becomes faster than the car.',
    notes: "8:10, you take the bus. Today, nobody knows when it will come, so people take their car. In a smart city, the bus shares its position: the screen at the stop and the app show the real waiting time, and the lights let the bus go first. You leave home at the right minute." },
  { short: 'The park', act: 0, time: '12:30', tod: 'noon', title: 'Lunch in the park', key: 'Document C · key 6 · Environmental sustainability',
    anchor: [8, 3.4, 9], view: { t: [8, 1, 7], az: 18, el: 32, d: 26 },
    today: 'On busy days the air is heavy with exhaust. Nobody warns you, even if your child has asthma.',
    smart: 'Air sensors measure pollution street by street and send an alert on bad days. Solar roofs and a wind turbine make local energy.',
    forYou: 'Cleaner air, and a warning on your phone before you go out with your kids.',
    notes: "12:30, lunch in the park. Look at the smog in the ordinary town: cars waiting with their engine on. In the smart town, there are fewer traffic jams, so the air is cleaner, and sensors warn people with asthma on bad days. That is an argument about health, not about technology." },
  { short: 'Grandma', act: 0, time: '14:00', tod: 'afternoon', title: 'Grandma’s check-up', key: 'Document C · key 9 · Technologies applied to health',
    anchor: [24.5, 7.2, -25.5], view: { t: [24.5, 2.5, -24], az: -40, el: 40, d: 34 },
    today: 'Your grandmother takes two buses to see her doctor for a five-minute check-up.',
    smart: 'A video consultation, and a connected device that sends her blood pressure to the doctor.',
    forYou: 'She stays at home, safe, and the doctor still keeps an eye on her.',
    notes: "2 p.m., your grandmother needs a check-up. Today she travels across town for five minutes with the doctor. In a smart city, she can see the doctor by video, and a connected device sends her blood pressure. She stays home, and the hospital is free for real emergencies." },
  { short: 'School', act: 0, time: '16:30', tod: 'afternoon', title: 'Picking up the kids', key: 'Document C · key 8 · Technologies applied to education',
    anchor: [24, 5.4, 25], view: { t: [24, 1.5, 24], az: -140, el: 30, d: 21 },
    today: 'Some pupils have a computer and fast internet at home. Others don’t. Homework is not fair.',
    smart: 'Wi-Fi in every classroom, a digital workspace shared with parents, laptops lent to the families who need them.',
    forYou: 'Your kids learn with the same tools as everyone, and you can follow their homework.',
    notes: "4:30 p.m., you pick up the kids. In a smart city, every classroom is connected, parents and teachers share a digital workspace, and families who need a laptop can borrow one. For parents, the argument is equality for their children." },
  { short: 'Your street', act: 0, time: '18:00', tod: 'sunset', title: 'Back in your street', key: 'Document C · key 5 · Smart waste management',
    anchor: [-3.3, 2.6, 8.2], view: { t: [-3.2, 0.5, 8.4], az: 74, el: 30, d: 16 },
    today: 'The bin at your door has been full for two days. Bags pile up on the pavement.',
    smart: 'Each bin knows how full it is. The truck comes when it is needed and skips the empty ones.',
    forYou: 'A clean street, and fewer trucks blocking the road for nothing.',
    notes: "6 p.m., you come back to your street. Today, the bin has been full for two days, while the truck empties half-empty bins somewhere else. With a fill sensor, the truck only comes when it is needed. People notice a clean street immediately." },
  { short: 'Walking home', act: 0, time: '22:30', tod: 'night', title: 'Walking home', key: 'Document C · keys 2 and 6 · Automation and environment',
    anchor: [0, 4.4, -24], view: { t: [0, 1, -23], az: 8, el: 20, d: 20 },
    today: 'Streetlights burn at full power all night on empty streets. When one breaks, nobody knows for weeks.',
    smart: 'LED lights dim when the street is empty and light up as you walk. A broken lamp reports itself.',
    forYou: 'You walk home in the light, and the money saved on electricity can pay for something else.',
    proof: 'In 2017, Dijon Métropole signed a 12-year, 105 million euro contract to run its 23 towns from one control centre. Its target: 65% less energy for street lighting.',
    src: 'The 65% is a target written in the contract, not a measured result.',
    notes: "10:30 p.m., you walk home. Today, every lamp burns all night, even on empty streets. In a smart city, the light follows you, and a broken lamp reports itself. You feel safe, and the town saves money. Dijon, in France, set a target of 65 percent energy savings on street lighting." },
  { short: 'Watched?', act: 1, time: '23:00', tod: 'night', title: 'Is someone watching me?', key: 'Privacy by design',
    anchor: [2.7, 3.8, 2.7], view: { t: [2.7, 2.6, 2.7], az: 45, el: 12, d: 8 },
    today: 'People imagine cameras on every corner and a town that tracks where they go.',
    smart: 'Our sensors count, they don’t film. No faces, no number plates. The data is made anonymous inside the box and deleted after 30 days.',
    forYou: 'The town knows how many cars are waiting. It never knows that it’s you.',
    special: 'json',
    proof: 'The GDPR (2018) makes this the law: collect the minimum, say why, delete on time. In France, the CNIL can check us.',
    proofLab: 'The law',
    notes: "To convince people, we must also answer their fears. The first fear is: is someone watching me? My rule is: count, don't film. Here is exactly what this sensor sends: a number of cars, a time, a direction. Nothing about a person. And the GDPR makes it the law." },
  { short: 'Hacked?', act: 1, time: '23:30', tod: 'night', title: 'Can someone hack it?', key: 'My job: IT technician, BTS CIEL',
    anchor: [-24.5, 4.6, -24.5], view: { t: [-24, 2, -24], az: 48, el: 30, d: 30 },
    today: 'A badly protected town can be attacked: lights switched off, traffic blocked, personal data stolen.',
    smart: '<ul><li><b>Encrypt everything,</b> in transit and at rest.</li><li><b>Separate the networks.</b> A hacked bin cannot reach the town hall.</li><li><b>Control access,</b> with two-factor login.</li><li><b>Patch, test, back up</b> every device.</li><li><b>Stay in Europe,</b> under the GDPR.</li></ul>',
    forYou: 'Your data stays in Europe, encrypted, and protected by people whose job is to protect it.',
    special: 'attack',
    notes: "The second fear is: can someone hack it? This is my job, and what I study in my BTS CIEL. Five rules: encrypt, separate the networks, control access, update and test, and keep the data in Europe. Let me show you an attack. In the ordinary town it reaches the servers. In the smart town, it is blocked." },
  { short: 'Your say', act: 2, time: '10:00', tod: 'morning', title: 'Having your say', key: 'Document C · keys 7, 11 and 12 · Social environment, transparency, open data',
    anchor: [-8.5, 8.6, -8], view: { t: [0, 2, -8.5], az: 92, el: 26, d: 30 },
    today: 'Projects are decided at the town hall. You hear about them when the roadworks start.',
    smart: 'Everything the town measures is public, live, on the screen at the town hall and in an app. You vote on projects, report a pothole, scan the QR code on any sensor. A person at the desk helps those who are not online.',
    forYou: 'You see the results, and you decide what comes next.',
    proof: 'Toronto, 2020: Sidewalk Labs, a sister company of Google, dropped its smart neighbourhood project. It blamed the economy, but the project had faced years of criticism about privacy and about who controls the data.',
    proofLab: 'The counter-example',
    notes: "The next morning, you have your say. In a smart city, everything the town measures is public: on this screen and in an app. People vote on projects and report problems. And there is always a human at the desk. Toronto is the counter-example: a smart district project was dropped in 2020 after years of criticism about privacy. People must be part of the project, not its target." },
  { short: 'The answer', act: 3, time: '18:00', tod: 'sunset', title: 'How to convince people', key: 'My answer to the mayor',
    anchor: [8, 19.5, -24], view: { t: [0, -2, 0], az: -32, el: 36, d: 100 },
    special: 'convince',
    notes: "So, how do we convince people that a smart city is good for their way of life? Five ideas. One: show, don't explain, like with this model, and start with a pilot district. Two: talk about their day, not about technology. Three: prove it, and publish the results. Four: protect their data, and say how. Five: let them decide, and keep a human answer for everyone. For me, a smart city is not a city full of sensors. It is a city that listens to its people, and protects what it hears. Thank you. Do you have any questions?" },
];

/* time of day */
const TOD = {
  dawn:      { label: 'Early morning', top: '#6d86b0', bot: '#ffc395', sun: '#ffc58f', si: 1.6, pos: [44, 15, -22], hs: '#c9d4ef', hg: '#5a4436', hi: .8, glow: .55, fog: '#d8b9a3' },
  morning:   { label: 'Morning', top: '#78a3d6', bot: '#ffe2c2', sun: '#ffe4c2', si: 2, pos: [40, 30, -14], hs: '#d8e6ff', hg: '#6e5a48', hi: .95, glow: .12, fog: '#e6d5c4' },
  noon:      { label: 'Midday', top: '#6aa5df', bot: '#dcecfb', sun: '#fff7ea', si: 2.3, pos: [12, 60, 18], hs: '#e4efff', hg: '#7a6a55', hi: 1.05, glow: 0, fog: '#dbe4ec' },
  afternoon: { label: 'Afternoon', top: '#7ca8da', bot: '#ffe6c6', sun: '#ffe8c6', si: 2.05, pos: [-30, 38, 22], hs: '#dfe8ff', hg: '#7a6250', hi: .95, glow: .05, fog: '#e8d8c5' },
  sunset:    { label: 'Sunset', top: '#4b3a6c', bot: '#ff9567', sun: '#ff8a4c', si: 1.7, pos: [-46, 13, 22], hs: '#a48dbe', hg: '#3a2418', hi: .85, glow: .85, fog: '#c98d76' },
  night:     { label: 'Night', top: '#0b0e1f', bot: '#2c1f37', sun: '#8aa2ff', si: .4, pos: [-20, 45, 30], hs: '#3b4a7e', hg: '#120c0a', hi: .55, glow: 1.25, fog: '#1d1a2c' },
};

/* ------------------------------------------------------------------ helpers */
const css = n => getComputedStyle(root).getPropertyValue(n).trim();
const lin = hex => new T.Color(hex).convertSRGBToLinear();
const col = n => lin(css(n) || '#ff00ff');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
const D2R = Math.PI / 180;
let seed = 20261031;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rr = (a, b) => a + (b - a) * rnd();
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ------------------------------------------------------------------ the wave: ordinary (grey) -> smart (alive) */
const WAVE = { uR: { value: 0 }, uC: { value: new T.Vector2(-8, -8) }, uW: { value: 7 }, uEdge: { value: new T.Color(1, .3, .6) }, uEdgeOn: { value: 0 } };
let waveR = 0;
const wake = (x, z) => sstep(0, WAVE.uW.value, waveR - Math.hypot(x - WAVE.uC.value.x, z - WAVE.uC.value.y));
function waveCompile(sh) {
  Object.assign(sh.uniforms, WAVE);
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
    .replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wpW = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wpW = instanceMatrix * wpW;
      #endif
      vWPos = (modelMatrix * wpW).xyz;`);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uR; uniform vec2 uC; uniform float uW; uniform vec3 uEdge; uniform float uEdgeOn;')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float wd = uR - distance(vWPos.xz, uC);
      float wk = smoothstep(0.0, uW, wd);
      float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb = mix(vec3(lum) * vec3(0.80, 0.79, 0.78), diffuseColor.rgb, wk);
      totalEmissiveRadiance *= mix(0.35, 1.0, wk);`)
    .replace('#include <tonemapping_fragment>', `
      float l2 = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor.rgb = mix(mix(gl_FragColor.rgb, vec3(l2) * vec3(0.96, 0.93, 0.89), 0.88) * 0.8, gl_FragColor.rgb, wk);
      gl_FragColor.rgb += uEdge * (1.0 - smoothstep(0.0, 2.2, abs(wd - 1.0))) * 1.6 * uEdgeOn;
      #include <tonemapping_fragment>`);
}

/* ------------------------------------------------------------------ renderer */
const canvas = $('#scene');
let renderer;
try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch (e) { $('#nogl').hidden = false; return; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new T.Scene();
scene.fog = new T.Fog(0x2a1a12, 60, 200);
const camera = new T.PerspectiveCamera(36, 1, 0.5, 500);
const hemi = new T.HemisphereLight(0xffffff, 0x000000, .8);
scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 1.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 180 });
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
const puffTex = (() => {
  const [c, g] = cnv(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
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
function drawClock(hh = 18, mm = 0) {
  const g = clockG, h = hh % 12 + mm / 60;
  g.fillStyle = '#f6efe2'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.strokeStyle = '#2a2018'; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); g.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54); g.stroke(); }
  const hand = (a, l, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(a) * l, 64 - Math.cos(a) * l); g.stroke(); };
  hand(h / 12 * Math.PI * 2, 30, 6); hand(mm / 60 * Math.PI * 2, 44, 4); clockTex.needsUpdate = true;
}
drawClock();

/* ------------------------------------------------------------------ materials */
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
const noWave = m => { m.userData.noWave = true; return m; };

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
const S_CROSS = 0, S_BUS = 1, S_PARK = 2, S_HOSP = 3, S_SCHOOL = 4, S_BINS = 5, S_LAMPS = 6, S_SENSOR = 7, S_SERVER = 8, S_SAY = 9;

// town hall (-8,-8)
mbox(9.4, .45, 8, M.stone, -8.9, .25, -8);
addBuilding(-9.6, -8, 5.6, 6.2, 3.9, '--s-stone', .7);
for (let k = 0; k < 6; k++) mcyl(.2, .22, 3.2, 10, M.stone, -5.6, .7, -10.6 + k * 1.04);
mbox(1.3, .7, 6.6, M.stone, -5.9, 3.9, -8);
gable(-8.9, 4.6, -8, 7.6, 6.8, 1.4, M.roof, true);
mbox(1.9, 2.6, 1.9, M.stone, -9.6, 4.6, -8);
mbox(2.1, .2, 2.1, M.roof, -9.6, 7.2, -8);
const flags = [];
{
  const dome = new T.Mesh(new T.SphereGeometry(.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.roof); dome.position.set(-9.6, 7.4, -8); dome.castShadow = true; scene.add(dome);
  const face = new T.Mesh(new T.CircleGeometry(.6, 32), new T.MeshBasicMaterial({ map: clockTex, toneMapped: false }));
  face.position.set(-8.62, 6, -8); face.rotation.y = Math.PI / 2; scene.add(face);
  mcyl(.03, .03, 1.7, 6, M.dark, -9.6, 8.3, -8);
  const flag = new T.Mesh(new T.PlaneGeometry(.9, .6), new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: .9 }));
  flag.position.set(-9.15, 9.65, -8); scene.add(flag); flags.push(flag);
}
mbox(1.1, .3, 4.4, M.stone, -4.75, .25, -8);
const hallScreen = (() => {
  const [c, g] = cnv(640, 360), tex = ctex(c);
  mbox(.18, 1.2, .18, M.dark, -2.75, .25, -13.1); mbox(.18, 1.2, .18, M.dark, -2.75, .25, -10.1);
  mbox(.22, 2.3, 4, M.dark, -2.78, 1.3, -11.6);
  const p = new T.Mesh(new T.PlaneGeometry(3.7, 2.08), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
  p.position.set(-2.66, 2.45, -11.6); p.rotation.y = Math.PI / 2; scene.add(p);
  return { c, g, tex };
})();
hitbox(S_SAY, -8.2, .25, -8.6, 12, 8, 10);

// main square (8,-8)
mbox(11.4, .06, 11.4, M.pave, 8, .25, -8, scene, false);
mcyl(1.85, 1.95, .45, 28, M.stone, 8, .3, -8);
mcyl(1.6, 1.6, .05, 28, M.water, 8, .68, -8, scene, false);
mcyl(.5, .6, .5, 14, M.stone, 8, .3, -8);
const jet = new T.Sprite(spriteAccent({ opacity: .0 }));
jet.position.set(8, 1.4, -8); jet.scale.set(1, 1.6, 1); scene.add(jet);
for (const [x, z, r] of [[4.4, -8, 0], [11.6, -8, 0], [8, -4.4, 1], [8, -11.6, 1]]) { const b = mbox(1.5, .3, .45, M.trunk, x, .3, z); b.rotation.y = r * Math.PI / 2; }
for (const [x, z] of [[3.6, -3.6], [12.4, -3.6], [3.6, -12.4], [12.4, -12.4]]) addTree(x, z, 1.1, .3);
hitbox(S_SAY, 8, .25, -8, 11, 4, 11);

// server room (-24,-24)
const ledMat = noWave(new T.MeshStandardMaterial({ color: 0x111111, emissive: new T.Color(1, .5, .7), emissiveIntensity: 1.4, roughness: .4 }));
const fans = [];
{
  mbox(9, 2.8, 6.4, M.dark, -24.6, .25, -24.6);
  mbox(9.06, .12, 6.46, ledMat, -24.6, 1.05, -24.6, scene, false);
  mbox(9.06, .12, 6.46, ledMat, -24.6, 2.05, -24.6, scene, false);
  for (let k = 0; k < 3; k++) {
    const x = -27.6 + k * 3;
    mbox(1.6, .5, 1.6, M.roof, x, 3.05, -24.6);
    fans.push(mcyl(.6, .6, .06, 14, M.dark, x, 3.56, -24.6, scene, false));
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
hitbox(S_SERVER, -24.4, .25, -24.4, 11, 6, 9);

// hospital (24,-24)
addBuilding(25.2, -26, 8, 5.2, 6.2, '--s-white');
addBuilding(22, -20.6, 4.8, 4.6, 3.1, '--s-white');
const crossMat = noWave(new T.MeshStandardMaterial({ color: 0xd2373c, emissive: 0xd2373c, emissiveIntensity: .6 }));
mbox(2.2, .2, .62, crossMat, 25.2, 6.45, -26); mbox(.62, .2, 2.2, crossMat, 25.2, 6.45, -26);
{
  const h = new T.Mesh(new T.CircleGeometry(1.7, 32), new T.MeshStandardMaterial({ map: heliTex, roughness: .9 }));
  h.rotation.x = -Math.PI / 2; h.position.set(22, 3.37, -20.6); h.receiveShadow = true; scene.add(h);
  mbox(1.1, 1.05, 2.3, M.white, 28.6, .25, -19.4); mbox(1.12, .16, 2.32, crossMat, 28.6, .9, -19.4, scene, false);
}
hitbox(S_HOSP, 24.5, .25, -24, 11, 7, 11);

// school (24,24)
addBuilding(25, 27.4, 10, 4, 3.5, '--s-b3');
mbox(7.4, .03, 4.6, M.court, 23.6, .25, 21, scene, false);
mbox(7, .02, .08, M.mark, 23.6, .29, 21, scene, false); mbox(.08, .02, 4.2, M.mark, 23.6, .29, 21, scene, false);
mcyl(.04, .05, 4.2, 6, M.dark, 19.2, .25, 27.6);
{
  const f = new T.Mesh(new T.PlaneGeometry(1, .66), new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: .9 }));
  f.position.set(19.72, 4.05, 27.6); scene.add(f); flags.push(f);
}
addTree(28.6, 20, 1.1); addTree(29, 23, .9); addTree(19.6, 19.8, 1);
const wifi = [];
for (let k = 0; k < 3; k++) {
  const m = new T.Mesh(new T.TorusGeometry(.55 + k * .5, .07, 6, 32, Math.PI * .6), addMatAccent({ opacity: 0 }));
  m.rotation.z = Math.PI * .2; m.position.set(25, 4.3, 26.5); m.rotation.y = -Math.PI / 4;
  scene.add(m); wifi.push(m);
}
hitbox(S_SCHOOL, 24, .25, 24.5, 11, 5, 11);

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
hitbox(S_PARK, -24, .25, 24, 12, 10, 12);

// park, bus stop, sensor (8,8)
mbox(11.2, .04, 11.2, M.grass, 8, .25, 8, scene, false);
mbox(11.2, .05, 1, M.walk, 8, .25, 8, scene, false); mbox(1, .05, 11.2, M.walk, 8, .25, 8, scene, false);
{ const p = mcyl(2, 2, .05, 32, M.water, 11.2, .27, 11.4, scene, false); p.scale.z = .7; }
for (const [x, z] of [[4, 4.4], [5.6, 6.2], [4.2, 11.6], [6.2, 12.6], [11, 4.2], [12.8, 5.8], [10.2, 6.4], [3.8, 9.6], [13, 9], [6, 3.6]]) addTree(x, z, 1);
const busScreen = (() => {
  mcyl(.05, .05, 2.2, 6, M.dark, 13.3, .25, 3); mcyl(.05, .05, 2.2, 6, M.dark, 13.3, .25, 5.2);
  mbox(1.3, .08, 2.6, M.dark, 13.2, 2.45, 4.1);
  const glass = new T.Mesh(new T.BoxGeometry(.04, 1.6, 2.2), noWave(new T.MeshStandardMaterial({ color: 0x9fc4d6, transparent: true, opacity: .25, roughness: .1 })));
  glass.position.set(12.7, 1.3, 4.1); scene.add(glass);
  mbox(.4, .4, 1.8, M.trunk, 12.95, .25, 4.1);
  const [c, g] = cnv(256, 128), tex = ctex(c);
  mcyl(.05, .05, 2.4, 6, M.dark, 13.75, .25, 6.4);
  const p = new T.Mesh(new T.PlaneGeometry(1.3, .65), new T.MeshBasicMaterial({ map: tex, toneMapped: false, side: T.DoubleSide }));
  p.position.set(13.82, 2.25, 6.4); p.rotation.y = Math.PI / 2; scene.add(p);
  return { c, g, tex };
})();
hitbox(S_BUS, 13.4, .25, 4.6, 2.4, 3, 4.6);
hitbox(S_PARK, 8, .25, 9, 9, 2, 8);
{
  mcyl(.06, .08, 3.6, 8, M.dark, 2.7, .25, 2.7);
  mbox(.5, .38, .34, M.white, 2.7, 2.6, 2.7);
  const qr = new T.Mesh(new T.PlaneGeometry(.36, .36), new T.MeshBasicMaterial({ map: qrTex }));
  qr.position.set(2.77, 1.55, 2.77); qr.rotation.y = Math.PI / 4; scene.add(qr);
}
const sensorLed = new T.Sprite(spriteAccent({ opacity: .9 }));
sensorLed.position.set(2.95, 2.85, 2.95); sensorLed.scale.setScalar(.5); scene.add(sensorLed);
const sensorRings = [0, 1].map(() => { const s = new T.Sprite(spriteAccent({ map: ringTex, opacity: 0 })); s.position.set(2.7, 2.8, 2.7); scene.add(s); return s; });
hitbox(S_SENSOR, 2.7, .25, 2.7, 1.4, 4, 1.4);

// bins block (-8,8)
addBuilding(-10.2, 5.4, 6, 5, 7.8, '--s-b1');
addBuilding(-9.8, 11.4, 6.6, 4.6, 10.4, '--s-b2');
addTree(-5.2, 3.2, .9); addTree(-4.8, 13, .8);
const BINS = [4.2, 5.8, 7.4, 9, 10.6, 12.2].map((z, i) => {
  mcyl(.3, .27, .74, 12, M.bin, -3.3, .25, z);
  const lidMat = noWave(new T.MeshStandardMaterial({ color: 0x55aa77, emissive: 0x55aa77, emissiveIntensity: .35, roughness: .5 }));
  const lid = mcyl(.34, .34, .08, 12, lidMat, -3.3, .99, z);
  const beam = mcyl(.05, .05, 5, 6, addMatAccent({ opacity: 0, blending: T.AdditiveBlending }), -3.3, 1.05, z, scene, false);
  const bags = new T.Group(); bags.position.set(-3.3, .25, z); scene.add(bags);
  for (const [dx, dz, s] of [[.42, .3, .26], [.5, -.25, .22], [.2, .5, .2]]) {
    const b = new T.Mesh(new T.SphereGeometry(s, 8, 6), M.dark); b.position.set(dx, s * .8, dz); b.castShadow = true; bags.add(b);
  }
  bags.scale.setScalar(.001);
  return { z, fill: rr(.1, .7), rate: [.05, .016, .03, .055, .02, .04][i], lidMat, lid, beam, bags, pass: -1, flash: 0 };
});
hitbox(S_BINS, -3.5, .25, 8.2, 3, 2.5, 10);
hitbox(S_CROSS, 0, 0, 0, 6, 3, 6);
hitbox(S_LAMPS, 0, 0, -24, 6, 5, 12);

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
    const arm = new T.Mesh(armGeo, M.dark); arm.position.set((x + hx) / 2, 3.5, (z + hz) / 2); arm.rotation.y = -Math.atan2(hz - z, hx - x); scene.add(arm);
    const hm = noWave(new T.MeshStandardMaterial({ color: 0x222222, emissive: new T.Color(1, .8, .5), emissiveIntensity: 1.5 }));
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
const RED = lin('#ff3b2f'), GREEN = lin('#3ddc84'), AMBER = lin('#ffb020');
for (const ix of ROADS) for (const iz of ROADS) {
  const I = { x: ix, z: iz, g: rnd() < .5 ? 'x' : 'z', phase: 'green', t: rr(0, 8), q: { x: 0, z: 0 }, bus: null, mats: {} };
  for (const ax of ['x', 'z']) I.mats[ax] = noWave(new T.MeshStandardMaterial({ color: 0x111111, emissive: RED.clone(), emissiveIntensity: 2.2 }));
  for (const [dx, dz, ax] of [[2.4, 2.4, 'x'], [-2.4, -2.4, 'x'], [-2.4, 2.4, 'z'], [2.4, -2.4, 'z']]) {
    const p = new T.Mesh(tlPole, M.dark); p.position.set(ix + dx, .25 + 1.2, iz + dz); scene.add(p);
    const l = new T.Mesh(lightGeo, I.mats[ax]); l.position.set(ix + dx, 2.75, iz + dz); scene.add(l);
  }
  I.ringMat = addMatAccent({ map: ringTex, opacity: 0 });
  const ring = new T.Mesh(new T.PlaneGeometry(8, 8), I.ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(ix, .07, iz); scene.add(ring);
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
const bus = { p: 2, v: 0, dwell: 0, served: false, x: -15, z: -15 };
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
function pickTarget(p) {
  const Z = p.Z;
  for (let i = 0; i < 10; i++) { p.tx = rr(Z.x0, Z.x1); p.tz = rr(Z.z0, Z.z1); if (Math.hypot(p.tx - Z.ax, p.tz - Z.az) > Z.ar) break; }
}
for (const Z of ZONES) for (let k = 0; k < Z.n; k++) {
  const p = { Z, x: rr(Z.x0, Z.x1), z: rr(Z.z0, Z.z1), tx: 0, tz: 0, sp: rr(.6, 1.1), wait: rr(0, 3), ph: rr(0, 6) };
  pickTarget(p); PEOPLE.push(p);
}
for (let k = 0; k < 10; k++) PEOPLE.push({ walker: true, x: k % 2 ? 3.1 : -3.1, z: rr(-30, 30), dir: rnd() < .5 ? 1 : -1, sp: rr(1, 1.4), ph: rr(0, 6) });
const PCOL = ['#c96f53', '#3e5c76', '#e3c08d', '#6d8a6a', '#8a5a7c', '#d9d2c5', '#4a4a52', '#b6863c'];
const pBody = new T.InstancedMesh(new T.CylinderGeometry(.15, .19, .6, 8).translate(0, .3, 0), new T.MeshStandardMaterial({ roughness: .8 }), PEOPLE.length);
const pHead = new T.InstancedMesh(new T.SphereGeometry(.13, 10, 8).translate(0, .74, 0), new T.MeshStandardMaterial({ color: 0xd9b48f, roughness: .7 }), PEOPLE.length);
pBody.castShadow = true;
{ const c = new T.Color(); PEOPLE.forEach((p, i) => pBody.setColorAt(i, c.set(PCOL[i % PCOL.length]).convertSRGBToLinear())); }
scene.add(pBody, pHead);

/* votes */
const HEARTS = Array.from({ length: 14 }, () => {
  const s = new T.Sprite(am(new T.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })));
  s.scale.setScalar(.55); s.visible = false; scene.add(s); return { s, t: 9 };
});

/* smog over the ordinary town, exhaust from idling cars */
const SMOG = Array.from({ length: 60 }, () => {
  const s = new T.Sprite(new T.SpriteMaterial({ map: puffTex, color: 0x8a8174, transparent: true, depthWrite: false, opacity: 0 }));
  s.position.set(rr(-33, 33), rr(1.5, 8), rr(-33, 33)); s.scale.setScalar(rr(10, 17)); s.userData.ph = rr(0, 6); scene.add(s); return s;
});
const EXHAUST = Array.from({ length: 48 }, () => {
  const s = new T.Sprite(new T.SpriteMaterial({ map: puffTex, color: 0x77716a, transparent: true, depthWrite: false, opacity: 0 }));
  s.visible = false; scene.add(s); return { s, t: 9 };
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
  const A_ = { curve, line, packets, speed: speed * rr(.8, 1.2), group: 'net', src: A }; ARCS.push(A_); return A_;
}
const DCP = [-24.4, 3.4, -24.4];
for (const src of [[0, 2.8, 0], [2.7, 3, 2.7], [-3.3, 1.1, 8.2], [13.8, 2.3, 6.4], [24.5, 6.6, -25.5], [24, 4.2, 25], [-24, 3, 24], [0, 3.4, -18.4], [0, 3.4, 23], [-16, 2.8, 0], [16, 2.8, 16], [16, 2.8, -16], [8, 1, 8]]) arc(src, DCP);
arc(DCP, [-2.66, 3.4, -11.6], 9, .35);
for (const t of [[22, 4, -9], [26.8, 4, -6.2], [21.4, 3.2, -2.4]]) arc([24.5, 6.5, -25], t, 4, .4).group = 'health';

/* attacks */
const ATTACKS = [], BURSTS = [];
let attackRun = null, dcAlarm = 0, shieldFlash = 0;

/* patch every lit material so the wave can wake it up */
{
  const done = new Set();
  scene.traverse(o => {
    if (!o.material) return;
    for (const m of [].concat(o.material)) {
      if (!m.isMeshStandardMaterial || m.userData.noWave || done.has(m)) continue;
      m.onBeforeCompile = waveCompile; m.needsUpdate = true; done.add(m);
    }
  });
}

/* ------------------------------------------------------------------ state */
let smart = false, smartK = 0, current = -1, G = 1;
const seen = new Set(store.get('city-day-seen') || []);
const hist = { wait: [], light: [], bins: [], air: [] };
let metrics = { wait: 0, light: 100, bins: 0, air: 0 }, idleEMA = 0;

/* ------------------------------------------------------------------ palette + time of day */
const accentCol = new T.Color(), lampCol = new T.Color(), warnCol = new T.Color(), goodCol = new T.Color(), badCol = new T.Color();
const SMOG_TINT = lin('#8c8478');
function applyPalette() {
  for (const [m, prop, tok] of themed) m[prop].copy(col(tok));
  accentCol.copy(col('--accent')); lampCol.copy(col('--s-lamp'));
  goodCol.copy(col('--good')); warnCol.copy(col('--warn')); badCol.copy(col('--bad'));
  for (const m of accentMats) if (m.color) m.color.copy(accentCol);
  WAVE.uEdge.value.copy(accentCol);
  for (const L of LAMPS) { L.glow.material.color.copy(lampCol); L.pool.material.color.copy(lampCol); L.hm.emissive.copy(lampCol); }
}
function todState(name) {
  const p = TOD[name];
  return { top: new T.Color(p.top), bot: new T.Color(p.bot), sun: lin(p.sun), si: p.si, pos: new T.Vector3(...p.pos), hs: lin(p.hs), hg: lin(p.hg), hi: p.hi, glow: p.glow, fog: lin(p.fog) };
}
const TS = todState('sunset');
let TT = todState('sunset'), todName = 'sunset';
function setTod(name) { if (name === todName) return; todName = name; TT = todState(name); if (reduced) stepTod(1, true); }
function stepTod(dt, instant) {
  const k = instant ? 1 : damp(1.6, dt);
  for (const key of ['top', 'bot', 'sun', 'hs', 'hg', 'fog']) TS[key].lerp(TT[key], k);
  TS.pos.lerp(TT.pos, k);
  for (const key of ['si', 'hi', 'glow']) TS[key] = lerp(TS[key], TT[key], k);
  sun.color.copy(TS.sun); sun.intensity = TS.si; sun.position.copy(TS.pos).normalize().multiplyScalar(70);
  hemi.color.copy(TS.hs); hemi.groundColor.copy(TS.hg); hemi.intensity = TS.hi;
  G = TS.glow;
  for (const m of glowMats) m.emissiveIntensity = .95 * G + .03;
}
const sky = $('#sky'), GREY = new T.Color('#8f877c'), _a = new T.Color(), _b = new T.Color();
let lastSky = '';
function paintSky() {
  const g = (1 - smartK) * (G > 1 ? .35 : .68);
  _a.copy(TS.top).lerp(GREY, g); _b.copy(TS.bot).lerp(GREY, g);
  const s = `linear-gradient(180deg, ${_a.getStyle()} 0%, ${_b.getStyle()} 100%)`;
  if (s !== lastSky) { sky.style.background = s; lastSky = s; }
}

/* ------------------------------------------------------------------ screens */
function drawHall() {
  const { g, c, tex } = hallScreen, W = c.width, H = c.height;
  g.fillStyle = '#120c0a'; g.fillRect(0, 0, W, H);
  const acc = css('--accent') || '#f472b6';
  if (wake(-2.7, -11.6) < .5) {
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
  const { g, c, tex } = busScreen, W = c.width;
  g.fillStyle = '#0f0d0c'; g.fillRect(0, 0, W, c.height);
  g.fillStyle = '#f1cf74'; g.font = '600 22px "JetBrains Mono", monospace'; g.fillText('LINE 1', 16, 34);
  if (wake(13.8, 6.4) < .5) {
    g.fillStyle = '#c9b9a1'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText('Timetable: 08:15', 16, 74);
    g.fillStyle = '#8d8679'; g.fillText('Next bus: unknown', 16, 106);
  } else {
    const d = ((STOP_P - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN, eta = Math.max(1, Math.round(d / 9));
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
    const sm = wake(I.x, I.z) > .5;
    I.t += dt;
    if (I.phase === 'green') {
      let go = false;
      if (!sm) go = I.t > 9;
      else {
        const o = I.g === 'x' ? 'z' : 'x', qg = I.q[I.g], qo = I.q[o];
        if (I.bus) go = I.bus !== I.g && I.t > 1.2;
        else go = (I.t > 2 && qo > 0 && qg === 0) || (I.t > 11 && qo > 0) || (I.t > 4 && qo >= qg + 3);
      }
      if (go) { I.phase = 'clear'; I.t = 0; }
    } else if (I.t > (sm ? .9 : 1.4)) { I.g = I.g === 'x' ? 'z' : 'x'; I.phase = 'green'; I.t = 0; }
    I.green = I.phase === 'green' ? I.g : null;
    for (const ax of ['x', 'z']) I.mats[ax].emissive.copy(I.green === ax ? GREEN : (I.phase === 'clear' && I.g === ax ? AMBER : RED));
    I.q.x = I.q.z = 0; I.bus = null;
  }
}
const lanes = new Map();
for (const c of CARS) { if (!lanes.has(c.key)) lanes.set(c.key, []); lanes.get(c.key).push(c); }
const carX = c => c.axis === 'x' ? c.s : c.road - c.dir;
const carZ = c => c.axis === 'x' ? c.road + c.dir : c.s;
function stepCars(dt) {
  for (const arr of lanes.values()) {
    arr.sort((a, b) => a.s * a.dir - b.s * b.dir);
    const n = arr.length;
    for (let k = 0; k < n; k++) {
      const c = arr[k], L = arr[(k + 1) % n];
      let tgt = (wake(carX(c), carZ(c)) > .5 ? 7 : 5.8) * (c.truck ? .8 : 1);
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
            const need = wake(-3.3, b.z) > .5 ? b.fill > .42 : true;
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
  let tgt = wake(bus.x, bus.z) > .5 ? 6.4 : 5;
  const dStop = ((STOP_P - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN;
  if (bus.dwell > 0) { bus.dwell -= dt; tgt = 0; }
  else if (dStop < 9 && !bus.served) { tgt = Math.min(tgt, Math.max(0, dStop) * 1.5); if (dStop < .1) { bus.dwell = 3; bus.served = true; } }
  if (dStop > 30 && dStop < 90) bus.served = false;
  let best = null, bd = 1e9;
  for (const B of BUS_INTERS) { const d = ((B.p - 3.2 - bus.p) % BUS_LEN + BUS_LEN) % BUS_LEN; if (d < bd) { bd = d; best = B; } }
  if (best && bd < 15) {
    if (wake(best.I.x, best.I.z) > .5) best.I.bus = best.axis;
    best.I.q[best.axis] += 2;
    if (best.I.green !== best.axis) tgt = Math.min(tgt, Math.max(0, bd - .1) * 1.6);
  }
  bus.v = tgt < bus.v ? lerp(bus.v, tgt, damp(8, dt)) : Math.min(tgt, bus.v + 3.5 * dt);
  bus.p = (bus.p + bus.v * dt) % BUS_LEN;
  const at = busAt(bus.p); bus.x = at.x; bus.z = at.z;
  busMesh.position.set(at.x, .04, at.z);
  busMesh.rotation.y += wrapPi(Math.atan2(at.dx, at.dz) - busMesh.rotation.y) * damp(9, dt);
}
const O = new T.Object3D();
function carPose(c) {
  const sc = clamp((HALF - Math.abs(c.s)) / 2.5, .001, 1);
  O.position.set(carX(c), .04, carZ(c)); O.rotation.set(0, c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI), 0); O.scale.setScalar(sc);
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
    O.position.set(p.x, .27 + bob + (p.Z === ZONES[0] ? .04 : 0), p.z); O.rotation.set(0, 0, 0); O.scale.setScalar(1); O.updateMatrix();
    pBody.setMatrixAt(i, O.matrix); pHead.setMatrixAt(i, O.matrix);
  });
  pBody.instanceMatrix.needsUpdate = pHead.instanceMatrix.needsUpdate = true;
}
function stepLamps(dt) {
  const movers = [];
  for (const c of CARS) movers.push(carX(c), carZ(c));
  movers.push(bus.x, bus.z);
  for (const p of PEOPLE) if (p.walker) movers.push(p.x, p.z);
  let sum = 0;
  const vis = clamp(G, 0, 1.3);
  for (const L of LAMPS) {
    let tgt = 1;
    if (wake(L.x, L.z) > .5) {
      tgt = .16;
      for (let k = 0; k < movers.length; k += 2) { const dx = movers[k] - L.x, dz = movers[k + 1] - L.z; if (dx * dx + dz * dz < 11) { tgt = 1; break; } }
    }
    L.i = lerp(L.i, tgt, damp(tgt > L.i ? 7 : 2.2, dt)); sum += L.i;
    L.hm.emissiveIntensity = (.15 + L.i * 1.6) * (.2 + vis);
    L.glow.material.opacity = L.i * .9 * vis;
    L.glow.scale.setScalar(1.2 + L.i * 1.4);
    L.pool.material.opacity = L.i * .55 * vis;
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
    b.lid.position.y = 1.03 + b.flash * .25;
    b.beam.material.opacity = wake(-3.3, b.z) * (b.fill > .42 ? .55 + Math.sin(performance.now() / 200) * .2 : 0);
    b.bags.scale.setScalar(lerp(b.bags.scale.x, b.fill >= 1 ? 1 : .001, damp(4, dt)));
  }
}
let exhaustT = 0;
function stepSmog(dt, time) {
  for (const s of SMOG) {
    s.position.x += Math.sin(time * .1 + s.userData.ph) * dt * .4;
    s.material.opacity = (1 - wake(s.position.x, s.position.z)) * .34 * (G > 1 ? .5 : 1);
  }
  exhaustT += dt;
  if (exhaustT > .12) {
    exhaustT = 0;
    const idle = CARS.filter(c => c.v < .5 && wake(carX(c), carZ(c)) < .5 && Math.abs(c.s) < 33);
    const e = EXHAUST.find(e => e.t > 1.8);
    if (idle.length && e) {
      const c = idle[Math.floor(rnd() * idle.length)];
      const bx = c.axis === 'x' ? -c.dir : 0, bz = c.axis === 'z' ? -c.dir : 0;
      e.t = 0; e.s.visible = true; e.s.position.set(carX(c) + bx * 1.1, .45, carZ(c) + bz * 1.1);
    }
  }
  for (const e of EXHAUST) if (e.s.visible) {
    e.t += dt; e.s.position.y += dt * .7; e.s.scale.setScalar(.5 + e.t * 1.3);
    e.s.material.opacity = Math.max(0, .5 * (1 - e.t / 1.8));
    if (e.t > 1.8) e.s.visible = false;
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
    if (wake(DC.x, DC.z) > .8 && dist < 8.6) done = 'blocked';
    else if (dist < 2.2) done = 'breach';
    if (done) {
      scene.remove(A.s); A.trail.forEach(t => scene.remove(t)); ATTACKS.splice(i, 1);
      if (done === 'blocked') { burst(A.s.position, accentCol); shieldFlash = 1; attackRun.blocked++; Sound.thud(); }
      else { burst(A.s.position, new T.Color(0xff3b2f)); dcAlarm = 3.5; attackRun.breach++; Sound.buzz(); }
      if (attackRun.blocked + attackRun.breach === attackRun.total) {
        const r = attackRun; attackRun = null;
        if (r.breach) toast(`${r.breach} of 3 attacks reached the servers. Press S to protect the town, then try again.`, 'bad');
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
const overview = () => ({ t: [0, -2, 0], az: 42, el: 38, d: 112 });
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
  const tx = panelOpen && !mobile ? Math.min(250, W * .26) : 0, ty = panelOpen && mobile ? Math.min(H * .3, 280) : 0;
  viewX = lerp(viewX, tx, damp(4, dt)); viewY = lerp(viewY, ty, damp(4, dt));
  camera.setViewOffset(W, H, viewX, viewY, W, H);
}
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  setGoal(current < 0 ? overview() : STOPS[current].view);
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
    this.init(); if (!this.ctx) return false; this.on = !this.on; this.ctx.resume?.();
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
    bp.frequency.setValueAtTime(up ? 250 : 2200, t); bp.frequency.exponentialRampToValueAtTime(up ? 2600 : 200, t + (up ? 4 : 1.3));
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.45, t + .4); g.gain.exponentialRampToValueAtTime(.001, t + (up ? 4.5 : 1.5));
    s.connect(bp).connect(g).connect(this.fx); s.start(t); s.stop(t + 4.6);
    if (up) [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, k) => this.tone(f, 2.2, 'sine', .05, .3 + k * .55));
  },
};

/* ------------------------------------------------------------------ UI */
const body = document.body, panel = $('#panel'), pbody = $('#p-body');
$('#total').textContent = STOPS.length;
const PINS = STOPS.map((s, i) => {
  const el = document.createElement('button'); el.className = 'pin'; el.type = 'button';
  el.innerHTML = `<span class="n">${i + 1}</span><span class="lbl">${s.time} · ${s.short}</span>`;
  el.setAttribute('aria-label', `${s.time}: ${s.title}`);
  el.addEventListener('click', () => goTo(i)); $('#pins').appendChild(el);
  return { el, v: new T.Vector3(...s.anchor) };
});
function updatePins() {
  const v = new T.Vector3();
  PINS.forEach(p => {
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
const SEG = '<div class="seg" role="group" aria-label="Town"><button data-mode="0">Ordinary</button><button data-mode="1">Smart</button></div>';
function panelHTML(i) {
  const s = STOPS[i], A = ACTS[s.act];
  let h = `<p class="eyebrow"><span class="tm">${s.time}</span> · <b>${A.label}</b> · ${A.q}</p><h2 class="ptitle">${s.title}</h2><p class="key">${s.key}</p>`;
  if (s.special === 'convince') {
    return h + `<section class="blk"><h3 class="lab"><i class="dot acc"></i>Five ways to convince people</h3>
      <ol class="advice">
        <li><span><b>Show, don’t explain.</b> Let people see the difference, like with this model, then test it in one pilot district.</span></li>
        <li><span><b>Talk about their day,</b> not about technology: minutes saved, clean air, a safe walk home.</span></li>
        <li><span><b>Prove it.</b> Measure the pilot and publish the results, good or bad.</span></li>
        <li><span><b>Protect their data,</b> and say how: count, don’t film, encrypt, delete on time.</span></li>
        <li><span><b>Let them decide:</b> votes, opt-in services, and a human answer for everyone.</span></li>
      </ol></section>
      <section class="blk proof"><h3 class="lab">What a smart city is, for me</h3>
      <p class="def">Not a city full of sensors. A city that listens to its people, and protects what it hears.</p><p class="def-by">Yanis</p></section>
      <section class="blk">${SEG}</section>`;
  }
  h += `<section class="blk"><div class="vshead"><h3 class="lab">Same moment, two towns</h3>${SEG}</div>
    <div class="vs"><div class="old"><h4 class="lab"><i class="dot bad"></i>Today</h4><p>${s.today}</p></div>
    <div class="new"><h4 class="lab"><i class="dot acc"></i>Smart town</h4>${s.smart.startsWith('<') ? s.smart : `<p>${s.smart}</p>`}</div></div></section>`;
  h += `<section class="blk foryou"><h3 class="lab"><i class="dot good"></i>What it changes for you</h3><p>${s.forYou}</p></section>`;
  if (s.special === 'json') h += `<section class="blk"><h3 class="lab">Everything this box sends, live</h3>
    <pre class="json">{
  <span class="k">"sensor"</span>: <span class="s">"crossroads-01"</span>,
  <span class="k">"time"</span>: <span class="s">"<span id="j-time">23:00:07</span>"</span>,
  <span class="k">"cars_waiting"</span>: <span class="n" id="j-cars">0</span>,
  <span class="k">"green_for"</span>: <span class="s">"<span id="j-green">north-south</span>"</span>
}</pre><p class="cap">No face. No number plate. No name. Nothing that points to a person.</p></section>`;
  if (s.special === 'attack') h += `<section class="blk"><h3 class="lab">Try it in both towns</h3><div class="attack"><button class="cta" data-attack>Simulate an attack</button><kbd>A</kbd></div></section>`;
  if (s.proof) h += `<section class="blk proof"><h3 class="lab">${s.proofLab || 'Real example'}</h3><p>${s.proof}</p>${s.src ? `<p class="src">${s.src}</p>` : ''}</section>`;
  return h;
}
function syncSeg() { for (const b of document.querySelectorAll('.seg button')) b.setAttribute('aria-pressed', String((b.dataset.mode === '1') === smart)); }
pbody.addEventListener('click', e => {
  const m = e.target.closest('[data-mode]'); if (m) setSmart(m.dataset.mode === '1');
  if (e.target.closest('[data-attack]')) launchAttack();
});
function setClock(time, tod) {
  $('#clk').textContent = time; $('#clk-l').textContent = TOD[tod].label;
  const [hh, mm] = time.split(':').map(Number); drawClock(hh, mm);
}
function goTo(i) {
  if (i < 0 || i >= STOPS.length) return;
  if (!$('#letter').classList.contains('gone')) enter();
  current = i; const s = STOPS[i];
  pbody.innerHTML = panelHTML(i); pbody.scrollTop = 0; syncSeg();
  $('#p-step').textContent = `Moment ${i + 1} of ${STOPS.length}`; $('#p-pos').textContent = `${i + 1} / ${STOPS.length}`;
  $('#p-next').textContent = i === STOPS.length - 1 ? 'Back to the town ↺' : 'Next →';
  panel.dataset.open = 'true'; body.classList.add('panel-open');
  setGoal(s.view); setTod(s.tod); setClock(s.time, s.tod);
  if (!seen.has(i)) { seen.add(i); store.set('city-day-seen', [...seen]); Sound.chime(); } else Sound.tone(660, .6, 'sine', .04);
  refreshSeen(); updateNotes();
  if (s.special === 'convince' && !smart) setTimeout(() => current === i && setSmart(true), 1100);
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
  if (v && waveR < 1) WAVE.uC.value.set(cam.t.x, cam.t.z);
  const sw = $('#sw'); sw.setAttribute('aria-checked', String(v)); sw.classList.remove('nudge');
  $('#mode-t').textContent = v ? 'Smart town' : 'Ordinary town';
  $('#mode-d').textContent = v ? 'Sensors on, data protected, everything published' : 'Grey, polluted, stuck in traffic. Press S to wake it up.';
  body.classList.toggle('is-smart', v);
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
  $('#n-where').textContent = current < 0 ? 'Introduction' : `${STOPS[current].time} · ${STOPS[current].title}`;
  $('#n-text').textContent = current < 0 ? INTRO.notes : STOPS[current].notes;
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
      li.innerHTML = `<button type="button"><span class="num">${s.time}</span><span class="tt">${s.title}<small>${s.forYou || 'Five ways to convince people, and my own definition.'}</small></span><span class="ck">${seen.has(i) ? 'seen' : ''}</span></button>`;
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
  else if (k === 's' || k === 'S' || k === 'b' || k === 'B') setSmart(!smart);
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
  metrics = { wait: waiting, light: lastLight, bins: BINS.filter(b => b.fill >= 1).length, air: Math.round(10 + idleEMA * 1.8 + (1 - smartK) * 22) };
  $('#m-wait').textContent = metrics.wait; $('#m-light').textContent = metrics.light; $('#m-bins').textContent = metrics.bins; $('#m-air').textContent = metrics.air;
  for (const k in hist) { hist[k].push(metrics[k]); if (hist[k].length > 60) hist[k].shift(); }
  const c = smartK > .5 ? css('--accent') : css('--muted');
  spark('sp-wait', hist.wait, 24, c); spark('sp-light', hist.light, 100, c); spark('sp-bins', hist.bins, 6, c); spark('sp-air', hist.air, 80, c);
  const jc = document.getElementById('j-cars');
  if (jc) {
    const I = IMAP.get('0,0');
    jc.textContent = CARS.filter(c => c.v < .4 && Math.abs(carX(c)) < 16 && Math.abs(carZ(c)) < 16).length;
    $('#j-time').textContent = new Date().toTimeString().slice(0, 8);
    $('#j-green').textContent = I.green === 'x' ? 'east-west' : I.green === 'z' ? 'north-south' : 'changing';
  }
  drawHall(); drawBus();
}

/* ------------------------------------------------------------------ loop */
const clock = new T.Clock(); let mt = 0, heartT = 0;
function frame() {
  const dt = Math.min(.05, clock.getDelta()), time = clock.elapsedTime;

  // the wave: grows out from where you look when the town wakes up, shrinks back when it sleeps
  if (smart) waveR = reduced ? 120 : Math.min(120, waveR + dt * (9 + waveR * .12));
  else waveR = reduced ? 0 : Math.max(0, waveR - dt * 30);
  WAVE.uR.value = waveR;
  WAVE.uEdgeOn.value = lerp(WAVE.uEdgeOn.value, smart && waveR < 100 ? 1 : 0, damp(4, dt));
  smartK = clamp(waveR / 70, 0, 1);
  const sk = ease(smartK);

  if (current < 0 && !dragging && performance.now() - lastInput > 4000 && !reduced) goal.az += .035 * dt;

  stepTod(dt);
  stepLights(dt); stepCars(dt); stepBus(dt); stepPeople(dt, time); stepBins(dt); stepAttacks(dt); stepSmog(dt, time);
  renderCars();
  lastLight = stepLamps(dt);

  // fog: thick grey smog in the ordinary town, clear air in the smart one
  scene.fog.color.copy(TS.fog).lerp(SMOG_TINT, (1 - sk) * (G > 1 ? .25 : .55));
  scene.fog.near = cam.d * lerp(.45, .95, sk); scene.fog.far = cam.d * lerp(1.7, 2.9, sk) + 20;
  paintSky();

  for (const I of INTERS) I.ringMat.opacity = wake(I.x, I.z) * (.25 + .15 * Math.sin(time * 3));
  for (const A of ARCS) {
    const w = wake(A.src.x, A.src.z);
    const vis = w * (A.group === 'health' ? (current === S_HOSP ? 2 : 1) : (current === S_SERVER ? 2 : 1));
    A.line.material.opacity = .16 * vis;
    for (const p of A.packets) { p.t = (p.t + dt * A.speed) % 1; A.curve.getPoint(p.t, p.s.position); p.s.material.opacity = Math.min(1, .85 * vis * wake(p.s.position.x, p.s.position.z)); }
  }
  const wDC = wake(DC.x, DC.z);
  shield.scale.setScalar(Math.max(.001, ease(clamp(wDC * 1.1, 0, 1))));
  shield.rotation.y += dt * .08; shieldFlash = Math.max(0, shieldFlash - dt * 1.8);
  shieldWireMat.opacity = .22 + shieldFlash * .7; shieldSkinMat.opacity = .05 + shieldFlash * .2;
  dcAlarm = Math.max(0, dcAlarm - dt);
  if (dcAlarm > 0) ledMat.emissive.setRGB(Math.sin(time * 20) > 0 ? 1 : .2, .02, .02);
  else ledMat.emissive.copy(SMOG_TINT).multiplyScalar(.4).lerp(accentCol, wDC).multiplyScalar(.5 + wDC * .8);
  mastLight.material.opacity = (Math.sin(time * 3) > .6 ? 1 : .15) * (G * .7 + .3);
  for (const f of fans) f.rotation.y += dt * 8;
  rotor.rotation.z += dt * (.7 + wake(-29.3, 29.3) * 1.6);
  for (const P of PANELS) P.scale.setScalar(Math.max(.001, ease(clamp(wake(P.position.x, P.position.z) * 1.5 - P.userData.delay, 0, 1))));
  const wS = wake(25, 26.5);
  wifi.forEach((m, k) => { m.material.opacity = wS * (.25 + .75 * Math.max(0, Math.sin(time * 3 - k * .9))); });
  const wSe = wake(2.7, 2.7);
  sensorRings.forEach((s, k) => { const t = (time * .7 + k * .5) % 1; s.scale.setScalar(.3 + t * 3); s.material.opacity = wSe * (1 - t) * .8; });
  sensorLed.material.opacity = .3 + wSe * .7 * (.6 + .4 * Math.sin(time * 6));
  jet.material.opacity = (.35 + .1 * Math.sin(time * 4)) * (G * .6 + .2);
  busMesh.userData.beacon.material.opacity = wake(bus.x, bus.z) * (.6 + .4 * Math.sin(time * 5));
  flags.forEach((f, k) => { f.rotation.y = Math.sin(time * 2 + k) * .25; });
  heartT += dt;
  const wSq = wake(8, -8);
  if (wSq > .5 && heartT > .45) {
    heartT = 0; const h = HEARTS.find(h => h.t > 2.2), p = PEOPLE[Math.floor(rnd() * ZONES[0].n)];
    if (h) { h.t = 0; h.s.visible = true; h.s.position.set(p.x, 1.3, p.z); }
  }
  for (const h of HEARTS) if (h.s.visible) {
    h.t += dt; h.s.position.y += dt * 1.3; h.s.material.opacity = Math.max(0, Math.sin(Math.min(1, h.t / 2.2) * Math.PI)) * wSq;
    if (h.t > 2.2) h.s.visible = false;
  }

  updateCamera(dt);
  renderer.render(scene, camera);
  updatePins();
  mt += dt; if (mt > .25) { mt = 0; tickMetrics(); }
  requestAnimationFrame(frame);
}

applyPalette(); resize(); setGoal(overview(), true); stepTod(1, true); setClock(INTRO.time, INTRO.tod); refreshSeen(); updateNotes();
renderCars();
for (let i = 0; i < 240; i++) { stepLights(1 / 30); stepCars(1 / 30); stepBus(1 / 30); stepBins(1 / 60); }
tickMetrics();
requestAnimationFrame(frame);
setTimeout(() => $('#enter').focus({ preventScroll: true }), 400);
})();
