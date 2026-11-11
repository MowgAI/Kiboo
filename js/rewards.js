"use strict";
/* =====================================================================
   CADEAUX ET COLLECTION
   Toutes les 3 bonnes réponses (exercices et questions en cours de
   partie, cumulées : une erreur ne fait pas perdre les points acquis),
   le joueur choisit un cadeau :
   - voir une carte cachée d'Ouest ou d'Est (seulement pendant une partie) ;
   - gagner une carte de Kiboo pour sa collection (40 cartes à réunir) :
     le joueur choisit laquelle parmi celles qui lui manquent, et peut lui
     donner un nom. Ce nom remplace celui du personnage dans les
     présentations et la parade (js/intro.js). On peut aussi renommer ses
     cartes depuis l'album (clic sur une carte).
   La progression et la collection sont gardées dans ce navigateur. Les noms
   aussi (kiboo.names.v1), mais ils ne sont pas envoyés au compte.
   ===================================================================== */
const Rewards = (() => {
  const KEY = "kiboo.rewards.v1";
  const GOAL = 3;
  const NAMES = "kiboo.names.v1";                // noms donnés aux cartes : { "blue-3": "Minou", … }
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

  /* ---------- Les noms donnés aux cartes ---------- */
  const keyOf = c => COLORS[c.s] + "-" + c.v;
  function names() { try { return JSON.parse(localStorage.getItem(NAMES)) || {}; } catch (e) { return {}; } }
  // Nom donné par le joueur à cette carte (s'il la possède), sinon null.
  const nameOf = c => (owned().has(cardId(c)) && names()[keyOf(c)]) || null;
  function setName(c, name) {
    const all = names();
    name = (name || "").replace(/\s+/g, " ").trim().slice(0, 20);
    if (name) all[keyOf(c)] = name; else delete all[keyOf(c)];
    try { localStorage.setItem(NAMES, JSON.stringify(all)); } catch (e) { /* stockage indisponible */ }
  }
  // Prénom d'origine du personnage, dans la langue `lang` (lang/parade.js).
  const defaultName = (c, lang = I18N.lang) => {
    const n = (window.KIBOO_PARADE || {}).names || {};
    return (n[lang] && n[lang][keyOf(c)]) || (n.fr && n.fr[keyOf(c)]) || "";
  };
  const escape = s => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  // Remplace le prénom d'origine par le nom donné par le joueur, dans un texte de présentation.
  function personalize(text, c, lang = I18N.lang) {
    const mine = nameOf(c), orig = defaultName(c, lang);
    if (!mine || !orig) return text;
    const re = new RegExp("(^|[^\\p{L}])" + orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "gu");
    return text.replace(re, (m, before) => before + escape(mine));
  }
  const complete = () => state.collection.length >= 40;

  function answered(ok) {
    Voice.cheer(ok);                              // « Bravo ! », « Presque ! »… si la voix est activée
    Sound.sfx(ok ? "ok" : "ko");
    Account.answered(ok);
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
    if (btn) btn.querySelector(".lbl").textContent = T("album.btn", { n: state.collection.length });
  }

  // Ajoute à la collection une carte qu'on n'a pas encore : `wanted` si on l'a choisie, sinon au
  // hasard (null si la collection est complète).
  function grantCard(wanted) {
    const have = owned();
    const missing = makeDeck().filter(c => !have.has(cardId(c)));
    if (!missing.length) return null;
    const card = wanted && !have.has(cardId(wanted)) ? wanted : missing[Math.floor(Math.random() * missing.length)];
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

    const show = (card, html, naming) => {
      Sound.sfx("gift");
      state.progress = 0;
      save();
      refresh();
      box.querySelectorAll("[data-g]").forEach(b => { b.disabled = true; });
      const won = q("[data-role=won]");
      won.hidden = false;
      won.innerHTML = `<div class="gift-card"></div><div><p>${html}</p>${naming ? nameForm(card) : ""}</div>`;
      won.querySelector(".gift-card").appendChild(cardEl(card));
      if (naming) wireNameForm(won, card);
      q("[data-role=next]").hidden = false;
      q("[data-role=done]").onclick = opts.onDone;
      (won.querySelector("input") || q("[data-role=done]")).focus();
    };

    // Choisir la carte à gagner, parmi celles qui manquent à la collection.
    const choose = () => {
      const have = owned();
      box.querySelectorAll("[data-g]").forEach(b => { b.disabled = true; });
      const pick = document.createElement("div");
      pick.className = "gift-pick";
      pick.innerHTML = `<p class="ex-q">${T("gift.choose")}</p>` + [0, 1, 2, 3].map(s =>
        `<div class="album-cards" data-s="${s}"></div>`).join("");
      for (let s = 0; s < 4; s++) for (let v = 1; v <= 10; v++) {
        const c = { s, v }, mine = have.has(cardId(c));
        const el = cardEl(c, { button: true });
        if (mine) { el.disabled = true; el.classList.add("dim"); el.title = T("gift.have"); }
        else el.onclick = () => {
          pick.remove();
          const card = grantCard(c);
          const n = state.collection.length;
          const fam = state.collection.filter(id => Math.floor(id / 10) === card.s).length;
          show(card, T("gift.won", { card: cardName(card), s: card.s, n, fam }), true);
        };
        pick.querySelector(`[data-s="${s}"]`).appendChild(el);
      }
      q("[data-role=choices]").after(pick);
      pick.querySelector("button:not(:disabled)")?.focus();
    };

    for (const b of box.querySelectorAll("[data-g]")) {
      b.onclick = () => {
        b.classList.add("ok");
        if (b.dataset.g === "col") {
          choose();
        } else {
          const seat = b.dataset.g;
          const card = opts.reveal(seat);
          show(card, T("gift.revealed", { seat, card: cardName(card) }));
        }
      };
    }
    box.querySelector("[data-g]")?.focus();
  }

  // Petit formulaire « Donne-lui un nom ».
  const nameForm = card => `<form class="name-form" data-role="name">
      <label class="field"><span>${T("name.label")}</span>
        <input type="text" maxlength="20" autocomplete="off" placeholder="${escape(defaultName(card))}" value="${escape(nameOf(card) || "")}"></label>
      <button class="act ghost" type="submit">${T("name.save")}</button>
      <span class="name-ok" aria-live="polite"></span>
    </form>`;
  function wireNameForm(root, card, after) {
    const f = root.querySelector("[data-role=name]");
    f.onsubmit = e => {
      e.preventDefault();
      setName(card, f.querySelector("input").value);
      f.querySelector(".name-ok").textContent = nameOf(card) ? T("name.saved", { name: nameOf(card) }) : T("name.reset");
      if (after) after();
    };
  }

  /* ---------- L'album ---------- */
  function renderAlbum() {
    const have = owned();
    const body = $("album-body");
    body.innerHTML = `<div id="album-rename" hidden></div>`;
    for (let s = 0; s < 4; s++) {
      const n = [...have].filter(id => Math.floor(id / 10) === s).length;
      const row = document.createElement("section");
      row.className = "album-row";
      row.innerHTML = `<h3><span class="fam ${COLORS[s]}">${familyName(s)}</span> <small>${T("album.famCount", { n })}</small></h3><div class="album-cards"></div>`;
      const cards = row.querySelector(".album-cards");
      for (let v = 1; v <= 10; v++) {
        const c = { s, v };
        if (have.has(cardId(c))) {
          // Carte possédée : son nom dessous ; un clic permet de la renommer.
          const fig = document.createElement("button");
          fig.type = "button";
          fig.className = "album-card";
          fig.title = T("name.rename");
          fig.appendChild(cardEl(c));
          const cap = document.createElement("span");
          cap.className = "album-name";
          cap.textContent = nameOf(c) || defaultName(c);
          fig.appendChild(cap);
          fig.onclick = () => {
            const box = $("album-rename");
            box.hidden = false;
            box.innerHTML = `<div class="gift-won"><div class="gift-card"></div><div>${nameForm(c)}</div></div>`;
            box.querySelector(".gift-card").appendChild(cardEl(c));
            wireNameForm(box, c, () => { cap.textContent = nameOf(c) || defaultName(c); });
            box.querySelector("input").focus();
          };
          cards.appendChild(fig);
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

  return { answered, giftReady, giftPanel, grantCard, refresh, nameOf, personalize };
})();
