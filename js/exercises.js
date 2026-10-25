"use strict";
/* =====================================================================
   EXERCICES : s'entraîner à lire une main de Kiboo.
   - Compter sa main : cartes et points par couleur, total des points
     (les points d'une couleur sont la somme des valeurs de ses cartes).
   - Couleur la plus longue.
   - Cartes jouables : quelles cartes a-t-on le droit de jouer quand une
     couleur est demandée ?
   - Cartes restantes : combien de cartes de chaque couleur ont encore Est
     et Ouest (avant l'entame, ou après le premier pli) ?
   - Répartition de l'entame : comment les cartes de la couleur entamée
     peuvent-elles être réparties entre Ouest et Est (règle d'entame) ?
   - Carré de Coco : voir js/coco.js.

   Chaque exercice est un « panneau » réutilisable : la fenêtre Exercices
   l'affiche sur une main tirée au hasard, les questions en cours de
   partie (js/quiz.js) sur la vraie main du joueur.
     panneau(body, { hand, ..., onResult(ok, button) })
   Après la vérification, onResult reçoit le bouton d'action pour en
   faire « Nouvelle main », « Reprendre la partie » ou « Ouvrir ton cadeau ».
   Utilise makeDeck, shuffle, cardEl, cardId, cardName, sortForDisplay,
   COLORS de js/game.js, et les textes de lang/*.js (T, colorName, cardAdj…).
   ===================================================================== */
const Exercises = (() => {
  const score = { done: 0, ok: 0 };
  let current = "count";

  const randomHand = () => shuffle(makeDeck()).slice(0, 10);
  const suitName = s => `<span class="fam ${COLORS[s]}">${colorName(s)}</span>`;
  const bySuit = (hand, s) => hand.filter(c => c.s === s).sort((a, b) => b.v - a.v);

  // Affiche une main ; `sorted` la range par couleur, `decorate(el, card)` personnalise chaque carte.
  function drawHand(box, hand, sorted, opts = {}) {
    box.innerHTML = "";
    for (const c of sorted ? sortForDisplay(hand) : hand) {
      const el = cardEl(c, { button: !!opts.button });
      if (opts.decorate) opts.decorate(el, c);
      box.appendChild(el);
    }
  }

  // Case « Ranger la main par couleur » (cochée d'office pour une vraie main de jeu).
  const sortBox = checked =>
    `<label class="check ex-sort"><input type="checkbox" data-role="sort"${checked ? " checked" : ""}> ${T("ex.sort")}</label>`;

  function setResult(body, ok, text) {
    const res = body.querySelector("[data-role=result]");
    res.className = "ex-result " + (ok ? "ok" : "ko");
    res.textContent = text;
  }

  /* ---------- 1. Compter sa main ---------- */
  function countPanel(body, opts) {
    const hand = opts.hand;
    body.innerHTML = `
      <p class="ex-q">${T("ex.count.q", { intro: opts.intro || T("ex.count.intro") })}</p>
      ${sortBox(opts.sorted)}
      <div class="ex-hand" data-role="hand"></div>
      <div class="ex-grid-wrap">
        <table class="ex-grid">
          <thead><tr><th scope="col">${T("ex.col.color")}</th><th scope="col">${T("ex.col.cards")}</th><th scope="col">${T("ex.col.points")}</th><th scope="col">${T("ex.col.fix")}</th></tr></thead>
          <tbody>
            ${[0, 1, 2, 3].map(s => `<tr>
              <th scope="row">${suitName(s)}</th>
              <td><input data-n="${s}" type="number" inputmode="numeric" min="0" max="10" placeholder="${T("ex.ph.cards")}" aria-label="${T("ex.aria.cards", { s })}"></td>
              <td><input data-p="${s}" type="number" inputmode="numeric" min="0" max="55" placeholder="${T("ex.ph.points")}" aria-label="${T("ex.aria.points", { s })}"></td>
              <td class="ex-fix" data-fix="${s}"></td></tr>`).join("")}
            <tr class="ex-total">
              <th scope="row">${T("ex.total")}</th><td></td>
              <td><input data-total type="number" inputmode="numeric" min="0" max="100" placeholder="${T("ex.ph.points")}" aria-label="${T("ex.total")}"></td>
              <td class="ex-fix" data-fix="t"></td></tr>
          </tbody>
        </table>
      </div>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>`;

    const q = sel => body.querySelector(sel);
    const draw = () => drawHand(q("[data-role=hand]"), hand, q("[data-role=sort]").checked);
    q("[data-role=sort]").onchange = draw;
    draw();

    q("[data-role=check]").onclick = () => {
      let wrong = 0;
      const mark = (input, expected) => {
        const ok = input.value.trim() !== "" && Number(input.value) === expected;
        input.classList.add(ok ? "ok" : "ko");
        input.disabled = true;
        if (!ok) wrong++;
        return ok;
      };
      const tick = ok => `<span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "✗"}</span> `;
      const sums = [];
      for (let s = 0; s < 4; s++) {
        const cards = bySuit(hand, s);
        const pts = cards.reduce((t, c) => t + c.v, 0);
        sums.push(pts);
        const okN = mark(q(`[data-n="${s}"]`), cards.length);
        const okP = mark(q(`[data-p="${s}"]`), pts);
        q(`[data-fix="${s}"]`).innerHTML = tick(okN && okP) + (cards.length
          ? T("ex.count.fix", { n: cards.length, values: cards.map(c => c.v).join(" + "), pts })
          : T("ex.count.fixNone"));
      }
      const total = sums.reduce((a, b) => a + b, 0);
      const okT = mark(q("[data-total]"), total);
      q('[data-fix="t"]').innerHTML = tick(okT) + T("ex.count.fixTotal", { sums: sums.join(" + "), total });
      setResult(body, !wrong, wrong ? T("ex.count.wrong", { n: wrong }) : T("ex.allRight"));
      opts.onResult(!wrong, q("[data-role=check]"));
    };
    q("[data-n='0']").focus();
  }

  /* ---------- 2. Couleur la plus longue ---------- */
  function longestPanel(body, opts) {
    const hand = opts.hand;
    body.innerHTML = `
      <p class="ex-q">${T("ex.longest.q")}</p>
      ${sortBox(opts.sorted)}
      <div class="ex-hand" data-role="hand"></div>
      <div class="ex-choices" role="group" aria-label="${T("ex.aria.colors")}">
        ${[0, 1, 2, 3].map(s => `<button class="ex-choice" type="button" data-s="${s}">${suitName(s)}</button>`).join("")}
      </div>
      <div class="ex-actions" hidden data-role="next"><button class="act" data-role="check" type="button"></button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>`;

    const q = sel => body.querySelector(sel);
    const draw = () => drawHand(q("[data-role=hand]"), hand, q("[data-role=sort]").checked);
    q("[data-role=sort]").onchange = draw;
    draw();

    const counts = [0, 1, 2, 3].map(s => bySuit(hand, s).length);
    const max = Math.max(...counts);
    const longest = [0, 1, 2, 3].filter(s => counts[s] === max);
    const buttons = [...body.querySelectorAll(".ex-choice")];
    for (const btn of buttons) {
      btn.onclick = () => {
        const ok = longest.includes(+btn.dataset.s);
        buttons.forEach(b => {
          b.disabled = true;
          if (longest.includes(+b.dataset.s)) b.classList.add("ok");
        });
        if (!ok) btn.classList.add("ko");
        setResult(body, ok, T("ex.longest.result", { ok, longest, counts, max }));
        q("[data-role=next]").hidden = false;
        opts.onResult(ok, q("[data-role=check]"));
      };
    }
    buttons[0].focus();
  }

  /* ---------- 3. Cartes jouables ----------
     opts.trick : cartes déjà posées dans le pli [{ seat, card }] (la première fixe la couleur). */
  function legalPanel(body, opts) {
    const { hand, trick } = opts;
    const led = trick[0].card.s;
    const follows = hand.some(c => c.s === led);
    const isLegal = c => !follows || c.s === led;
    const picked = new Set();
    let checked = false;

    const played = trick.map(p => T("ex.legal.playedItem", { seat: seatName(p.seat), card: cardName(p.card) })).join(", ");
    body.innerHTML = `
      <div class="ex-led"><div class="ex-led-cards" data-role="trick"></div>
        <p>${trick.length === 1 ? T("ex.legal.lead", { seat: seatName(trick[0].seat), card: cardName(trick[0].card) }) : T("ex.legal.played", { list: played })}.
        ${T("ex.legal.ledSuit", { suit: suitName(led) })}</p></div>
      <p class="ex-q">${opts.dummy ? T("ex.legal.q.dummy") : T("ex.legal.q.me")}</p>
      ${sortBox(opts.sorted)}
      <div class="ex-hand" data-role="hand"></div>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>`;
    const q = sel => body.querySelector(sel);
    for (const p of trick) q("[data-role=trick]").appendChild(cardEl(p.card));

    const handBox = q("[data-role=hand]");
    const draw = () => drawHand(handBox, hand, q("[data-role=sort]").checked, {
      button: true,
      decorate: (el, c) => {
        const on = picked.has(cardId(c));
        el.setAttribute("aria-pressed", on);
        if (on) el.classList.add("picked");
        if (checked) {
          el.disabled = true;
          if (on && isLegal(c)) el.classList.add("ok");
          else if (on) el.classList.add("ko");
          else if (isLegal(c)) el.classList.add("missed");
          else el.classList.add("dim");
          el.classList.remove("picked");
          return;
        }
        el.onclick = () => {
          on ? picked.delete(cardId(c)) : picked.add(cardId(c));
          draw();
          handBox.querySelector(`[aria-label="${cardName(c)}"]`)?.focus();
        };
      },
    });
    q("[data-role=sort]").onchange = draw;
    draw();

    q("[data-role=check]").onclick = () => {
      checked = true;
      draw();
      const legal = hand.filter(isLegal);
      const wrong = hand.filter(c => picked.has(cardId(c)) !== isLegal(c)).length;
      const why = T("ex.legal.why", { follows, led, n: legal.length, hand: hand.length });
      setResult(body, !wrong, (wrong ? T("ex.notQuite") : T("ex.ok")) + why + (wrong ? T("ex.legal.legend") : ""));
      opts.onResult(!wrong, q("[data-role=check]"));
    };
  }

  // Exercice « Cartes jouables » au hasard : une fois sur trois environ, la
  // main est tirée sans la couleur demandée, pour s'entraîner aussi à défausser.
  function randomLegalSetup() {
    let hand, led, ledOptions;
    do {
      const deck = shuffle(makeDeck());
      led = Math.floor(Math.random() * 4);
      hand = (Math.random() < 0.35 ? deck.filter(c => c.s !== led) : deck).slice(0, 10);
      ledOptions = deck.filter(c => c.s === led && !hand.includes(c));
    } while (!ledOptions.length);
    return { hand, trick: [{ seat: "O", card: ledOptions[Math.floor(Math.random() * ledOptions.length)] }] };
  }

  /* ---------- Moteur de déduction : les mains possibles d'Ouest ----------
     Juste après l'entame, le déclarant voit sa main, le mort et la carte
     d'entame, plus les cartes révélées par un cadeau. Ouest a 10 cartes :
     l'entame, ses cartes révélées et des cartes prises parmi celles que le
     joueur ne voit pas. On garde les mains où la règle d'entame (openingCard)
     choisit exactement la carte entamée.
     ctx : { me, dummy, lead, revealedW: [cartes], revealedE: Set d'id }.
     visit(hand, possible, entame) est appelé pour chaque main possible ; avec
     { all: true }, aussi pour les mains que la règle d'entame exclut
     (possible = false, entame = la carte que la règle aurait jouée). */
  function westHands(ctx, visit, opts = {}) {
    const { lead, revealedW = [], revealedE = new Set() } = ctx;
    const seen = new Set([...ctx.me, ...ctx.dummy, lead, ...revealedW].map(cardId));
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

  // Ce que le déclarant voit, couleur par couleur : ses cartes, celles du mort,
  // et ce qui reste pour Est et Ouest (nombre de cartes et points).
  function remainingTable(me, dummy, lead) {
    const pts = cards => cards.reduce((t, c) => t + c.v, 0);
    const rows = [0, 1, 2, 3].map(s => {
      const seen = new Set([...me, ...dummy].filter(c => c.s === s).map(cardId));
      const rest = makeDeck().filter(c => c.s === s && !seen.has(cardId(c)));
      return {
        s, rest: rest.length, pts: pts(rest), values: rest.map(c => c.v).sort((a, b) => b - a),
        me: me.filter(c => c.s === s).length, dummy: dummy.filter(c => c.s === s).length,
      };
    });
    const html = `<div class="ex-grid-wrap"><table class="ex-grid quiz-rest">
      <thead><tr><th scope="col">${T("ex.col.color")}</th><th scope="col">${T("quiz.col.me")}</th><th scope="col">${T("quiz.col.dummy")}</th><th scope="col">${T("quiz.col.rest")}</th><th scope="col">${T("quiz.col.pts")}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><th scope="row">${suitName(r.s)}</th><td>${r.me}</td><td>${r.dummy}</td>
        <td><strong>${r.rest}</strong>${r.rest ? ` (${r.values.join(", ")})` : ""}${r.s === lead.s ? T("quiz.rest.lead", { v: lead.v }) : ""}</td><td>${r.pts}</td></tr>`).join("")}</tbody>
    </table></div>`;
    return { rows, html };
  }

  // Une main en petit, avec son titre.
  const miniHand = (label, role) =>
    `<p class="quiz-label">${label}</p><div class="ex-hand quiz-mini" data-role="${role}"></div>`;

  // Bouton qui montre ou cache la règle d'entame (la même que dans les Règles du jeu).
  function ruleToggle(q) {
    q("[data-role=rule]").innerHTML = $("lead-rule").innerHTML;
    q("[data-role=rule-btn]").onclick = e => {
      const box = q("[data-role=rule]"), open = box.hidden;
      box.hidden = !open;
      e.currentTarget.setAttribute("aria-expanded", open);
      e.currentTarget.textContent = open ? T("quiz.rule.hide") : T("quiz.rule.show");
    };
  }
  const ruleBlock = () => `<button class="act ghost quiz-rule-btn" type="button" data-role="rule-btn" aria-expanded="true">${T("quiz.rule.hide")}</button>
      <div class="quiz-rule" data-role="rule"></div>`;

  /* ---------- 4. Cartes restantes chez Est et Ouest ----------
     Combien de cartes de chaque couleur ont encore les adversaires ?
     opts : { me, dummy (cartes encore en main), played (cartes déjà jouées,
     par les quatre joueurs), shown (cartes du pli affichées, ou rien),
     intro, onResult }. */
  function restPanel(body, opts) {
    const { me, dummy, played = [] } = opts;
    const n = (cards, s) => cards.filter(c => c.s === s).length;
    const expected = [0, 1, 2, 3].map(s => 10 - n(me, s) - n(dummy, s) - n(played, s));
    body.innerHTML = `
      ${opts.shown ? `<div class="ex-led"><div class="ex-led-cards" data-role="shown"></div><p>${opts.intro}</p></div>` : `<p>${opts.intro}</p>`}
      <p class="ex-q">${T(played.length ? "rest.q.after" : "rest.q.before")}</p>
      ${miniHand(T("quiz.dummy"), "dummy")}
      ${miniHand(T("quiz.me"), "me")}
      <div class="ex-grid-wrap">
        <table class="ex-grid">
          <thead><tr><th scope="col">${T("ex.col.color")}</th><th scope="col">${T("rest.col")}</th><th scope="col">${T("ex.col.fix")}</th></tr></thead>
          <tbody>
            ${[0, 1, 2, 3].map(s => `<tr>
              <th scope="row">${suitName(s)}</th>
              <td><input data-n="${s}" type="number" inputmode="numeric" min="0" max="10" placeholder="${T("ex.ph.cards")}" aria-label="${T("rest.aria", { s })}"></td>
              <td class="ex-fix" data-fix="${s}"></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="ex-actions"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>`;
    const q = sel => body.querySelector(sel);
    if (opts.shown) for (const c of opts.shown) q("[data-role=shown]").appendChild(cardEl(c));
    drawHand(q("[data-role=dummy]"), dummy, true);
    drawHand(q("[data-role=me]"), me, true);

    q("[data-role=check]").onclick = () => {
      let wrong = 0;
      for (let s = 0; s < 4; s++) {
        const input = q(`[data-n="${s}"]`);
        const ok = input.value.trim() !== "" && Number(input.value) === expected[s];
        input.classList.add(ok ? "ok" : "ko");
        input.disabled = true;
        if (!ok) wrong++;
        const gone = played.filter(c => c.s === s).map(c => c.v).sort((a, b) => b - a);
        q(`[data-fix="${s}"]`).innerHTML = `<span class="${ok ? "ok" : "ko"}">${ok ? "✓" : "✗"}</span> ` +
          T("rest.fix", { me: n(me, s), dummy: n(dummy, s), gone, rest: expected[s] });
      }
      setResult(body, !wrong, wrong ? T("ex.count.wrong", { n: wrong }) : T("ex.allRight"));
      opts.onResult(!wrong, q("[data-role=check]"));
    };
    q("[data-n='0']").focus();
  }

  /* ---------- 5. Répartition de la couleur d'entame ----------
     Ouest a entamé selon la règle de Piperno : comment les cartes de la
     couleur d'entame que le déclarant ne voit pas peuvent-elles être
     réparties entre Ouest et Est ? La réponse vient du moteur de déduction.
     opts : { me, dummy, lead, bot, revealedW, revealedE, onResult }. */
  function splitPanel(body, opts) {
    const { me, dummy, lead } = opts;
    const L = lead.s;
    const count = (h, s) => h.filter(c => c.s === s).length;
    const restL = 10 - count(me, L) - count(dummy, L);        // entame comprise
    const splits = Array.from({ length: restL }, (_, i) => i + 1);   // cartes d'Ouest dans la couleur
    const per = Array.from({ length: 11 }, () => ({ n: 0, example: null, exists: false, longest: false, card: false, suit: false }));
    westHands(opts, (h, possible, chosen) => {
      const st = per[count(h, L)];
      st.exists = true;
      if (possible) { st.n++; if (Math.random() * st.n < 1) st.example = h; return; }
      // Main exclue : le L était-il au moins sa couleur la plus longue ?
      if ([0, 1, 2, 3].some(x => count(h, x) > count(h, L))) return;
      st.longest = true;
      if (chosen.s === L) st.card = true; else st.suit = true;
    }, { all: true });
    const good = w => per[w].n > 0;

    body.innerHTML = `
      <div class="ex-led"><div class="ex-led-cards" data-role="lead"></div>
        <p>${T("quiz.led", { bot: opts.bot, card: cardName(lead) })}</p></div>
      <p class="ex-q">${T("split.q", { L, rest: restL, v: lead.v })}</p>
      ${ruleBlock()}
      ${miniHand(T("quiz.dummy"), "dummy")}
      ${miniHand(T("quiz.me"), "me")}
      <div class="ex-choices" role="group" aria-label="${T("quiz.aria.answers")}">
        ${splits.map(w => `<button class="ex-choice" type="button" data-w="${w}" aria-pressed="false">${T("split.choice", { w, e: restL - w })}</button>`).join("")}
      </div>
      <div class="ex-actions" data-role="next"><button class="act" data-role="check" type="button">${T("ex.check")}</button></div>
      <p class="ex-result" data-role="result" aria-live="polite"></p>
      <div class="quiz-why" data-role="why" hidden></div>`;
    const q = sel => body.querySelector(sel);
    q("[data-role=lead]").appendChild(cardEl(lead));
    ruleToggle(q);
    drawHand(q("[data-role=dummy]"), dummy, true);
    drawHand(q("[data-role=me]"), me, true);

    const picks = [...body.querySelectorAll("[data-w]")];
    for (const p of picks) p.onclick = () => p.setAttribute("aria-pressed", p.getAttribute("aria-pressed") !== "true");
    q("[data-role=check]").onclick = () => {
      let ok = true;
      for (const p of picks) {
        const on = p.getAttribute("aria-pressed") === "true", g = good(+p.dataset.w);
        p.disabled = true;
        if (g) p.classList.add(on ? "ok" : "missed");
        else if (on) p.classList.add("ko");
        if (on !== g) ok = false;
      }
      const goods = splits.filter(good);
      setResult(body, ok, (ok ? T("ex.ok") : T("ex.notQuite")) +
        T("split.result", { list: goods.map(w => T("split.choice", { w, e: restL - w })) }));

      // Le raisonnement, répartition par répartition.
      const why = q("[data-role=why]");
      why.hidden = false;
      const table = remainingTable(me, dummy, lead);
      const lines = splits.map(w => {
        const st = per[w], label = T("split.choice", { w, e: restL - w });
        if (st.n) return `<li>${T("split.possible", { label, n: st.n, nTxt: I18N.g("num")(st.n) })}</li>`;
        if (!st.exists) return `<li>${T("split.none", { label })}</li>`;
        if (!st.longest) return `<li>${T("split.short", { label, w, L, pigeon: Math.ceil((10 - w) / 3) > w })}</li>`;
        const parts = [];
        if (st.card) parts.push(T("split.card", { L, v: lead.v }));
        if (st.suit) parts.push(T("split.suit", { L }));
        return `<li>${T("split.rule", { label, w, L, parts: parts.join(T("quiz.same.or")) })}</li>`;
      });
      why.innerHTML = `<p class="quiz-label">${T("quiz.unseen")}</p>${table.html}
        <p class="quiz-label">${T("split.detail")}</p><ul class="quiz-reasons">${lines.join("")}</ul>`;
      const ex = goods[Math.floor(Math.random() * goods.length)];
      if (ex !== undefined) {
        why.insertAdjacentHTML("beforeend", `<p class="quiz-label">${T("split.example", { label: T("split.choice", { w: ex, e: restL - ex }) })}</p><div class="ex-hand quiz-mini" data-role="example"></div>`);
        drawHand(q("[data-role=example]"), per[ex].example, true);
      }
      opts.onResult(ok, q("[data-role=check]"));
    };
    picks[0].focus();
  }

  // Exercices hors partie : une donne tirée au hasard, Ouest entame selon la règle.
  function randomDeal() {
    const deck = shuffle(makeDeck());
    return { O: deck.slice(0, 10), N: deck.slice(10, 20), E: deck.slice(20, 30), S: deck.slice(30, 40) };
  }
  // Une fois sur deux, le premier pli est déjà joué (les quatre joueurs suivent les règles de Piperno).
  function randomRestSetup() {
    const d = randomDeal();
    if (Math.random() < 0.5) return { me: d.S, dummy: d.N, played: [], intro: T("rest.intro.before") };
    const trick = [], played = [];
    for (const seat of ["O", "N", "E", "S"]) {
      const hand = d[seat];
      const legal = legalCards(hand, trick);
      const card = new DeterministicBot().choose({ seat, hand, trick, played: played.slice(), legal });
      d[seat] = hand.filter(c => c !== card);
      trick.push({ seat, card });
      played.push(card);
    }
    return { me: d.S, dummy: d.N, played, shown: played, intro: T("rest.intro.trick", { list: trick.map(p => T("ex.legal.playedItem", { seat: seatName(p.seat), card: cardName(p.card) })).join(", ") }) };
  }
  function randomSplitSetup() {
    const d = randomDeal();
    return { me: d.S, dummy: d.N, lead: openingCard(d.O), bot: "Piperno" };
  }

  /* ---------- La fenêtre Exercices ---------- */
  const PANELS = {
    count: body => countPanel(body, { hand: randomHand(), onResult }),
    longest: body => longestPanel(body, { hand: randomHand(), onResult }),
    legal: body => legalPanel(body, { ...randomLegalSetup(), onResult }),
    rest: body => restPanel(body, { ...randomRestSetup(), onResult }),
    split: body => splitPanel(body, { ...randomSplitSetup(), onResult }),
    coco: body => Coco.staticPanel(body, { onResult }),
  };

  function onResult(ok, btn) {
    score.done++;
    if (ok) score.ok++;
    renderScore();
    Rewards.answered(ok);
    const next = btn => { btn.textContent = T("ex.newHand"); btn.onclick = render; btn.focus(); };
    if (Rewards.giftReady({ canReveal: false })) {
      btn.textContent = T("ex.openGift");
      btn.onclick = () => Rewards.giftPanel($("ex-body"), {
        canReveal: false, doneLabel: T("ex.continue"), onDone: render,
      });
      btn.focus();
    } else next(btn);
  }

  function renderScore() {
    $("ex-score").textContent = score.done ? T("ex.score", score) : T("ex.scoreNone");
  }

  function render() {
    for (const tab of document.querySelectorAll(".ex-tabs [role=tab]")) {
      tab.setAttribute("aria-selected", tab.dataset.ex === current);
    }
    PANELS[current]($("ex-body"));
    Voice.auto(T("voice.ex." + current));
    Account.setContext("ex." + current);
  }

  function open() {
    if (!$("ex-body").childElementCount) render();
    renderScore();
    Rewards.refresh();
    $("exercises").showModal();
  }

  for (const tab of document.querySelectorAll(".ex-tabs [role=tab]")) {
    tab.addEventListener("click", () => { current = tab.dataset.ex; render(); });
  }
  $("btn-exercises").addEventListener("click", open);
  $("btn-ex-close").addEventListener("click", () => $("exercises").close());
  $("exercises").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  // Changement de langue : l'exercice affiché sera recréé à la prochaine ouverture.
  document.addEventListener("kiboo-lang", () => { $("ex-body").innerHTML = ""; });

  return { get current() { return current; }, countPanel, longestPanel, legalPanel, restPanel, splitPanel, westHands, remainingTable, ruleBlock, ruleToggle, drawHand, suitName };
})();
