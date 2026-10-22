"use strict";
/* =====================================================================
   QUESTIONS EN COURS DE PARTIE
   Réglage « Questions » : aucune, quelques-unes (tirées au sort, au moins
   une par donne) ou toutes (mode entraînement). Seulement quand le joueur
   humain est le déclarant (Sud). La partie s'arrête sur la question et
   reprend exactement où elle en était après la réponse (ou « Passer »).

   Moments utilisés (js/game.js appelle Quiz.at(moment, ctx)) :
   - "start"   : avant l'entame -> compter sa main ; cartes de chaque couleur
                 chez Est et Ouest (en voyant sa main et le mort) ;
   - "lead"    : juste après l'entame, si Ouest suit la règle d'entame
                 (Piperno, Averell, Averell250) -> déduction sur la main
                 d'Ouest ; répartition de la couleur entamée ;
   - "trick"   : fin de pli -> après le 1er pli, cartes restantes chez Est
                 et Ouest ; après le 3e pli, cartes maîtresses ;
   - "play"    : avant de jouer sur un pli déjà commencé -> cartes jouables ;
   - "discard" : un joueur vient de défausser -> répartition de départ de
                 la couleur demandée (quand elle est déductible).

   Les questions de déduction portent sur des cartes cachées : la bonne
   réponse est calculée en passant en revue toutes les mains qu'Ouest peut
   avoir compte tenu de ce que le joueur voit et de la règle d'entame,
   jamais en regardant les vraies cartes d'Ouest.
   ===================================================================== */
const Quiz = (() => {
  const RULE_LEADERS = ["deterministe", "pimc", "pimc250"];   // entament selon la règle de Piperno
  const ANSWERS = [
    { key: "yes", get label() { return T("quiz.yes"); } },
    { key: "no", get label() { return T("quiz.no"); } },
    { key: "maybe", get label() { return T("quiz.maybe"); } },
  ];

  let finish = null;            // résout la promesse de la question ouverte
  let askedTrick = -1;          // au plus une question « play » par pli

  /* ---------- Ouvrir une question et attendre la fin ---------- */
  async function askOne(title, build) {
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
     Voir Exercises.westHands : ce que voit le déclarant juste après l'entame
     (sa main, le mort, l'entame et les cartes révélées par un cadeau). */
  function westCtx() {
    const revealedW = [], revealedE = new Set();
    for (const [id, seat] of game.revealed) {
      if (seat === "O") revealedW.push(makeDeck()[id]);
      else revealedE.add(id);
    }
    return { me: game.initial.S, dummy: game.initial.N, lead: game.history[0].card, revealedW, revealedE };
  }
  const forEachWestHand = (visit, opts) => Exercises.westHands(westCtx(), visit, opts);

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
      ${Exercises.ruleBlock()}
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
    Exercises.ruleToggle(q);
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
      const table = Exercises.remainingTable(game.initial.S, game.initial.N, lead);
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

  /* ---------- Les cartes maîtresses (fin du 3e pli) ----------
     Une carte est maîtresse quand Est et Ouest n'ont plus aucune carte plus
     forte dans sa couleur. Le joueur clique sur toutes les cartes maîtresses
     de sa main et du mort ; il doit se souvenir des cartes déjà jouées. */
  function mastersPanel(body) {
    const me = game.hands.S, dummy = game.hands.N;
    const seen = new Set([...me, ...dummy, ...game.played].map(cardId));
    const opp = makeDeck().filter(c => !seen.has(cardId(c)));       // cartes encore chez Est et Ouest
    const top = s => Math.max(0, ...opp.filter(c => c.s === s).map(c => c.v));
    const isMaster = c => c.v > top(c.s);
    const picked = new Set();
    let checked = false;

    body.innerHTML = `
      <p class="ex-q">${T("masters.q")}</p>
      <p class="quiz-label">${T("quiz.dummy")}</p><div class="ex-hand" data-role="dummy"></div>
      <p class="quiz-label">${T("quiz.me")}</p><div class="ex-hand" data-role="me"></div>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <div class="quiz-why" data-role="why" hidden></div>`;
    const q = sel => body.querySelector(sel);
    const draw = () => {
      for (const [role, hand] of [["dummy", dummy], ["me", me]]) Exercises.drawHand(q(`[data-role=${role}]`), hand, true, {
        button: true,
        decorate: (el, c) => {
          const on = picked.has(cardId(c));
          el.setAttribute("aria-pressed", on);
          if (checked) {
            el.disabled = true;
            if (on && isMaster(c)) el.classList.add("ok");
            else if (on) el.classList.add("ko");
            else if (isMaster(c)) el.classList.add("missed");
            else el.classList.add("dim");
            return;
          }
          if (on) el.classList.add("picked");
          el.onclick = () => {
            on ? picked.delete(cardId(c)) : picked.add(cardId(c));
            draw();
            body.querySelector(`[aria-label="${cardName(c)}"]`)?.focus();
          };
        },
      });
    };
    draw();

    q("[data-role=check]").onclick = () => {
      checked = true;
      draw();
      const mine = [...me, ...dummy];
      const wrong = mine.filter(c => picked.has(cardId(c)) !== isMaster(c)).length;
      const none = !mine.some(isMaster);
      const res = q("[data-role=result]");
      res.className = "ex-result " + (wrong ? "ko" : "ok");
      res.textContent = (wrong ? T("ex.notQuite") : T("ex.ok")) + (none ? T("masters.none") : "") + (wrong ? T("ex.legal.legend") : "");
      const why = q("[data-role=why]");
      why.hidden = false;
      const lines = [0, 1, 2, 3].filter(s => mine.some(c => c.s === s)).map(s => {
        const gone = game.played.filter(c => c.s === s).map(c => c.v).sort((a, b) => b - a);
        const masters = sortForDisplay(mine.filter(c => c.s === s && isMaster(c))).map(c => c.v);
        return `<li>${T("masters.suit", { suit: Exercises.suitName(s), s, top: top(s), gone, masters })}</li>`;
      });
      why.innerHTML = `<p>${T("masters.rule")}</p><ul class="quiz-reasons">${lines.join("")}</ul>`;
      onResult(!wrong, q("[data-role=check]"));
    };
  }

  /* ---------- Une défausse : la répartition de départ de la couleur ----------
     Un joueur ne fournit pas : il n'a plus de cartes de la couleur demandée.
     Si c'est un défenseur, on connaît alors toute la répartition de départ :
     la main du déclarant et le mort au départ, les cartes que le défenseur a
     jouées dans la couleur, et le reste pour le quatrième joueur. */
  const ORDER = ["O", "N", "E", "S"];
  const initialCount = (seat, s) => game.initial[seat].filter(c => c.s === s).length;
  // Défenseurs qui n'ont plus la couleur `s` (ils ont déjà défaussé dessus).
  function voidDefenders(s) {
    const led = {}, voids = new Set();
    for (const h of game.history) {
      if (!(h.trickNo in led)) led[h.trickNo] = h.card.s;
      else if (led[h.trickNo] === s && h.card.s !== s && team(h.seat) === "EO") voids.add(h.seat);
    }
    return voids;
  }

  function discardPanel(body, { seat, card, led }) {
    const s = led;
    const expected = ORDER.map(x => initialCount(x, s));
    const voids = voidDefenders(s);
    body.innerHTML = `
      <div class="ex-led"><div class="ex-led-cards" data-role="card"></div>
        <p>${T("discard.intro", { who: seat === DUMMY ? T("who.dummy") : seatName(seat), card: cardName(card), suit: Exercises.suitName(s) })}</p></div>
      <p class="ex-q">${T("discard.q", { suit: Exercises.suitName(s) })}</p>
      ${seat === DUMMY || seat === DECLARER ? "" : `<p class="quiz-hint">${T("discard.hint")}</p>`}
      <div class="ex-grid-wrap">
        <table class="ex-grid">
          <thead><tr><th scope="col">${T("discard.col.seat")}</th><th scope="col">${T("ex.col.cards")}</th><th scope="col">${T("ex.col.fix")}</th></tr></thead>
          <tbody>
            ${ORDER.map(x => `<tr>
              <th scope="row">${seatName(x)}</th>
              <td><input data-seat="${x}" type="number" inputmode="numeric" min="0" max="10" placeholder="${T("ex.ph.cards")}" aria-label="${T("discard.aria", { seat: seatName(x), s })}"></td>
              <td class="ex-fix" data-fix="${x}"></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>`;
    const q = sel => body.querySelector(sel);
    q("[data-role=card]").appendChild(cardEl(card));

    q("[data-role=check]").onclick = () => {
      let wrong = 0;
      ORDER.forEach((x, i) => {
        const input = q(`[data-seat="${x}"]`);
        const ok = input.value.trim() !== "" && Number(input.value) === expected[i];
        input.classList.add(ok ? "ok" : "ko");
        input.disabled = true;
        if (!ok) wrong++;
        // Comment on le sait, pour chaque joueur.
        let how;
        if (x === "S" || x === "N") how = T(x === "S" ? "discard.how.me" : "discard.how.dummy", { n: expected[i] });
        else if (voids.has(x)) {
          const cards = game.history.filter(h => h.seat === x && h.card.s === s).map(h => h.card.v);
          how = T("discard.how.void", { n: expected[i], cards });
        } else how = T("discard.how.rest", { others: ORDER.filter(y => y !== x).map(y => expected[ORDER.indexOf(y)]), n: expected[i] });
        q(`[data-fix="${x}"]`).innerHTML = `<span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "✗"}</span> ` + how;
      });
      const res = q("[data-role=result]");
      res.className = "ex-result " + (wrong ? "ko" : "ok");
      res.textContent = (wrong ? T("ex.notQuite") : T("ex.ok")) + T("discard.result", { split: expected.join("-"), suit: colorName(s) });
      onResult(!wrong, q("[data-role=check]"));
    };
    q("[data-seat='O']").focus();
  }

  /* ---------- Quelles questions pour cette donne ? ----------
     Mode « all » (entraînement) : toutes les questions, à chaque donne.
     Mode « light » : chaque type de question est tiré au sort, avec au moins
     une question sûre d'arriver dans la donne. */
  const SURE = ["count", "rest0", "rest1", "masters"];   // ces moments arrivent à chaque donne
  const RULE_KINDS = ["lead", "split"];                  // seulement si Ouest suit la règle d'entame
  const OTHER = ["play", "discard"];                     // dépendent du déroulement de la donne
  let plan = null;
  const askedSuits = new Set();                          // défausses déjà questionnées, par couleur
  let playAsked = false;

  function makePlan() {
    const sure = SURE.concat(RULE_LEADERS.includes(game.types.O) ? RULE_KINDS : []);
    if (config.quiz === "all") return new Set(sure.concat(OTHER));
    const p = new Set(sure.concat(OTHER).filter(() => Math.random() < 0.3));
    if (!sure.some(k => p.has(k))) p.add(sure[Math.floor(Math.random() * sure.length)]);
    return p;
  }

  /* ---------- Point d'entrée appelé par la boucle de jeu ---------- */
  async function at(moment, ctx = {}) {
    // Questions seulement quand l'humain est le déclarant.
    if (config.quiz === "off" || !game || game.types.S !== "humain") return;
    // Deux questions de suite : la deuxième seulement si la donne n'a pas changé entre-temps.
    const g = game;
    const ask = async (title, build) => { if (game === g) await askOne(title, build); };
    // Pas de question pendant le dernier pli : il ne reste qu'une carte, aucun choix à faire.
    if (game.tricksWon.NS + game.tricksWon.EO >= 9) return;
    if (!plan) plan = makePlan();
    const pl = plan;
    const all = config.quiz === "all";

    if (moment === "start") {
      if (pl.has("count")) await ask(T("quiz.title.start"), body => Exercises.countPanel(body, {
        hand: game.hands.S, sorted: true, intro: T("quiz.start.intro"), onResult,
      }));
      if (pl.has("rest0")) await ask(T("quiz.title.start"), body => Exercises.restPanel(body, {
        me: game.hands.S, dummy: game.hands.N, intro: T("rest.intro.game"), onResult,
      }));
    } else if (moment === "lead") {
      if (!RULE_LEADERS.includes(game.types.O) || game.history.length !== 1) return;
      if (pl.has("lead")) await ask(T("quiz.title.lead"), leadPanel);
      if (pl.has("split")) await ask(T("quiz.title.lead"), body => Exercises.splitPanel(body, {
        ...westCtx(), bot: PLAYER_TYPES[game.types.O].label, onResult,
      }));
    } else if (moment === "trick") {
      const done = game.tricksWon.NS + game.tricksWon.EO;
      if (done === 1 && pl.has("rest1")) await ask(T("quiz.title.trick1"), body => Exercises.restPanel(body, {
        me: game.hands.S, dummy: game.hands.N, played: game.played, intro: T("rest.intro.game1"), onResult,
      }));
      if (done === 3 && pl.has("masters")) await ask(T("quiz.title.trick3"), mastersPanel);
    } else if (moment === "play") {
      const trickNo = game.tricksWon.NS + game.tricksWon.EO;
      if (!pl.has("play") || !game.trick.length || askedTrick === trickNo) return;
      // Une seule carte jouable : la question n'aurait pas d'intérêt.
      if (legalCards(game.hands[ctx.seat], game.trick).length < 2) return;
      // Entraînement : de temps en temps ; mode léger : une seule fois, à un moment au hasard.
      if (all ? Math.random() >= 0.12 : (playAsked || Math.random() >= 0.25)) return;
      askedTrick = trickNo;
      playAsked = true;
      const seat = ctx.seat;
      await ask(T("quiz.title.play"), body => Exercises.legalPanel(body, {
        hand: game.hands[seat], trick: game.trick.map(p => ({ seat: p.seat, card: p.card })), sorted: true,
        dummy: seat === DUMMY, onResult,
      }));
    } else if (moment === "discard") {
      const led = game.trick[0].card.s;
      // La répartition n'est connue que si un défenseur n'a plus la couleur.
      if (!pl.has("discard") || askedSuits.has(led) || !voidDefenders(led).size) return;
      // Pas à chaque défausse : une fois sur deux en entraînement, une seule fois en mode léger.
      if (all ? Math.random() >= 0.5 : askedSuits.size) return;
      askedSuits.add(led);
      await ask(T("quiz.title.discard"), body => discardPanel(body, { ...ctx, led }));
    }
  }

  // Nouvelle donne : on ferme une question restée ouverte et on oublie ce qui a été demandé.
  function reset() {
    askedTrick = -1;
    plan = null;
    askedSuits.clear();
    playAsked = false;
    if (finish) finish();
  }

  $("quiz-skip").addEventListener("click", () => finish && finish());
  // Touche Échap. L'événement « close » arrive un peu après la fermeture : s'il
  // vient d'une question d'une donne précédente, une nouvelle question est déjà ouverte.
  $("quiz").addEventListener("close", () => { if (!$("quiz").open && finish) finish(); });

  return { at, reset, forEachWestHand, leadPanel };
})();
