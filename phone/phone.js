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
  let state = null, results = {}, myVotes = store.get('ph-votes') || {};

  const T = {
    en: { welcomeEyebrow: 'English oral · Smart cities', welcomeTitle: 'You’re in.', welcomeLead: 'Keep this page open: it follows the presentation, moment by moment.',
      how1: 'What’s on the board, explained: how it works, and what it changes for you.', how2: 'Tap an emoji: it flies across the board.',
      how3: 'Answer the polls and quizzes. Results appear live.', privacy: 'No name, no account, no tracking. Your votes stay in the presenter’s computer memory and disappear after the talk.',
      tech: 'Behind the scene', you: 'For you', lostLabel: 'Tom’s lost time today', poll: 'Poll', quiz: 'Quiz', votes: n => `${n} ${n === 1 ? 'vote' : 'votes'}`,
      change: 'Tap another answer to change your vote.', right: '✓ Right answer!', wrong: a => `✗ Not quite. The answer: ${a}`, live: 'Live', off: 'Reconnecting…',
      calcTitle: 'And you?', calcQ: 'How many minutes do you lose every day (traffic, parking, queues)?',
      calcY: h => `That’s <b>${h}</b> hours a year.`, calcS: (b, d) => `In our story, the smart town cut Tom’s lost time by 77%. For you, that would give back about ${b} hours a year: ${d}.`,
      days: d => `${d} full ${d === 1 ? 'day' : 'days'}`, thanks: 'Thank you for following along!', waiting: 'Waiting for the board…' },
    fr: { welcomeEyebrow: 'Oral d’anglais · Smart cities', welcomeTitle: 'C’est parti.', welcomeLead: 'Gardez cette page ouverte : elle suit la présentation, moment par moment.',
      how1: 'Ce qui est au tableau, expliqué : comment ça marche, et ce que ça change pour vous.', how2: 'Touchez un emoji : il s’envole sur le tableau.',
      how3: 'Répondez aux sondages et aux quiz. Les résultats s’affichent en direct.', privacy: 'Pas de nom, pas de compte, pas de pistage. Vos votes restent dans la mémoire de l’ordinateur du présentateur et disparaissent après l’oral.',
      tech: 'Dans les coulisses', you: 'Pour vous', lostLabel: 'Temps perdu par Tom', poll: 'Sondage', quiz: 'Quiz', votes: n => `${n} vote${n > 1 ? 's' : ''}`,
      change: 'Touchez une autre réponse pour changer votre vote.', right: '✓ Bonne réponse !', wrong: a => `✗ Pas tout à fait. La réponse : ${a}`, live: 'En direct', off: 'Reconnexion…',
      calcTitle: 'Et vous ?', calcQ: 'Combien de minutes perdez-vous chaque jour (bouchons, parking, files d’attente) ?',
      calcY: h => `Ça fait <b>${h}</b> heures par an.`, calcS: (b, d) => `Dans notre histoire, la ville intelligente a réduit de 77 % le temps perdu par Tom. Pour vous, ça ferait environ ${b} heures de gagnées par an : ${d}.`,
      days: d => `${d} jour${d > 1 ? 's' : ''} entier${d > 1 ? 's' : ''}`, thanks: 'Merci d’avoir suivi !', waiting: 'En attente du tableau…' },
  };
  const t = k => T[lang][k];

  /* language */
  function setLang(l) {
    lang = l; document.documentElement.lang = l;
    $('#l-en').setAttribute('aria-pressed', String(l === 'en')); $('#l-fr').setAttribute('aria-pressed', String(l === 'fr'));
    for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
    $('#status-t').textContent = t($('#status').classList.contains('off') ? 'off' : 'live');
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
    if (shownPoll !== p.id) { shownPoll = p.id; if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {} }
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
    fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid, poll: p.id, choice: k }) }).catch(() => {});
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
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
    wake();
    fetch('/api/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid, emoji: b.dataset.e }) }).catch(() => {});
  });

  /* keep the screen on while following (where the browser allows it) */
  let lock = null;
  async function wake() { try { if (!lock && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && lock === null && navigator.wakeLock) wake(); });

  /* live connection */
  const status = $('#status');
  function connect() {
    const es = new EventSource('/api/events?role=phone');
    es.onopen = () => { status.classList.remove('off'); $('#status-t').textContent = t('live'); };
    es.onerror = () => { status.classList.add('off'); $('#status-t').textContent = t('off'); };
    es.addEventListener('state', e => { state = JSON.parse(e.data); render(true); });
    es.addEventListener('results', e => { results = JSON.parse(e.data); renderPoll(); });
  }
  setLang(lang);
  connect();
})();
