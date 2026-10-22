"use strict";
/* =====================================================================
   CADEAUX ET COLLECTION
   Toutes les 3 bonnes réponses (exercices et questions en cours de
   partie, cumulées : une erreur ne fait pas perdre les points acquis),
   le joueur choisit un cadeau :
   - voir une carte cachée d'Ouest ou d'Est (seulement pendant une partie) ;
   - gagner une carte de Kiboo pour sa collection (40 cartes à réunir).
   La progression et la collection sont gardées dans ce navigateur.
   ===================================================================== */
const Rewards = (() => {
  const KEY = "kiboo.rewards.v1";
  const GOAL = 3;
  let state = { progress: 0, collection: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.collection)) {
      state = { progress: Math.min(GOAL, saved.progress | 0), collection: saved.collection.filter(n => n >= 0 && n < 40) };
    }
  } catch (e) { /* stockage indisponible : on garde l'état en mémoire */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* idem */ }
  }

  const owned = () => new Set(state.collection);
  const complete = () => state.collection.length >= 40;

  function answered(ok) {
    if (ok && state.progress < GOAL) state.progress++;
    save();
    refresh();
  }

  // Un cadeau est prêt si 3 bonnes réponses sont acquises et qu'il reste quelque chose à offrir.
  function giftReady({ canReveal }) {
    return state.progress >= GOAL && (canReveal || !complete());
  }

  // Met à jour les indicateurs de progression et le bouton Collection.
  function refresh() {
    for (const el of document.querySelectorAll(".gift-progress")) {
      const dots = "●".repeat(state.progress) + "○".repeat(GOAL - state.progress);
      el.innerHTML = `${T("gift.next")} <span class="dots" aria-hidden="true">${dots}</span>`;
      el.setAttribute("aria-label", T("gift.aria", { n: state.progress, goal: GOAL }));
    }
    const btn = $("btn-album");
    if (btn) btn.textContent = T("album.btn", { n: state.collection.length });
  }

  // Ajoute à la collection une carte qu'on n'a pas encore (null si elle est complète).
  function grantCard() {
    const have = owned();
    const missing = makeDeck().filter(c => !have.has(cardId(c)));
    if (!missing.length) return null;
    const card = missing[Math.floor(Math.random() * missing.length)];
    state.collection.push(cardId(card));
    save();
    refresh();
    return card;
  }

  /* Panneau de choix du cadeau, affiché dans `box`.
     opts = { canReveal, reveal(seat) -> carte | null, revealable(seat) -> bool, doneLabel, onDone } */
  function giftPanel(box, opts) {
    const canO = opts.canReveal && opts.revealable("O");
    const canE = opts.canReveal && opts.revealable("E");
    box.innerHTML = `
      <div class="gift">
        <h3>${T("gift.title", { goal: GOAL })}</h3>
        <div class="ex-choices" data-role="choices">
          ${canO ? `<button class="ex-choice" type="button" data-g="O">${T("gift.revealO")}</button>` : ""}
          ${canE ? `<button class="ex-choice" type="button" data-g="E">${T("gift.revealE")}</button>` : ""}
          ${complete() ? "" : `<button class="ex-choice" type="button" data-g="col">${T("gift.collect")}</button>`}
        </div>
        <div class="gift-won" data-role="won" hidden></div>
        <div class="ex-actions" data-role="next" hidden><button class="act" type="button" data-role="done">${opts.doneLabel}</button></div>
      </div>`;
    const q = sel => box.querySelector(sel);

    const show = (card, html) => {
      state.progress = 0;
      save();
      refresh();
      box.querySelectorAll("[data-g]").forEach(b => { b.disabled = true; });
      const won = q("[data-role=won]");
      won.hidden = false;
      won.innerHTML = `<div class="gift-card"></div><p>${html}</p>`;
      won.querySelector(".gift-card").appendChild(cardEl(card));
      q("[data-role=next]").hidden = false;
      q("[data-role=done]").onclick = opts.onDone;
      q("[data-role=done]").focus();
    };

    for (const b of box.querySelectorAll("[data-g]")) {
      b.onclick = () => {
        b.classList.add("ok");
        if (b.dataset.g === "col") {
          const card = grantCard();
          const n = state.collection.length;
          const fam = state.collection.filter(id => Math.floor(id / 10) === card.s).length;
          show(card, T("gift.won", { card: cardName(card), s: card.s, n, fam }));
        } else {
          const seat = b.dataset.g;
          const card = opts.reveal(seat);
          show(card, T("gift.revealed", { seat, card: cardName(card) }));
        }
      };
    }
    box.querySelector("[data-g]")?.focus();
  }

  /* ---------- L'album ---------- */
  function renderAlbum() {
    const have = owned();
    const body = $("album-body");
    body.innerHTML = "";
    for (let s = 0; s < 4; s++) {
      const n = [...have].filter(id => Math.floor(id / 10) === s).length;
      const row = document.createElement("section");
      row.className = "album-row";
      row.innerHTML = `<h3><span class="fam ${COLORS[s]}">${familyName(s)}</span> <small>${T("album.famCount", { n })}</small></h3><div class="album-cards"></div>`;
      const cards = row.querySelector(".album-cards");
      for (let v = 1; v <= 10; v++) {
        const c = { s, v };
        if (have.has(cardId(c))) {
          cards.appendChild(cardEl(c));
        } else {
          const slot = document.createElement("div");
          slot.className = "card missing";
          slot.textContent = v;
          slot.setAttribute("aria-label", T("album.missing", { card: cardName(c) }));
          slot.setAttribute("role", "img");
          cards.appendChild(slot);
        }
      }
      body.appendChild(row);
    }
    $("album-count").textContent = complete() ? T("album.complete") : T("album.count", { n: state.collection.length });
  }

  $("btn-album").addEventListener("click", () => { renderAlbum(); refresh(); $("album").showModal(); });
  $("btn-album-close").addEventListener("click", () => $("album").close());
  $("album").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  refresh();
  document.addEventListener("kiboo-lang", refresh);

  return { answered, giftReady, giftPanel, grantCard, refresh };
})();
