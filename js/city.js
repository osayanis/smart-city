(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!window.THREE) { $('#nogl').hidden = false; return; }
const T = THREE;

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
const WMAX = 200;   // far enough to wake the energy park too
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
const OCC = [];   // buildings that step aside when they hide Tom from the camera
function addBuilding(x, z, w, d, h, token, base = .25, parent = scene) {
  const geo = new T.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const ou = Math.floor(rnd() * 8) / 8, ov = Math.floor(rnd() * 4) / 8;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 16 + ou, uv.getY(i) * dims[f][1] / 20.8 + ov);
  }
  geo.translate(0, h / 2, 0);
  const s = sideMat(token), m = new T.Mesh(geo, [s, s, M.roof, M.roof, s, s]);
  m.position.set(x, base, z); m.castShadow = m.receiveShadow = true; parent.add(m); OCC.push(m);
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
const GEN = [[-24, -8, 4, 11], [-24, 8, 4, 10], [24, -8, 5, 12], [-8, -24, 8, 19], [8, -24, 7, 17], [-8, 24, 4, 9], [8, 24, 4, 9]];
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
function hitbox() {}
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
    if (x === -28 && z === 20.4) { k++; continue; } // Tom's house is built on its own, open like a doll's house
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
    LAMPS.push({ x: hx, z: hz, i: 1, hm, glow, pool, px: x, pz: z });
  };
  // Tom's street: one lamp carries a presence sensor, one is broken in the ordinary town
  for (const x of [-10.5, -21, -25.6, -30.4]) add(x, 18.45, x, 17.7);
  LAMPS[LAMPS.length - 3].sensor = true; LAMPS[LAMPS.length - 2].broken = true;
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

/* ================================================================== Tom's world */
const HX = -28, HZ = 20.4;                       // Tom's house
const std = c => new T.MeshStandardMaterial({ color: lin(c), roughness: .85 });
function canvasPlane(cw, ch, w, h) {
  const [c, g] = cnv(cw, ch), tex = ctex(c);
  const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false, side: T.DoubleSide }));
  scene.add(mesh); return { c, g, tex, mesh, key: '' };
}
function tree(x, z, s = 1, y = .25) {
  const t = new T.Mesh(new T.CylinderGeometry(.1 * s, .14 * s, s, 6), M.trunk); t.position.set(x, y + .5 * s, z); t.castShadow = true; scene.add(t);
  const c = new T.Mesh(new T.IcosahedronGeometry(.8 * s, 0), M.tree); c.position.set(x, y + 1.45 * s, z); c.scale.y = 1.2; c.castShadow = true; scene.add(c);
}

/* cars you can drive (Tom's) or that stay parked */
const wheelGeo = new T.CylinderGeometry(.17, .17, .12, 12).rotateZ(Math.PI / 2);
const cabMat = new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: .2, metalness: .5 });
function makeCar(color, mine = false) {
  const g = new T.Group();
  const bodyM = mine ? noWave(new T.MeshStandardMaterial({ color: lin(color), roughness: .35, metalness: .25 })) : new T.MeshStandardMaterial({ color: lin(color), roughness: .45, metalness: .2 });
  const body = new T.Mesh(new T.BoxGeometry(.95, .42, 1.9), bodyM); body.position.y = .38; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const cabM = mine ? noWave(new T.MeshStandardMaterial({ color: 0xbfe0ee, roughness: .05, metalness: .2, transparent: true, opacity: .42 })) : cabMat;
  const cab = new T.Mesh(new T.BoxGeometry(.82, .36, 1), cabM); cab.position.set(0, .77, -.1); cab.castShadow = !mine; g.add(cab);
  const wm = mine ? noWave(new T.MeshStandardMaterial({ color: 0x1d1b1a, roughness: .8 })) : M.dark;
  for (const [x, z] of [[-.46, .6], [.46, .6], [-.46, -.62], [.46, -.62]]) { const w = new T.Mesh(wheelGeo, wm); w.position.set(x, .17, z); g.add(w); }
  if (mine) {
    const lm = noWave(new T.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffe2a0, emissiveIntensity: .3 }));
    for (const x of [-.3, .3]) { const l = new T.Mesh(new T.BoxGeometry(.18, .09, .04), lm); l.position.set(x, .44, .96); g.add(l); }
    g.userData.lights = lm;
  }
  return g;
}

/* Tom's house: a doll's house, the front wall and the roof lift off for the bedroom shots */
const glassM = new T.MeshStandardMaterial({ color: lin('#9fc4d6'), emissive: lin('#ffc887'), emissiveIntensity: 0, roughness: .2 });
const house = { front: new T.Group(), roof: new T.Group(), open: false, light: new T.PointLight(0xffc48a, 0, 6, 2), k: 0, target: 0 };
scene.add(house.front, house.roof);
house.light.position.set(HX - .1, 1.75, HZ + .1); scene.add(house.light);
const alarm = new T.Group();
const alarmFace = (() => { const [c, g] = cnv(128, 64), tex = ctex(c); return { c, g, tex, txt: '' }; })();
const THERMO = new T.Vector3(HX + 1.24, 1.55, HZ - .55);
{
  const y0 = .25, wall = M.b1, wood = std('#a87d5a');
  mbox(2.8, 1.9, .1, wall, HX, y0, HZ + 1.25);
  mbox(.1, 1.9, 2.6, wall, HX - 1.35, y0, HZ);
  mbox(.1, 1.9, 2.6, wall, HX + 1.35, y0, HZ);
  house.front.add(mbox(2.8, 1.9, .1, wall, HX, y0, HZ - 1.25));
  house.front.add(mbox(.62, 1.28, .05, M.trunk, HX, y0, HZ - 1.31));
  house.front.add(mbox(.66, .48, .04, glassM, HX + .86, y0 + .9, HZ - 1.31));
  house.front.add(mbox(.66, .48, .04, glassM, HX - .86, y0 + .9, HZ - 1.31));
  house.roof.add(gable(HX, 2.15, HZ, 3.1, 2.9, .85, M.tile, true));
  solar(HX, 2.62, HZ + .72, 2.1, .95, .5); house.roof.add(PANELS[PANELS.length - 1]);
  // inside
  mbox(2.6, .08, 2.4, std('#b8916c'), HX, y0, HZ);
  mbox(.72, .5, .04, glassM, HX + .45, y0 + .95, HZ + 1.19);
  mbox(.9, .012, .7, std('#c46d5a'), HX + .2, .33, HZ - .25, scene, false);
  mbox(1.35, .2, .82, wood, HX - .6, .33, HZ + .75);
  mbox(.08, .55, .82, wood, HX - 1.25, .33, HZ + .75);
  mbox(1.25, .1, .74, std('#f1ebe1'), HX - .6, .53, HZ + .75);
  mbox(.26, .08, .5, std('#ffffff'), HX - 1.05, .63, HZ + .75);
  mbox(.8, .22, .8, std('#4f78b0'), HX - .22, .6, HZ + .75);
  mbox(.32, .36, .32, wood, HX - 1.12, .33, HZ + .1);
  mbox(.5, 1.4, .9, std('#c9a27e'), HX + 1.03, .33, HZ + .62);
  mbox(.03, .16, .12, M.white, HX + 1.29, .98, HZ - .55);
  alarm.position.set(HX - 1.12, .69, HZ + .1); scene.add(alarm);
  const ab = new T.Mesh(new T.BoxGeometry(.17, .1, .07), std('#d24b3f')); ab.position.y = .05; ab.castShadow = true; alarm.add(ab);
  const face = new T.Mesh(new T.PlaneGeometry(.13, .065), new T.MeshBasicMaterial({ map: alarmFace.tex, toneMapped: false }));
  face.position.set(0, .05, -.037); face.rotation.y = Math.PI; alarm.add(face);
}
function drawAlarm(txt) {
  if (txt === alarmFace.txt) return; alarmFace.txt = txt;
  const g = alarmFace.g; g.fillStyle = '#120a08'; g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#ff4a3a'; g.font = '600 40px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 34);
  alarmFace.tex.needsUpdate = true;
}

/* the office and its car park (block 24, 8) */
const LOT = { spots: [21.2, 22.6, 24, 25.4, 26.8, 28.2], z: 12.4, cars: [], discs: [] };
{
  mbox(11.6, .02, 11.6, M.road, 24, .25, 8, scene, false);
  addBuilding(21, 5, 4.8, 4.8, 13, '--s-b2', .27);
  mbox(.9, 1.15, .04, M.dark, 21, .27, 7.43);
  mbox(2.1, .12, 4.8, M.grass, 26.8, .27, 6.7);
  tree(26.8, 5.3, .7, .39); tree(26.8, 8.1, .65, .39);
  for (const x of [20.5, 21.9, 23.3, 24.7, 26.1, 27.5, 28.9]) mbox(.06, .012, 2, M.mark, x, .27, 12.4, scene, false);
  const cols = ['#8a9bb0', '#d9c7b0', '#6b7f6a', '#b8574a', '#cfcfcf', '#3d4a5c'];
  LOT.cars = LOT.spots.map((x, i) => { const g = makeCar(cols[i]); g.position.set(x, .27, LOT.z); scene.add(g); return g; });
  LOT.discs = LOT.spots.map(x => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: 0 }));
    s.position.set(x, .42, 11.2); s.scale.setScalar(.6); scene.add(s); return s;
  });
  mcyl(.05, .05, 1.6, 6, M.dark, 18.75, .25, 14.75);
}
const lotSign = canvasPlane(256, 160, .9, .56); lotSign.mesh.position.set(18.75, 2.05, 14.8);

/* the bench by the bins (lunch) */
mbox(.42, .06, 1.5, M.trunk, -4.5, .49, 8.2);
mbox(.06, .44, 1.5, M.trunk, -4.73, .55, 8.2);
for (const z of [7.6, 8.8]) mbox(.36, .24, .06, M.dark, -4.5, .25, z);
const FLIES = Array.from({ length: 12 }, (_, i) => {
  const m = new T.Mesh(new T.SphereGeometry(.03, 5, 4), noWave(new T.MeshBasicMaterial({ color: 0x15110f })));
  m.userData = { z: BINS[i % 6].z, ph: rr(0, 6), r: rr(.22, .5), sp: rr(3, 7) }; m.visible = false; scene.add(m); return m;
});

/* town hall door + opening hours */
mbox(.05, 1.5, 1, M.trunk, -6.83, .7, -8);
const hallSign = canvasPlane(256, 168, .66, .43); hallSign.mesh.position.set(-6.76, 1.62, -8.95); hallSign.mesh.rotation.y = Math.PI / 2;

/* Tom's street: a sensor on one lamp */
const SENSOR_LAMP = LAMPS.find(L => L.sensor), BROKEN_LAMP = LAMPS.find(L => L.broken);
mbox(.2, .14, .14, M.white, SENSOR_LAMP.px, 2.45, SENSOR_LAMP.pz);
const sensorLed2 = new T.Sprite(spriteAccent({ opacity: 0 }));
sensorLed2.position.set(SENSOR_LAMP.px, 2.6, SENSOR_LAMP.pz - .09); sensorLed2.scale.setScalar(.4); scene.add(sensorLed2);

/* Tom */
const TOM = (() => {
  const mat = c => noWave(new T.MeshStandardMaterial({ color: lin(c), roughness: .7 }));
  const skin = mat('#e9b48f'), hair = mat('#3a2619'), hood = mat('#f2b544'), pants = mat('#38476b'), shoe = mat('#f4efe6');
  const eye = noWave(new T.MeshBasicMaterial({ color: 0x1a1412 }));
  const root = new T.Group(), hips = new T.Group(), upper = new T.Group(), head = new T.Group();
  root.add(hips); hips.add(upper); hips.position.y = .38;
  const part = (parent, w, h, d, m, y, z = 0) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(0, y, z); o.castShadow = true; parent.add(o); return o; };
  const legs = [-1, 1].map(sx => {
    const thigh = new T.Group(); thigh.position.x = sx * .075; hips.add(thigh);
    part(thigh, .12, .2, .13, pants, -.095);
    const knee = new T.Group(); knee.position.y = -.19; thigh.add(knee);
    part(knee, .11, .16, .12, pants, -.08);
    part(knee, .12, .06, .19, shoe, -.18, .03);
    return { thigh, knee };
  });
  part(upper, .32, .36, .19, hood, .18);
  part(upper, .2, .09, .03, mat('#d9952a'), .1, .1);
  head.position.y = .37; upper.add(head);
  const skull = new T.Mesh(new T.SphereGeometry(.125, 18, 14), skin); skull.position.y = .13; skull.castShadow = true; head.add(skull);
  const cap = new T.Mesh(new T.SphereGeometry(.133, 18, 10, 0, Math.PI * 2, 0, Math.PI * .5), hair); cap.position.y = .145; cap.rotation.x = -.5; head.add(cap);
  for (const sx of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.017, 8, 6), eye); e.position.set(sx * .045, .14, .115); head.add(e); }
  const nose = new T.Mesh(new T.SphereGeometry(.021, 8, 6), skin); nose.position.set(0, .112, .124); head.add(nose);
  const arms = [-1, 1].map(sx => {
    const sh = new T.Group(); sh.position.set(sx * .2, .33, 0); upper.add(sh);
    part(sh, .09, .18, .1, hood, -.085);
    const el = new T.Group(); el.position.y = -.17; sh.add(el);
    part(el, .085, .15, .09, hood, -.07);
    const hand = new T.Mesh(new T.SphereGeometry(.048, 8, 6), skin); hand.position.y = -.17; el.add(hand);
    return { sh, el };
  });
  const phone = new T.Mesh(new T.BoxGeometry(.075, .13, .016), noWave(new T.MeshStandardMaterial({ color: 0x111111, emissive: 0x9ad0ff, emissiveIntensity: .9 })));
  phone.position.set(0, -.2, .05); phone.rotation.x = -.5; arms[1].el.add(phone); phone.visible = false;
  const food = new T.Mesh(new T.BoxGeometry(.14, .07, .09), mat('#e6c58a')); food.position.set(0, -.21, .04); arms[1].el.add(food); food.visible = false;
  const box = new T.Mesh(new T.BoxGeometry(.3, .22, .24), mat('#c49a62')); box.position.set(0, .2, .3); box.castShadow = true; upper.add(box); box.visible = false;
  scene.add(root);
  return { root, hips, upper, head, legs, arms, phone, food, box, skin, hair };
})();

/* Tom's car, with Tom's head behind the windscreen */
const tomCarG = makeCar('#e2574c', true);
{
  const h = new T.Group(); h.position.set(.2, .7, -.08);
  const s = new T.Mesh(new T.SphereGeometry(.12, 14, 10), TOM.skin); h.add(s);
  const c = new T.Mesh(new T.SphereGeometry(.128, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5), TOM.hair); c.position.y = .015; c.rotation.x = -.5; h.add(c);
  tomCarG.add(h); tomCarG.userData.head = h; h.visible = false;
}
scene.add(tomCarG);
const tomFill = new T.PointLight(0xc9d6ff, 0, 7, 2); scene.add(tomFill);
/* ================================================================== Part 3: the energy park, a second map outside the town */
const EX = 150, EZ = 0;                                     // centre of the island
const ev = (lx, y, lz) => new T.Vector3(EX + lx, y, EZ + lz);
const E3 = (lx, y, lz) => [EX + lx, y, EZ + lz];
const glowSprite = (hex, s = .6) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: lin(hex), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: 0 })); sp.scale.setScalar(s); scene.add(sp); return sp; };
const EN = { wind: .8, windT: .8, bio: .5, town: .6, bat: .45, windA: Math.PI / 2, sunK: 0, net: 0, gate: 0, gateT: 0, maint: false };
const islandH = (lx, lz) => {
  if (lx > 9 && lx < 27 && lz > 10 && lz < 15.5) return 1.1;                     // the recycling quay
  if (lx > 4 && lx <= 9 && lz > 11.2 && lz < 14.2) return 1.1 * (lx - 4) / 5;   // its ramp
  return .04;
};
const gravel = std('#cdbf9f'), concrete = std('#cfc8bb'), steel = std('#9aa2a8');
{
  // the tile
  const top = new T.Mesh(new T.BoxGeometry(64, 4, 64), [M.edge, M.edge, M.grass, M.edge, M.edge, M.edge]);
  top.position.set(EX, -2, EZ); top.receiveShadow = true; scene.add(top);
  mbox(67, .8, 67, M.base, EX, -4.8, EZ, scene, false);
  // roads: main road, the way in to the recycling centre, the trucks' loop
  mbox(64, .04, 3.4, M.road, EX, 0, EZ + 3, scene, false);
  for (let x = -30.6; x < 32; x += 2.4) mbox(1.1, .02, .14, M.mark, EX + x, .04, EZ + 3, scene, false);
  mbox(3, .04, 9.6, M.road, EX + 3, .001, EZ + 9.3, scene, false);
  mbox(3, .04, 19, M.road, EX + 29.5, .001, EZ + 12.6, scene, false);
  mbox(3, .04, 19, M.road, EX, .001, EZ + 12.6, scene, false);
  mbox(32.5, .04, 3, M.road, EX + 15, .002, EZ + 21.5, scene, false);
  // gravel tracks to the wind turbines
  mbox(52, .03, 2.2, gravel, EX, 0, EZ - 13.5, scene, false);
  mbox(2.2, .03, 13.6, gravel, EX + 6, .004, EZ - 6.4, scene, false);
  for (let x = -31; x <= 31; x += 3.1) { tree(EX + x, EZ - 31, rr(.8, 1.1), 0); if (Math.abs(x) > 4) tree(EX + x, EZ + 31, rr(.8, 1.1), 0); }
  for (let z = -27.9; z <= 28; z += 3.1) { if (Math.abs(z - 3) > 3) { tree(EX - 31, EZ + z, rr(.8, 1.1), 0); tree(EX + 31.3, EZ + z, rr(.8, 1.1), 0); } }
}

/* wind turbines with sensors: they turn to face the wind */
const TURBINES = [[-24, -20], [-12, -25], [0, -19], [12, -25], [24, -20]].map(([lx, lz], i) => {
  const x = EX + lx, z = EZ + lz;
  mbox(3, .03, 3, gravel, x, .008, z, scene, false);
  mbox(2.2, .03, Math.abs(lz + 13.5) - 1.4, gravel, x, .004, EZ + (lz - 13.5) / 2 + (lz < -13.5 ? .7 : -.7), scene, false);
  mcyl(.2, .42, 13, 14, M.white, x, 0, z);
  const nac = new T.Group(); nac.position.set(x, 13.1, z); scene.add(nac);
  const nb = new T.Mesh(new T.BoxGeometry(.75, .75, 2), M.white); nb.position.z = -.25; nb.castShadow = true; nac.add(nb);
  const hub = new T.Mesh(new T.SphereGeometry(.34, 12, 8), M.white); hub.position.z = .9; hub.scale.z = 1.4; nac.add(hub);
  const rotor = new T.Group(); rotor.position.z = .95; nac.add(rotor);
  for (let k = 0; k < 3; k++) {
    const g = new T.BoxGeometry(.38, 5.6, .09); g.translate(0, 2.8, 0);
    const b = new T.Mesh(g, M.white); b.rotation.z = k * Math.PI * 2 / 3; b.castShadow = true; rotor.add(b);
  }
  rotor.rotation.z = i;
  // the sensors: a little anemometer and a light on top of the nacelle
  const mast = new T.Mesh(new T.CylinderGeometry(.025, .025, .5, 5), M.dark); mast.position.set(0, .6, -1); nac.add(mast);
  const cups = new T.Group(); cups.position.set(0, .86, -1); nac.add(cups);
  for (let k = 0; k < 3; k++) { const c = new T.Mesh(new T.SphereGeometry(.07, 6, 4), M.dark); c.position.set(Math.cos(k * 2.1) * .2, 0, Math.sin(k * 2.1) * .2); cups.add(c); }
  const led = glowSprite('#ffffff', .9); led.position.set(x, 13.75, z);
  const ring = new T.Sprite(new T.SpriteMaterial({ map: ringTex, color: lin('#8fd3ff'), transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); ring.position.copy(led.position); scene.add(ring);
  const yaw = EN.windA + Math.PI; nac.rotation.y = yaw;
  return { x, z, lx, lz, nac, rotor, cups, led, ring, yaw, wait: 0, pulse: 0, at: new T.Vector3(x, 14.2, z) };
});

/* the wind you can see: streaks blowing over the farm */
const STREAKS = Array.from({ length: 34 }, () => {
  const m = new T.Mesh(new T.BoxGeometry(.05, .05, 3.2), noWave(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })));
  m.userData = { t: rnd() * 2, L: rr(1.6, 2.6), sp: rr(7, 10) }; scene.add(m); return m;
});
function spawnStreak(s) {
  const a = EN.windA, ux = Math.sin(a), uz = Math.cos(a);
  s.position.set(EX + rr(-30, 30) - ux * 8, rr(3, 15), EZ + rr(-30, -6) - uz * 8);
  s.rotation.y = a; s.userData.t = 0; s.userData.L = rr(1.6, 2.6);
}

/* a windsock next to the control room */
const sock = new T.Group();
{
  mcyl(.05, .07, 4.2, 6, M.dark, EX + 6.5, 0, EZ - 9.5);
  sock.position.set(EX + 6.5, 4, EZ - 9.5); scene.add(sock);
  const g = new T.ConeGeometry(.32, 1.5, 14, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, .75);
  const m = new T.Mesh(g, std('#ef7d3c')); m.material.side = T.DoubleSide; m.castShadow = true; sock.add(m);
}

/* the solar park: rows of panels on trackers that follow the sun */
const ROWS = [];
for (let i = 0; i < 8; i++) {
  const lx = -28 + i * 3.25, x = EX + lx;
  for (const z of [9.2, 18, 26.8]) mcyl(.06, .08, 1.2, 6, M.dark, x, 0, EZ + z);
  const row = new T.Group(); row.position.set(x, 1.25, EZ + 18); scene.add(row);
  for (let k = 0; k < 5; k++) {
    const p = new T.Mesh(new T.BoxGeometry(2, .07, 3.6), M.panel); p.position.z = -7.6 + k * 3.8; p.castShadow = true; p.receiveShadow = true; row.add(p);
    const f = new T.Mesh(new T.BoxGeometry(2.04, .05, .06), M.white); f.position.set(0, .03, -7.6 + k * 3.8 + 1.8); row.add(f);
  }
  const axle = new T.Mesh(new T.CylinderGeometry(.05, .05, 19.4, 6), M.dark); axle.rotation.x = Math.PI / 2; axle.position.y = -.06; row.add(axle);
  ROWS.push({ row, a: 0 });
}
mbox(1.2, 1, .8, M.white, EX - 16, 0, EZ + 6.6);   // the inverter

/* the smart grid: substation, batteries, control room and its screen */
const BATS = [], SEGS = [];
{
  // substation, fenced
  for (const [w, d, x, z] of [[6.2, .06, 0, -8.6], [6.2, .06, 0, -2.4], [.06, 6.2, -3.1, -5.5], [.06, 6.2, 3.1, -5.5]]) mbox(w, .9, d, steel, EX + x, 0, EZ + z, scene, false);
  mbox(6.2, .03, 6.2, gravel, EX, 0, EZ - 5.5, scene, false);
  for (const x of [-1.4, 1.4]) {
    mbox(1.6, 1.4, 1.2, std('#7c8a86'), EX + x, 0, EZ - 6.3);
    for (const dx of [-.45, 0, .45]) mcyl(.07, .1, .55, 8, std('#c98a5a'), EX + x + dx, 1.4, EZ - 6.3);
    mbox(1.3, 1, .25, M.dark, EX + x, .15, EZ - 5.55);
  }
  for (const x of [-2.6, 2.6]) mcyl(.09, .12, 4.3, 6, steel, EX + x, 0, EZ - 4.4);
  mbox(5.4, .18, .18, steel, EX, 4.2, EZ - 4.4);
  // batteries: three containers, their lights show how full they are
  for (const x of [-12.5, -9, -5.5]) {
    mbox(3, 1.5, 1.6, M.white, EX + x, 0, EZ - 2.2);
    mbox(3.04, .12, 1.64, std('#4aa37a'), EX + x, 1.38, EZ - 2.2);
    mbox(.5, .5, .04, M.dark, EX + x - 1, .5, EZ - 1.39);
    for (let k = 0; k < 5; k++) {
      const m = noWave(new T.MeshBasicMaterial({ color: 0x222222, toneMapped: false }));
      const s = new T.Mesh(new T.BoxGeometry(.26, .5, .03), m); s.position.set(EX + x - .1 + k * .32, .75, EZ - 1.38); scene.add(s); SEGS.push({ m, k });
    }
    BATS.push(x);
  }
  // control room
  mbox(4, 2.6, 3, M.b1, EX - 12, 0, EZ - 7.5);
  mbox(4.3, .15, 3.3, M.roof, EX - 12, 2.6, EZ - 7.5);
  mbox(.9, 1.6, .05, M.trunk, EX - 11, 0, EZ - 5.98);
  mbox(1.3, .7, .05, glassM, EX - 13, 1, EZ - 5.98);
  for (const x of [-8.1, -5.1]) mcyl(.06, .06, 1.6, 6, M.dark, EX + x, 0, EZ - 6.6);
}
const gridScreen = canvasPlane(512, 320, 3.4, 2.12);
gridScreen.mesh.position.set(EX - 6.6, 2.6, EZ - 6.55); gridScreen.mesh.rotation.y = 18 * D2R;
const FLOODS = [[-3.4, -9], [3.4, -9], [8.5, 9.4], [26, 9.4]].map(([x, z]) => { mcyl(.05, .06, 4.2, 6, M.dark, EX + x, 0, EZ + z); const s = glowSprite('#ffd9a0', 3); s.position.set(EX + x, 4.25, EZ + z); return s; });

/* the power line to the town */
function pylon(x, z, rotY = 0) {
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  const tw = new T.Mesh(new T.CylinderGeometry(.14, .6, 7.6, 4, 1, true), new T.MeshStandardMaterial({ color: 0x6f7378, roughness: .6, wireframe: true }));
  tw.position.y = 3.8; tw.rotation.y = Math.PI / 4; g.add(tw);
  const core = new T.Mesh(new T.CylinderGeometry(.06, .2, 7.6, 4), M.dark); core.position.y = 3.8; core.castShadow = true; g.add(core);
  const arm = new T.Mesh(new T.BoxGeometry(3.2, .14, .14), M.dark); arm.position.y = 7.2; arm.castShadow = true; g.add(arm);
  for (const dx of [-1.4, 0, 1.4]) { const ins = new T.Mesh(new T.CylinderGeometry(.06, .06, .4, 6), std('#c98a5a')); ins.position.set(dx, 6.95, 0); g.add(ins); }
  return g;
}
const CITY_PYLON = new T.Vector3(35, 0, -35);
pylon(EX - 18, EZ - 4.4, Math.PI / 2); pylon(EX - 30, EZ - 4.4, Math.PI / 2); pylon(CITY_PYLON.x, CITY_PYLON.z, -Math.PI / 4);
const LINE_PTS = (() => {
  const P = [ev(0, 4.3, -4.4), ev(-9, 5.6, -4.4), ev(-18, 6.8, -4.4), ev(-24, 6.2, -4.4), ev(-30, 6.8, -4.4)];
  const a = ev(-30, 6.8, -4.4), b = new T.Vector3(CITY_PYLON.x, 6.8, CITY_PYLON.z);
  for (let k = 1; k <= 10; k++) { const s = k / 11; P.push(new T.Vector3(lerp(a.x, b.x, s), 6.8 - 16 * 4 * s * (1 - s) * .5, lerp(a.z, b.z, s))); }
  P.push(b, new T.Vector3(CITY_PYLON.x - 2, 4.5, CITY_PYLON.z + 2), new T.Vector3(CITY_PYLON.x - 3, .4, CITY_PYLON.z + 3));
  return P;
})();
{
  const c = new T.CatmullRomCurve3(LINE_PTS.slice(0, -2), false, 'centripetal');
  const w = new T.Mesh(new T.TubeGeometry(c, 240, .045, 5, false), M.dark); scene.add(w);
  mbox(1.4, 1.1, 1.1, std('#7c8a86'), CITY_PYLON.x - 3, 0, CITY_PYLON.z + 3);
}

/* energy you can see: glowing packets running along the cables */
const FLOWS = {};
function flow(key, pts, hex, n, speed, size = .55) {
  const v = pts.map(p => Array.isArray(p) ? ev(p[0], p[1], p[2]) : p).filter((p, i, a) => !i || p.distanceTo(a[i - 1]) > .1);
  const curve = new T.CatmullRomCurve3(v, false, 'centripetal'), len = curve.getLength();
  const line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(Math.max(8, Math.round(len * 2)))), new T.LineBasicMaterial({ color: lin(hex), transparent: true, opacity: 0, depthWrite: false }));
  scene.add(line);
  const packets = Array.from({ length: n }, (_, i) => { const s = glowSprite(hex, size); return { s, u: i / n }; });
  const F = { curve, len, line, packets, speed, k: 0, kT: 1, rev: false };
  (FLOWS[key] = FLOWS[key] || []).push(F); return F;
}
for (const t of TURBINES) flow('wind', [[t.lx, .3, t.lz + .5], [t.lx, .3, -13.5], [0, .3, -13.5], [0, .3, -8.8]], '#8fd3ff', 4, 4.5);
flow('sun', [[-16, .3, 7.2], [-16, .3, .8], [-1.5, .3, .8], [-1.5, .3, -2.6]], '#ffcf5a', 6, 4.5);
flow('bio', [[27.4, .3, -1.3], [27.4, .3, .8], [1.5, .3, .8], [1.5, .3, -2.6]], '#8fe08a', 6, 4.5);
flow('gas', [[19.2, 2.2, -5.5], [22, 2.6, -5.5], [24.8, 2.2, -5.5], [26.6, 1.2, -2.6]], '#8fe08a', 3, 2.5, .45);
flow('bat', [[-3.2, .3, -4.6], [-9, .3, -4.6], [-9, .3, -3.1]], '#6ff0c8', 4, 3.5);
flow('town', LINE_PTS, '#ff8fc8', 26, 9, .8);

/* the methanizer: green waste becomes gas, then electricity, and compost */
const DOMES = [];
{
  for (const lx of [19.2, 24.8]) {
    mcyl(2.3, 2.3, 1.3, 26, concrete, EX + lx, 0, EZ - 5.5);
    const d = new T.Mesh(new T.SphereGeometry(2.3, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#7fa86a'));
    d.position.set(EX + lx, 1.3, EZ - 5.5); d.scale.y = .8; d.castShadow = true; d.receiveShadow = true; scene.add(d); DOMES.push(d);
  }
  mbox(2.2, 1.5, 1.4, M.white, EX + 27.4, 0, EZ - 2.2);
  mcyl(.12, .12, 1.6, 8, M.dark, EX + 28.1, 1.5, EZ - 2.4);
  const pile = new T.Mesh(new T.SphereGeometry(1.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std('#6b4a2e')); pile.scale.set(1.3, .55, 1); pile.position.set(EX + 14.2, 0, EZ - 5); pile.castShadow = true; scene.add(pile);
  const pile2 = pile.clone(); pile2.material = std('#5f8a3e'); pile2.scale.set(.8, .45, .7); pile2.position.set(EX + 14.6, 0, EZ - 8.4); scene.add(pile2);
}
const GAS_AT = ev(22, 4.2, -5.5), GEN_AT = ev(27.4, 2.6, -2.2), COMPOST_AT = ev(14.2, 1.6, -5);

/* the recycling centre: a quay, five skips with fill sensors, a gate */
const QUAY_Y = 1.1;
{
  mbox(18, QUAY_Y, 5.5, concrete, EX + 18, 0, EZ + 12.75);
  const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(5, 0); sh.lineTo(5, QUAY_Y); sh.lineTo(0, 0);
  const rg = new T.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false });
  const ramp = new T.Mesh(rg, concrete); ramp.position.set(EX + 4, 0, EZ + 11.2); ramp.castShadow = ramp.receiveShadow = true; scene.add(ramp);
  mbox(18, .03, 3, M.road, EX + 18, QUAY_Y, EZ + 12.7, scene, false);
  for (let x = 9.3; x <= 27; x += 1.75) mcyl(.035, .035, .62, 6, std('#f2c14e'), EX + x, QUAY_Y, EZ + 15.35);
  mbox(17.8, .06, .06, std('#f2c14e'), EX + 18.1, QUAY_Y + .58, EZ + 15.35);
  // gate: a barrier that opens with the resident card
  mbox(.4, 1.1, .4, M.white, EX + 5.2, 0, EZ + 7);
  mbox(.22, 1.2, .22, M.dark, EX + 5.6, 0, EZ + 5.4);
  mbox(.36, .3, .08, M.dark, EX + 5.6, 1, EZ + 5.33);
}
const GATE = new T.Group(); GATE.position.set(EX + 5.2, 1, EZ + 7); scene.add(GATE);
for (let k = 0; k < 4; k++) { const s = new T.Mesh(new T.BoxGeometry(.8, .1, .1), k % 2 ? M.white : std('#d2373c')); s.position.x = -.4 - k * .8; s.castShadow = true; GATE.add(s); }
const GATE_AT = ev(5.6, 1.9, 5.4);
const gateLed = glowSprite('#ff5a4a', .5); gateLed.position.set(EX + 5.6, 1.18, EZ + 5.28);
const SIGN_RC = canvasPlane(512, 160, 4.2, 1.3);
{
  const { g, tex, mesh } = SIGN_RC;
  g.fillStyle = '#20573f'; g.fillRect(0, 0, 512, 160); g.strokeStyle = '#f4efe6'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 140);
  g.fillStyle = '#f4efe6'; g.font = '600 54px "Bricolage Grotesque", sans-serif'; g.textBaseline = 'middle'; g.fillText('♻ Recycling centre', 34, 64);
  g.font = '28px "JetBrains Mono", monospace'; g.fillText('open 7 days · card entry', 38, 118); tex.needsUpdate = true;
  mesh.position.set(EX + 8.8, 2.4, EZ + 7.6);
  for (const dx of [-1.9, 1.9]) mcyl(.05, .05, 1.8, 6, M.dark, EX + 8.8 + dx, 0, EZ + 7.55);
}
const SKIP_KIND = [['📦', 'Cardboard', '#3f6fb5', '#b98d5a'], ['🪵', 'Wood', '#8a5b35', '#a8784a'], ['🔩', 'Metal', '#7b838c', '#5d6268'], ['🌿', 'Green waste', '#4f8c46', '#6c9a3e'], ['📺', 'Electronics', '#d69a2d', '#3a3d44']];
const SKIPS = SKIP_KIND.map(([icon, name, c, fillC], i) => {
  const lx = 11.5 + i * 3.5, home = ev(lx, 0, 17.6), g = new T.Group(); g.position.copy(home); scene.add(g);
  const m = std(c), add = (w, h, d, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(2.8, .12, 3.4, 0, 0, 0); add(.12, 1.1, 3.4, -1.34, 0, 0); add(.12, 1.1, 3.4, 1.34, 0, 0); add(2.8, 1.1, .12, 0, 0, -1.64); add(2.8, 1.1, .12, 0, 0, 1.64);
  const cg = new T.BoxGeometry(2.5, 1, 3.1); cg.translate(0, .5, 0);
  const contents = new T.Mesh(cg, std(fillC)); contents.position.y = .12; contents.receiveShadow = true; g.add(contents);
  const [lc, lg] = cnv(256, 112), ltex = ctex(lc);
  const label = new T.Mesh(new T.PlaneGeometry(2.2, .96), new T.MeshBasicMaterial({ map: ltex, toneMapped: false })); label.position.set(0, .58, 1.71); g.add(label);
  const sensor = new T.Mesh(new T.BoxGeometry(.3, .16, .2), M.white); sensor.position.set(0, 1.18, -1.64); g.add(sensor);
  const led = glowSprite('#7bd88f', .55);
  return { i, icon, name, g, home, contents, label, lg, ltex, led, fill: 0, shown: -1, pop: 1, at: () => _cp.copy(g.position).add(_up.set(0, 1.9, -1.4)) };
});
function drawSkipLabel(S) {
  const pct = Math.round(S.fill * 100); if (pct === S.shown) return; S.shown = pct;
  const g = S.lg, full = pct >= 100, col2 = full ? '#e5484d' : pct > 80 ? '#f2a93b' : '#3fb37f';
  g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, 256, 112);
  g.fillStyle = '#1c1714'; g.font = '600 30px "Bricolage Grotesque", sans-serif'; g.textBaseline = 'middle'; g.fillText(`${S.icon} ${S.name}`, 14, 30);
  g.fillStyle = '#ddd5c8'; g.fillRect(14, 62, 160, 30); g.fillStyle = col2; g.fillRect(14, 62, 160 * Math.min(1, S.fill), 30);
  g.fillStyle = col2; g.font = '700 30px "JetBrains Mono", monospace'; g.fillText(full ? 'FULL' : pct + '%', 184, 78);
  S.ltex.needsUpdate = true;
}
const SKIP_FILL0 = [.93, .55, .4, .7, .25];

/* the skip lorry and the technicians' van */
const truckG = new T.Group(), truckF = follower(truckG);
{
  const green = std('#3f8f6b');
  const ch = new T.Mesh(new T.BoxGeometry(1.25, .32, 5), M.dark); ch.position.set(0, .5, -.3); ch.castShadow = true; truckG.add(ch);
  const cab = new T.Mesh(new T.BoxGeometry(1.4, 1.25, 1.3), green); cab.position.set(0, 1.18, 1.65); cab.castShadow = true; truckG.add(cab);
  const win = new T.Mesh(new T.BoxGeometry(1.3, .45, .05), cabMat); win.position.set(0, 1.45, 2.31); truckG.add(win);
  const hook = new T.Mesh(new T.BoxGeometry(.25, 1.3, .25), green); hook.position.set(0, 1.2, .78); truckG.add(hook);
  const wg = new T.CylinderGeometry(.27, .27, .2, 12).rotateZ(Math.PI / 2);
  for (const z of [1.6, -1.2, -2.2]) for (const x of [-.62, .62]) { const w = new T.Mesh(wg, M.dark); w.position.set(x, .27, z); truckG.add(w); }
  truckG.visible = false; scene.add(truckG);
}
const vanG = makeCar('#f1ede4'), vanF = follower(vanG);
{ const s = new T.Mesh(new T.BoxGeometry(.97, .1, 1.92), std('#ef7d3c')); s.position.y = .42; vanG.add(s); scene.add(vanG); }
const VAN_HOME = [6, -1.6];
let carried = null, flyBox = null;
const FLY = new T.Mesh(new T.BoxGeometry(.3, .22, .24), noWave(new T.MeshStandardMaterial({ color: lin('#c49a62'), roughness: .8 }))); FLY.visible = false; FLY.castShadow = true; scene.add(FLY);
function throwBox(from, to, then) { FLY.visible = true; flyBox = { a: from.clone(), b: to.clone(), t: 0, then }; FLY.position.copy(from); }
const SUN_C = new T.Vector3();
function energyReset() {
  EN.windA = Math.PI / 2; EN.wind = EN.windT = .8; EN.bio = .5; EN.town = .6; EN.maint = false; EN.gateT = 0;
  for (const t of TURBINES) { t.yaw = EN.windA + Math.PI; t.wait = 0; t.pulse = 0; }
  for (const S of SKIPS) { if (S.g.parent !== scene) scene.attach(S.g); S.g.position.copy(S.home); S.g.rotation.set(0, 0, 0); S.g.visible = true; S.fill = SKIP_FILL0[S.i]; S.pop = 1; }
  if (carried) { carried.parent.remove(carried); carried = null; }
  truckF.moving = false; truckG.visible = false; Object.assign(truckF, { x: EX + 40, z: EZ + 2.2 });
  vanF.moving = false; Object.assign(vanF, { x: EX + VAN_HOME[0], z: EZ + VAN_HOME[1], yaw: Math.PI });
  FLY.visible = false; flyBox = null;
}
const toWorld = pts => pts.map(([x, z]) => [EX + x, EZ + z]);
function truckRun() {
  truckG.visible = true; Object.assign(truckF, { x: EX + 33, z: EZ + 2.2, yaw: -Math.PI / 2 });
  fGo(truckF, toWorld([[33, 2.2], [31, 2.4], [29.6, 4.4], [29.5, 18.6], [28, 21.3], [24, 21.5], [14.1, 21.5]]), 6.5, truckLoad);
}
function truckLoad() {
  const S = SKIPS[0];
  carried = S.g.clone(); carried.remove(carried.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry'));
  scene.add(carried); S.g.visible = false;
  const from = S.home.clone(), to = ev(15, .62, 21.5), t0 = beatT;
  st.load = { from, to, t0 };
  Sound.thud();
}
function stepEnergy(dt, time) {
  // wind: speed, direction, turbines turning to face it one after the other
  EN.wind = lerp(EN.wind, EN.windT, damp(1.5, dt));
  const tgt = EN.windA + Math.PI;
  TURBINES.forEach((t, i) => {
    t.rotor.rotation.z -= dt * (.4 + EN.wind * 1.4);
    t.cups.rotation.y += dt * (3 + EN.wind * 6);
    const d = wrapPi(tgt - t.yaw);
    if (t.wait > 0) t.wait -= dt;
    else if (Math.abs(d) > .002) { t.yaw += clamp(d, -.6 * dt, .6 * dt); t.pulse = 1; }
    t.nac.rotation.y = t.yaw;
    t.pulse = Math.max(0, t.pulse - dt * .7);
    const warn = EN.maint && i === 2, w = wake(t.x, t.z);
    t.led.material.color.set(warn ? 0xff9a3c : 0x8fd3ff);
    t.led.material.opacity = w * (warn ? (Math.sin(time * 8) > 0 ? 1 : .25) : .45 + .35 * Math.sin(time * 3 + i));
    const rt = (time * .8 + i * .2) % 1; t.ring.scale.setScalar(.6 + rt * 3.5); t.ring.material.opacity = w * (warn ? 0 : (1 - rt) * (.25 + t.pulse * .6));
  });
  for (const s of STREAKS) {
    const u = s.userData; u.t += dt;
    if (u.t > u.L) spawnStreak(s);
    s.position.x += Math.sin(s.rotation.y) * u.sp * dt * (.5 + EN.wind); s.position.z += Math.cos(s.rotation.y) * u.sp * dt * (.5 + EN.wind);
    s.material.opacity = Math.sin(Math.PI * clamp(u.t / u.L, 0, 1)) * .55 * wake(s.position.x, s.position.z);
  }
  sock.rotation.y += wrapPi(EN.windA - sock.rotation.y) * damp(3, dt);
  sock.rotation.x = Math.sin(time * 6) * .06;
  // sun: the trackers turn towards it, and lie flat at night
  _od.copy(TS.pos).normalize();
  EN.sunK = clamp((TS.si - .6) / 1.5, 0, 1) * (TS.pos.y > 0 ? 1 : 0) * (todName === 'night' ? 0 : 1);
  const sa = EN.sunK > .05 ? clamp(Math.atan2(-_od.x, _od.y), -.95, .95) : 0;
  ROWS.forEach((r, i) => { r.a = lerp(r.a, sa, damp(1.2 + i * .12, dt)); r.row.rotation.z = r.a; });
  // the grid: what comes in, what the town needs, the batteries in between
  EN.net = EN.wind * .55 + EN.sunK * .45 + EN.bio * .12 - EN.town * .8;
  EN.bat = clamp(EN.bat + EN.net * dt * .22, .05, .98);
  const lit = Math.round(EN.bat * 5), charging = EN.net > .02;
  for (const S of SEGS) S.m.color.copy(S.k < lit ? goodCol : (charging && S.k === lit && Math.sin(time * 6) > 0) ? goodCol : _a.setRGB(.06, .06, .07));
  for (const D of DOMES) D.scale.y = .8 + Math.sin(time * 1.3) * .025 * EN.bio;
  const want = { wind: EN.wind, sun: EN.sunK, bio: EN.bio, gas: EN.bio, bat: Math.min(1, Math.abs(EN.net) * 3), town: 1 };
  for (const key in FLOWS) for (const F of FLOWS[key]) {
    F.k = lerp(F.k, want[key], damp(2, dt));
    if (key === 'bat') F.rev = !charging;
    const v = F.speed / F.len * (.4 + .6 * F.k);
    F.line.material.opacity = .22 * F.k * wake(F.curve.points[0].x, F.curve.points[0].z);
    for (const p of F.packets) {
      p.u = (p.u + dt * v) % 1; F.curve.getPointAt(F.rev ? 1 - p.u : p.u, p.s.position);
      p.s.material.opacity = F.k * wake(p.s.position.x, p.s.position.z) * Math.min(1, Math.sin(p.u * Math.PI) * 4);
    }
  }
  for (const f of FLOODS) f.material.opacity = clamp(G - .5, 0, 1) * .55;
  // the recycling centre
  EN.gate = lerp(EN.gate, EN.gateT, damp(4, dt)); GATE.rotation.z = -1.45 * EN.gate;
  gateLed.material.color.set(EN.gateT ? 0x63e07a : 0xff5a4a); gateLed.material.opacity = .9;
  for (const S of SKIPS) {
    S.pop = lerp(S.pop, 1, damp(6, dt)); S.g.scale.setScalar(Math.max(.001, S.g.parent === scene ? S.pop : 1));
    S.contents.scale.y = Math.max(.02, S.fill * .95); drawSkipLabel(S);
    S.led.position.copy(S.g.position).add(_up.set(0, 1.32, -1.5)); S.led.visible = S.g.visible;
    S.led.material.color.copy(S.fill >= 1 ? badCol : S.fill > .8 ? warnCol : goodCol);
    S.led.material.opacity = wake(S.home.x, S.home.z) * (S.fill >= 1 ? (Math.sin(time * 9) > 0 ? 1 : .2) : .8);
  }
  if (flyBox) {
    const f = flyBox; f.t = Math.min(1, f.t + dt / .75);
    FLY.position.lerpVectors(f.a, f.b, f.t); FLY.position.y += Math.sin(f.t * Math.PI) * .9; FLY.rotation.x += dt * 7; FLY.rotation.z += dt * 4;
    if (f.t >= 1) { FLY.visible = false; flyBox = null; if (f.then) f.then(); }
  }
  if (st.load && carried) {
    const L = st.load, k = clamp((beatT - L.t0) / 2.2, 0, 1), e = ease(k);
    carried.position.lerpVectors(L.from, L.to, e); carried.position.y += Math.sin(k * Math.PI) * 1.6;
    carried.rotation.y = -Math.PI / 2 * e;
    if (k >= 1) {
      truckG.attach(carried); st.load = null;
      later(.6, () => {
        const S = SKIPS[0]; S.fill = 0; S.pop = .001; S.g.visible = true; Sound.ping();
        bub('✓ Fresh empty skip', S.at, { cls: 'sign good', dur: 3.5 });
        fGo(truckF, toWorld([[14.1, 21.5], [4, 21.5], [1.2, 20.6], [0, 18.6], [0, 5], [-1.4, 2.4], [-6, 2.2], [-34, 2.2]]), 6.5, () => { truckG.visible = false; });
      });
    }
  }
  fStep(truckF, dt); truckG.position.set(truckF.x, .04, truckF.z); truckG.rotation.y = truckF.yaw;
  fStep(vanF, dt); vanG.position.set(vanF.x, .04, vanF.z); vanG.rotation.y = vanF.yaw;
}
let gridShown = '';
function drawGrid() {
  const { g, c, tex } = gridScreen, Wd = c.width, Hd = c.height;
  const pc = v => Math.round(clamp(v, 0, 1) * 100);
  const rows = [['💨 Wind', EN.wind * .55, '#8fd3ff'], ['☀️ Sun', EN.sunK * .45, '#ffcf5a'], ['🌿 Biogas', EN.bio * .12, '#8fe08a'], ['🏙️ Town needs', EN.town * .8, '#ff8fc8']];
  const key = rows.map(r => pc(r[1])).join() + pc(EN.bat) + (EN.net > .02);
  if (key === gridShown) return; gridShown = key;
  g.fillStyle = '#0f1412'; g.fillRect(0, 0, Wd, Hd);
  g.fillStyle = '#7bd88f'; g.font = '600 22px "JetBrains Mono", monospace'; g.textBaseline = 'middle'; g.fillText('● SMART GRID · LIVE', 24, 34);
  rows.forEach(([name, v, col3], k) => {
    const y = 82 + k * 46;
    g.fillStyle = '#e9e4da'; g.font = '24px "Bricolage Grotesque", sans-serif'; g.fillText(name, 24, y);
    g.fillStyle = '#2a302d'; g.fillRect(218, y - 11, 190, 22); g.fillStyle = col3; g.fillRect(218, y - 11, 190 * clamp(v / .6, 0, 1), 22);
    g.fillStyle = '#e9e4da'; g.font = '600 22px "JetBrains Mono", monospace'; g.fillText(Math.round(v * 100) + ' MW', 420, y);
  });
  const ch = EN.net > .02;
  g.fillStyle = ch ? '#7bd88f' : '#6ff0c8'; g.font = '600 24px "JetBrains Mono", monospace';
  g.fillText(`🔋 Batteries ${pc(EN.bat)}%  ${ch ? '▲ storing' : '▼ to the town'}`, 24, 286);
  tex.needsUpdate = true;
}

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
const body = document.body;
let smart = false, smartK = 0, G = 1, lastLight = 100;
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
  sun.color.copy(TS.sun); sun.intensity = TS.si; sun.position.copy(TS.pos).normalize().multiplyScalar(70).add(SUN_C); sun.target.position.copy(SUN_C);
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
    if (I.force) { I.g = I.force; I.phase = 'green'; I.t = 0; }
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
  if (tom.vis) movers.push(tom.x, tom.z);
  movers.push(tcar.x, tcar.z);
  for (const c of CARS) movers.push(carX(c), carZ(c));
  movers.push(bus.x, bus.z);
  for (const p of PEOPLE) if (p.walker) movers.push(p.x, p.z);
  let sum = 0;
  const vis = clamp(G, 0, 1.3);
  for (const L of LAMPS) {
    let tgt = 1;
    if (L.broken && wake(L.x, L.z) < .5) tgt = Math.random() < .035 ? .8 : 0;
    else if (wake(L.x, L.z) > .5) {
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
    this.master.gain.setTargetAtTime(this.on ? .3 : 0, t, .5); this.fx.gain.setTargetAtTime(this.on ? .9 : 0, t, .05);
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
  burst(freq, q, dur, vol, at = 0) {
    if (!this.on) return; const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(); s.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(bp).connect(g).connect(this.fx); s.start(t, Math.random() * 2); s.stop(t + dur + .05);
  },
  ring() { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) this.tone(1480, .06, 'square', .03, r * .75 + k * .1); },
  honk() { this.tone(392, .34, 'sawtooth', .045); this.tone(494, .34, 'sawtooth', .035); },
  cough() { this.burst(650, 1.1, .16, .9); this.burst(560, 1.1, .2, .8, .22); },
  ping() { this.tone(1046.5, .5, 'sine', .07); this.tone(1568, .8, 'sine', .05, .09); },
  rewind() {
    if (!this.on) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(120, t + 3.4);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03, t + .2); g.gain.exponentialRampToValueAtTime(.001, t + 3.6);
    o.connect(g).connect(this.fx); o.start(t); o.stop(t + 3.7); this.whoosh(false);
  },
};

/* ================================================================== Tom: moves and poses */
const hAt = (x, z) => {
  if (x > EX - 33) return islandH(x - EX, z - EZ);
  if (Math.abs(x - HX) < 1.3 && Math.abs(z - HZ) < 1.2) return .33;
  if (x > -13.6 && x < -4.2 && z > -12 && z < -4) return .7;
  const onB = v => BLOCK.some(b => Math.abs(v - b) <= 6);
  return onB(x) && onB(z) ? .25 : .04;
};
const carY = (x, z) => x > EX - 33 ? islandH(x - EX, z - EZ) : (x > 18.2 && x < 29.8 && z > 2.2 && z < 13.8) ? .27 : hAt(x, z) > .2 ? .25 : .04;

const POSE0 = { hy: .38, upX: 0, upZ: 0, hdX: 0, hdY: 0, lT: 0, rT: 0, lK: 0, rK: 0, lA: 0, rA: 0, lAZ: -.08, rAZ: .08, lE: -.15, rE: -.15 };
const tom = { x: HX, z: HZ, y: .3, yaw: 0, yawT: 0, act: 'idle', path: null, speed: 1.3, walkAct: null, then: null, walkPh: 0,
  vis: true, scale: 1, scaleT: 1, fixedY: null, prop: null, glide: null, P: Object.assign({}, POSE0) };

function tomTarget(t) {
  const P = Object.assign({}, POSE0), a = tom.path ? (tom.walkAct || (tom.speed > 2 ? 'run' : 'walk')) : tom.act;
  P.upX = Math.sin(t * 2.2) * .02;
  const SIT = () => { P.hy = .26; P.lT = P.rT = -1.5; P.lK = P.rK = 1.45; P.lA = P.rA = -.35; P.lE = P.rE = -.55; };
  const BED = () => { P.hy = .07; P.lT = P.rT = -1.57; P.lK = P.rK = 0; P.lA = P.rA = -.55; P.lE = P.rE = -.45; };
  if (a === 'walk' || a === 'run' || a === 'scared') {
    const run = a === 'run', amp = run ? .85 : .55, s = Math.sin(tom.walkPh), c = Math.cos(tom.walkPh);
    P.lT = -amp * s; P.rT = amp * s;
    P.lK = Math.max(0, c) * (run ? 1.3 : .8); P.rK = Math.max(0, -c) * (run ? 1.3 : .8);
    P.lA = amp * .8 * s; P.rA = -amp * .8 * s; P.lE = P.rE = run ? -1.2 : -.35;
    P.hy = .37 + Math.abs(c) * (run ? .04 : .02);
    P.upX = run ? .28 : .06;
    if (a === 'scared') { P.upX = .2; P.hdY = Math.sin(t * 2.6) * .7; P.lE = P.rE = -1.4; P.lAZ = .35; P.rAZ = -.35; P.lA = P.rA = -.5; }
  }
  else if (a === 'sit') SIT();
  else if (a === 'eat') { SIT(); const k = sstep(.1, .7, Math.sin(t * 2.1)); P.rA = -.45 - 1.15 * k; P.rE = -.6 - 1.25 * k; P.rAZ = -.12 * k; P.hdX = .12 - .2 * k; }
  else if (a === 'cough') { SIT(); const c = t % 2.2, j = c < .8 ? Math.abs(Math.sin(c * 15)) : 0; P.upX = .2 + .3 * j; P.hdX = .2 + .25 * j; P.rA = -1.75; P.rE = -1.95; P.rAZ = -.25; }
  else if (a === 'lie') { P.hy = .07; P.lT = P.rT = -1.57; P.upX = -1.57 + Math.sin(t * 1.4) * .015; P.lA = P.rA = .05; P.lE = P.rE = 0; P.hdY = .25; }
  else if (a === 'situp') BED();
  else if (a === 'shiver') { BED(); P.upZ = Math.sin(t * 46) * .05; P.lAZ = .55; P.rAZ = -.55; P.lA = P.rA = -1.05; P.lE = P.rE = -1.6; P.hdX = .18; }
  else if (a === 'stretch') { BED(); const w = Math.sin(t * 3) * .15; P.lA = P.rA = -2.95 + w; P.lAZ = -.3; P.rAZ = .3; P.lE = P.rE = -.15; P.upX = -.12; P.hdX = -.3; }
  else if (a === 'facepalm') { P.rA = -2.25; P.rE = -2.15; P.rAZ = -.3; P.hdX = .4; P.upX = .14; P.lA = .1; }
  else if (a === 'cheer') { const w = Math.sin(t * 9); P.lA = P.rA = -2.85 + .2 * w; P.lAZ = -.35 - .1 * w; P.rAZ = .35 + .1 * w; P.lE = P.rE = -.2; P.hy = .38 + Math.abs(w) * .03; }
  else if (a === 'lookup') { P.hdX = -.6; P.upX = -.05; }
  else if (a === 'throw') { P.lA = P.rA = -2.5; P.lE = P.rE = -.1; P.lAZ = .1; P.rAZ = -.1; P.upX = -.14; P.hdX = -.2; }
  else if (a === 'thumb') { P.rA = -1.45; P.rE = -.55; P.rAZ = -.1; P.hdX = -.1; }
  if (tom.prop === 'box' && a !== 'throw') { P.lA = P.rA = -1.15; P.lE = P.rE = -.5; P.lAZ = .12; P.rAZ = -.12; }
  if (tom.prop === 'phone') { P.rA = -1.05; P.rE = -1.25; P.rAZ = -.22; P.hdX += .42; }
  return P;
}
function applyPose() {
  const R = TOM, P = tom.P;
  R.hips.position.y = P.hy; R.upper.rotation.x = P.upX; R.upper.rotation.z = P.upZ; R.head.rotation.x = P.hdX; R.head.rotation.y = P.hdY;
  R.legs[0].thigh.rotation.x = P.lT; R.legs[1].thigh.rotation.x = P.rT; R.legs[0].knee.rotation.x = P.lK; R.legs[1].knee.rotation.x = P.rK;
  R.arms[0].sh.rotation.x = P.lA; R.arms[1].sh.rotation.x = P.rA; R.arms[0].sh.rotation.z = P.lAZ; R.arms[1].sh.rotation.z = P.rAZ;
  R.arms[0].el.rotation.x = P.lE; R.arms[1].el.rotation.x = P.rE;
}
function tomPlace(x, z, yawDeg, act = 'idle', y = null) {
  Object.assign(tom, { x, z, yaw: yawDeg * D2R, yawT: yawDeg * D2R, act, path: null, then: null, fixedY: y, vis: true, scale: 1, scaleT: 1, glide: null });
  tom.y = y ?? hAt(x, z); Object.assign(tom.P, tomTarget(0)); applyPose();
}
function tomAppear(x, z, yawDeg) { tomPlace(x, z, yawDeg); tom.scale = .01; }
function tomHide() { tom.vis = false; tom.path = null; tom.then = null; }
function tomWalk(pts, speed = 1.3, then = null, act = null) { tom.path = pts.map(p => p.slice()); tom.speed = speed; tom.then = then; tom.walkAct = act; tom.fixedY = null; tom.glide = null; }
function tomDo(act, yawDeg) { tom.act = act; if (yawDeg != null) tom.yawT = yawDeg * D2R; }
function ensureTom(x, z, yawDeg, act = 'idle') { if (!tom.vis || Math.hypot(tom.x - x, tom.z - z) > .6) tomPlace(x, z, yawDeg, act); else tomDo(act, yawDeg); }
function flop() { tom.glide = [HX - .5, HZ + .75]; tom.fixedY = .63; tom.yawT = Math.PI / 2; tom.act = 'lie'; }
function stepTom(dt, time) {
  if (tom.path) {
    const [px, pz] = tom.path[0], dx = px - tom.x, dz = pz - tom.z, d = Math.hypot(dx, dz), step = tom.speed * dt;
    if (d <= step) {
      tom.x = px; tom.z = pz; tom.path.shift();
      if (!tom.path.length) { tom.path = null; const f = tom.then; tom.then = null; if (f) f(); }
    } else { tom.x += dx / d * step; tom.z += dz / d * step; tom.yawT = Math.atan2(dx, dz); }
    tom.walkPh += dt * Math.PI * 2 * tom.speed / (tom.speed > 2 ? .95 : .62);
  }
  if (tom.glide) { const k = damp(7, dt); tom.x = lerp(tom.x, tom.glide[0], k); tom.z = lerp(tom.z, tom.glide[1], k); }
  tom.yaw += wrapPi(tom.yawT - tom.yaw) * damp(10, dt);
  tom.y = lerp(tom.y, tom.fixedY != null ? tom.fixedY : hAt(tom.x, tom.z), damp(14, dt));
  const tgt = tomTarget(time), k = damp(tom.path ? 22 : 8, dt);
  for (const key in tgt) tom.P[key] = lerp(tom.P[key], tgt[key], k);
  applyPose();
  tom.scale = lerp(tom.scale, tom.scaleT, damp(9, dt));
  const R = TOM.root; R.visible = tom.vis && tom.scale > .03;
  R.position.set(tom.x, tom.y, tom.z); R.rotation.y = tom.yaw; R.scale.setScalar(Math.max(.001, tom.scale));
  TOM.phone.visible = tom.prop === 'phone'; TOM.food.visible = tom.prop === 'food'; TOM.box.visible = tom.prop === 'box';
}

/* ------------------------------------------------------------------ cars that follow a drawn path */
const curveOf = (pts, closed = false) => new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], 0, p[1])), closed, 'centripetal');
function follower(obj) { return { obj, curve: null, clen: 1, u: 0, spd: 0, spdT: 0, rev: false, then: null, loop: null, inLoop: false, onU: null, flow: false, moving: false, x: obj.position.x, z: obj.position.z, yaw: obj.rotation.y }; }
function fGo(f, pts, speed, then = null, opt = {}) {
  f.curve = curveOf((opt.fromHere ? [[f.x, f.z]] : []).concat(pts)); f.clen = f.curve.getLength();
  Object.assign(f, { u: 0, spdT: speed, rev: !!opt.rev, then, loop: opt.loop || null, inLoop: false, onU: null, flow: !!opt.flow, moving: true });
  if (!opt.keepSpeed) f.spd = 0;
}
const _tg = new T.Vector3(), _pt = new T.Vector3();
function fStep(f, dt) {
  if (!f.moving) return;
  const slow = f.loop || f.inLoop || f.flow ? 1e9 : Math.max(.3, (1 - f.u) * f.clen * 1.4);
  const tgt = Math.min(f.spdT, slow);
  f.spd = f.spd < tgt ? Math.min(tgt, f.spd + 3.2 * dt) : lerp(f.spd, tgt, damp(6, dt));
  const pu = f.u; f.u += f.spd * dt / f.clen;
  if (f.inLoop && f.onU && pu < f.onU.u && f.u >= f.onU.u && f.onU.when()) { const h = f.onU; f.onU = null; h.fn(); return; }
  if (f.u >= 1) {
    if (f.loop) { f.curve = f.loop; f.clen = f.curve.getLength(); f.u = 0; f.loop = null; f.inLoop = true; }
    else if (f.inLoop) f.u -= 1;
    else { f.u = 1; place(f, dt); f.moving = false; f.spd = 0; const t = f.then; f.then = null; if (t) t(); return; }
  }
  place(f, dt);
}
function place(f, dt) {
  f.curve.getPointAt(Math.min(1, f.u), _pt); f.curve.getTangentAt(Math.min(1, f.u), _tg);
  f.x = _pt.x; f.z = _pt.z;
  const yt = Math.atan2(_tg.x, _tg.z) + (f.rev ? Math.PI : 0);
  f.yaw += wrapPi(yt - f.yaw) * damp(14, dt);
}

/* Tom's car: parked, on a drawn path, or driving in the traffic model */
const tcar = Object.assign(follower(tomCarG), { mode: 'park', axis: 'x', road: 16, dir: 1, key: 'x|16|1', s: 0, v: 0, len: 1.9, pass: 0, tom: true, driver: false, y: .25, stopAt: null, onStop: null, green: false });
const leaver = follower(LOT.cars[0]);
function leaveSim() { const L = lanes.get(tcar.key), i = L.indexOf(tcar); if (i >= 0) L.splice(i, 1); }
function carPark(x, z, yawDeg) { leaveSim(); Object.assign(tcar, { mode: 'park', moving: false, x, z, yaw: yawDeg * D2R, spd: 0, v: 0 }); tcar.y = carY(x, z); }
function carGo(pts, speed, then, opt = {}) {
  const v = tcar.mode === 'sim' ? tcar.v : tcar.spd; leaveSim(); tcar.mode = 'path';
  fGo(tcar, pts, speed, then, opt); if (opt.keepSpeed) tcar.spd = v;
}
function carJoin(s, v = 0) {
  leaveSim(); Object.assign(tcar, { mode: 'sim', moving: false, s, v });
  const L = lanes.get(tcar.key);
  for (const c of L) { const d = ((c.s - s) % 72 + 108) % 72 - 36; if (Math.abs(d) < 3) c.s = s - 3.2 - Math.random() * 2; }
  L.push(tcar);
}
function carLoop(u) { tcar.mode = 'path'; leaveSim(); Object.assign(tcar, { curve: LOOP, clen: LOOP.getLength(), u, inLoop: true, loop: null, moving: true, spd: 3, spdT: 3.4, rev: false, then: null, flow: false }); place(tcar, 1); tcar.yaw = Math.atan2(_tg.x, _tg.z); }
function ensureSim(s) { if (!(tcar.mode === 'sim' && Math.abs(tcar.s - s) < 4)) carJoin(s, 0); tcar.driver = true; tomHide(); }
function tomIntoCar() { tom.scaleT = 0; tom.path = null; setTimeout(() => { if (tom.scaleT === 0) tom.vis = false; }, 400); tcar.driver = true; }
const atEntrance = () => tcar.mode !== 'sim' && Math.hypot(tcar.x - 19.6, tcar.z - 14.2) < 1.2;
function stepTomCar(dt) {
  if (tcar.mode === 'path') fStep(tcar, dt);
  if (tcar.mode === 'path' && !tcar.moving) tcar.mode = 'park';
  if (tcar.mode === 'sim') {
    tcar.x = carX(tcar); tcar.z = carZ(tcar); tcar.yaw = Math.PI / 2;
    if (tcar.green) {  // smart lights: the crossroads ahead sees Tom and gives him green
      for (const I of INTERS) if (I.z === 16 && I.force === 'x' && tcar.x > I.x + 3) I.force = null;
      const ni = nextInter(tcar); if (ni && ni.d < 12) ni.I.force = 'x';
    }
    if (tcar.stopAt != null && tcar.s >= tcar.stopAt) { const f = tcar.onStop; tcar.stopAt = null; tcar.onStop = null; if (f) f(); }
  }
  tcar.y = lerp(tcar.y, carY(tcar.x, tcar.z), damp(10, dt));
  tomCarG.position.set(tcar.x, tcar.y, tcar.z); tomCarG.rotation.y = tcar.yaw;
  tomCarG.userData.head.visible = tcar.driver;
  tomCarG.userData.lights.emissiveIntensity = G > .5 ? 2.6 : .3;
  fStep(leaver, dt);
  if (leaver.moving) { leaver.obj.position.set(leaver.x, carY(leaver.x, leaver.z), leaver.z); leaver.obj.rotation.y = leaver.yaw; }
}
function lotSet(smartLot) {
  LOT.cars.forEach((g, i) => { g.visible = !(smartLot && i === 1); g.position.set(LOT.spots[i], .27, LOT.z); g.rotation.y = 0; });
  Object.assign(leaver, { moving: false, x: LOT.spots[0], z: LOT.z, yaw: 0 });
}
const force = (x, z, ax) => { IMAP.get(x + ',' + z).force = ax; };

/* paths */
const DRIVE_OUT = [[-26, 19.6], [-25.8, 18.4], [-25, 17.3], [-23.6, 17]];
const LOT_ENTRY = [[16.6, 17], [18.6, 16.8], [19.5, 15.6], [19.6, 13.6], [19.7, 11], [20.8, 10.05], [23.6, 10], [25.6, 10]];
const LOOP = curveOf([[25.6, 10], [28, 10], [28.6, 9.3], [28.6, 4.1], [28, 3.4], [25.6, 3.4], [25, 4.1], [25, 9.3]], true);
const U_WEST = (() => { let best = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { LOOP.getPointAt(i / 400, _pt); const d = Math.hypot(_pt.x - 25, _pt.z - 7.2); if (d < bd) { bd = d; best = i / 400; } } return best; })();
const PARK_A = [[25, 9], [24.5, 9.95], [23.2, 10.25], [21.9, 10.45], [21.35, 11.2], [21.2, 12.3]];
const PARK_B = [[19.6, 12.6], [19.9, 10.8], [20.9, 10.15], [21.9, 10.3], [22.45, 11.1], [22.6, 12.3]];
const TURN_IN = [[19.3, 16.5], [19.6, 15.3], [19.6, 14.2]];

/* ------------------------------------------------------------------ speech bubbles, phone notifications */
const bubLayer = $('#bubbles'), BUBS = [];
const _hp = new T.Vector3(), _up = new T.Vector3(), _cp = new T.Vector3(), _bp = new T.Vector3();
function bub(html, at, o = {}) {
  const el = document.createElement('div'); el.className = 'bub ' + (o.cls || 'emo');
  el.innerHTML = `<div class="b">${html}</div>`; bubLayer.appendChild(el);
  const b = { el, at, t: 0, dur: o.dur || 0, dx: o.dx || 0, dy: o.dy || 0 }; BUBS.push(b); placeBub(b); return b;
}
function killBub(b) { const i = BUBS.indexOf(b); if (i >= 0) BUBS.splice(i, 1); b.el.classList.add('out'); setTimeout(() => b.el.remove(), 320); }
function clearBubs() { for (const b of [...BUBS]) killBub(b); }
function placeBub(b) {
  _bp.copy(typeof b.at === 'function' ? b.at() : b.at).project(camera);
  const off = _bp.z > 1 || Math.abs(_bp.x) > 1.3 || Math.abs(_bp.y) > 1.3;
  b.el.style.visibility = off ? 'hidden' : 'visible';
  const bw = b.el.firstChild.offsetWidth, bh = b.el.firstChild.offsetHeight;   // keep bubbles on screen, below the top bar
  const x = clamp((_bp.x * .5 + .5) * W + b.dx, bw / 2 + 12, W - bw / 2 - 12), y = clamp((-_bp.y * .5 + .5) * H + b.dy, bh + 78, H - 150);
  b.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}
function stepBubs(dt) { for (const b of [...BUBS]) { b.t += dt; if (b.dur && b.t > b.dur) killBub(b); else placeBub(b); } }
const note = (icon, app, text, at, o = {}) => bub(`<i class="ic">${icon}</i><span><small>${app}</small>${text}</span>`, at, Object.assign({ cls: 'note' }, o));
const atTom = (dy = .46) => () => TOM.head.getWorldPosition(_hp).add(_up.set(0, dy, 0));
const atCar = () => _cp.set(tcar.x, tcar.y + 1.7, tcar.z);
const ALARM_AT = new T.Vector3(HX - 1.12, 1.05, HZ + .1);
const SENSOR_AT = new T.Vector3(SENSOR_LAMP.px, 2.85, SENSOR_LAMP.pz);
const BROKEN_AT = new T.Vector3(BROKEN_LAMP.x, 4, BROKEN_LAMP.z + .3);
const HALL_SIGN_AT = new T.Vector3(-6.7, 2.15, -8.95);

/* ------------------------------------------------------------------ the story, beat by beat */
const PARTS = { intro: ['One day, two towns', ''], p1: ['Part 1', 'An ordinary town'], rw: ['Rewind', 'Same day, again'], p2: ['Part 2', 'A smart town'], p3: ['Part 3', 'Energy & recycling'], end: ['Conclusion', 'How to convince people'] };
const V = (t, az, el, d, off) => ({ t, az, el, d, off });
const OVER = V([0, -2, 0], 42, 38, 108);
const BEDV = V([HX - .55, .7, HZ + .5], 176, 30, 6.2);
const LUNCH = V([-4.1, .95, 8.2], 62, 16, 6.6);
const tomOrCar = () => tom.vis ? _cp.set(tom.x, tom.y + .5, tom.z) : _cp.set(tcar.x, tcar.y + .5, tcar.z);
const tomPos = () => _cp.set(tom.x, tom.y + .55, tom.z);
const carPos = () => _cp.set(tcar.x, tcar.y + .5, tcar.z);

let beatT = 0, cues = [];
const cue = (t, fn) => cues.push({ t, fn, done: false });
const later = (d, fn) => cue(beatT + d, fn);
let binsMode = null, alarmShake = 0;
const houseLight = v => { house.target = v; };
function bedScene(act = 'lie') { house.open = true; houseLight(0); tomPlace(HX - .5, HZ + .75, 90, act, .63); carPark(-26, 21, 180); }
const sleep = () => bub('<b>z</b><b>z</b><b>z</b>', atTom(.2), { cls: 'zzz' });
const ring = () => { Sound.ring(); alarmShake = 2.4; bub('RING!', ALARM_AT, { cls: 'say', dur: 2.4 }); };
const honk = () => { Sound.honk(); bub('BEEP!', atCar, { cls: 'say', dur: 1.3, dx: 46 }); };
function leaveHome() {
  house.open = false; houseLight(0); carPark(-26, 21, 180); tcar.driver = false; tomPlace(HX, 18.95, 180);
  cue(.4, () => tomWalk([[-27.1, 18.9], [-26.35, 19.6]], 1.4, () => {
    tomIntoCar(); later(.5, () => carGo(DRIVE_OUT, 2.8, () => carJoin(-23.6, tcar.spd), { fromHere: true, flow: true }));
  }));
}
function turnIn() { carGo(TURN_IN, 2.4, () => bub('🅿️', atCar, { dur: 2 }), { fromHere: true, keepSpeed: true }); }
const JSON_HTML = `<pre><span class="k">"sensor"</span>: <span class="s">"lamp-17"</span>,
<span class="k">"people"</span>: <span class="n">1</span>,
<span class="k">"time"</span>: <span class="s">"22:35"</span></pre><p>No camera. No face. No name.</p>`;

const WIND_JSON = `<pre><span class="k">"turbine"</span>: <span class="n">3</span>,
<span class="k">"wind"</span>: <span class="s">"30 km/h"</span>,
<span class="k">"from"</span>: <span class="s">"west"</span></pre><p>Measured every second.</p>`;
function windNow(a) { EN.windA = a; for (const t of TURBINES) { t.yaw = a + Math.PI; t.nac.rotation.y = t.yaw; } }
function atQuay() { EN.gateT = EN.gate = 1; if (!(tcar.mode === 'park' && Math.hypot(tcar.x - EX - 14.2, tcar.z - EZ - 12.7) < .5)) carPark(EX + 14.2, EZ + 12.7, 90); tcar.driver = false; }

const B = [
  { id: 'title', part: 'intro', clock: '06:30', tod: 'dawn', smart: false, over: 'title', view: OVER, drift: .035, place: '',
    cap: '', fr: '', setup() { bedScene(); } },
  { id: 'town', part: 'intro', clock: '06:30', tod: 'dawn', smart: false, view: V([-4, 0, 2], 30, 32, 84), drift: .03, place: 'Our town',
    cap: 'This is our town. A normal town, like many others: traffic jams, pollution, and a town hall that closes at five.',
    fr: 'Voici notre ville. Une ville normale, comme beaucoup d’autres : des bouchons, de la pollution, et une mairie qui ferme à 17 h.',
    setup() { bedScene(); } },

  /* ---------------- Part 1: an ordinary day */
  { id: 'p1-asleep', part: 'p1', clock: '06:45', tod: 'dawn', smart: false, view: BEDV, place: 'Tom’s bedroom',
    cap: 'And this is Tom. It’s 6:45 and he is still asleep. Today, we are going to follow him all day long.',
    fr: 'Et voici Tom. Il est 6 h 45 et il dort encore. Aujourd’hui, on va le suivre toute la journée.',
    setup() { bedScene(); cue(.5, sleep); } },
  { id: 'p1-alarm', part: 'p1', clock: '06:45', tod: 'dawn', smart: false, view: BEDV, place: 'Tom’s bedroom',
    cap: 'His alarm rings. Brrr… the house is cold: the old heating only starts at 7 o’clock, every day.',
    fr: 'Son réveil sonne. Brrr… la maison est froide : le vieux chauffage ne s’allume qu’à 7 h, tous les jours.',
    setup() {
      bedScene(); cue(.2, ring); cue(1.5, () => tomDo('situp')); cue(2.3, () => houseLight(1));
      cue(2.7, () => { tomDo('shiver'); bub('🥶', atTom()); }); cue(3.4, () => bub('16 °C', THERMO, { cls: 'sign bad' }));
    } },
  { id: 'p1-car', part: 'p1', clock: '07:30', tod: 'morning', smart: false, view: V(null, -150, 26, 12), follow: tomOrCar, place: 'Tom’s street',
    cap: '7:30. Tom takes his car to go to work. And… red light.',
    fr: '7 h 30. Tom prend sa voiture pour aller travailler. Et… feu rouge.',
    setup() { leaveHome(); force(-16, 16, 'z'); },
    run(t, dt, st) { if (!st.mad && tcar.mode === 'sim' && tcar.v < .15 && t > 4) { st.mad = 1; bub('😤', atCar); honk(); } } },
  { id: 'p1-wait', part: 'p1', clock: '07:40', tod: 'morning', smart: false, view: V(null, 100, 20, 9, [1.4, 0, 0]), follow: carPos, place: 'First crossroads',
    cap: 'These lights work on a timer: they don’t see the traffic. So Tom waits… with his engine running.',
    fr: 'Ces feux marchent avec une minuterie : ils ne voient pas la circulation. Alors Tom attend… moteur allumé.',
    setup() { ensureSim(-19.4); force(-16, 16, 'z'); cue(.5, honk); cue(2.4, () => bub('😤', atCar)); cue(4.2, honk); } },
  { id: 'p1-roads', part: 'p1', clock: '07:55', tod: 'morning', smart: false, lost: 20, view: V(null, -95, 32, 15, [3, 0, 0]), follow: carPos, place: 'Main road',
    cap: 'And it’s the same at every crossroads. In total, Tom waits 20 minutes at red lights.',
    fr: 'Et c’est pareil à chaque carrefour. Au total, Tom attend 20 minutes aux feux rouges.',
    setup() { ensureSim(-19.4); force(-16, 16, 'z'); force(0, 16, 'z'); cue(.6, () => force(-16, 16, 'x')); },
    run(t, dt, st) {
      if (t > 1 && tcar.x > -12.5) force(-16, 16, null);
      if (!st.sad && t > 3 && tcar.mode === 'sim' && tcar.v < .15) { st.sad = 1; bub('😩', atCar); honk(); }
    } },
  { id: 'p1-parking', part: 'p1', clock: '08:20', tod: 'morning', smart: false, lost: 32, view: V([24.4, .5, 8.2], 18, 50, 25), place: 'The office car park',
    cap: '8:20. The car park is full. Tom drives around… and around… and around again.',
    fr: '8 h 20. Le parking est plein. Tom tourne… et tourne… et tourne encore.',
    setup() { lotSet(false); tomHide(); tcar.driver = true; carGo(LOT_ENTRY, 3.4, null, { loop: LOOP }); cue(2.5, () => bub('❓', atCar)); } },
  { id: 'p1-late', part: 'p1', clock: '08:32', tod: 'morning', smart: false, view: V(null, 22, 42, 15), follow: tomOrCar, place: 'The office car park',
    cap: 'Finally, a free space! But Tom is half an hour late, and his day has only just started.',
    fr: 'Enfin une place ! Mais Tom a une demi-heure de retard, et sa journée ne fait que commencer.',
    setup() {
      lotSet(false); if (!(tcar.mode === 'path' && tcar.inLoop)) carLoop(.12); tcar.driver = true; tomHide();
      cue(.5, () => fGo(leaver, [[21.25, 11.5], [21.7, 10.8], [22.3, 10.4]], 1.3, () =>
        fGo(leaver, [[21.2, 10.35], [20.1, 10.7], [19.6, 12], [19.6, 14.2], [19.1, 15.1], [17.6, 15.05], [13.5, 15]], 2.8, () => { leaver.obj.visible = false; }, { fromHere: true }),
        { rev: true, fromHere: true }));
      tcar.onU = { u: U_WEST, when: () => beatT > 4.8, fn: () => {
        bub('😮‍💨', atCar, { dur: 2 });
        carGo(PARK_A, 2.2, () => {
          tcar.driver = false; tomAppear(20.5, 11.9, 180);
          later(.3, () => { bub('LATE!', atTom(), { cls: 'say', dur: 3 }); tomWalk([[20.5, 10.4], [21, 8.1]], 2.6, () => { tom.scaleT = 0; }); });
        }, { fromHere: true, keepSpeed: true });
      } };
    } },
  { id: 'p1-lunch', part: 'p1', clock: '12:30', tod: 'noon', smart: false, view: LUNCH, place: 'Lunch break',
    cap: '12:30. Lunch break. But look at the bins: they are overflowing. The truck only comes on Thursdays, full or not.',
    fr: '12 h 30. Pause déjeuner. Mais regardez les poubelles : elles débordent. Le camion ne passe que le jeudi, pleines ou pas.',
    setup() { tomPlace(-4.48, 8.2, 90, 'eat', .25); tom.prop = 'food'; binsMode = 'full'; cue(2, () => bub('🤢', atTom())); } },
  { id: 'p1-cough', part: 'p1', clock: '12:40', tod: 'noon', smart: false, view: V([-4.3, .95, 8.2], 78, 13, 5), place: 'Lunch break',
    cap: 'And the air is heavy: all these cars waiting with their engines on. Tom coughs.',
    fr: 'Et l’air est lourd : toutes ces voitures qui attendent moteur allumé. Tom tousse.',
    setup() { tomPlace(-4.48, 8.2, 90, 'cough', .25); binsMode = 'full'; cue(.4, () => bub('😷', atTom())); },
    run(t, dt, st) { const k = Math.floor(t / 2.2); if (k !== st.k) { st.k = k; bub('cough!', atTom(.25), { cls: 'say', dur: 1, dx: 58 }); Sound.cough(); } } },
  { id: 'p1-townhall', part: 'p1', clock: '17:30', tod: 'sunset', smart: false, lost: 62, view: V([-5.6, 1.5, -8], 66, 17, 13), place: 'The town hall',
    cap: '5:30 pm. Tom needs a document from the town hall. Closed! It’s open from 9 to 5… exactly when he is at work.',
    fr: '17 h 30. Tom a besoin d’un papier à la mairie. Fermé ! Elle est ouverte de 9 h à 17 h… pile quand il travaille.',
    setup() {
      tomPlace(-2.6, -4.6, -150);
      cue(.3, () => tomWalk([[-3.6, -6.6], [-4.6, -7.9], [-6.35, -8]], 1.3, () => {
        tomDo('idle', -90);
        later(.5, () => bub('CLOSED', HALL_SIGN_AT, { cls: 'sign bad' }));
        later(1.4, () => { tomDo('facepalm', 90); bub('😤', atTom()); });
      }));
    } },
  { id: 'p1-night', part: 'p1', clock: '22:30', tod: 'night', smart: false, view: V(null, -100, 15, 12), follow: tomPos, place: 'Tom’s street, at night',
    cap: '10:30 pm. Tom walks home after dinner at a friend’s. The big avenue is lit all night… for nobody.',
    fr: '22 h 30. Tom rentre à pied après un dîner chez un ami. La grande avenue est éclairée toute la nuit… pour personne.',
    setup() { carPark(-26, 21, 180); tcar.driver = false; house.open = false; tomPlace(-12, 18.95, -90); cue(.3, () => tomWalk([[-21.4, 18.95]], 1.25)); } },
  { id: 'p1-lamp', part: 'p1', clock: '22:35', tod: 'night', smart: false, view: V(null, -150, 22, 9.5), follow: tomPos, place: 'Tom’s street, at night',
    cap: 'But the lamp in his street has been broken for a month. Nobody has reported it.',
    fr: 'Mais le lampadaire de sa rue est cassé depuis un mois. Personne ne l’a signalé.',
    setup() {
      carPark(-26, 21, 180); tcar.driver = false; house.open = false; ensureTom(-21.4, 18.95, -90);
      cue(.2, () => { bub('😨', atTom(), { dur: 4 }); tomWalk([[-25.6, 18.95], [-27.6, 18.95], [HX, 19.05]], 1.05, () => { tom.scaleT = 0; houseLight(1); }, 'scared'); });
    } },
  { id: 'p1-bed', part: 'p1', clock: '23:00', tod: 'night', smart: false, view: BEDV, place: 'Tom’s bedroom',
    cap: '11 pm. Tom goes to bed, tired and stressed. Today, he lost more than an hour.',
    fr: '23 h. Tom va se coucher, fatigué et stressé. Aujourd’hui, il a perdu plus d’une heure.',
    setup() {
      house.open = true; houseLight(1); carPark(-26, 21, 180); tomPlace(HX - .45, HZ + .05, 0);
      cue(.9, flop); cue(1.2, () => bub('😩', atTom(), { dur: 2.4 })); cue(3.3, () => { houseLight(0); sleep(); });
    } },

  /* ---------------- the switch */
  { id: 'rewind', part: 'rw', clock: '23:00', tod: 'night', smart: false, view: V([-12, 0, 10], 35, 36, 72), drift: .05, place: '',
    cap: 'Now, let’s rewind. Same town, same Tom, same day…',
    fr: 'Maintenant, on rembobine. Même ville, même Tom, même journée…',
    setup() { bedScene(); body.classList.add('rewinding'); $('#rew').hidden = false; Sound.rewind(); cue(.3, sleep); },
    run(t) {
      const m = lerp(23 * 60, 6 * 60 + 45, ease(clamp(t / 3.6, 0, 1))), hh = Math.floor(m / 60);
      setClock(`${String(hh).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`);
      setTod(hh >= 21 ? 'night' : hh >= 17 ? 'sunset' : hh >= 14 ? 'afternoon' : hh >= 11 ? 'noon' : hh >= 8 ? 'morning' : 'dawn');
      if (t > 3.8) { body.classList.remove('rewinding'); $('#rew').hidden = true; }
    } },
  { id: 'wave', part: 'p2', clock: '06:45', tod: 'dawn', smart: 'wave', view: OVER, drift: .03, place: 'Our town',
    cap: '…but this time, the town is smart. Look: it wakes up, street by street.',
    fr: '…mais cette fois, la ville est intelligente. Regardez : elle se réveille, rue après rue.',
    setup() { bedScene(); cue(.6, () => setSmart(true, true)); } },

  /* ---------------- Part 2: a smart day */
  { id: 'p2-asleep', part: 'p2', clock: '06:45', tod: 'dawn', smart: true, view: BEDV, place: 'Tom’s bedroom',
    cap: '6:45. Tom is still asleep. But the house knows when he wakes up: the heating started a few minutes ago.',
    fr: '6 h 45. Tom dort encore. Mais la maison sait quand il se réveille : le chauffage s’est allumé il y a quelques minutes.',
    setup() { bedScene(); cue(.5, sleep); cue(1.5, () => bub('20 °C', THERMO, { cls: 'sign good' })); } },
  { id: 'p2-alarm', part: 'p2', clock: '06:45', tod: 'dawn', smart: true, view: BEDV, place: 'Tom’s bedroom',
    cap: 'His alarm rings. It’s warm, and his phone already knows the traffic: 18 minutes to work.',
    fr: 'Son réveil sonne. Il fait bon, et son téléphone connaît déjà la circulation : 18 minutes jusqu’au travail.',
    setup() {
      bedScene(); cue(.2, ring); cue(1.5, () => tomDo('situp')); cue(2.2, () => houseLight(1));
      cue(2.5, () => { tomDo('stretch'); bub('😊', atTom(), { dur: 2.2 }); });
      cue(4.5, () => { tomDo('situp'); tom.prop = 'phone'; note('🚦', 'Traffic · now', 'Roads are clear. Leave at 7:30, 18 min to work.', atTom(.6)); Sound.ping(); });
    } },
  { id: 'p2-lights', part: 'p2', clock: '07:30', tod: 'morning', smart: true, view: V(null, -95, 32, 15, [3, 0, 0]), follow: tomOrCar, place: 'Main road',
    cap: '7:30. Same car, same road. But now the lights have sensors: they see Tom coming and turn green.',
    fr: '7 h 30. Même voiture, même route. Mais maintenant les feux ont des capteurs : ils voient Tom arriver et passent au vert.',
    setup() { leaveHome(); tcar.green = true; tcar.stopAt = 18.4; tcar.onStop = turnIn; },
    run(t, dt, st) { if (!st.cool && tcar.mode === 'sim' && tcar.x > -14) { st.cool = 1; bub('😎', atCar, { dur: 3 }); } } },
  { id: 'p2-pittsburgh', part: 'p2', clock: '07:40', tod: 'morning', smart: true, lost: 12, view: V([0, .5, 16], 38, 30, 21), place: 'Smart crossroads',
    cap: 'In Pittsburgh, in the USA, lights like these cut the waiting at red lights by 40%. For Tom, it’s 12 minutes instead of 20.',
    fr: 'À Pittsburgh, aux États-Unis, ce genre de feux a réduit de 40 % l’attente aux feux rouges. Pour Tom, ça fait 12 minutes au lieu de 20.',
    src: 'Surtrac, Carnegie Mellon University: figures reported by the team for the first pilot.',
    setup() {
      tomHide(); tcar.driver = true; tcar.green = true;
      if (tcar.mode === 'sim') { tcar.stopAt = 18.4; tcar.onStop = turnIn; } else if (tcar.mode === 'park' && !atEntrance()) carPark(19.6, 14.2, 180);
    } },
  { id: 'p2-parking', part: 'p2', clock: '08:00', tod: 'morning', smart: true, view: V(null, 22, 42, 16), follow: tomOrCar, place: 'The office car park',
    cap: '8:00. Every parking space has a sensor. The app shows Tom a free space, and he drives straight to it. He’s on time!',
    fr: '8 h. Chaque place de parking a un capteur. L’appli montre une place libre à Tom, et il y va directement. Il est à l’heure !',
    setup() {
      lotSet(true); if (!atEntrance()) carPark(19.6, 14.2, 180); tcar.driver = true; tomHide();
      cue(.3, () => { note('🅿️', 'Parking', 'Free space: row A, spot 2. Straight ahead.', atCar); Sound.ping(); });
      cue(1.6, () => carGo(PARK_B, 2.4, () => {
        tcar.driver = false; tomAppear(23.3, 11.9, 180);
        later(.3, () => { bub('🎵', atTom(), { dur: 2.5 }); tomWalk([[23.3, 10.4], [21.5, 9], [21, 8.1]], 1.3, () => { tom.scaleT = 0; }); });
      }, { fromHere: true }));
    } },
  { id: 'p2-lunch', part: 'p2', clock: '12:30', tod: 'noon', smart: true, view: LUNCH, place: 'Lunch break',
    cap: '12:30. The bins tell the truck when they are full, so it came this morning. And with fewer cars waiting, the air is cleaner.',
    fr: '12 h 30. Les poubelles préviennent le camion quand elles sont pleines : il est passé ce matin. Et avec moins de voitures à l’arrêt, l’air est plus propre.',
    setup() {
      tomPlace(-4.48, 8.2, 90, 'eat', .25); tom.prop = 'food'; binsMode = 'empty';
      cue(1.2, () => { note('🌿', 'Air quality', 'Good today. Enjoy your lunch outside!', atTom(.9), { dx: 60 }); Sound.ping(); });
      cue(4.4, () => bub('😋', atTom(), { dur: 2.5, dx: -70 }));
    } },
  { id: 'p2-townhall', part: 'p2', clock: '17:30', tod: 'sunset', smart: true, lost: 14, view: V([-2.4, 1.5, -10.2], 80, 12, 9.5), place: 'The town hall',
    cap: '5:30 pm. His document? He asked for it online, in two minutes. And on this screen, everyone can see the town’s data, live.',
    fr: '17 h 30. Son papier ? Il l’a demandé en ligne, en deux minutes. Et sur cet écran, tout le monde peut voir les données de la ville, en direct.',
    setup() {
      tomPlace(-1.9, -4.6, 180);
      cue(.3, () => tomWalk([[-1.9, -9.6]], 1.2, () => tomDo('idle', -90)));
      cue(1.6, () => { tom.prop = 'phone'; note('🏛️', 'Town hall', 'Your certificate is ready ✓ Asked online in 2 min.', atTom(.6)); Sound.ping(); });
      cue(5.4, () => { tom.prop = null; tomDo('thumb'); });
    } },
  { id: 'p2-night', part: 'p2', clock: '22:30', tod: 'night', smart: true, view: V(null, -100, 15, 12), follow: tomPos, place: 'Tom’s street, at night',
    cap: '10:30 pm. In empty streets, the lights are dimmed… and they light up when Tom walks by.',
    fr: '22 h 30. Dans les rues vides, les lampadaires sont baissés… et ils s’allument quand Tom passe.',
    setup() { carPark(-26, 21, 180); tcar.driver = false; house.open = false; tomPlace(-12, 18.95, -90); cue(.3, () => tomWalk([[-19.8, 18.95]], 1.25)); } },
  { id: 'p2-sensor', part: 'p2', clock: '22:35', tod: 'night', smart: true, view: V([-20.8, 1.7, 18.7], -165, 9, 7.2), place: 'Under the smart lamp',
    cap: 'But is the town watching him? No. This lamp has a sensor: it counts people, it doesn’t film them.',
    fr: 'Mais est-ce que la ville le surveille ? Non. Ce lampadaire a un capteur : il compte les gens, il ne les filme pas.',
    setup() {
      carPark(-26, 21, 180); house.open = false; ensureTom(-19.8, 18.95, -90);
      cue(.2, () => tomWalk([[-20.6, 18.95]], 1.1, () => { tomDo('lookup', -140); bub('❓', atTom(), { dur: 2 }); }));
      cue(1.6, () => bub(JSON_HTML, SENSOR_AT, { cls: 'json' })); cue(4.8, () => tomDo('thumb'));
    } },
  { id: 'p2-gdpr', part: 'p2', clock: '22:36', tod: 'night', smart: true, view: V([-20.8, 1.9, 18.7], -160, 12, 8.4), place: 'Under the smart lamp',
    cap: 'And the data is protected: encrypted, kept in Europe, deleted after 30 days. That’s the law in Europe: the GDPR.',
    fr: 'Et les données sont protégées : chiffrées, gardées en Europe, effacées au bout de 30 jours. C’est la loi en Europe : le RGPD.',
    setup() {
      carPark(-26, 21, 180); house.open = false; ensureTom(-20.6, 18.95, -140, 'thumb');
      cue(.4, () => bub('🔒 Encrypted', SENSOR_AT, { cls: 'sign good', dy: -88 }));
      cue(1.2, () => bub('🇪🇺 Kept in Europe', SENSOR_AT, { cls: 'sign good', dy: -44 }));
      cue(2, () => bub('🗓️ Deleted after 30 days', SENSOR_AT, { cls: 'sign good' }));
    } },
  { id: 'p2-lamp', part: 'p2', clock: '22:38', tod: 'night', smart: true, view: V(null, -150, 20, 10), follow: tomPos, place: 'Tom’s street, at night',
    cap: 'And the broken lamp? It reported itself, and it was repaired the next day. In Dijon, the goal is to use 65% less energy for street lights.',
    fr: 'Et le lampadaire cassé ? Il a signalé sa panne tout seul, et il a été réparé le lendemain. À Dijon, l’objectif est de consommer 65 % d’énergie en moins pour l’éclairage.',
    src: 'Dijon Métropole, OnDijon contract (2017). The 65% is a target, not a measured result.',
    setup() {
      carPark(-26, 21, 180); house.open = false; ensureTom(-20.6, 18.95, -90);
      cue(.3, () => tomWalk([[-25.6, 18.95], [-27.6, 18.95], [HX, 19.05]], 1.2, () => { tom.scaleT = 0; houseLight(1); }));
      cue(1.8, () => bub('🔧 Reported itself · repaired', BROKEN_AT, { cls: 'sign good' }));
    } },
  { id: 'p2-bed', part: 'p2', clock: '23:00', tod: 'night', smart: true, view: BEDV, place: 'Tom’s bedroom',
    cap: '11 pm. Tom goes to bed, relaxed. Today, he lost only 14 minutes.',
    fr: '23 h. Tom va se coucher, détendu. Aujourd’hui, il n’a perdu que 14 minutes.',
    setup() {
      house.open = true; houseLight(1); carPark(-26, 21, 180); tomPlace(HX - .45, HZ + .05, 0);
      cue(.9, flop); cue(1.2, () => bub('😌', atTom(), { dur: 2.4 })); cue(3.3, () => { houseLight(0); sleep(); });
    } },

  /* ---------------- Part 3: where the energy comes from, where the waste goes */
  { id: 'p3-line', part: 'p3', clock: '10:00', tod: 'morning', smart: true, city: true, view: V([33, 3, -30], 118, 22, 36), place: 'The edge of town',
    cap: 'One last thing. Our town needs energy, and it makes waste. Where does it all come from, and where does it go? Let’s follow this power line.',
    fr: 'Une dernière chose. Notre ville a besoin d’énergie, et elle produit des déchets. D’où vient l’une, où vont les autres ? Suivons cette ligne électrique.',
    setup() { carPark(-26, 21, 180); tomHide(); } },
  { id: 'p3-park', part: 'p3', clock: '10:00', tod: 'morning', smart: true, view: V(E3(0, 0, 2), 30, 40, 92), camK: .9, drift: .03, place: 'The energy park',
    cap: 'Just outside town: a wind farm, a solar park, and the recycling centre. Everything is connected, and everything has sensors.',
    fr: 'Juste à côté de la ville : un parc éolien, un parc solaire et la déchèterie. Tout est relié, et tout a des capteurs.',
    setup() { carPark(-26, 21, 180); tomHide(); } },
  { id: 'p3-wind', part: 'p3', clock: '10:05', tod: 'morning', smart: true, view: V(E3(0, 9.5, -21), 22, 12, 48), place: 'The wind farm',
    cap: 'This is the wind farm. On every turbine, sensors measure the wind every second: how strong it is, and where it comes from.',
    fr: 'Voici le parc éolien. Sur chaque éolienne, des capteurs mesurent le vent à chaque seconde : sa force, et d’où il vient.',
    setup() {
      carPark(-26, 21, 180); tomHide();
      cue(.5, () => TURBINES.forEach((t, i) => later(i * .2, () => { t.pulse = 1; })));
      cue(1.6, () => bub(WIND_JSON, TURBINES[2].at, { cls: 'json' }));
    } },
  { id: 'p3-windturn', part: 'p3', clock: '10:10', tod: 'morning', smart: true, view: V(E3(0, 9.5, -21), 36, 13, 47), place: 'The wind farm',
    cap: 'The wind turns? The turbines turn with it, by themselves, to face it and catch as much wind as possible.',
    fr: 'Le vent tourne ? Les éoliennes tournent avec lui, toutes seules, pour lui faire face et capter le plus de vent possible.',
    setup() {
      carPark(-26, 21, 180); tomHide();
      cue(1.2, () => { EN.windA = Math.PI; EN.windT = 1; TURBINES.forEach((t, i) => { t.wait = .3 + i * .45; }); bub('💨 The wind turns', ev(-16, 15, -16), { cls: 'sign', dur: 3 }); Sound.whoosh(false); });
      cue(5.6, () => bub('✓ Facing the wind', TURBINES[2].at, { cls: 'sign good', dur: 4 }));
    } },
  { id: 'p3-maint', part: 'p3', clock: '10:30', tod: 'morning', smart: true, view: V(E3(2, 7, -13), 40, 18, 34), place: 'Turbine 3',
    cap: 'And when a part starts to wear out, the sensors warn the technicians before it breaks. No surprise breakdown, no wind wasted.',
    fr: 'Et quand une pièce commence à s’user, les capteurs préviennent les techniciens avant la panne. Pas de panne surprise, pas de vent perdu.',
    setup() {
      carPark(-26, 21, 180); tomHide(); windNow(Math.PI);
      cue(.6, () => { EN.maint = true; Sound.alarm(); });
      cue(1.3, () => { note('🔧', 'Turbine 3', 'A bearing is starting to wear. Repair planned on Tuesday, before it breaks.', TURBINES[2].at); Sound.ping(); });
      cue(3, () => fGo(vanF, toWorld([[6, -1.6], [6, -12.4], [4.8, -13.5], [1.8, -13.6], [1.1, -16]]), 3.4, () => bub('👷', () => _cp.set(vanF.x, 1.9, vanF.z), { dur: 3 })));
    } },
  { id: 'p3-gate', part: 'p3', clock: '11:00', tod: 'morning', smart: true, view: V(null, 32, 26, 15), follow: carPos, place: 'The recycling centre',
    cap: '11:00. Tom brings his old boxes to the recycling centre, right next door. His resident card opens the gate: no queue, no paperwork.',
    fr: '11 h. Tom apporte ses vieux cartons à la déchèterie, juste à côté. Sa carte d’habitant ouvre la barrière : pas de file, pas de papiers.',
    setup() {
      tomHide(); windNow(Math.PI); carPark(EX - 9, EZ + 3.85, 90); tcar.driver = true;
      cue(.3, () => carGo(toWorld([[.4, 3.85], [2.5, 4.6], [3, 5.6]]), 4.6, () => {
        later(.3, () => { note('♻️', 'Recycling centre', 'Hello Tom! Resident card OK ✓', GATE_AT); Sound.ping(); EN.gateT = 1; });
        later(1.9, () => carGo(toWorld([[3, 8.6], [3, 11.2], [3.9, 12.7], [6.5, 12.7], [9.6, 12.7], [14.2, 12.7]]), 3.6, () => bub('📦', atCar, { dur: 2.2 }), { fromHere: true }));
      }, { fromHere: true }));
    } },
  { id: 'p3-skip', part: 'p3', clock: '11:05', tod: 'morning', smart: true, view: V(E3(15, 1.5, 16), 14, 24, 11.5), place: 'The recycling centre',
    cap: 'Every skip has a sensor that measures how full it is. Tom’s box goes into the cardboard skip… and now it’s full.',
    fr: 'Chaque benne a un capteur qui mesure son remplissage. Le carton de Tom va dans la benne à cartons… et maintenant, elle est pleine.',
    setup() {
      windNow(Math.PI); atQuay(); tomAppear(EX + 14.5, EZ + 13.75, 180); tom.prop = 'box';
      cue(.3, () => bub('📡 Cardboard: 93% full', SKIPS[0].at, { cls: 'sign', dur: 3 }));
      cue(.8, () => tomWalk([[EX + 15, EZ + 14.95]], 1.1, () => tomDo('idle', 0)));
      cue(2.7, () => tomDo('throw'));
      cue(2.95, () => { tom.prop = null; throwBox(ev(15, QUAY_Y + .85, 15.2), ev(15, .95, 17.6), () => {
        SKIPS[0].fill = 1; Sound.thud(); later(.5, () => bub('📡 100%: the skip calls the truck', SKIPS[0].at, { cls: 'sign good' }));
      }); });
      cue(3.9, () => tomDo('thumb'));
    } },
  { id: 'p3-truck', part: 'p3', clock: '11:20', tod: 'morning', smart: true, view: V(E3(18, 1, 19), 26, 30, 21), place: 'The recycling centre',
    cap: 'The skip calls the truck by itself. The truck only comes when a skip is full: fewer trips, less fuel, less pollution.',
    fr: 'La benne appelle le camion toute seule. Le camion ne vient que quand une benne est pleine : moins de trajets, moins de carburant, moins de pollution.',
    setup() {
      windNow(Math.PI); atQuay(); SKIPS[0].fill = 1; ensureTom(EX + 15, EZ + 14.95, 0);
      cue(.3, () => bub('🚚 Truck on its way', SKIPS[0].at, { cls: 'sign', dur: 3.5 }));
      cue(.5, truckRun);
      cue(8.5, () => tomDo('thumb'));
    } },
  { id: 'p3-biogas', part: 'p3', clock: '11:30', tod: 'morning', smart: true, view: V(E3(21, 1.5, -4.5), 26, 22, 20), place: 'The methanizer',
    cap: 'And the green waste? It goes into these domes. It makes gas, the gas makes electricity, and what is left becomes compost for the parks.',
    fr: 'Et les déchets verts ? Ils vont dans ces dômes. Ça produit du gaz, le gaz produit de l’électricité, et le reste devient du compost pour les parcs.',
    setup() {
      windNow(Math.PI); atQuay(); tomHide(); EN.bio = 1;
      cue(.8, () => bub('🌿 Green waste', COMPOST_AT, { cls: 'sign good' }));
      cue(2.6, () => bub('🔥 Gas', GAS_AT, { cls: 'sign good' }));
      cue(4.4, () => bub('⚡ Electricity', GEN_AT, { cls: 'sign good' }));
      cue(6.2, () => bub('🌱 Compost for the parks', ev(14.6, 1.6, -8.4), { cls: 'sign good' }));
    } },
  { id: 'p3-solar', part: 'p3', clock: '08:00', tod: 'morning', smart: true, view: V(E3(-15, 1, 18), -30, 32, 30), place: 'The solar park',
    cap: 'Now, let’s speed up the day. In the solar park, the panels follow the sun from morning to evening, to catch as much light as possible.',
    fr: 'Maintenant, on accélère la journée. Dans le parc solaire, les panneaux suivent le soleil du matin au soir, pour capter le plus de lumière possible.',
    setup() { windNow(Math.PI); atQuay(); tomHide(); cue(3, () => bub('☀️ Following the sun', ev(-15, 3.4, 18), { cls: 'sign good', dur: 5 })); },
    run(t, dt, st) {
      const k = clamp((t - .8) / 9, 0, 1), m = Math.round((480 + k * 660) / 10) * 10;
      if (m !== st.m) { st.m = m; const c = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; setClock(c); capMeta.textContent = `${c} · The solar park`; }
      setTod(k < .22 ? 'morning' : k < .5 ? 'noon' : k < .8 ? 'afternoon' : 'sunset');
    } },
  { id: 'p3-grid', part: 'p3', clock: '19:00', tod: 'sunset', smart: true, view: V(E3(-6.5, 1.8, -4.4), 24, 20, 19), place: 'The smart grid',
    cap: 'All this energy arrives here. The smart grid decides, every second: send it to the town now, or store it in the batteries for tonight.',
    fr: 'Toute cette énergie arrive ici. Le réseau intelligent décide, à chaque seconde : l’envoyer à la ville maintenant, ou la stocker dans les batteries pour ce soir.',
    setup() {
      windNow(Math.PI); atQuay(); tomHide(); EN.bat = .4;
      cue(1.2, () => bub('⚡ To the town', ev(-20, 8.2, -4.4), { cls: 'sign good', dur: 4.5 }));
      cue(2.6, () => bub('🔋 Storing for tonight', ev(-9, 2.4, -2.2), { cls: 'sign good' }));
    } },
  { id: 'p3-night', part: 'p3', clock: '22:00', tod: 'night', smart: true, view: V(E3(-10, 2.5, -4), 58, 20, 27), place: 'The smart grid, at night',
    cap: 'At night, there is no sun. So the batteries give their energy back to the town. Nothing is wasted.',
    fr: 'La nuit, il n’y a plus de soleil. Alors les batteries rendent leur énergie à la ville. Rien n’est gaspillé.',
    setup() { windNow(Math.PI); atQuay(); tomHide(); EN.town = .95; EN.bat = .95; cue(1.4, () => bub('🔋 → 🏙️ Power for the town', ev(-9, 2.4, -2.2), { cls: 'sign good' })); } },
  { id: 'p3-recap', part: 'p3', clock: '22:00', tod: 'night', smart: true, view: V(E3(-4, 0, 0), -38, 38, 90), drift: .03, place: 'The energy park',
    cap: 'Wind, sun, and even our waste: the town makes its own clean energy, and uses it smartly. That’s a smart city too.',
    fr: 'Le vent, le soleil, et même nos déchets : la ville produit sa propre énergie propre, et l’utilise intelligemment. Ça aussi, c’est une smart city.',
    setup() { windNow(Math.PI); atQuay(); tomHide(); EN.town = .95; EN.bat = .7; } },

  /* ---------------- conclusion */
  { id: 'board', part: 'end', clock: '23:00', tod: 'night', smart: true, over: 'board', view: OVER, drift: .03, place: 'Tom’s day',
    cap: 'So, how do we convince people? We don’t talk to them about sensors or data. We show them their own day.',
    fr: 'Alors, comment convaincre les gens ? On ne leur parle pas de capteurs ni de données. On leur montre leur propre journée.',
    setup() { bedScene(); } },
  { id: 'final', part: 'end', clock: '23:00', tod: 'sunset', smart: true, over: 'final', view: V([0, -2, 0], -32, 30, 96), drift: .025, place: '',
    cap: 'Thank you for listening. Do you have any questions?',
    fr: 'Merci de nous avoir écoutés. Avez-vous des questions ?',
    setup() { bedScene(); } },
];
{ let cur = 0, part = ''; for (const b of B) { if (b.part !== part) { part = b.part; cur = 0; } if (b.lost != null) cur = b.lost; b.lostV = cur; } }

/* ------------------------------------------------------------------ smart mode */

function setSmart(v, animate) {
  if (v === smart && !animate) return;
  smart = v; WAVE.uC.value.set(0, 0);
  if (!animate) waveR = v ? WMAX : 0; else if (v) { waveR = 0; Sound.whoosh(true); }
  body.classList.toggle('is-smart', v);
}

/* ------------------------------------------------------------------ HUD */
const capLine = $('#s-line'), capFr = $('#s-fr'), capSrc = $('#s-src'), capMeta = $('#s-meta');
let fr = !!store.get('city-fr'), auto = false, beatI = -1, st = {};
let lostShown = 0;
const fmtLost = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`;
function setClock(txt) {
  $('#clk').textContent = txt; drawAlarm(txt);
  const [hh, mm] = txt.split(':').map(Number); drawClock(hh, mm);
}
function wordsHTML(s) { return s.split(' ').map((w, i) => `<span style="--i:${i}">${w}</span>`).join(' '); }
const prog = $('#prog');
B.forEach((b, i) => { const d = document.createElement('i'); d.dataset.part = b.part; d.title = `${i + 1}`; prog.appendChild(d); });
function syncHUD(b) {
  const [a, c] = PARTS[b.part];
  $('#chip-a').textContent = a; $('#chip-b').textContent = c; $('#chip').dataset.part = b.part;
  capMeta.textContent = b.place ? `${b.clock} · ${b.place}` : '';
  capLine.innerHTML = wordsHTML(b.cap); capFr.textContent = b.fr; capFr.hidden = !fr || !b.fr; capSrc.textContent = b.src || ''; capSrc.hidden = !b.src;
  $('#subs').classList.toggle('empty', !b.cap);
  $('#subs').classList.remove('in'); void $('#subs').offsetWidth; $('#subs').classList.add('in');
  [...prog.children].forEach((d, i) => { d.classList.toggle('on', i === beatI); d.classList.toggle('done', i < beatI); });
  for (const id of ['title', 'board', 'final']) $('#' + id).hidden = b.over !== id;
  $('#day').hidden = !(b.part === 'p1' || b.part === 'p2' || b.part === 'p3'); $('#day').classList.toggle('nolost', b.part === 'p3');
  $('#b-fr').setAttribute('aria-pressed', String(fr));
}

/* ------------------------------------------------------------------ playing a beat */
function go(i) {
  i = clamp(i, 0, B.length - 1); const b = B[i]; beatI = i;
  clearBubs(); cues = []; beatT = 0; st = {};
  for (const I of INTERS) I.force = null;
  tom.path = null; tom.then = null; tom.prop = null; tom.glide = null; tom.walkAct = null;
  tcar.onU = null; tcar.stopAt = null; tcar.onStop = null; tcar.green = false;
  leaver.moving = false; binsMode = null; alarmShake = 0;
  energyReset();
  const onIsland = b.part === 'p3' && !b.city; SUN_C.set(onIsland ? EX : 0, 0, onIsland ? EZ : 0);
  body.classList.remove('rewinding'); $('#rew').hidden = true;
  if (b.smart === 'wave') setSmart(false); else setSmart(!!b.smart);
  lotSet(!!b.smart);
  setTod(b.tod); setClock(b.clock);
  if (b.part === 'p2' && B[i - 1] && B[i - 1].part !== 'p2') lostShown = 0;
  b.setup(st);
  setView(b.view);
  syncHUD(b);
  // tell the live layer (phones in the room) which moment is on the board
  try { dispatchEvent(new CustomEvent('city:beat', { detail: window.__cityBeat = { i, n: B.length, id: b.id, part: b.part, partName: PARTS[b.part], clock: b.clock, place: b.place, cap: b.cap, fr: b.fr, src: b.src || '',
    lost: b.part === 'p1' || b.part === 'p2' ? b.lostV : null, ids: B.map(x => x.id) } })); } catch (e) {}
  try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
}
const next = () => go(beatI + 1), prev = () => go(beatI - 1);
function beatDur(b) { return Math.max(6, b.cap.split(' ').length * .42 + 3); }
function stepStory(dt) {
  const b = B[beatI]; beatT += dt;
  for (const c of cues) if (!c.done && beatT >= c.t) { c.done = true; c.fn(); }
  if (b.run) b.run(beatT, dt, st);
  if (b.follow) goal.t.copy(b.follow()).add(followOff);
  if (b.drift && !dragging && performance.now() - lastInput > 2500) goal.az += b.drift * dt;
  lostShown = lerp(lostShown, b.lostV, damp(1.6, dt));
  if (Math.abs(lostShown - b.lostV) < .4) lostShown = b.lostV;
  $('#lost').textContent = fmtLost(lostShown);
  $('#day').classList.toggle('bad', b.part === 'p1' && lostShown > .5);
  if (binsMode) for (const bn of BINS) bn.fill = binsMode === 'full' ? 1 : .12;
  if (auto && beatT > beatDur(b) && beatI < B.length - 1) next();
}

/* ------------------------------------------------------------------ signs that change with the town */
function spotFree(i) {
  const x = LOT.spots[i], g = LOT.cars[i];
  if (g.visible && Math.hypot(g.position.x - x, g.position.z - LOT.z) < .8) return false;
  return Math.hypot(tcar.x - x, tcar.z - LOT.z) > .9;
}
function drawSigns() {
  const hs = wake(-6.8, -8) > .5 ? 's' : 'o';
  if (hallSign.key !== hs) {
    hallSign.key = hs; const { g, c } = hallSign, W2 = c.width, H2 = c.height;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (hs === 'o') {
      g.fillStyle = '#f3ede2'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#c8372d'; g.fillRect(0, 0, W2, 62);
      g.fillStyle = '#fff'; g.font = '700 42px "Bricolage Grotesque", sans-serif'; g.fillText('CLOSED', W2 / 2, 33);
      g.fillStyle = '#2a2018'; g.font = '600 27px "Bricolage Grotesque", sans-serif'; g.fillText('Open 9:00 – 17:00', W2 / 2, 98);
      g.fillStyle = '#7c7266'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText('Monday to Friday', W2 / 2, 136);
    } else {
      g.fillStyle = '#120c0a'; g.fillRect(0, 0, W2, H2);
      g.fillStyle = css('--accent') || '#f472b6'; g.font = '700 40px "Bricolage Grotesque", sans-serif'; g.fillText('OPEN 24/7', W2 / 2, 62);
      g.fillStyle = '#f1ece2'; g.font = '23px "Bricolage Grotesque", sans-serif'; g.fillText('online · town hall app', W2 / 2, 114);
    }
    hallSign.tex.needsUpdate = true;
  }
  const free = LOT.spots.filter((_, i) => spotFree(i)).length, sm = wake(18.75, 14.8) > .5;
  const ls = (sm ? 's' : 'o') + free;
  if (lotSign.key !== ls) {
    lotSign.key = ls; const { g, c } = lotSign, W2 = c.width, H2 = c.height;
    g.fillStyle = '#1d3f8f'; g.fillRect(0, 0, W2, H2); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(5, 5, W2 - 10, H2 - 10);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = '700 96px "Bricolage Grotesque", sans-serif'; g.fillText('P', 62, 84);
    const ok = sm && free > 0;
    g.fillStyle = ok ? '#3ddc84' : '#ff4a3a'; g.fillRect(118, 34, 122, 54);
    g.fillStyle = '#0f0d0c'; g.font = '700 32px "Bricolage Grotesque", sans-serif'; g.fillText(ok ? `${free} FREE` : 'FULL', 179, 62);
    g.fillStyle = '#fff'; g.font = '22px "Bricolage Grotesque", sans-serif'; g.fillText(ok ? '→ row A, spot 2' : sm ? 'see the app' : '', 179, 118);
    lotSign.tex.needsUpdate = true;
  }
}
function tickMetrics() {
  const waiting = CARS.filter(c => c.v < .4).length;
  idleEMA = lerp(idleEMA, waiting, .12);
  metrics = { wait: waiting, light: lastLight, bins: BINS.filter(b => b.fill >= 1).length, air: Math.round(10 + idleEMA * 1.8 + (1 - smartK) * 22) };
  drawHall(); drawBus(); drawSigns();
}

/* ------------------------------------------------------------------ camera */
const cam = { t: new T.Vector3(0, -2, 0), az: 42 * D2R, el: 38 * D2R, d: 108 };
const goal = { t: new T.Vector3(0, -2, 0), az: cam.az, el: cam.el, d: cam.d };
const followOff = new T.Vector3();
let lastInput = -1e9, dragging = false, W = 1, H = 1, curView = OVER;
const narrowF = () => { const a = W / H; return a < 1 ? Math.pow(1.05 / a, .85) : 1; };
function setView(v, instant) {
  curView = v;
  if (v.t) goal.t.set(...v.t);
  followOff.set(...(v.off || [0, 0, 0]));
  goal.el = v.el * D2R; goal.d = v.d * narrowF(); goal.az = cam.az + wrapPi(v.az * D2R - cam.az);
  if (instant || reduced) {
    if (B[beatI] && B[beatI].follow) goal.t.copy(B[beatI].follow()).add(followOff);
    cam.t.copy(goal.t); cam.az = goal.az; cam.el = goal.el; cam.d = goal.d;
  }
}
function updateCamera(dt) {
  const k = dragging ? 14 : (B[beatI] && B[beatI].camK) || 2.2;
  cam.t.lerp(goal.t, damp(k, dt)); cam.az = lerp(cam.az, goal.az, damp(k, dt)); cam.el = lerp(cam.el, goal.el, damp(k, dt)); cam.d = lerp(cam.d, goal.d, damp(k, dt));
  const ce = Math.cos(cam.el);
  camera.position.set(cam.t.x + cam.d * ce * Math.sin(cam.az), cam.t.y + cam.d * Math.sin(cam.el), cam.t.z + cam.d * ce * Math.cos(cam.az));
  camera.lookAt(cam.t);
  camera.setViewOffset(W, H, 0, Math.min(110, H * .1), W, H);   // keep the action above the subtitles
}
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  setView(curView);
}
addEventListener('resize', resize);

/* ------------------------------------------------------------------ input */
const pointers = new Map(); let downAt = null, pinchD = 0;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  downAt = { x: e.clientX, y: e.clientY, b: e.button }; dragging = true; canvas.classList.add('drag'); lastInput = performance.now();
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const prv = pointers.get(e.pointerId), dx = e.clientX - prv.x, dy = e.clientY - prv.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastInput = performance.now();
  if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinchD) goal.d = clamp(goal.d * pinchD / d, 3, 170); pinchD = d; return; }
  goal.az -= dx * .0055; goal.el = clamp(goal.el + dy * .004, .05, 1.45);
});
const endPtr = e => {
  pointers.delete(e.pointerId); if (pointers.size) return;
  dragging = false; canvas.classList.remove('drag'); pinchD = 0;
  if (downAt && e.type === 'pointerup' && downAt.b === 0 && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6) next();
  downAt = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.d = clamp(goal.d * Math.exp(e.deltaY * .0012), 3, 170); lastInput = performance.now(); }, { passive: false });

function toggleFr() { fr = !fr; store.set('city-fr', fr); syncHUD(B[beatI]); }
function syncSound() { $('#b-sound').setAttribute('aria-pressed', String(!!Sound.on)); }
function toggleSound() { Sound.toggle(); store.set('city-sound', !!Sound.on); syncSound(); }
function toggleAuto() { auto = !auto; $('#b-auto').setAttribute('aria-pressed', String(auto)); if (auto) beatT = Math.min(beatT, 1); }
const btn = (id, fn) => $(id).addEventListener('click', e => { fn(); e.currentTarget.blur(); });
btn('#b-fr', toggleFr); btn('#b-sound', toggleSound); btn('#b-auto', toggleAuto); btn('#b-prev', prev); btn('#b-next', next);
btn('#b-full', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.().catch(() => {}); });
btn('#start', next); btn('#b-home', () => go(0));
{ // sound starts with the first key or click (browsers only allow audio after a gesture)
  const first = () => { removeEventListener('keydown', first, true); removeEventListener('pointerdown', first, true); if (store.get('city-sound') !== false && !Sound.on) { Sound.toggle(); syncSound(); } };
  addEventListener('keydown', first, true); addEventListener('pointerdown', first, true);
}
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'ArrowDown') { e.preventDefault(); next(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { e.preventDefault(); prev(); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(B.length - 1);
  else if (k === 'r' || k === 'R') go(beatI);
  else if (k === 't' || k === 'T') toggleFr();
  else if (k === 'm' || k === 'M') toggleSound();
  else if (k === 'p' || k === 'P') toggleAuto();
  else if (k === 'f' || k === 'F') $('#b-full').click();
});

/* ------------------------------------------------------------------ loop */
const clock = new T.Clock(); let mt = 0, heartT = 0, exT = 0;
function tomExhaust(dt) {
  exT += dt;
  if (exT < .13) return; exT = 0;
  if (smart || tcar.mode !== 'sim' || tcar.v > .5) return;
  const e = EXHAUST.find(e => e.t > 1.8); if (!e) return;
  e.t = 0; e.s.visible = true; e.s.position.set(tcar.x - 1.05, .42, tcar.z + .25);
}
let simT = 0;
function tick(dt) {
  simT += dt; const time = simT;
  if (smart) waveR = reduced ? WMAX : Math.min(WMAX, waveR + dt * (9 + waveR * .12));
  else waveR = Math.max(0, waveR - dt * 30);
  WAVE.uR.value = waveR;
  WAVE.uEdgeOn.value = lerp(WAVE.uEdgeOn.value, smart && waveR < 110 ? 1 : 0, damp(4, dt));
  smartK = clamp(waveR / 70, 0, 1);
  const sk = ease(smartK);

  stepStory(dt);
  stepTod(dt);
  stepLights(dt); stepCars(dt); stepBus(dt); stepPeople(dt, time); stepBins(dt); stepSmog(dt, time);
  stepTomCar(dt); stepTom(dt, time); tomExhaust(dt); stepEnergy(dt, time);
  renderCars();
  lastLight = stepLamps(dt);

  scene.fog.color.copy(TS.fog).lerp(SMOG_TINT, (1 - sk) * (G > 1 ? .25 : .55));
  scene.fog.near = cam.d * lerp(.45, .95, sk); scene.fog.far = cam.d * lerp(1.7, 2.9, sk) + 20;
  paintSky();

  for (const I of INTERS) I.ringMat.opacity = wake(I.x, I.z) * (.25 + .15 * Math.sin(time * 3));
  for (const A of ARCS) {
    const w = wake(A.src.x, A.src.z);
    A.line.material.opacity = .16 * w;
    for (const p of A.packets) { p.t = (p.t + dt * A.speed) % 1; A.curve.getPoint(p.t, p.s.position); p.s.material.opacity = Math.min(1, .85 * w * wake(p.s.position.x, p.s.position.z)); }
  }
  const wDC = wake(DC.x, DC.z);
  shield.scale.setScalar(Math.max(.001, ease(clamp(wDC * 1.1, 0, 1))));
  shield.rotation.y += dt * .08; shieldWireMat.opacity = .22; shieldSkinMat.opacity = .05;
  ledMat.emissive.copy(SMOG_TINT).multiplyScalar(.4).lerp(accentCol, wDC).multiplyScalar(.5 + wDC * .8);
  mastLight.material.opacity = (Math.sin(time * 3) > .6 ? 1 : .15) * (G * .7 + .3);
  for (const f of fans) f.rotation.y += dt * 8;
  rotor.rotation.z += dt * (.7 + wake(-29.3, 29.3) * 1.6);
  for (const P of PANELS) P.scale.setScalar(Math.max(.001, ease(clamp(wake(P.position.x, P.position.z) * 1.5 - P.userData.delay, 0, 1))));
  const wS = wake(25, 26.5);
  wifi.forEach((m, k) => { m.material.opacity = wS * (.25 + .75 * Math.max(0, Math.sin(time * 3 - k * .9))); });
  const wSe = wake(2.7, 2.7);
  sensorRings.forEach((s, k) => { const t = (time * .7 + k * .5) % 1; s.scale.setScalar(.3 + t * 3); s.material.opacity = wSe * (1 - t) * .8; });
  sensorLed.material.opacity = .3 + wSe * .7 * (.6 + .4 * Math.sin(time * 6));
  sensorLed2.material.opacity = wake(SENSOR_LAMP.x, SENSOR_LAMP.z) * (.55 + .45 * Math.sin(time * 6));
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

  // Tom's places
  LOT.discs.forEach((s, i) => { s.material.color.copy(spotFree(i) ? goodCol : badCol); s.material.opacity = wake(LOT.spots[i], LOT.z) * (.75 + .25 * Math.sin(time * 4 + i)); });
  FLIES.forEach(f => {
    f.visible = binsMode === 'full';
    if (f.visible) { const u = f.userData, a = time * u.sp + u.ph; f.position.set(-3.3 + Math.cos(a) * u.r, 1.25 + Math.sin(a * 1.7) * .18, u.z + Math.sin(a) * u.r); }
  });
  alarmShake = Math.max(0, alarmShake - dt);
  alarm.rotation.z = alarmShake > 0 ? Math.sin(time * 70) * .2 : 0;
  alarm.position.y = .69 + (alarmShake > 0 ? Math.abs(Math.sin(time * 35)) * .02 : 0);
  house.front.visible = house.roof.visible = !house.open;
  house.k = lerp(house.k, house.target, damp(6, dt));
  tomFill.position.set(tom.vis ? tom.x : tcar.x, 2.6, (tom.vis ? tom.z : tcar.z) - .8); tomFill.intensity = clamp(G - .4, 0, 1) * (house.open ? .5 : 2.2);
  house.light.intensity = house.k * 1.7; glassM.emissiveIntensity = house.k * 1.2;

  updateCamera(dt); occlude();
  mt += dt; if (mt > .25) { mt = 0; tickMetrics(); drawGrid(); }
}
const occRay = new T.Raycaster(), _od = new T.Vector3(), _rx = new T.Vector3();
let occN = 0;
function occlude() {
  if (++occN % 3) return;
  _rx.setFromMatrixColumn(camera.matrixWorld, 0);
  const hits = new Set();
  for (const [ox, oy] of [[0, 0], [-1.6, 0], [1.6, 0], [0, 1.4], [0, -.6]]) {   // a small cone around the target
    _od.copy(cam.t).addScaledVector(_rx, ox).addScaledVector(camera.up, oy).sub(camera.position);
    const dist = _od.length(); _od.normalize();
    occRay.set(camera.position, _od); occRay.far = Math.max(.1, dist - .3);
    for (const h of occRay.intersectObjects(OCC, false)) hits.add(h.object);
  }
  for (const m of OCC) m.visible = !hits.has(m);
}
function frame() {
  const dt = Math.min(.05, clock.getDelta());
  tick(dt); renderer.render(scene, camera); stepBubs(dt);
  requestAnimationFrame(frame);
}
// for rehearsing and testing: __city.go(n) jumps to a moment, __city.advance(s) plays s seconds at once
window.__city = { go: n => { go(n); setView(B[beatI].view, true); }, advance(s) { for (let i = 0; i < s * 30; i++) { tick(1 / 30); stepBubs(1 / 30); occN = 2; } renderer.render(scene, camera); }, get beat() { return beatI; } };

applyPalette(); resize(); stepTod(1, true);
renderCars();
for (let i = 0; i < 240; i++) { stepLights(1 / 30); stepCars(1 / 30); stepBus(1 / 30); stepBins(1 / 60); }
{
  const h = parseInt(location.hash.slice(1), 10);
  go(h >= 1 && h <= B.length ? h - 1 : 0);
  setView(B[beatI].view, true); stepTod(1, true);
}
syncSound(); tickMetrics();
requestAnimationFrame(frame);
})();
