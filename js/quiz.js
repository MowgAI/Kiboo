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
    { key: "yes", label: "Oui, forcément" },
    { key: "no", label: "Non, c'est impossible" },
    { key: "maybe", label: "On ne peut pas savoir" },
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
    const resume = () => { btn.textContent = "Reprendre la partie"; btn.onclick = () => finish && finish(); btn.focus(); };
    const giftOpts = {
      canReveal: canReveal(),
      revealable: seat => hiddenCards(seat).length > 0,
      reveal,
      doneLabel: "Reprendre la partie",
      onDone: () => finish && finish(),
    };
    if (Rewards.giftReady(giftOpts)) {
      btn.textContent = "Ouvrir ton cadeau";
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
    render();
    return card;
  }

  /* ---------- Moteur de déduction : les mains possibles d'Ouest ----------
     Juste après l'entame, le joueur (Sud) voit sa main, le mort et la carte
     d'entame, plus les cartes révélées par un cadeau. Ouest a 10 cartes :
     l'entame, ses cartes révélées et des cartes prises parmi celles que le
     joueur ne voit pas. On garde les mains où la règle d'entame (openingCard)
     choisit exactement la carte entamée.
     visit(hand) est appelé pour chaque main possible. */
  function forEachWestHand(visit) {
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
      if (cardId(openingCard(hand)) === leadId) visit(hand);
      let i = k - 1;
      while (i >= 0 && idx[i] === n - k + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
  }

  // Les questions de déduction après l'entame. Chacune : texte, rappel de la règle, prédicat.
  function leadQuestions(lead) {
    const L = lead.s, V = lead.v, col = COLOR_NAMES[L];
    const count = (h, s) => h.filter(c => c.s === s).length;
    const list = [
      {
        text: `Ouest peut-il avoir <strong>autant de cartes</strong> dans une autre couleur que le ${Exercises.suitName(L)} ?`,
        rule: "À longueur égale, la règle d'entame choisit la couleur qui a le plus de points (à points égaux, la dernière dans l'ordre bleu, vert, rouge, jaune). Une autre couleur aussi longue est donc possible si elle a moins de points.",
        test: h => [0, 1, 2, 3].some(s => s !== L && count(h, s) === count(h, L)),
      },
    ];
    if (V < 10) list.push({
      text: `Ouest a entamé le ${V} ${col}. Peut-il avoir une <strong>carte ${Exercises.adj(L, 1)} plus forte</strong> que le ${V} ?`,
      rule: "La règle d'entame fait jouer la plus haute carte d'une séquence (au moins deux cartes qui se suivent) ; sans séquence, la plus petite carte de la couleur.",
      test: h => h.some(c => c.s === L && c.v > V),
    });
    if (V > 1) list.push({
      text: `Ouest a entamé le ${V} ${col}. Peut-il avoir une <strong>carte ${Exercises.adj(L, 1)} plus faible</strong> que le ${V} ?`,
      rule: "La règle d'entame fait jouer la plus haute carte d'une séquence (au moins deux cartes qui se suivent) ; sans séquence, la plus petite carte de la couleur.",
      test: h => h.some(c => c.s === L && c.v < V),
    });
    return list;
  }

  function leadPanel(body) {
    const lead = game.history[0].card;
    const questions = leadQuestions(lead);
    const Q = questions[Math.floor(Math.random() * questions.length)];

    // Passe en revue les mains possibles ; garde un exemple au hasard de chaque cas.
    let total = 0, yes = 0, exYes = null, exNo = null;
    forEachWestHand(h => {
      total++;
      if (Q.test(h)) { yes++; if (Math.random() * yes < 1) exYes = h; }
      else if (Math.random() * (total - yes) < 1) exNo = h;
    });
    const truth = yes === total ? "yes" : yes === 0 ? "no" : "maybe";

    body.innerHTML = `
      <div class="ex-led"><div class="ex-led-cards" data-role="lead"></div>
        <p>Ouest (${PLAYER_TYPES[game.types.O].label}) a entamé le <strong>${cardName(lead)}</strong>. Il suit la règle d'entame de Piperno.</p></div>
      <p class="ex-q">${Q.text}</p>
      <button class="act ghost quiz-rule-btn" type="button" data-role="rule-btn" aria-expanded="true">Cacher la règle d'entame</button>
      <div class="quiz-rule" data-role="rule"></div>
      <p class="quiz-label">Le mort (Nord)</p><div class="ex-hand quiz-mini" data-role="dummy"></div>
      <p class="quiz-label">Ta main (Sud, déclarant)</p><div class="ex-hand quiz-mini" data-role="me"></div>
      <div class="ex-choices" role="group" aria-label="Réponses">
        ${ANSWERS.map(a => `<button class="ex-choice" type="button" data-a="${a.key}">${a.label}</button>`).join("")}
      </div>
      <div class="ex-actions" hidden data-role="next"><button class="act" data-role="check" type="button"></button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <div class="quiz-why" data-role="why" hidden></div>`;
    const q = sel => body.querySelector(sel);
    q("[data-role=lead]").appendChild(cardEl(lead));
    // La règle d'entame (la même que dans les Règles du jeu), affichée d'office pendant la question.
    q("[data-role=rule]").innerHTML = $("lead-rule").innerHTML;
    q("[data-role=rule-btn]").onclick = e => {
      const box = q("[data-role=rule]"), open = box.hidden;
      box.hidden = !open;
      e.currentTarget.setAttribute("aria-expanded", open);
      e.currentTarget.textContent = open ? "Cacher la règle d'entame" : "Voir la règle d'entame";
    };
    Exercises.drawHand(q("[data-role=me]"), game.hands.S, true);
    Exercises.drawHand(q("[data-role=dummy]"), game.hands.N, true);

    const buttons = [...body.querySelectorAll("[data-a]")];
    for (const b of buttons) b.onclick = () => {
      const ok = b.dataset.a === truth;
      buttons.forEach(x => { x.disabled = true; if (x.dataset.a === truth) x.classList.add("ok"); });
      if (!ok) b.classList.add("ko");
      const answer = ANSWERS.find(a => a.key === truth).label;
      const res = q("[data-role=result]");
      res.className = "ex-result " + (ok ? "ok" : "ko");
      res.textContent = (ok ? "Bravo ! " : "Pas tout à fait. ") + `La bonne réponse : ${answer.toLowerCase()}.`;

      // Le raisonnement : la règle, puis le décompte des mains possibles et des exemples.
      const fmt = n => n.toLocaleString("fr-FR");
      const why = q("[data-role=why]");
      why.hidden = false;
      why.innerHTML = `<p>${Q.rule}</p>
        <p>Avec les cartes que tu vois et la règle d'entame, Ouest peut avoir <strong>${fmt(total)}</strong> main${total > 1 ? "s" : ""} différente${total > 1 ? "s" : ""}.
        La réponse est oui dans <strong>${fmt(yes)}</strong> d'entre elles${truth === "maybe" ? ` et non dans ${fmt(total - yes)}` : ""}.</p>`;
      const example = (h, label) => {
        const p = document.createElement("p");
        p.className = "quiz-label";
        p.textContent = label;
        const box = document.createElement("div");
        box.className = "ex-hand quiz-mini";
        Exercises.drawHand(box, h, true);
        why.append(p, box);
      };
      if (exYes) example(exYes, truth === "maybe" ? "Une main possible d'Ouest où la réponse est oui :" : "Par exemple, Ouest pourrait avoir :");
      if (exNo) example(exNo, truth === "maybe" ? "Une main possible d'Ouest où la réponse est non :" : "Par exemple, Ouest pourrait avoir :");
      q("[data-role=next]").hidden = false;
      onResult(ok, q("[data-role=check]"));
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
      await ask("Question : avant l'entame", body => Exercises.countPanel(body, {
        hand: game.hands.S, sorted: true, intro: "La donne commence. Voici ta main.", onResult,
      }));
    } else if (moment === "lead") {
      if (!RULE_LEADERS.includes(game.types.O) || game.history.length !== 1) return;
      await ask("Question : après l'entame", leadPanel);
    } else if (moment === "play") {
      const trickNo = game.tricksWon.NS + game.tricksWon.EO;
      if (!game.trick.length || askedTrick === trickNo) return;
      // Une seule carte jouable : la question n'aurait pas d'intérêt.
      if (legalCards(game.hands[ctx.seat], game.trick).length < 2) return;
      askedTrick = trickNo;
      const seat = ctx.seat;
      await ask("Question : avant de jouer", body => Exercises.legalPanel(body, {
        hand: game.hands[seat], trick: game.trick.map(p => ({ seat: p.seat, card: p.card })), sorted: true,
        whose: seat === DUMMY ? "que le mort a" : "que tu as", onResult,
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

  return { at, reset, forEachWestHand };
})();
