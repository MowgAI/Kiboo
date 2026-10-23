"use strict";
/* =====================================================================
   LE CARRÉ DE COCO
   Au départ, chaque joueur a 10 cartes et chaque couleur a 10 cartes.
   Le carré de Coco est le tableau 4 × 4 des cartes de départ : une ligne
   par couleur, une colonne par joueur (Ouest, Nord, Est, Sud). Chaque ligne
   et chaque colonne font 10.

   - Exercice (fenêtre Exercices, staticPanel) : une donne tirée au hasard,
     des cases vides à compléter grâce aux totaux. Facile (4 cases vides),
     Moyen (7, le maximum pour une seule solution) ou Comme à la table
     (Nord et Sud remplis, trois indices sur Ouest et Est).
   - En jouant (réglage « Remplir le carré de Coco », quand l'humain est
     déclarant) : Nord et Sud sont remplis d'office, le joueur remplit
     Ouest et Est au fur et à mesure. « Vérifier ce qui est sûr » ne juge
     que les cases déjà déductibles : un défenseur qui ne fournit pas avait
     autant de cartes de la couleur qu'il en a jouées, et les totaux à 10
     font le reste. En fin de donne, le vrai carré est montré.
   - Mode Goat (même réglage, choix « Goat ») : le programme remplit le
     carré tout seul pendant la donne et explique chaque déduction. Une case
     encore inconnue montre « ≥ n » quand le défenseur a déjà joué n cartes
     de la couleur. Goat est une aide : la donne n'est pas comptée dans
     l'évaluation.
   ===================================================================== */
const Coco = (() => {
  const ORDER = ["O", "N", "E", "S"];                  // colonnes, en commençant par Ouest
  const TEAM = { O: "eo", N: "ns", E: "eo", S: "ns" };
  const LEVELS = ["easy", "medium", "table"];
  let level = "easy";

  // M[s][j] : cartes de la couleur s chez le joueur ORDER[j] au départ.
  const matrix = hands => [0, 1, 2, 3].map(s => ORDER.map(x => hands[x].filter(c => c.s === s).length));
  const full = () => [0, 1, 2, 3].map(() => [true, true, true, true]);

  /* Déduction pas à pas : tant qu'une ligne ou une colonne n'a plus qu'une
     case inconnue, elle vaut 10 moins les autres. Renvoie les cases connues
     à la fin et les étapes (pour la correction). */
  function propagate(M, known) {
    known = known.map(r => r.slice());
    const steps = [];
    for (let moved = true; moved;) {
      moved = false;
      for (let s = 0; s < 4; s++) {
        const miss = [0, 1, 2, 3].filter(j => !known[s][j]);
        if (miss.length !== 1) continue;
        const j = miss[0];
        steps.push({ k: "coco.step.row", p: { s, seat: ORDER[j], v: M[s][j], others: [0, 1, 2, 3].filter(x => x !== j).map(x => M[s][x]) } });
        known[s][j] = moved = true;
      }
      for (let j = 0; j < 4; j++) {
        const miss = [0, 1, 2, 3].filter(s => !known[s][j]);
        if (miss.length !== 1) continue;
        const s = miss[0];
        steps.push({ k: "coco.step.col", p: { s, seat: ORDER[j], v: M[s][j], others: [0, 1, 2, 3].filter(x => x !== s).map(x => M[x][j]) } });
        known[s][j] = moved = true;
      }
    }
    return { known, steps, done: known.every(r => r.every(Boolean)) };
  }

  // Cache `count` cases prises dans `pool` ; la grille doit rester déductible.
  function hide(M, base, pool, count) {
    for (let t = 0; t < 500; t++) {
      const known = base.map(r => r.slice());
      pool.slice().sort(() => Math.random() - 0.5).slice(0, count).forEach(([s, j]) => { known[s][j] = false; });
      const res = propagate(M, known);
      if (res.done) return { given: known, steps: res.steps };
    }
    return null;
  }

  /* ---------- Le tableau ----------
     given[s][j] : case affichée d'office. Les autres sont des champs à remplir.
     Renvoie de quoi lire les valeurs, repeindre les totaux et marquer les cases. */
  function grid(box, M, given, opts = {}) {
    const head = `<tr><th class="corner"></th>${ORDER.map(x => `<th scope="col"><span class="seat-name ${TEAM[x]}">${seatName(x)}</span></th>`).join("")}<th class="corner" scope="col">${T("coco.total")}</th></tr>`;
    const rows = [0, 1, 2, 3].map(s => `<tr><th scope="row">${Exercises.suitName(s)}</th>${
      ORDER.map((x, j) => given[s][j]
        ? `<td class="given">${M[s][j]}</td>`
        : `<td data-cell="${s}-${j}"><input type="number" inputmode="numeric" min="0" max="10" data-s="${s}" data-j="${j}" aria-label="${T("coco.aria", { seat: seatName(x), s })}"></td>`).join("")
    }<td class="sum" data-row="${s}"></td></tr>`).join("");
    const foot = `<tr><th class="corner" scope="row">${T("coco.total")}</th>${ORDER.map((x, j) => `<td class="sum" data-col="${j}"></td>`).join("")}<td class="corner">10</td></tr>`;
    box.innerHTML = `<div class="ex-grid-wrap"><table class="coco"><thead>${head}</thead><tbody>${rows}${foot}</tbody></table></div>
      <label class="check coco-totals"><input type="checkbox" data-role="totals" checked> ${T("coco.showTotals")}</label>`;
    const q = sel => box.querySelector(sel);
    const input = (s, j) => q(`input[data-s="${s}"][data-j="${j}"]`);
    const value = (s, j) => {
      if (given[s][j]) return M[s][j];
      const v = input(s, j).value.trim();
      return v === "" ? null : Number(v);
    };
    function totals() {
      const show = q("[data-role=totals]").checked;
      const paint = (el, vals) => {
        const sum = vals.reduce((t, v) => t + (v || 0), 0), done = vals.every(v => v !== null);
        el.textContent = show ? sum : "";
        el.className = "sum" + (show && done && sum === 10 ? " done" : show && sum > 10 ? " over" : "");
      };
      for (let s = 0; s < 4; s++) paint(q(`[data-row="${s}"]`), [0, 1, 2, 3].map(j => value(s, j)));
      for (let j = 0; j < 4; j++) paint(q(`[data-col="${j}"]`), [0, 1, 2, 3].map(s => value(s, j)));
    }
    for (const el of box.querySelectorAll("input[data-s]")) el.addEventListener("input", () => {
      el.parentElement.className = "";                 // une case modifiée perd sa marque
      if (opts.onInput) opts.onInput(+el.dataset.s, +el.dataset.j, el.value);
      totals();
    });
    q("[data-role=totals]").onchange = totals;
    // Correction d'une case : la réponse barrée puis la bonne valeur, ou juste « juste ».
    function correct(s, j) {
      const el = input(s, j);
      if (!el) return true;
      const td = el.parentElement, typed = el.value.trim();
      const ok = typed !== "" && Number(typed) === M[s][j];
      td.className = ok ? "ok" : "ko";
      el.disabled = true;
      if (!ok) td.innerHTML = (typed ? `<s class="was">${typed}</s>` : "") + `<span class="fix">${M[s][j]}</span>`;
      return ok;
    }
    function finish() {
      for (const el of box.querySelectorAll(".sum")) { el.textContent = "10"; el.className = "sum done"; }
      q("[data-role=totals]").disabled = true;
    }
    return { input, value, totals, correct, finish, mark: (s, j, cls) => { const el = input(s, j); if (el) el.parentElement.className = cls; } };
  }

  const stepsHtml = steps => `<p class="quiz-label">${T("coco.steps")}</p><ol class="coco-steps">${steps.map(st => `<li>${T(st.k, st.p)}</li>`).join("")}</ol>`;

  /* ---------- L'exercice (fenêtre Exercices) ---------- */
  function staticPanel(body, opts) {
    const deck = shuffle(makeDeck());
    const hands = {};
    ORDER.forEach((x, i) => { hands[x] = deck.slice(i * 10, i * 10 + 10); });
    const M = matrix(hands);
    const all = [];
    for (let s = 0; s < 4; s++) for (let j = 0; j < 4; j++) all.push([s, j]);
    let puzzle, clues = "";
    if (level === "table") {
      // Nord et Sud sont connus (le mort et ta main) : trois indices sur Ouest et Est.
      const we = all.filter(([s, j]) => ORDER[j] === "O" || ORDER[j] === "E");
      puzzle = hide(M, full(), we, 5);
      const hints = we.filter(([s, j]) => puzzle.given[s][j]);
      clues = `<p>${T("coco.table.intro")}</p><ul class="coco-clues">${hints.map(([s, j]) => `<li>${T("coco.clue", { seat: seatName(ORDER[j]), n: M[s][j], s })}</li>`).join("")}</ul>`;
    } else puzzle = hide(M, full(), all, level === "easy" ? 4 : 7);

    body.innerHTML = `
      <p>${T("coco.intro")}</p>
      <div class="coco-levels" role="group" aria-label="${T("coco.levels")}">
        ${LEVELS.map(l => `<button type="button" data-level="${l}" aria-pressed="${l === level}">${T("coco.level." + l)}</button>`).join("")}
      </div>
      ${clues}
      <div data-role="grid"></div>
      <p class="coco-legend">${T("coco.legend")}</p>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <div class="quiz-why" data-role="why" hidden></div>`;
    const q = sel => body.querySelector(sel);
    for (const b of body.querySelectorAll("[data-level]")) b.onclick = () => { level = b.dataset.level; staticPanel(body, opts); };
    const G = grid(q("[data-role=grid]"), M, puzzle.given);
    G.totals();

    q("[data-role=check]").onclick = () => {
      let wrong = 0;
      for (let s = 0; s < 4; s++) for (let j = 0; j < 4; j++) if (!puzzle.given[s][j] && !G.correct(s, j)) wrong++;
      G.finish();
      const res = q("[data-role=result]");
      res.className = "ex-result " + (wrong ? "ko" : "ok");
      res.textContent = wrong ? T("coco.wrong", { n: wrong }) : T("coco.ok");
      const why = q("[data-role=why]");
      why.hidden = false;
      why.innerHTML = stepsHtml(puzzle.steps);
      opts.onResult(!wrong, q("[data-role=check]"));
    };
    body.querySelector("input[data-s]").focus();
  }

  /* ---------- En jouant ---------- */
  let state = null;                 // { g: partie, G: tableau, entries, revealed }

  // Ce que le déclarant sait sûrement à ce moment de la donne.
  function knownNow(g) {
    const known = [0, 1, 2, 3].map(() => ORDER.map(x => x === "N" || x === "S"));
    const led = {};
    for (const h of g.history) {
      if (!(h.trickNo in led)) led[h.trickNo] = h.card.s;
      else if (h.card.s !== led[h.trickNo] && team(h.seat) === "EO") known[led[h.trickNo]][ORDER.indexOf(h.seat)] = true;
    }
    return propagate(matrix(g.initial), known).known;
  }

  function build() {
    const box = $("coco");
    const M = matrix(game.initial);
    const given = [0, 1, 2, 3].map(() => ORDER.map(x => x === "N" || x === "S"));
    box.innerHTML = `<h2>${T("coco.title")}</h2>
      <p>${T("coco.game.intro")}</p>
      <div data-role="grid"></div>
      <div class="ex-actions"><button class="act ghost" type="button" data-role="check">${T("coco.game.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <p class="coco-legend" data-role="legend" hidden>${T("coco.game.legend")}</p>`;
    const entries = new Map();
    const G = grid(box.querySelector("[data-role=grid]"), M, given, { onInput: (s, j, v) => entries.set(s + "-" + j, v) });
    G.totals();
    state = { g: game, G, M, entries, revealed: false };
    box.querySelector("[data-role=check]").onclick = check;
  }

  // Juge seulement les cases déjà déductibles ; les autres restent « pas encore sûres ».
  function check() {
    const { G, M } = state;
    const known = knownNow(game);
    const n = { ok: 0, ko: 0, unsure: 0, todo: 0 };
    for (let s = 0; s < 4; s++) for (const j of [0, 2]) {
      const v = G.value(s, j);
      if (v === null) { if (known[s][j]) { n.todo++; G.mark(s, j, "todo"); } else G.mark(s, j, ""); continue; }
      if (!known[s][j]) { n.unsure++; G.mark(s, j, "unsure"); continue; }
      const ok = v === M[s][j];
      n[ok ? "ok" : "ko"]++;
      G.mark(s, j, ok ? "ok" : "ko");
    }
    const box = $("coco");
    const res = box.querySelector("[data-role=result]");
    res.className = "ex-result " + (n.ko ? "ko" : "ok");
    res.textContent = T("coco.game.result", n);
    box.querySelector("[data-role=legend]").hidden = false;
  }

  // Fin de donne : le vrai carré de Coco, case par case.
  function reveal() {
    const { G } = state;
    let ok = 0;
    for (let s = 0; s < 4; s++) for (const j of [0, 2]) if (G.correct(s, j)) ok++;
    G.finish();
    const box = $("coco");
    box.querySelector("[data-role=check]").hidden = true;
    box.querySelector("[data-role=legend]").hidden = true;
    const res = box.querySelector("[data-role=result]");
    res.className = "ex-result " + (ok === 8 ? "ok" : "ko");
    res.textContent = T("coco.game.end", { ok });
    state.revealed = true;
  }

  /* ---------- Mode Goat : le carré se remplit tout seul ---------- */
  // Rejoue l'historique de la donne : chaque défausse d'un défenseur fixe une
  // case, puis les totaux à 10 en donnent d'autres. Chaque déduction est notée.
  function goatAnalyse(g) {
    const M = matrix(g.initial);
    let known = [0, 1, 2, 3].map(() => ORDER.map(x => x === "N" || x === "S"));
    const fresh = new Set();                         // cases trouvées au dernier coup
    const log = [{ trick: 0, k: "goat.start", p: { rest: [0, 1, 2, 3].map(s => M[s][0] + M[s][2]) } }];
    const led = {}, played = { O: [[], [], [], []], E: [[], [], [], []] };
    const lower = (s, j) => (ORDER[j] in played ? played[ORDER[j]][s].length : 0);
    // Une ligne ou une colonne dont les cases connues plus les « au moins » font
    // déjà 10 : chaque case inconnue vaut exactement son « au moins ».
    function bounds(trick, last) {
      const lines = [];
      for (let s = 0; s < 4; s++) lines.push({ kind: "row", s, cells: [0, 1, 2, 3].map(j => [s, j]) });
      for (let j = 0; j < 4; j++) lines.push({ kind: "col", j, cells: [0, 1, 2, 3].map(s => [s, j]) });
      for (const ln of lines) {
        const miss = ln.cells.filter(([s, j]) => !known[s][j]);
        if (miss.length < 2) continue;                 // une seule case : les totaux s'en chargent
        const sum = ln.cells.reduce((t, [s, j]) => t + (known[s][j] ? M[s][j] : lower(s, j)), 0);
        if (sum !== 10) continue;
        const cells = miss.map(([s, j]) => ({ s, seat: ORDER[j], n: lower(s, j) }));
        miss.forEach(([s, j]) => { known[s][j] = true; if (last) fresh.add(s + "-" + j); });
        log.push({ trick, k: ln.kind === "row" ? "goat.bound.row" : "goat.bound.col", p: { s: ln.s, seat: ORDER[ln.j], cells, known: ln.cells.filter(c => !miss.includes(c)).map(([s, j]) => M[s][j]) } });
        return true;
      }
      return false;
    }
    function close(trick, last) {
      for (let again = true; again;) {
        const res = propagate(M, known);
        for (const st of res.steps) {
          log.push({ trick, k: st.k, p: st.p });
          if (last) fresh.add(st.p.s + "-" + ORDER.indexOf(st.p.seat));
        }
        known = res.known;
        again = bounds(trick, last);
      }
    }
    g.history.forEach((h, i) => {
      const last = i === g.history.length - 1;
      if (!(h.trickNo in led)) led[h.trickNo] = h.card.s;
      if (h.seat in played) played[h.seat][h.card.s].push(h.card.v);
      const L = led[h.trickNo], j = ORDER.indexOf(h.seat);
      if (h.card.s !== L && h.seat in played && !known[L][j]) {
        known[L][j] = true;
        if (last) fresh.add(L + "-" + j);
        log.push({ trick: h.trickNo, k: "goat.void", p: { seat: h.seat, card: h.card, s: L, n: M[L][j], cards: played[h.seat][L].slice() } });
      }
      close(h.trickNo, last);
    });
    return { M, known, fresh, log, played, done: known.every(r => r.every(Boolean)) };
  }

  function goatRender() {
    const box = $("coco");
    const A = goatAnalyse(game);
    const cell = (s, j) => {
      const x = ORDER[j], id = s + "-" + j;
      if (A.known[s][j]) return `<td class="given${A.fresh.has(id) ? " fresh" : ""}">${A.M[s][j]}</td>`;
      const n = A.played[x][s].length;
      return `<td class="unknown">${n ? "≥ " + n : "?"}</td>`;
    };
    const head = `<tr><th class="corner"></th>${ORDER.map(x => `<th scope="col"><span class="seat-name ${TEAM[x]}">${seatName(x)}</span></th>`).join("")}<th class="corner" scope="col">${T("coco.total")}</th></tr>`;
    const rows = [0, 1, 2, 3].map(s => `<tr><th scope="row">${Exercises.suitName(s)}</th>${[0, 1, 2, 3].map(j => cell(s, j)).join("")}<td class="corner">10</td></tr>`).join("");
    const foot = `<tr><th class="corner" scope="row">${T("coco.total")}</th>${ORDER.map(() => `<td class="corner">10</td>`).join("")}<td class="corner"></td></tr>`;
    const items = A.log.slice().reverse().map(e =>
      `<li>${e.trick ? `<b>${T("goat.trick", { n: e.trick })}</b> · ` : ""}${T(e.k, e.p)}</li>`).join("");
    box.innerHTML = `<h2>${T("goat.title")}</h2>
      <p>${T("goat.intro")}</p>
      <div class="ex-grid-wrap"><table class="coco goat"><thead>${head}</thead><tbody>${rows}${foot}</tbody></table></div>
      ${A.done ? `<p class="ex-result ok">${T("goat.done")}</p>` : A.log.length === 1 ? `<p class="coco-legend">${T("goat.none")}</p>` : ""}
      <p class="quiz-label">${T("goat.why")}</p><ul class="goat-log">${items}</ul>`;
  }

  // Appelé à chaque affichage de la table (js/game.js).
  function render() {
    const box = $("coco");
    const on = config.coco !== "off" && !!game && game.types.S === "humain";
    box.hidden = !on;
    if (!on) return;
    if (config.coco === "goat") {
      // Goat est une aide : la donne ne compte pas pour l'évaluation.
      game.assisted = true;
      state = null;
      const key = game.history.length + (game.over ? "!" : "") + I18N.lang;
      if (box.dataset.goat !== key) { box.dataset.goat = key; goatRender(); }
      return;
    }
    box.dataset.goat = "";
    if (!state || state.g !== game) build();
    if (game.over && !state.revealed) reveal();
  }

  // Changement de langue : le tableau est reconstruit (les cases remplies sont gardées).
  document.addEventListener("kiboo-lang", () => {
    if (!state || !game) return;
    const entries = state.entries, wasRevealed = state.revealed;
    state = null;
    if (config.coco !== "manual" || game.types.S !== "humain") return;
    build();
    for (const [k, v] of entries) {
      const [s, j] = k.split("-").map(Number);
      const el = state.G.input(s, j);
      if (el) el.value = v;
      state.entries.set(k, v);
    }
    state.G.totals();
    if (wasRevealed) reveal();
  });

  return { staticPanel, render, matrix, propagate, knownNow };
})();
