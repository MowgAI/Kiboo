"use strict";
/* =====================================================================
   ÉVALUATION : un score « duplicate », comme au bridge en tournoi.
   Quand Sud est humain (déclarant, avec le mort), la même donne est
   rejouée en coulisses avec Piperno, Averell puis Averell250 en
   déclarant, contre les mêmes défenseurs. Le joueur est comparé à eux :
   2 points par robot battu, 1 par égalité, 0 sinon, ramené en pourcentage.

   - Les parties fantômes démarrent dès le début de la donne, dans un
     Worker à part (makeSolver), pour être prêtes en fin de donne sans
     ralentir la partie.
   - Le hasard d'Averell (et de PiperRand en défense) est fixé par une
     graine tirée de la donne : sur une même donne, les robots jouent
     toujours pareil, même après « Rejouer la donne ».
   - Historique et niveaux gardés dans ce navigateur. Une donne n'est pas
     comptée si le joueur a eu de l'aide (meilleurs coups, jeux ouverts,
     carte révélée) ou s'il la rejoue.
   ===================================================================== */
const Evaluation = (() => {
  const KEY = "kiboo.eval.v1";
  const DECLARERS = [
    { type: "deterministe", key: "piperno" },
    { type: "pimc", key: "averell" },
    { type: "pimc250", key: "averell250" },
  ];
  // Niveaux : faire au moins aussi bien que le robot sur 7 des 10 dernières donnes comptées.
  const WINDOW = 10, NEEDED = 7;
  const LEVELS = [
    { name: "Débutant" },
    { name: "Niveau Piperno", key: "piperno", who: "Piperno" },
    { name: "Niveau Averell", key: "averell", who: "Averell" },
    { name: "Niveau Averell250", key: "averell250", who: "Averell250" },
    { name: "Expert", key: "par", who: "le jeu parfait" },
  ];

  const solver = makeSolver();
  let job = null;               // évaluation de la donne en cours
  let history = [];             // [{ t, me, piperno, averell, averell250, par, pct }]
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) history = saved;
  } catch (e) { /* stockage indisponible : historique en mémoire seulement */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(history.slice(-200))); } catch (e) { /* idem */ } };

  // Générateur pseudo-aléatoire à graine (mulberry32) et graine tirée de la donne.
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dealSeed(hands) {
    let h = 2166136261;
    for (const s of SEATS) for (const c of sortAsc(hands[s])) { h ^= cardId(c) + 1; h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const eligible = () => config.eval && game && game.types.S === "humain" && game.types.O !== "humain" && game.types.E !== "humain";

  // Rejoue la donne avec `declarer` en Sud et en Nord, sans affichage. Renvoie les plis Nord-Sud.
  async function simulate(j, declarer) {
    const env = { solver, seed: j.seed, rand: seeded(j.seed ^ 0x9E3779B9) };
    const controllers = {
      O: PLAYER_TYPES[j.types.O].make("O", env),
      E: PLAYER_TYPES[j.types.E].make("E", env),
      S: PLAYER_TYPES[declarer].make("S", env),
    };
    controllers.N = controllers.S;
    const g = {
      hands: {}, trick: [], played: [], history: [], leader: OPENING_LEADER, turn: OPENING_LEADER,
      tricksWon: { NS: 0, EO: 0 }, dummyShown: false, controllers,
    };
    for (const s of SEATS) g.hands[s] = j.hands[s].slice();
    while (g.played.length < 40) {
      const seat = g.turn;
      let card = await controllers[seat].choose(viewFor(seat, g));
      if (j.cancelled) return null;                   // nouvelle donne : on abandonne
      const legal = legalCards(g.hands[seat], g.trick);
      if (!card || !legal.some(c => cardId(c) === cardId(card))) card = legal[0];
      card = g.hands[seat].find(c => cardId(c) === cardId(card));
      g.history.push({ seat, card, trickNo: g.tricksWon.NS + g.tricksWon.EO + 1 });
      g.hands[seat] = g.hands[seat].filter(c => c !== card);
      g.trick.push({ seat, card });
      g.played.push(card);
      g.dummyShown = true;
      if (g.trick.length < 4) { g.turn = nextSeat(seat); continue; }
      const w = trickWinner(g.trick);
      g.tricksWon[team(w)]++;
      g.trick = [];
      g.leader = g.turn = w;
    }
    return g.tricksWon.NS;
  }

  // Début de donne : on lance les parties fantômes en arrière-plan.
  async function start() {
    if (job) job.cancelled = true;
    solver.reset();
    job = null;
    if (!eligible()) return;
    const j = job = {
      hands: game.initial, types: { ...game.types }, seed: dealSeed(game.initial),
      results: {}, par: null, current: null, me: null, recorded: false, levelUp: null,
    };
    j.par = await solver.solve({ hands: SEATS.map(s => j.hands[s].slice()), trick: [], leader: SEATS.indexOf(OPENING_LEADER) });
    if (job !== j || j.par === null) return;
    for (const d of DECLARERS) {
      j.current = d.key;
      const ns = await simulate(j, d.type);
      if (job !== j || ns === null) return;
      j.results[d.key] = ns;
      if (game.over) render();
    }
    j.current = null;
    finish(j);
  }

  // Fin de donne (appelé par la boucle de jeu) : on note le score du joueur.
  function dealOver() {
    if (!job) return;
    job.me = game.tricksWon.NS;
    job.counted = !game.assisted && !game.replayed;
    finish(job);
  }

  function score(j) {
    let pts = 0;
    for (const d of DECLARERS) pts += j.me > j.results[d.key] ? 2 : j.me === j.results[d.key] ? 1 : 0;
    return Math.round(pts / (2 * DECLARERS.length) * 100);
  }

  // Quand le joueur a fini ET que les robots ont fini : on enregistre et on met à jour le niveau.
  function finish(j) {
    if (j.recorded || j.me === null || j.current !== null || DECLARERS.some(d => j.results[d.key] === undefined)) {
      if (game.over) render();
      return;
    }
    j.recorded = true;
    j.pct = score(j);
    if (j.counted) {
      const before = level().index;
      history.push({ t: Date.now(), me: j.me, piperno: j.results.piperno, averell: j.results.averell, averell250: j.results.averell250, par: j.par, pct: j.pct });
      save();
      const after = level().index;
      if (after > before) j.levelUp = { name: LEVELS[after].name, card: Rewards.grantCard() };
    }
    render();
  }

  /* ---------- Niveaux ---------- */
  function level() {
    const recent = history.slice(-WINDOW);
    let index = 0;
    for (let i = 1; i < LEVELS.length; i++) {
      const n = recent.filter(h => h.me >= h[LEVELS[i].key]).length;
      if (n >= NEEDED) index = i; else break;
    }
    const next = LEVELS[index + 1];
    const progress = next ? recent.filter(h => h.me >= h[next.key]).length : null;
    return { index, name: LEVELS[index].name, next, progress, recent };
  }

  function levelText() {
    const L = level();
    if (!L.next) return `<strong>${L.name}</strong> : le plus haut niveau. Bravo !`;
    return `<strong>${L.name}</strong>. Pour passer au <strong>${L.next.name}</strong>, fais au moins aussi bien que ${L.next.who} sur ${NEEDED} des ${WINDOW} dernières donnes : <strong>${L.progress} sur ${NEEDED}</strong> pour l'instant.`;
  }

  /* ---------- Affichage en fin de donne ---------- */
  function render_() {
    const box = $("evaluation");
    const j = job;
    box.hidden = !(j && game.over);
    if (box.hidden) return;
    const names = { piperno: "Piperno", averell: "Averell", averell250: "Averell250" };
    if (!j.recorded) {
      const wait = j.current ? names[j.current] : "les robots";
      box.innerHTML = `<h2>Évaluation</h2><p>Calcul en cours : ${wait} rejoue ta donne…</p>`;
      return;
    }
    const cmp = r => j.me > r ? `<span class="ok">tu fais mieux</span>` : j.me === r ? "égalité" : `<span class="ko">${r - j.me} pli${r - j.me > 1 ? "s" : ""} de plus</span>`;
    const rows = DECLARERS.map(d => `<tr><th scope="row">${names[d.key]}</th><td>${j.results[d.key]}</td><td>${cmp(j.results[d.key])}</td></tr>`).join("");
    const counted = j.counted
      ? ""
      : `<p class="eval-note">Donne non comptée dans ta progression (${game.replayed ? "donne rejouée" : "aide utilisée : meilleurs coups, jeux ouverts ou carte révélée"}).</p>`;
    const up = j.levelUp
      ? `<p class="eval-up">Nouveau niveau : <strong>${j.levelUp.name}</strong> !${j.levelUp.card ? ` Tu gagnes le <strong>${cardName(j.levelUp.card)}</strong> pour ta collection.` : ""}</p>`
      : "";
    box.innerHTML = `<h2>Évaluation</h2>
      <p class="eval-score">Ton score duplicate : <strong>${j.pct} %</strong></p>
      <div class="ex-grid-wrap"><table class="ex-grid eval-table">
        <thead><tr><th scope="col">Déclarant</th><th scope="col">Plis Nord-Sud</th><th scope="col">Comparaison</th></tr></thead>
        <tbody><tr class="eval-me"><th scope="row">Toi</th><td>${j.me}</td><td></td></tr>${rows}
        <tr class="eval-par"><th scope="row">Jeu parfait (pour info)</th><td>${j.par}</td><td></td></tr></tbody>
      </table></div>
      <p class="eval-how">Même donne, mêmes défenseurs. 2 points par robot battu, 1 par égalité, rapportés au maximum de ${2 * DECLARERS.length} points.</p>
      ${counted}${up}
      <p>${levelText()}</p>
      <button class="act ghost" type="button" data-role="progress">Voir ma progression</button>`;
    box.querySelector("[data-role=progress]").onclick = openProgress;
  }

  /* ---------- La fenêtre « Ma progression » ---------- */
  function openProgress() {
    const L = level();
    const body = $("progress-body");
    const last = history.slice(-20).reverse();
    const avg = L.recent.length ? Math.round(L.recent.reduce((t, h) => t + h.pct, 0) / L.recent.length) : null;
    const steps = LEVELS.slice(1).map((lv, i) => {
      const n = L.recent.filter(h => h.me >= h[lv.key]).length;
      const done = L.index >= i + 1;
      return `<li class="${done ? "done" : ""}"><strong>${lv.name}</strong> : au moins aussi bien que ${lv.who} sur ${n} des ${L.recent.length} dernières donnes${done ? " ✓" : ` (il en faut ${NEEDED} sur ${WINDOW})`}</li>`;
    }).join("");
    const bars = L.recent.map(h => `<span class="eval-bar" style="height:${Math.max(4, h.pct)}%" title="${h.pct} %"></span>`).join("");
    body.innerHTML = history.length ? `
      <p>${levelText()}</p>
      <ol class="eval-steps">${steps}</ol>
      <p class="quiz-label">Score duplicate des ${L.recent.length} dernières donnes${avg !== null ? ` (moyenne ${avg} %)` : ""} :</p>
      <div class="eval-bars" role="img" aria-label="Scores : ${L.recent.map(h => h.pct + " %").join(", ")}">${bars}</div>
      <div class="ex-grid-wrap"><table class="ex-grid eval-table">
        <thead><tr><th scope="col">Donne</th><th scope="col">Toi</th><th scope="col">Piperno</th><th scope="col">Averell</th><th scope="col">Averell250</th><th scope="col">Parfait</th><th scope="col">Score</th></tr></thead>
        <tbody>${last.map((h, i) => `<tr><td>${history.length - i}</td><td><strong>${h.me}</strong></td><td>${h.piperno}</td><td>${h.averell}</td><td>${h.averell250}</td><td>${h.par}</td><td>${h.pct} %</td></tr>`).join("")}</tbody>
      </table></div>`
      : `<p>Pas encore de donne évaluée. Joue une donne en Sud (déclarant) avec le mode évaluation : ton score s'affichera à la fin, et ta progression ici.</p>`;
    $("progress").showModal();
  }

  $("btn-progress").addEventListener("click", openProgress);
  $("btn-progress-close").addEventListener("click", () => $("progress").close());
  $("progress").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  return { start, dealOver, render: render_, openProgress, simulate, level, get current() { return job; } };
})();
