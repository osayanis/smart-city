/* The phone page: follows the board live, explains each moment, lets people react and vote. No name, no account. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const POLLS = window.POLLS || [], EXTRA = window.EXTRA || {};
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  // a random id, only to count one vote per phone; it says nothing about you
  let pid = store.get('ph-id');
  if (!pid) { pid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-zA-Z0-9-]/g, ''); store.set('ph-id', pid); }
  let lang = store.get('ph-lang-choice') || 'en';   // the talk is in English: French only if someone asks for it
  let state = null, results = {}, myVotes = store.get('ph-votes') || {}, es = null;
  const token = new URLSearchParams(location.search).get('s') || '';   // which session this QR code opened

  const T = {
    en: { welcomeEyebrow: 'English oral · Smart cities', welcomeTitle: 'You’re in.', welcomeLead: 'Keep this page open: it follows the presentation, moment by moment.',
      how1: 'What’s on the board, explained: how it works, and what it changes for you.', how2: 'Tap an emoji: it flies across the board.',
      how3: 'Answer the polls and quizzes. Results appear live.', privacy: 'No name, no account, no tracking. Your votes stay in the presenter’s computer memory and disappear after the talk.',
      tech: 'Behind the scene', you: 'For you', lostLabel: 'Tom’s lost time today', poll: 'Poll', quiz: 'Quiz', votes: n => `${n} ${n === 1 ? 'vote' : 'votes'}`,
      change: 'Tap another answer to change your vote.', right: '✓ Right answer!', wrong: a => `✗ Not quite. The answer: ${a}`, live: 'Live', off: 'Reconnecting…',
      ended: 'Session over', endedLead: 'Thanks for following! The presentation has started again.', endedHow: 'To join again, scan the new QR code on the board.', calcTitle: 'And you?', calcQ: 'How many minutes do you lose every day (traffic, parking, queues)?',
      calcY: h => `That’s <b>${h}</b> hours a year.`, calcS: (b, d) => `In our story, the smart town cut Tom’s lost time by 77%. For you, that would give back about ${b} hours a year: ${d}.`,
      days: d => `${d} full ${d === 1 ? 'day' : 'days'}`, thanks: 'Thank you for following along!', waiting: 'Waiting for the board…' },
    fr: { welcomeEyebrow: 'Oral d’anglais · Smart cities', welcomeTitle: 'C’est parti.', welcomeLead: 'Gardez cette page ouverte : elle suit la présentation, moment par moment.',
      how1: 'Ce qui est au tableau, expliqué : comment ça marche, et ce que ça change pour vous.', how2: 'Touchez un emoji : il s’envole sur le tableau.',
      how3: 'Répondez aux sondages et aux quiz. Les résultats s’affichent en direct.', privacy: 'Pas de nom, pas de compte, pas de pistage. Vos votes restent dans la mémoire de l’ordinateur du présentateur et disparaissent après l’oral.',
      tech: 'Dans les coulisses', you: 'Pour vous', lostLabel: 'Temps perdu par Tom', poll: 'Sondage', quiz: 'Quiz', votes: n => `${n} vote${n > 1 ? 's' : ''}`,
      change: 'Touchez une autre réponse pour changer votre vote.', right: '✓ Bonne réponse !', wrong: a => `✗ Pas tout à fait. La réponse : ${a}`, live: 'En direct', off: 'Reconnexion…',
      ended: 'Session terminée', endedLead: 'Merci d’avoir suivi ! La présentation a recommencé.', endedHow: 'Pour revenir, scannez le nouveau QR code au tableau.', calcTitle: 'Et vous ?', calcQ: 'Combien de minutes perdez-vous chaque jour (bouchons, parking, files d’attente) ?',
      calcY: h => `Ça fait <b>${h}</b> heures par an.`, calcS: (b, d) => `Dans notre histoire, la ville intelligente a réduit de 77 % le temps perdu par Tom. Pour vous, ça ferait environ ${b} heures de gagnées par an : ${d}.`,
      days: d => `${d} jour${d > 1 ? 's' : ''} entier${d > 1 ? 's' : ''}`, thanks: 'Merci d’avoir suivi !', waiting: 'En attente du tableau…' },
  };
  const t = k => T[lang][k];

  /* haptics: short and rare. Android vibrates; on iPhone, Safari has no vibration API, so only taps get the
     little "click" of a switch (iOS 18+). Automatic ones wait 2 s between each other, and need one touch first (browser rule). */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = (() => { const l = document.createElement('label'), i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', '');
    l.appendChild(i); l.setAttribute('aria-hidden', 'true'); l.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;left:-10px;top:0';
    document.body.appendChild(l); return () => { try { l.click(); } catch (e) {} }; })();
  let lastAuto = 0, touched = false;
  addEventListener('pointerdown', () => { touched = true; }, { once: true, capture: true });
  function buzz(pattern, fromTap = false) {
    if (document.hidden) return;
    if (!fromTap) { const now = Date.now(); if (reduced || !touched || now - lastAuto < 2000) return; lastAuto = now; }
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
    else if (fromTap) tick();
  }
  const HAPTIC = { tap: 8, vote: 14, poll: [18, 70, 18], right: [12, 50, 12, 50, 24], wrong: 40, ended: [30, 80, 30] };
  // a few moments of the story you can feel in your hand
  const MOMENT_BUZZ = { 'p1-alarm': [20, 90, 20, 90, 20], 'p2-alarm': [20, 90, 20], 'p1-wait': [35], rewind: [10, 40, 10, 40, 10, 40, 10], wave: [60], 'p3-skip': [25], final: [15, 60, 15] };

  /* language */
  function setLang(l) {
    lang = l; document.documentElement.lang = l;
    $('#l-en').setAttribute('aria-pressed', String(l === 'en')); $('#l-fr').setAttribute('aria-pressed', String(l === 'fr'));
    for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
    $('#status-t').textContent = t(!$('#ended').hidden ? 'ended' : $('#status').classList.contains('off') ? 'off' : 'live');
    render(false);
  }
  $('#l-en').onclick = () => { store.set('ph-lang-choice', 'en'); setLang('en'); }; $('#l-fr').onclick = () => { store.set('ph-lang-choice', 'fr'); setLang('fr'); };

  /* the moment on the board */
  const idx = id => state && state.ids ? state.ids.indexOf(id) : -1;
  function currentPoll() {
    if (!state) return null; let best = null;
    for (const p of POLLS) { const s = idx(p.beat); if (s >= 0 && state.i >= s && state.i < s + (p.span || 1)) best = p; }
    return best;
  }
  const fmtLost = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`;
  let shownId = null, shownPoll = null;
  function render(animate = true) {
    if (!$('#ended').hidden) return;
    const s = state, title = !s || s.id === 'title';
    $('#welcome').hidden = !title; $('#now').hidden = title;
    if (title) $('#tech').hidden = $('#you').hidden = true;
    document.body.dataset.part = s ? s.part : 'intro';
    $('#prog-i').style.width = s && s.n ? ((s.i + 1) / s.n * 100).toFixed(1) + '%' : '0';
    if (!title) {
      const x = EXTRA[s.id] || {};
      $('#chip').textContent = s.partName ? s.partName.filter(Boolean).join(' · ') : '';
      $('#clock').textContent = s.part === 'p1' || s.part === 'p2' || s.part === 'p3' ? s.clock : '';
      $('#icon').textContent = x.icon || '•';
      $('#place').textContent = s.place || s.partName?.[1] || '';
      $('#cap').textContent = s.cap; $('#capfr').textContent = s.fr; $('#capfr').hidden = lang !== 'fr' || !s.fr;
      $('#src').textContent = s.src ? (lang === 'fr' ? 'Source : ' : 'Source: ') + s.src : ''; $('#src').hidden = !s.src;
      $('#lost').hidden = s.lost == null; if (s.lost != null) $('#lost-v').textContent = fmtLost(s.lost);
      $('#tech').hidden = !x.tech; if (x.tech) $('#tech-t').textContent = x.tech[lang];
      $('#you').hidden = !x.you; if (x.you) $('#you-t').textContent = x.you[lang];
      if (animate && shownId !== s.id && MOMENT_BUZZ[s.id]) buzz(MOMENT_BUZZ[s.id]);
      if (animate && shownId !== s.id) { const n = $('#now'); n.classList.remove('in'); void n.offsetWidth; n.classList.add('in'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
    shownId = s ? s.id : null;
    $('#calc').hidden = !s || s.id !== 'board';
    $('#thanks').hidden = !s || s.id !== 'final';
    renderPoll();
    updateCalc();
  }

  /* polls and quizzes */
  function renderPoll() {
    const p = currentPoll(), box = $('#poll');
    box.hidden = !p; if (!p) { shownPoll = null; return; }
    if (shownPoll !== p.id) { shownPoll = p.id; lastAuto = 0; buzz(HAPTIC.poll); }
    const c = results[p.id] || p.options.map(() => 0), total = c.reduce((a, b) => a + b, 0), mine = myVotes[p.id];
    const voted = mine != null, quiz = p.answer != null;
    box.innerHTML = `<p class="pk">${quiz ? t('quiz') : t('poll')}</p><h2>${p.q[lang]}</h2><div class="opts">` +
      p.options.map((o, k) => {
        const pct = total ? Math.round(c[k] / total * 100) : 0;
        const cls = ['opt', voted && k === mine ? 'mine' : '', voted && quiz && k === p.answer ? 'right' : '', voted && quiz && k === mine && k !== p.answer ? 'wrong' : ''].join(' ');
        return `<button class="${cls}" data-k="${k}"><i class="fill" style="width:${voted ? pct : 0}%"></i><span>${o[lang]}</span>${voted ? `<b>${pct}%</b>` : ''}</button>`;
      }).join('') + '</div>' +
      (voted && quiz ? `<p class="feedback ${mine === p.answer ? 'ok' : 'no'}">${mine === p.answer ? t('right') : t('wrong')(p.options[p.answer][lang])}</p>` : '') +
      `<p class="tot">${t('votes')(total)}${voted && !quiz ? ' · ' + t('change') : ''}</p>`;
    for (const b of box.querySelectorAll('.opt')) b.onclick = () => vote(p, +b.dataset.k);
  }
  function vote(p, k) {
    if (p.answer != null && myVotes[p.id] != null) return;   // a quiz is answered once
    myVotes[p.id] = k; store.set('ph-votes', myVotes);
    results[p.id] = results[p.id] || p.options.map(() => 0);
    renderPoll(); wake();
    buzz(p.answer == null ? HAPTIC.vote : k === p.answer ? HAPTIC.right : HAPTIC.wrong, true);
    fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid, s: token, poll: p.id, choice: k }) }).catch(() => {});
  }

  /* your time */
  const calcIn = $('#calc-m');
  function updateCalc() {
    const m = +calcIn.value, h = Math.round(m * 365 / 60), back = Math.round(h * (1 - 14 / 62)), d = Math.floor(back / 24);
    $('#calc-mv').textContent = m + ' min';
    $('#calc-y').innerHTML = t('calcY')(h);
    $('#calc-s').textContent = t('calcS')(back, t('days')(d));
  }
  calcIn.addEventListener('input', updateCalc);

  /* reactions */
  let lastReact = 0;
  for (const b of document.querySelectorAll('.reacts button')) b.addEventListener('click', () => {
    const now = Date.now(); if (now - lastReact < 400) return; lastReact = now;
    b.classList.remove('sent'); void b.offsetWidth; b.classList.add('sent');
    const r = b.getBoundingClientRect(), f = document.createElement('span'); f.className = 'fly'; f.textContent = b.dataset.e;
    f.style.left = (r.left + r.width / 2 - 17) + 'px'; f.style.top = (r.top - 10) + 'px'; document.body.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
    buzz(HAPTIC.tap, true);
    wake();
    fetch('/api/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid, s: token, emoji: b.dataset.e }) }).catch(() => {});
  });

  /* keep the screen on while following (where the browser allows it) */
  let lock = null;
  async function wake() { try { if (!lock && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && lock === null && navigator.wakeLock) wake(); });

  /* live connection */
  const status = $('#status');
  // let go by the board (it started again) or opened from an old QR code
  function ended() {
    const wasLive = !!(state || es);
    if (es) es.close(); es = null; state = null;
    myVotes = {}; store.set('ph-votes', myVotes);
    for (const id of ['welcome', 'now', 'tech', 'you', 'poll', 'calc', 'thanks', 'reacts']) $('#' + id).hidden = true;
    if (wasLive) { lastAuto = 0; buzz(HAPTIC.ended); }
    $('#ended').hidden = false; $('#prog-i').style.width = '0';
    status.classList.add('off'); $('#status-t').textContent = t('ended');
    if (lock) { lock.release().catch(() => {}); lock = null; }
  }
  function connect() {
    if (!token) return ended();
    es = new EventSource('/api/events?role=phone&s=' + encodeURIComponent(token));
    es.addEventListener('ended', ended);
    es.onopen = () => { status.classList.remove('off'); $('#status-t').textContent = t('live'); };
    es.onerror = () => { if (!es) return; status.classList.add('off'); $('#status-t').textContent = t('off'); };
    es.addEventListener('state', e => { state = JSON.parse(e.data); render(true); });
    es.addEventListener('results', e => { results = JSON.parse(e.data); renderPoll(); });
    // a new session (the board went back to the start, or the server restarted): forget the old answers
    const newSession = sid => { if (store.get('ph-session') !== sid) { store.set('ph-session', sid); myVotes = {}; store.set('ph-votes', myVotes); results = {}; renderPoll(); } };
    es.addEventListener('hello', e => newSession(JSON.parse(e.data).session));
    es.addEventListener('reset', e => newSession(JSON.parse(e.data).session));
  }
  setLang(lang);
  connect();
})();
