/* The live layer of the board: when the page is served by server.js, the audience can follow on their phones.
   It sends each moment to the server, shows the QR code, the number of phones, their reactions and the poll results.
   Opened as a file (file://), it does nothing and the presentation works as before. */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol) || !window.EventSource) return;
  const $ = s => document.querySelector(s);
  const POLLS = window.POLLS || [];
  let phoneUrl = '', beat = window.__cityBeat || null, results = {}, lang = 'en';
  try { lang = JSON.parse(localStorage.getItem('city-fr')) ? 'fr' : 'en'; } catch (e) {}

  /* the moment on the board -> server */
  let sending = null;
  function pushState() {
    if (!beat) return;
    clearTimeout(sending);
    sending = setTimeout(() => fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(beat) }).catch(() => {}), 60);
  }
  // back to the title = a new audience: the polls start again from zero
  const resetPolls = () => fetch('/api/reset', { method: 'POST' }).catch(() => {});
  addEventListener('city:beat', e => { const was = beat && beat.id; beat = e.detail; pushState(); syncPoll(); syncJoin(); if (beat.id === 'title' && was !== 'title') resetPolls(); });

  /* QR codes */
  function setQr() {
    if (!phoneUrl || !window.QR) return;
    const svg = QR.svg(phoneUrl, { dark: '#1c120d', light: '#fffaf2', quiet: 2, label: 'QR code: open the phone page' });
    for (const el of document.querySelectorAll('[data-qr]')) el.innerHTML = svg;
    for (const el of document.querySelectorAll('[data-url]')) el.textContent = phoneUrl.replace(/^https?:\/\//, '');
  }
  const join = $('#join'), big = $('#qrbig'), liveBtn = $('#b-live'), liveN = $('#live-n');
  function syncJoin() { if (join) join.hidden = !phoneUrl || !beat || beat.id !== 'title'; }
  function toggleBig(v) { big.hidden = v == null ? !big.hidden : !v; liveBtn.setAttribute('aria-pressed', String(!big.hidden)); }
  liveBtn.addEventListener('click', e => { toggleBig(); e.currentTarget.blur(); });
  big.addEventListener('click', () => toggleBig(false));
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'q' || e.key === 'Q') toggleBig();
    else if (e.key === 'Escape' && !big.hidden) toggleBig(false);
    else if (e.key === 'v' || e.key === 'V') { pollHidden = !pollHidden; syncPoll(); }
  });

  /* reactions float up on the right of the board */
  const layer = $('#reacts'); let live = 0;
  function react(emoji) {
    if (live > 36 || document.hidden) return;
    const el = document.createElement('span'); el.className = 'react'; el.textContent = emoji;
    el.style.setProperty('--x', (Math.random() * 120 - 60).toFixed(0) + 'px');
    el.style.setProperty('--r', (Math.random() * 40 - 20).toFixed(0) + 'deg');
    el.style.setProperty('--d', (2.6 + Math.random() * 1.2).toFixed(2) + 's');
    layer.appendChild(el); live++;
    el.addEventListener('animationend', () => { el.remove(); live--; });
  }

  /* the poll of the moment, with live results */
  const box = $('#pollb'); let pollHidden = false;
  const idx = id => beat && beat.ids ? beat.ids.indexOf(id) : -1;
  function currentPoll() {
    if (!beat) return null;
    let best = null;
    for (const p of POLLS) { const s = idx(p.beat); if (s >= 0 && beat.i >= s && beat.i < s + (p.span || 1)) best = p; }
    return best;
  }
  function syncPoll() {
    const p = currentPoll();
    box.hidden = !p || pollHidden;
    if (!p) return;
    const c = results[p.id] || p.options.map(() => 0), total = c.reduce((a, b) => a + b, 0);
    const reveal = p.answer != null && beat.i > idx(p.beat);
    const key = p.id + lang + c.join() + reveal;
    if (box.dataset.key === key) return; box.dataset.key = key;
    const max = Math.max(1, ...c);
    box.innerHTML = `<p class="pk">${p.answer != null ? 'Quiz' : 'Poll'} · <span data-url></span></p><h4>${p.q[lang]}</h4><ul>` +
      p.options.map((o, k) => `<li class="${reveal && k === p.answer ? 'is-answer' : ''}${c[k] === max && total && !reveal ? ' is-lead' : ''}"><span class="lb">${o[lang]}</span>` +
        `<span class="bar"><i style="width:${total ? (c[k] / total * 100).toFixed(1) : 0}%"></i></span><b>${total ? Math.round(c[k] / total * 100) : 0}%</b></li>`).join('') +
      `</ul><p class="tot">${total} ${total === 1 ? 'vote' : 'votes'}${reveal ? ' · ✓ ' + (lang === 'fr' ? 'bonne réponse' : 'right answer') : ''}</p>`;
    setQr();
  }
  // follow the board's language (T)
  new MutationObserver(() => { const l = $('#b-fr').getAttribute('aria-pressed') === 'true' ? 'fr' : 'en'; if (l !== lang) { lang = l; syncPoll(); } })
    .observe($('#b-fr'), { attributes: true, attributeFilter: ['aria-pressed'] });

  /* connection */
  const es = new EventSource('/api/events?role=board');
  let firstHello = true;
  es.addEventListener('hello', e => { phoneUrl = JSON.parse(e.data).phoneUrl; liveBtn.hidden = false; setQr(); syncJoin(); pushState(); if (firstHello && beat && beat.id === 'title') resetPolls(); firstHello = false; });
  es.addEventListener('reset', e => { phoneUrl = JSON.parse(e.data).phoneUrl; setQr(); results = {}; box.dataset.key = ''; syncPoll(); });
  es.addEventListener('count', e => { const n = JSON.parse(e.data).phones; liveN.textContent = n; for (const el of document.querySelectorAll('[data-count]')) el.textContent = n; });
  es.addEventListener('results', e => { results = JSON.parse(e.data); syncPoll(); });
  es.addEventListener('react', e => react(JSON.parse(e.data).emoji));
  es.onerror = () => { liveBtn.classList.add('off'); };
  es.onopen = () => { liveBtn.classList.remove('off'); };
})();
