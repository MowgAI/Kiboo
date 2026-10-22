"use strict";
/* =====================================================================
   QUESTIONS EN COURS DE PARTIE
   Quand la case « Questions pendant la partie » est cochée et que Sud est
   humain, la partie s'arrête de temps en temps sur une question. Elle
   reprend exactement où elle en était après la réponse (ou « Passer »).

   Moments utilisés (js/game.js appelle Quiz.at(moment, token)) :
   - "start"  : début de donne, avant l'entame -> compter sa main ;
   - "lead"   : juste après l'entame, mort étalé -> déduction sur la main
                d'Ouest, seulement si Ouest suit la règle d'entame (Piperno,
                Averell, Averell250) ;
   - "play"   : avant de jouer sur un pli déjà commencé -> cartes jouables ;
   - "trick"  : fin de pli (prêt, aucune question pour l'instant).

   Les questions de déduction portent sur des cartes cachées : la bonne
   réponse est calculée en passant en revue toutes les mains qu'Ouest peut
   avoir compte tenu de ce que le joueur voit et de la règle d'entame,
   jamais en regardant les vraies cartes d'Ouest.
   ===================================================================== */
const Quiz = (() => {
  // Probabilité de poser une question à chaque occasion. La question sur
  // l'entame est la plus utile : elle est posée à chaque donne où Ouest suit la règle.
  const CHANCE = { start: 0.5, lead: 1, play: 0.12 };
  const RULE_LEADERS = ["deterministe", "pimc", "pimc250"];   // entament selon la règle de Piperno
  const ANSWERS = [
    { key: "yes", get label() { return T("quiz.yes"); } },
    { key: "no", get label() { return T("quiz.no"); } },
    { key: "maybe", get label() { return T("quiz.maybe"); } },
  ];

  let finish = null;            // résout la promesse de la question ouverte
  let askedTrick = -1;          // au plus une question « play » par pli

  /* ---------- Ouvrir une question et attendre la fin ---------- */
  async function ask(title, build) {
    // Si le joueur consulte les règles, les exercices ou sa collection, la question attend.
    while (document.querySelector("dialog[open]")) await sleep(300);
    return new Promise(resolve => {
      const dlg = $("quiz");
      $("quiz-title").textContent = title;
      $("quiz-skip").hidden = false;
      finish = () => {
        finish = null;
        if (dlg.open) dlg.close();
        resolve();
      };
      build($("quiz-body"));
      Rewards.refresh();
      dlg.showModal();
    });
  }

  // Après une réponse : « Reprendre la partie », ou d'abord le cadeau.
  function onResult(ok, btn) {
    $("quiz-skip").hidden = true;
    Rewards.answered(ok);
    const resume = () => { btn.textContent = T("quiz.resume"); btn.onclick = () => finish && finish(); btn.focus(); };
    const giftOpts = {
      canReveal: canReveal(),
      revealable: seat => hiddenCards(seat).length > 0,
      reveal,
      doneLabel: T("quiz.resume"),
      onDone: () => finish && finish(),
    };
    if (Rewards.giftReady(giftOpts)) {
      btn.textContent = T("ex.openGift");
      btn.onclick = () => Rewards.giftPanel($("quiz-body"), giftOpts);
      btn.focus();
    } else resume();
  }

  /* ---------- Cadeau « voir une carte cachée » ---------- */
  const hiddenCards = seat => game.hands[seat].filter(c => !game.revealed.has(cardId(c)));
  const canReveal = () => !!game && !game.over && !config.open;
  function reveal(seat) {
    const pool = hiddenCards(seat);
    const card = pool[Math.floor(Math.random() * pool.length)];
    game.revealed.set(cardId(card), seat);
    game.assisted = true;                         // une carte révélée est une aide : donne non évaluée
    render();
    return card;
  }

  /* ---------- Moteur de déduction : les mains possibles d'Ouest ----------
     Juste après l'entame, le joueur (Sud) voit sa main, le mort et la carte
     d'entame, plus les cartes révélées par un cadeau. Ouest a 10 cartes :
     l'entame, ses cartes révélées et des cartes prises parmi celles que le
     joueur ne voit pas. On garde les mains où la règle d'entame (openingCard)
     choisit exactement la carte entamée.
     visit(hand, possible, entame) est appelé pour chaque main possible ; avec
     { all: true }, aussi pour les mains que la règle d'entame exclut
     (possible = false, entame = la carte que la règle aurait jouée). */
  function forEachWestHand(visit, opts = {}) {
    const lead = game.history[0].card;
    const seen = new Set([...game.hands.S, ...game.hands.N, lead].map(cardId));
    const revealedW = [], revealedE = new Set();
    for (const [id, seat] of game.revealed) {
      if (seat === "O") revealedW.push(makeDeck()[id]);
      else revealedE.add(id);
    }
    revealedW.forEach(c => seen.add(cardId(c)));
    const unknown = makeDeck().filter(c => !seen.has(cardId(c)) && !revealedE.has(cardId(c)));
    const fixed = [lead, ...revealedW];
    const k = 10 - fixed.length;
    const leadId = cardId(lead);
    // Toutes les combinaisons de k cartes parmi `unknown`.
    const idx = Array.from({ length: k }, (_, i) => i);
    const n = unknown.length;
    while (true) {
      const hand = fixed.concat(idx.map(i => unknown[i]));
      const chosen = openingCard(hand);
      const possible = cardId(chosen) === leadId;
      if (possible || opts.all) visit(hand, possible, chosen);
      let i = k - 1;
      while (i >= 0 && idx[i] === n - k + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
  }

  // Les questions de déduction après l'entame. Chacune : texte, rappel de la règle, prédicat.
  function leadQuestions(lead) {
    const L = lead.s, V = lead.v;
    const count = (h, s) => h.filter(c => c.s === s).length;
    const list = [
      {
        key: "same",
        text: T("quiz.q.same", { suit: Exercises.suitName(L) }),
        rule: T("quiz.rule.same"),
        test: h => [0, 1, 2, 3].some(s => s !== L && count(h, s) === count(h, L)),
      },
    ];
    if (V < 10) list.push({
      text: T("quiz.q.higher", { v: V, s: L }),
      rule: T("quiz.rule.seq"),
      test: h => h.some(c => c.s === L && c.v > V),
    });
    if (V > 1) list.push({
      text: T("quiz.q.lower", { v: V, s: L }),
      rule: T("quiz.rule.seq"),
      test: h => h.some(c => c.s === L && c.v < V),
    });
    return list;
  }

  // Ce que le joueur voit, couleur par couleur : ses cartes, celles du mort,
  // et ce qui reste pour Est et Ouest (nombre de cartes et points).
  function remainingTable(lead) {
    const pts = cards => cards.reduce((t, c) => t + c.v, 0);
    const rows = [0, 1, 2, 3].map(s => {
      const seen = new Set([...game.hands.S, ...game.hands.N].filter(c => c.s === s).map(cardId));
      const rest = makeDeck().filter(c => c.s === s && !seen.has(cardId(c)));
      return {
        s, rest: rest.length, pts: pts(rest), values: rest.map(c => c.v).sort((a, b) => b - a),
        me: game.hands.S.filter(c => c.s === s).length, dummy: game.hands.N.filter(c => c.s === s).length,
      };
    });
    const html = `<div class="ex-grid-wrap"><table class="ex-grid quiz-rest">
      <thead><tr><th scope="col">${T("ex.col.color")}</th><th scope="col">${T("quiz.col.me")}</th><th scope="col">${T("quiz.col.dummy")}</th><th scope="col">${T("quiz.col.rest")}</th><th scope="col">${T("quiz.col.pts")}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${Exercises.suitName(r.s)}</th><td>${r.me}</td><td>${r.dummy}</td>
        <td><strong>${r.rest}</strong>${r.rest ? ` (${r.values.join(", ")})` : ""}${r.s === lead.s ? T("quiz.rest.lead", { v: lead.v }) : ""}</td><td>${r.pts}</td></tr>`).join("")}</tbody>
    </table></div>`;
    return { rows, html };
  }

  function leadPanel(body) {
    const lead = game.history[0].card;
    const L = lead.s;
    const questions = leadQuestions(lead);
    const Q = questions[Math.floor(Math.random() * questions.length)];
    const count = (h, s) => h.filter(c => c.s === s).length;
    const points = (h, s) => h.filter(c => c.s === s).reduce((t, c) => t + c.v, 0);

    // Passe en revue les mains d'Ouest. Pour la question « autant de cartes »,
    // on note aussi, couleur par couleur : si c'est possible (avec un exemple),
    // si c'est seulement faisable en nombre de cartes, et sinon ce que la règle
    // d'entame aurait fait jouer.
    let total = 0, yes = 0, exYes = null, exNo = null, minL = 10;
    const per = [0, 1, 2, 3].map(() => ({ feasible: false, possible: false, example: null, n: 0, chosen: new Set() }));
    forEachWestHand((h, possible, chosen) => {
      if (Q.key === "same") {
        for (let s2 = 0; s2 < 4; s2++) {
          if (s2 === L || count(h, s2) !== count(h, L)) continue;
          // Seules comptent les mains où les deux couleurs sont à égalité en tête :
          // si une troisième couleur était plus longue, Ouest n'entamerait pas le L.
          if ([0, 1, 2, 3].some(x => count(h, x) > count(h, L))) continue;
          const st = per[s2];
          st.feasible = true;
          if (possible) { st.possible = true; st.n++; if (Math.random() * st.n < 1) st.example = h; }
          else st.chosen.add(chosen.s === L ? "card" : chosen.s);
        }
      }
      if (!possible) return;
      total++;
      minL = Math.min(minL, count(h, L));
      if (Q.test(h)) { yes++; if (Math.random() * yes < 1) exYes = h; }
      else if (Math.random() * (total - yes) < 1) exNo = h;
    }, { all: Q.key === "same" });
    const truth = yes === total ? "yes" : yes === 0 ? "no" : "maybe";
    const others = [0, 1, 2, 3].filter(s2 => s2 !== L);
    const followUp = Q.key === "same" && truth !== "no";

    body.innerHTML = `
      <div class="ex-led"><div class="ex-led-cards" data-role="lead"></div>
        <p>${T("quiz.led", { bot: PLAYER_TYPES[game.types.O].label, card: cardName(lead) })}</p></div>
      <p class="ex-q">${Q.text}</p>
      <button class="act ghost quiz-rule-btn" type="button" data-role="rule-btn" aria-expanded="true">${T("quiz.rule.hide")}</button>
      <div class="quiz-rule" data-role="rule"></div>
      <p class="quiz-label">${T("quiz.dummy")}</p><div class="ex-hand quiz-mini" data-role="dummy"></div>
      <p class="quiz-label">${T("quiz.me")}</p><div class="ex-hand quiz-mini" data-role="me"></div>
      <p class="quiz-hint">${T("quiz.hint")}</p>
      <div class="ex-choices" role="group" aria-label="${T("quiz.aria.answers")}">
        ${ANSWERS.map(a => `<button class="ex-choice" type="button" data-a="${a.key}">${a.label}</button>`).join("")}
      </div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <div class="quiz-follow" data-role="follow" hidden>
        <p class="ex-q">${T("quiz.follow.q", { suit: Exercises.suitName(L) })}</p>
        <div class="ex-choices" role="group" aria-label="${T("ex.aria.colors")}">
          ${others.map(s2 => `<button class="ex-choice" type="button" data-s="${s2}" aria-pressed="false">${Exercises.suitName(s2)}</button>`).join("")}
        </div>
        <div class="ex-actions"><button class="act" type="button" data-role="follow-check">${T("ex.check")}</button></div>
        <p class="ex-result" data-role="follow-result" aria-live="polite"></p>
      </div>
      <div class="ex-actions" hidden data-role="next"><button class="act" data-role="check" type="button"></button></div>
      <div class="quiz-why" data-role="why" hidden></div>`;
    const q = sel => body.querySelector(sel);
    q("[data-role=lead]").appendChild(cardEl(lead));
    // La règle d'entame (la même que dans les Règles du jeu), affichée d'office pendant la question.
    q("[data-role=rule]").innerHTML = $("lead-rule").innerHTML;
    q("[data-role=rule-btn]").onclick = e => {
      const box = q("[data-role=rule]"), open = box.hidden;
      box.hidden = !open;
      e.currentTarget.setAttribute("aria-expanded", open);
      e.currentTarget.textContent = open ? T("quiz.rule.hide") : T("quiz.rule.show");
    };
    Exercises.drawHand(q("[data-role=me]"), game.hands.S, true);
    Exercises.drawHand(q("[data-role=dummy]"), game.hands.N, true);

    const setResult = (sel, ok, text) => {
      const res = q(sel);
      res.className = "ex-result " + (ok ? "ok" : "ko");
      res.textContent = text;
    };
    const fmt = n => I18N.g("num")(n);
    const example = (h, label) => {
      const p = document.createElement("p");
      p.className = "quiz-label";
      p.textContent = label;
      const box = document.createElement("div");
      box.className = "ex-hand quiz-mini";
      Exercises.drawHand(box, h, true);
      q("[data-role=why]").append(p, box);
    };

    // La correction : la règle, le reste de chaque couleur, puis le raisonnement.
    function explain(ok) {
      const why = q("[data-role=why]");
      why.hidden = false;
      const table = remainingTable(lead);
      why.innerHTML = `<p>${Q.rule}</p>
        <p class="quiz-label">${T("quiz.unseen")}</p>${table.html}`;
      if (Q.key === "same") {
        const lines = others.map(s2 => {
          const st = per[s2], r = table.rows[s2];
          if (st.possible) {
            const h = st.example, k = count(h, L);
            return `<li>${T("quiz.same.possible", { suit: Exercises.suitName(s2), k, L, s: s2, pL: points(h, L), pS: points(h, s2), tie: points(h, s2) === points(h, L) })}</li>`;
          }
          if (!st.feasible) {
            // Pas assez de cartes pour égaler la couleur la plus longue d'Ouest.
            return `<li>${T("quiz.same.short", { suit: Exercises.suitName(s2), L, s: s2, minL, rest: r.rest })}</li>`;
          }
          // Assez de cartes, mais la règle d'entame aurait fait jouer autre chose.
          const parts = [];
          if (st.chosen.has(s2)) parts.push(T("quiz.same.points", { s: s2, L, pts: r.pts }));
          if (st.chosen.has("card")) parts.push(T("quiz.same.card", { L, v: lead.v }));
          if (!parts.length) parts.push(T("quiz.same.other", { L, v: lead.v }));
          return `<li>${T("quiz.same.rule", { suit: Exercises.suitName(s2), s: s2, parts: parts.join(T("quiz.same.or")) })}</li>`;
        });
        why.insertAdjacentHTML("beforeend", `<p class="quiz-label">${T("quiz.perSuit")}</p><ul class="quiz-reasons">${lines.join("")}</ul>`);
      }
      why.insertAdjacentHTML("beforeend", `<p>${T("quiz.total", { total, totalTxt: fmt(total), yesTxt: fmt(yes), noTxt: fmt(total - yes), maybe: truth === "maybe" })}</p>`);
      if (Q.key !== "same") {
        if (exYes) example(exYes, truth === "maybe" ? T("quiz.ex.yes") : T("quiz.ex.any"));
        if (exNo) example(exNo, truth === "maybe" ? T("quiz.ex.no") : T("quiz.ex.any"));
      }
      q("[data-role=next]").hidden = false;
      onResult(ok, q("[data-role=check]"));
    }

    const buttons = [...body.querySelectorAll("[data-a]")];
    for (const b of buttons) b.onclick = () => {
      const ok = b.dataset.a === truth;
      buttons.forEach(x => { x.disabled = true; if (x.dataset.a === truth) x.classList.add("ok"); });
      if (!ok) b.classList.add("ko");
      const answer = ANSWERS.find(a => a.key === truth).label;
      setResult("[data-role=result]", ok, (ok ? T("ex.ok") : T("ex.notQuite")) + T("quiz.goodAnswer", { answer }));
      if (!followUp) return explain(ok);

      // Deuxième question : lesquelles ?
      const follow = q("[data-role=follow]");
      follow.hidden = false;
      const picks = [...follow.querySelectorAll("[data-s]")];
      for (const p of picks) p.onclick = () => p.setAttribute("aria-pressed", p.getAttribute("aria-pressed") !== "true");
      q("[data-role=follow-check]").onclick = () => {
        let ok2 = true;
        for (const p of picks) {
          const on = p.getAttribute("aria-pressed") === "true", good = per[+p.dataset.s].possible;
          p.disabled = true;
          if (good) p.classList.add(on ? "ok" : "missed");
          else if (on) p.classList.add("ko");
          if (on !== good) ok2 = false;
        }
        q("[data-role=follow-check]").hidden = true;
        const goods = others.filter(s2 => per[s2].possible);
        setResult("[data-role=follow-result]", ok2, (ok2 ? T("ex.ok") : T("ex.notQuite")) + T("quiz.follow.result", { list: goods }));
        explain(ok && ok2);
      };
      picks[0].focus();
    };
    buttons[0].focus();
  }

  /* ---------- Point d'entrée appelé par la boucle de jeu ---------- */
  async function at(moment, ctx = {}) {
    if (!config.quiz || !game || game.types.S !== "humain") return;
    if (!(moment in CHANCE) || Math.random() >= CHANCE[moment]) return;
    // Pas de question pendant le dernier pli : il ne reste qu'une carte, aucun choix à faire.
    if (game.tricksWon.NS + game.tricksWon.EO === 9) return;

    if (moment === "start") {
      await ask(T("quiz.title.start"), body => Exercises.countPanel(body, {
        hand: game.hands.S, sorted: true, intro: T("quiz.start.intro"), onResult,
      }));
    } else if (moment === "lead") {
      if (!RULE_LEADERS.includes(game.types.O) || game.history.length !== 1) return;
      await ask(T("quiz.title.lead"), leadPanel);
    } else if (moment === "play") {
      const trickNo = game.tricksWon.NS + game.tricksWon.EO;
      if (!game.trick.length || askedTrick === trickNo) return;
      // Une seule carte jouable : la question n'aurait pas d'intérêt.
      if (legalCards(game.hands[ctx.seat], game.trick).length < 2) return;
      askedTrick = trickNo;
      const seat = ctx.seat;
      await ask(T("quiz.title.play"), body => Exercises.legalPanel(body, {
        hand: game.hands[seat], trick: game.trick.map(p => ({ seat: p.seat, card: p.card })), sorted: true,
        dummy: seat === DUMMY, onResult,
      }));
    }
  }

  // Nouvelle donne : on ferme une question restée ouverte et on oublie le pli mémorisé.
  function reset() {
    askedTrick = -1;
    if (finish) finish();
  }

  $("quiz-skip").addEventListener("click", () => finish && finish());
  $("quiz").addEventListener("close", () => finish && finish());   // touche Échap

  return { at, reset, forEachWestHand, leadPanel };
})();
