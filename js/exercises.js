"use strict";
/* =====================================================================
   EXERCICES : s'entraîner à lire une main de Kiboo.
   - Compter sa main : cartes et points par couleur, total des points
     (les points d'une couleur sont la somme des valeurs de ses cartes).
   - Couleur la plus longue.
   - Cartes jouables : quelles cartes a-t-on le droit de jouer quand une
     couleur est demandée ?

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

  /* ---------- La fenêtre Exercices ---------- */
  const PANELS = {
    count: body => countPanel(body, { hand: randomHand(), onResult }),
    longest: body => longestPanel(body, { hand: randomHand(), onResult }),
    legal: body => legalPanel(body, { ...randomLegalSetup(), onResult }),
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

  return { countPanel, longestPanel, legalPanel, drawHand, suitName };
})();
