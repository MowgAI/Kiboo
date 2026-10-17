"use strict";
/* =====================================================================
   EXERCICES : s'entraîner à lire une main de Kiboo.
   - Compter sa main : cartes et points par couleur, total des points
     (les points d'une couleur sont la somme des valeurs de ses cartes).
   - Couleur la plus longue.
   - Cartes jouables : quelles cartes a-t-on le droit de jouer quand une
     couleur est demandée ?
   Utilise makeDeck, shuffle, cardEl, cardId, cardName, sortForDisplay,
   COLORS et COLOR_NAMES de js/game.js.
   ===================================================================== */
const Exercises = (() => {
  const score = { done: 0, ok: 0 };
  let current = "count";

  const randomHand = () => shuffle(makeDeck()).slice(0, 10);
  const suitName = s => `<span class="fam ${COLORS[s]}">${COLOR_NAMES[s]}</span>`;
  const bySuit = (hand, s) => hand.filter(c => c.s === s).sort((a, b) => b.v - a.v);
  const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
  // Couleur accordée avec « carte » : une carte bleue, des cartes bleues.
  const ADJ = ["bleue", "verte", "rouge", "jaune"];
  const adj = (s, n) => ADJ[s] + (n > 1 ? "s" : "");

  function recordAttempt(success) {
    score.done++;
    if (success) score.ok++;
    renderScore();
  }
  function renderScore() {
    $("ex-score").textContent = score.done
      ? `Exercices réussis : ${score.ok} sur ${score.done}`
      : "Choisis un exercice. Tes réussites s'affichent ici.";
  }

  // Affiche une main ; `sorted` la range par couleur, `decorate(el, card)` personnalise chaque carte.
  function drawHand(box, hand, sorted, opts = {}) {
    box.innerHTML = "";
    for (const c of sorted ? sortForDisplay(hand) : hand) {
      const el = cardEl(c, { button: !!opts.button });
      if (opts.decorate) opts.decorate(el, c);
      box.appendChild(el);
    }
  }

  // Case « Ranger la main par couleur », commune aux trois exercices.
  const sortBox = `<label class="check ex-sort"><input type="checkbox" id="ex-sort"> Ranger la main par couleur</label>`;

  function nextButton(body) {
    const btn = body.querySelector("#ex-check");
    btn.textContent = "Nouvelle main";
    btn.onclick = () => render();
    btn.focus();
  }

  /* ---------- 1. Compter sa main ---------- */
  function countExercise(body) {
    const hand = randomHand();
    body.innerHTML = `
      <p class="ex-q">Voici une main de 10 cartes. Pour chaque couleur, combien as-tu de <strong>cartes</strong> et combien de <strong>points</strong> ? Les points d'une couleur sont la somme des valeurs de ses cartes.</p>
      ${sortBox}
      <div class="ex-hand" id="ex-hand"></div>
      <div class="ex-grid-wrap">
        <table class="ex-grid">
          <thead><tr><th scope="col">Couleur</th><th scope="col">Cartes</th><th scope="col">Points</th><th scope="col">Correction</th></tr></thead>
          <tbody>
            ${[0, 1, 2, 3].map(s => `<tr>
              <th scope="row">${suitName(s)}</th>
              <td><input id="ex-n-${s}" type="number" inputmode="numeric" min="0" max="10" placeholder="cartes" aria-label="Nombre de cartes ${COLOR_NAMES[s]}"></td>
              <td><input id="ex-p-${s}" type="number" inputmode="numeric" min="0" max="55" placeholder="points" aria-label="Points ${COLOR_NAMES[s]}"></td>
              <td class="ex-fix" id="ex-fix-${s}"></td></tr>`).join("")}
            <tr class="ex-total">
              <th scope="row">Total des points</th><td></td>
              <td><input id="ex-total" type="number" inputmode="numeric" min="0" max="100" placeholder="points" aria-label="Total des points"></td>
              <td class="ex-fix" id="ex-fix-t"></td></tr>
          </tbody>
        </table>
      </div>
      <div class="ex-actions"><button class="act" id="ex-check" type="button">Vérifier</button></div>
      <p class="ex-result" id="ex-result" aria-live="polite"></p>`;

    const handBox = body.querySelector("#ex-hand");
    const draw = () => drawHand(handBox, hand, body.querySelector("#ex-sort").checked);
    body.querySelector("#ex-sort").onchange = draw;
    draw();

    body.querySelector("#ex-check").onclick = () => {
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
        const okN = mark($("ex-n-" + s), cards.length);
        const okP = mark($("ex-p-" + s), pts);
        $("ex-fix-" + s).innerHTML = tick(okN && okP) + (cards.length
          ? `${plural(cards.length, "carte")} : ${cards.map(c => c.v).join(" + ")} = ${plural(pts, "point")}`
          : "0 carte : 0 point");
      }
      const total = sums.reduce((a, b) => a + b, 0);
      const okT = mark($("ex-total"), total);
      $("ex-fix-t").innerHTML = tick(okT) + `${sums.join(" + ")} = ${plural(total, "point")}`;

      const res = $("ex-result");
      res.className = "ex-result " + (wrong ? "ko" : "ok");
      res.textContent = wrong
        ? `${plural(wrong, "réponse")} à revoir : la correction est indiquée pour chaque ligne.`
        : "Bravo, tout est juste !";
      recordAttempt(!wrong);
      nextButton(body);
    };
    body.querySelector("#ex-n-0").focus();
  }

  /* ---------- 2. Couleur la plus longue ---------- */
  function longestExercise(body) {
    const hand = randomHand();
    body.innerHTML = `
      <p class="ex-q">Quelle est ta <strong>couleur la plus longue</strong>, c'est-à-dire celle où tu as le plus de cartes ?</p>
      ${sortBox}
      <div class="ex-hand" id="ex-hand"></div>
      <div class="ex-choices" role="group" aria-label="Couleurs">
        ${[0, 1, 2, 3].map(s => `<button class="ex-choice" type="button" data-s="${s}">${suitName(s)}</button>`).join("")}
      </div>
      <div class="ex-actions" hidden id="ex-next"><button class="act" id="ex-check" type="button">Nouvelle main</button></div>
      <p class="ex-result" id="ex-result" aria-live="polite"></p>`;

    const handBox = body.querySelector("#ex-hand");
    const draw = () => drawHand(handBox, hand, body.querySelector("#ex-sort").checked);
    body.querySelector("#ex-sort").onchange = draw;
    draw();

    const counts = [0, 1, 2, 3].map(s => bySuit(hand, s).length);
    const max = Math.max(...counts);
    const longest = [0, 1, 2, 3].filter(s => counts[s] === max);
    const buttons = [...body.querySelectorAll(".ex-choice")];
    for (const btn of buttons) {
      btn.onclick = () => {
        const chosen = +btn.dataset.s;
        const ok = longest.includes(chosen);
        buttons.forEach(b => {
          b.disabled = true;
          if (longest.includes(+b.dataset.s)) b.classList.add("ok");
        });
        if (!ok) btn.classList.add("ko");
        const detail = [0, 1, 2, 3].map(s => `${COLOR_NAMES[s]} ${counts[s]}`).join(", ");
        const tie = longest.length > 1
          ? ` ${longest.map(s => COLOR_NAMES[s]).join(" et ")} ont chacune ${max} cartes : ${longest.length === 2 ? "les deux réponses sont justes" : "toutes ces réponses sont justes"}.`
          : "";
        const res = $("ex-result");
        res.className = "ex-result " + (ok ? "ok" : "ko");
        res.textContent = (ok ? "Bravo ! " : `Pas tout à fait : ta couleur la plus longue est le ${longest.map(s => COLOR_NAMES[s]).join(" ou le ")}. `) +
          `Nombre de cartes : ${detail}.` + tie;
        recordAttempt(ok);
        body.querySelector("#ex-next").hidden = false;
        nextButton(body);
      };
    }
    buttons[0].focus();
  }

  /* ---------- 3. Cartes jouables ---------- */
  function legalExercise(body) {
    // Une main tirée au hasard a presque toujours les quatre couleurs : pour
    // qu'on s'entraîne aussi à défausser, une fois sur trois environ la main
    // est tirée sans la couleur demandée.
    let hand, led, ledOptions;
    do {
      const deck = shuffle(makeDeck());
      led = Math.floor(Math.random() * 4);
      hand = (Math.random() < 0.35 ? deck.filter(c => c.s !== led) : deck).slice(0, 10);
      ledOptions = deck.filter(c => c.s === led && !hand.includes(c));
    } while (!ledOptions.length);
    const ledCard = ledOptions[Math.floor(Math.random() * ledOptions.length)];
    const follows = hand.some(c => c.s === led);
    const isLegal = c => !follows || c.s === led;
    const picked = new Set();
    let checked = false;

    body.innerHTML = `
      <div class="ex-led"><div id="ex-led-card"></div>
        <p>Ouest entame le <strong>${cardName(ledCard)}</strong> : la couleur demandée est le ${suitName(led)}.</p></div>
      <p class="ex-q">Clique sur <strong>toutes les cartes</strong> que tu as le droit de jouer, puis vérifie.</p>
      ${sortBox}
      <div class="ex-hand" id="ex-hand"></div>
      <div class="ex-actions"><button class="act" id="ex-check" type="button">Vérifier</button></div>
      <p class="ex-result" id="ex-result" aria-live="polite"></p>`;
    body.querySelector("#ex-led-card").appendChild(cardEl(ledCard));

    const handBox = body.querySelector("#ex-hand");
    const draw = () => drawHand(handBox, hand, body.querySelector("#ex-sort").checked, {
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
    body.querySelector("#ex-sort").onchange = draw;
    draw();

    body.querySelector("#ex-check").onclick = () => {
      checked = true;
      draw();
      const legal = hand.filter(isLegal);
      const wrong = hand.filter(c => picked.has(cardId(c)) !== isLegal(c)).length;
      const res = $("ex-result");
      res.className = "ex-result " + (wrong ? "ko" : "ok");
      const why = follows
        ? `Tu as du ${COLOR_NAMES[led]} : tu dois fournir. ` + (legal.length === 1
          ? `Seule ta carte ${adj(led, 1)} est jouable.`
          : `Seules tes ${legal.length} cartes ${adj(led, 2)} sont jouables.`)
        : `Tu n'as pas de ${COLOR_NAMES[led]} : tu peux défausser n'importe quelle carte. Les 10 sont jouables.`;
      res.textContent = (wrong ? "Pas tout à fait. " : "Bravo ! ") + why +
        (wrong ? " Les cartes entourées en pointillés étaient jouables mais non choisies ; celles entourées de rouge ne l'étaient pas." : "");
      recordAttempt(!wrong);
      nextButton(body);
    };
  }

  const EXERCISES = { count: countExercise, longest: longestExercise, legal: legalExercise };

  function render() {
    for (const tab of document.querySelectorAll(".ex-tabs [role=tab]")) {
      tab.setAttribute("aria-selected", tab.dataset.ex === current);
    }
    EXERCISES[current]($("ex-body"));
  }

  function open() {
    if (!$("ex-body").childElementCount) render();
    renderScore();
    $("exercises").showModal();
  }

  for (const tab of document.querySelectorAll(".ex-tabs [role=tab]")) {
    tab.addEventListener("click", () => { current = tab.dataset.ex; render(); });
  }
  $("btn-exercises").addEventListener("click", open);
  $("btn-ex-close").addEventListener("click", () => $("exercises").close());
  $("exercises").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  return { open };
})();
