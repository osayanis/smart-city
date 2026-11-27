/* A small QR code encoder (byte mode, error correction M, versions 1 to 10), so the project needs nothing from the internet.
   QR.matrix(text) -> array of rows of booleans (true = dark). QR.svg(text, opts) -> an SVG string. Works in the browser and in Node. */
(function (root) {
  'use strict';
  // [total codewords, ec codewords per block, blocks in group 1, data codewords per block in group 1, blocks in group 2, data per block in group 2]
  const M_TABLE = [null,
    [26, 10, 1, 16, 0, 0], [44, 16, 1, 28, 0, 0], [70, 26, 1, 44, 0, 0], [100, 18, 2, 32, 0, 0], [134, 24, 2, 43, 0, 0],
    [172, 16, 4, 27, 0, 0], [196, 18, 4, 31, 0, 0], [242, 22, 2, 38, 2, 39], [292, 22, 3, 36, 2, 37], [346, 26, 4, 43, 1, 44]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  // Galois field GF(256), polynomial 0x11d
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
  function rsGenerator(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { next[j] ^= g[j]; next[j + 1] ^= mul(g[j], EXP[i]); }
      g = next;
    }
    return g;
  }
  function rsRemainder(data, n) {
    const g = rsGenerator(n), r = data.concat(new Array(n).fill(0));
    for (let i = 0; i < data.length; i++) {
      const f = r[i]; if (!f) continue;
      for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], f);
    }
    return r.slice(data.length);
  }

  function utf8(text) { return Array.from(typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(text) : Buffer.from(text, 'utf8')); }

  function codewords(bytes) {
    let v = 1;
    for (; v <= 10; v++) {
      const t = M_TABLE[v], cap = t[2] * t[3] + t[4] * t[5], countBits = v < 10 ? 8 : 16;
      if (4 + countBits + bytes.length * 8 <= cap * 8) break;
    }
    if (v > 10) throw new Error('QR: text too long');
    const t = M_TABLE[v], dataCap = t[2] * t[3] + t[4] * t[5], countBits = v < 10 ? 8 : 16;
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, countBits); for (const b of bytes) put(b, 8);
    for (let i = 0; i < 4 && bits.length < dataCap * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
    for (let p = 0; data.length < dataCap; p++) data.push(p % 2 ? 0x11 : 0xec);
    // split into blocks, add error correction, interleave
    const blocks = []; let k = 0;
    for (let g = 0; g < 2; g++) for (let b = 0; b < t[2 + g * 2]; b++) { const n = t[3 + g * 2]; blocks.push(data.slice(k, k + n)); k += n; }
    const ecs = blocks.map(b => rsRemainder(b, t[1]));
    const out = [], maxLen = Math.max(...blocks.map(b => b.length));
    for (let i = 0; i < maxLen; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
    for (let i = 0; i < t[1]; i++) for (const e of ecs) out.push(e[i]);
    return { v, out };
  }

  function bch(value, poly, bitsOfPoly) {
    let v = value << (bitsOfPoly - 1);
    const top = (p) => 31 - Math.clz32(p);
    while (v && top(v) >= bitsOfPoly - 1) v ^= poly << (top(v) - (bitsOfPoly - 1));
    return (value << (bitsOfPoly - 1)) | v;
  }

  const MASKS = [
    (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0, (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0];

  function build(v, cw, mask) {
    const n = v * 4 + 17, m = Array.from({ length: n }, () => new Array(n).fill(null));
    const fn = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (r, c, d) => { m[r][c] = d; fn[r][c] = true; };
    // finder patterns and separators
    for (const [R, C] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const rr = R + r, cc = C + c; if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        set(rr, cc, inside && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)));
      }
    }
    // timing patterns
    for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    // alignment patterns
    const A = ALIGN[v];
    A.forEach((r, i) => A.forEach((c, j) => {
      const L = A.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === L) || (i === L && j === 0)) return;   // the finder corners
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }));
    // dark module and reserved format / version areas
    set(n - 8, 8, true);
    for (let i = 0; i < 9; i++) { if (!fn[8][i]) set(8, i, false); if (!fn[i][8]) set(i, 8, false); }
    for (let i = 0; i < 8; i++) { if (!fn[8][n - 1 - i]) set(8, n - 1 - i, false); if (!fn[n - 1 - i][8]) set(n - 1 - i, 8, false); }
    if (v >= 7) {
      const vi = bch(v, 0x1f25, 13);
      for (let i = 0; i < 18; i++) { const d = ((vi >> i) & 1) === 1, a = Math.floor(i / 3), b = n - 11 + i % 3; set(a, b, d); set(b, a, d); }
    }
    // data, in the zigzag order
    const bits = []; for (const b of cw) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    let bi = 0, up = true;
    for (let col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let k = 0; k < n; k++) {
        const r = up ? n - 1 - k : k;
        for (const c of [col, col - 1]) {
          if (fn[r][c]) continue;
          let d = bi < bits.length ? bits[bi] === 1 : false; bi++;
          if (MASKS[mask](r, c)) d = !d;
          m[r][c] = d;
        }
      }
      up = !up;
    }
    // format information: level M (00) + mask
    const f = bch((0 << 3) | mask, 0x537, 11) ^ 0x5412;
    const fb = i => ((f >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) m[8][i] = fb(14 - i);
    m[8][7] = fb(8); m[8][8] = fb(7); m[7][8] = fb(6);
    for (let i = 9; i < 15; i++) m[14 - i][8] = fb(14 - i);
    for (let i = 0; i < 8; i++) m[n - 1 - i][8] = fb(14 - i);
    for (let i = 7; i < 15; i++) m[8][n - 15 + i] = fb(14 - i);
    m[n - 8][8] = true;
    return m;
  }

  function penalty(m) {
    const n = m.length; let p = 0;
    const lines = (get) => {
      for (let i = 0; i < n; i++) {
        let run = 1;
        for (let j = 1; j <= n; j++) {
          if (j < n && get(i, j) === get(i, j - 1)) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        for (let j = 0; j + 10 < n + 1; j++) {
          const s = []; for (let k = 0; k < 11 && j + k < n; k++) s.push(get(i, j + k) ? 1 : 0);
          const str = s.join('');
          if (str === '10111010000' || str === '00001011101') p += 40;
        }
      }
    };
    lines((i, j) => m[i][j]); lines((i, j) => m[j][i]);
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) { const d = m[r][c]; if (d === m[r][c + 1] && d === m[r + 1][c] && d === m[r + 1][c + 1]) p += 3; }
    let dark = 0; for (const row of m) for (const d of row) if (d) dark++;
    p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return p;
  }

  function matrix(text) {
    const { v, out } = codewords(utf8(text));
    let best = null, bestP = Infinity;
    for (let k = 0; k < 8; k++) { const m = build(v, out, k), p = penalty(m); if (p < bestP) { bestP = p; best = m; } }
    return best;
  }

  function svg(text, o = {}) {
    const m = matrix(text), n = m.length, q = o.quiet ?? 4, s = n + q * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"${o.label ? ` role="img" aria-label="${o.label}"` : ''}>` +
      `<rect width="${s}" height="${s}" fill="${o.light || '#fff'}"/><path d="${d}" fill="${o.dark || '#000'}"/></svg>`;
  }

  function terminal(text) {   // two rows per line with half blocks, for the server's console
    const m = matrix(text), n = m.length, q = 2, at = (r, c) => r >= 0 && c >= 0 && r < n && c < n && m[r][c];
    const lines = [];
    for (let r = -q; r < n + q; r += 2) {
      let l = '';
      for (let c = -q; c < n + q; c++) { const a = at(r, c), b = at(r + 1, c); l += a && b ? ' ' : a ? '▄' : b ? '▀' : '█'; }
      lines.push(l);
    }
    return lines.join('\n');
  }

  const QR = { matrix, svg, terminal };
  if (typeof module !== 'undefined' && module.exports) module.exports = QR; else root.QR = QR;
})(typeof window !== 'undefined' ? window : globalThis);
