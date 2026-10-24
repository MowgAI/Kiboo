"use strict";
/* =====================================================================
   L'ACCUEIL ET LES ANIMATIONS
   - Écran d'accueil au démarrage : le logo Kiboo se forme lettre par
     lettre, des personnages sautillent et l'un d'eux traverse l'écran.
     Boutons : Jouer, Les familles, Les personnages, Passer. Une case
     permet de ne plus l'afficher ; un clic sur le logo du jeu le rouvre.
   - Les familles se présentent : les 4 familles arrivent tour à tour, avec
     leurs 10 cartes ; une phrase est lue à voix haute.
   - Les personnages se présentent : les 40 cartes une par une, avec leur
     présentation (lang/personnages.js), lue à voix haute.
   - La parade de Kiboo (bouton Parade de l'en-tête, ou de l'accueil) : les
     40 personnages défilent tout seuls, chacun dit sa présentation puis
     laisse la place au suivant (pause, suivant, son).
   - Musique rétro sur l'accueil (bouton 🎵, js/sound.js).
   - Distribution animée : à la première donne seulement, les cartes partent
     du centre vers les quatre joueurs (bouton « Passer »).
   L'accueil a sa propre langue, l'anglais par défaut (la voix anglaise est
   la meilleure sur la plupart des appareils) ; les boutons EN · FR · IT la
   changent, sans toucher à la langue du jeu.
   Les animations sont coupées si l'appareil demande de réduire les
   animations (prefers-reduced-motion).
   ===================================================================== */
const Intro = (() => {
  const KEY = "kiboo.intro.off";
  const LANG_KEY = "kiboo.intro.lang";
  let introLang = "en";
  try { introLang = localStorage.getItem(LANG_KEY) || "en"; } catch (e) { /* stockage indisponible */ }
  // Les textes de l'accueil sont écrits dans sa langue à lui.
  const inLang = fn => I18N.within(introLang, fn);
  const FAMILY_ORDER = [0, 1, 2, 3];
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let off = false;
  try { off = localStorage.getItem(KEY) === "1"; } catch (e) { /* stockage indisponible */ }
  let dealPending = true;             // la distribution animée n'a lieu qu'une fois
  let sound = true;                   // voix des présentations (bouton 🔊 / 🔇)
  let introMusic = true;              // musique de l'accueil (bouton 🎵), gardée dans le navigateur
  try { introMusic = localStorage.getItem("kiboo.intro.music") !== "0"; } catch (e) { /* idem */ }
  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  let view = "home", index = 0;

  const img = (s, v) => IMAGES[COLORS[s] + "-" + v];
  const say = text => { if (sound) Voice.speak(text, introLang); };
  // Choix de la langue de l'accueil (EN · FR · IT), puis on redessine la vue courante.
  const langs = () => `<div class="intro-langs" role="group" aria-label="Language">${I18N.SUPPORTED.map(l =>
    `<button type="button" data-lang="${l}" aria-pressed="${l === introLang}">${l.toUpperCase()}</button>`).join("")}
    <button type="button" data-music aria-pressed="${introMusic}" title="${T("intro.music")}">${introMusic ? "🎵" : "🔇"}</button></div>`;
  // Redessine la vue courante (après un changement de langue ou de musique).
  function again() {
    if (view === "families") families(index);
    else if (view === "characters") characters(index);
    else if (view === "parade") parade(index);
    else home();
  }
  function wireLangs() {
    for (const b of box.querySelectorAll("[data-lang]")) b.onclick = () => {
      introLang = b.dataset.lang;
      try { localStorage.setItem(LANG_KEY, introLang); } catch (e) { /* idem */ }
      Voice.stop();
      again();
    };
    box.querySelector("[data-music]").onclick = () => {
      introMusic = !introMusic;
      try { localStorage.setItem("kiboo.intro.music", introMusic ? "1" : "0"); } catch (e) { /* idem */ }
      Sound.music(introMusic ? "intro" : null);
      const b = box.querySelector("[data-music]");
      b.setAttribute("aria-pressed", introMusic);
      b.textContent = introMusic ? "🎵" : "🔇";
    };
  }
  const presentation = (s, v) => {
    const all = window.KIBOO_CHARACTERS || {};
    const key = COLORS[s] + "-" + v;
    return (all[I18N.lang] && all[I18N.lang][key]) || (all.fr && all.fr[key]) || "";
  };

  /* ---------- La fenêtre ---------- */
  const box = document.createElement("div");
  box.className = "intro";
  box.id = "intro";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.hidden = true;

  function logo() {
    return `<h2 class="intro-logo kiboo" aria-label="Kiboo">${[..."Kiboo"].map((ch, i) => `<span style="animation-delay:${0.15 + i * 0.18}s">${ch}</span>`).join("")}</h2>`;
  }
  // Huit personnages tirés au hasard qui sautillent, et un qui traverse l'écran.
  function crowd() {
    const picks = shuffle(makeDeck()).slice(0, 9);
    const spots = [[6, 12], [80, 8], [12, 62], [84, 58], [30, 76], [62, 78], [4, 38], [90, 34]];
    const hop = spots.map(([x, y], i) => {
      const c = picks[i];
      return `<div class="intro-hop" style="left:${x}%;top:${y}%;animation-delay:${0.6 + i * 0.12}s, ${1.2 + i * 0.12}s"><div class="card" style="background-image:url(${img(c.s, c.v)})"></div></div>`;
    }).join("");
    const c = picks[8];
    return hop + `<div class="intro-run"><div class="card" style="background-image:url(${img(c.s, c.v)})"></div></div>`;
  }

  function home() { inLang(homeView); wireLangs(); }
  function homeView() {
    view = "home";
    box.innerHTML = `<div class="intro-stage">${langs()}${crowd()}
      <div class="intro-center">
        ${logo()}
        <div class="intro-btns">
          <button class="act intro-play" type="button" data-a="play"><span class="emo" aria-hidden="true">▶️</span>${T("intro.play")}</button>
          <button class="act ghost" type="button" data-a="families"><span class="emo" aria-hidden="true">👋</span>${T("intro.families")}</button>
          <button class="act ghost" type="button" data-a="characters"><span class="emo" aria-hidden="true">🎭</span>${T("intro.characters")}</button>
          <button class="act ghost" type="button" data-a="parade"><span class="emo" aria-hidden="true">🎪</span>${T("intro.parade")}</button>
        </div>
        <label class="check intro-off"><input type="checkbox" data-a="off"${off ? " checked" : ""}> ${T("intro.noShow")}</label>
      </div>
      <button class="act ghost intro-skip" type="button" data-a="skip">${T("intro.skip")} ⏭</button>
    </div>`;
    box.querySelector("[data-a=play]").onclick = () => close(true);
    box.querySelector("[data-a=skip]").onclick = () => close(false);
    box.querySelector("[data-a=families]").onclick = () => families(0);
    box.querySelector("[data-a=characters]").onclick = () => characters(0);
    box.querySelector("[data-a=parade]").onclick = () => parade(0);
    box.querySelector("[data-a=off]").onchange = e => {
      off = e.target.checked;
      try { localStorage.setItem(KEY, off ? "1" : "0"); } catch (err) { /* idem */ }
    };
    box.querySelector("[data-a=play]").focus();
  }

  // Barre du bas des présentations : précédent, suivant, son, retour.
  function nav(prev, next, back) {
    return `<div class="intro-nav">
      <button class="act ghost" type="button" data-a="prev"${prev ? "" : " disabled"}>◀ ${T("intro.prev")}</button>
      <button class="act ghost" type="button" data-a="sound" aria-pressed="${sound}">${sound ? "🔊" : "🔇"} ${T("intro.sound")}</button>
      <button class="act ghost" type="button" data-a="back">${T("intro.back")}</button>
      <button class="act" type="button" data-a="next">${next ? `${T("intro.next")} ▶` : `▶️ ${T("intro.play")}`}</button>
    </div>`;
  }
  function wireNav(onPrev, onNext, again) {
    box.querySelector("[data-a=prev]").onclick = onPrev;
    box.querySelector("[data-a=next]").onclick = onNext;
    box.querySelector("[data-a=back]").onclick = () => { paradeRun++; Voice.stop(); home(); };
    box.querySelector("[data-a=sound]").onclick = () => { sound = !sound; if (!sound) Voice.stop(); again(); };
  }

  /* ---------- Les familles se présentent ---------- */
  function families(f) { inLang(() => familiesView(f)); wireLangs(); }
  function familiesView(f) {
    view = "families"; index = f;
    const s = FAMILY_ORDER[f];
    box.innerHTML = `<div class="intro-stage intro-show">${langs()}
      <h2 class="intro-fam fam ${COLORS[s]}">${T("intro.famTitle", { s })}</h2>
      <p class="intro-text">${T("intro.fam." + s)}</p>
      <div class="intro-fan">${Array.from({ length: 10 }, (_, i) => `<div class="card" style="background-image:url(${img(s, i + 1)});animation-delay:${0.2 + i * 0.12}s"></div>`).join("")}</div>
      ${nav(f > 0, f < 3)}
    </div>`;
    wireNav(() => families(f - 1), () => (f < 3 ? families(f + 1) : close(true)), () => families(f));
    say(T("intro.fam." + s));
    box.querySelector("[data-a=next]").focus();
  }

  /* ---------- Les personnages se présentent ---------- */
  function characters(i) { inLang(() => charactersView(i)); wireLangs(); }
  function charactersView(i) {
    view = "characters"; index = i;
    const s = Math.floor(i / 10), v = (i % 10) + 1;
    const text = presentation(s, v);
    box.innerHTML = `<div class="intro-stage intro-show">${langs()}
      <div class="intro-chips" role="group" aria-label="${T("intro.characters")}">
        ${[0, 1, 2, 3].map(x => `<button type="button" class="intro-chip ${COLORS[x]}" data-f="${x}" aria-pressed="${x === s}">${familyName(x)}</button>`).join("")}
      </div>
      <div class="intro-char">
        <div class="card intro-big" style="background-image:url(${img(s, v)})" role="img" aria-label="${cardName({ s, v })}"></div>
        <div class="intro-bubble"><p>${text}</p><p class="intro-count">${i + 1} / 40</p></div>
      </div>
      ${nav(i > 0, i < 39)}
    </div>`;
    for (const chip of box.querySelectorAll("[data-f]")) chip.onclick = () => characters(+chip.dataset.f * 10);
    wireNav(() => characters(i - 1), () => (i < 39 ? characters(i + 1) : close(true)), () => characters(i));
    say(text);
    box.querySelector("[data-a=next]").focus();
  }

  /* ---------- La parade de Kiboo ---------- */
  let paradeRun = 0, paused = false, forward = false, skipNow = null, resumeFn = null;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function parade(start) { inLang(paradeView); wireLangs(); runParade(start); }
  function paradeView() {
    view = "parade";
    box.innerHTML = `<div class="intro-stage intro-show intro-parade">${langs()}
      <h2 class="intro-fam">🎪 ${T("intro.parade")}</h2>
      <div class="parade-floor" data-role="floor"></div>
      <div class="intro-nav">
        <button class="act ghost" type="button" data-a="pause">${paused ? `▶ ${T("intro.resume")}` : `⏸ ${T("intro.pause")}`}</button>
        <button class="act ghost" type="button" data-a="sound" aria-pressed="${sound}">${sound ? "🔊" : "🔇"} ${T("intro.sound")}</button>
        <button class="act ghost" type="button" data-a="back">${T("intro.back")}</button>
        <button class="act" type="button" data-a="next">${T("intro.next")} ▶</button>
      </div>
    </div>`;
    const q = sel => box.querySelector(sel);
    q("[data-a=back]").onclick = () => { paradeRun++; Voice.stop(); home(); };
    q("[data-a=sound]").onclick = e => {
      sound = !sound;
      if (!sound) Voice.stop();
      e.currentTarget.setAttribute("aria-pressed", sound);
      e.currentTarget.textContent = `${sound ? "🔊" : "🔇"} ${inLang(() => T("intro.sound"))}`;
    };
    q("[data-a=pause]").onclick = e => {
      paused = !paused;
      e.currentTarget.textContent = inLang(() => paused ? `▶ ${T("intro.resume")}` : `⏸ ${T("intro.pause")}`);
      if (paused) Voice.stop(); else if (resumeFn) resumeFn();
    };
    q("[data-a=next]").onclick = () => {
      forward = true;
      if (paused) { paused = false; q("[data-a=pause]").textContent = inLang(() => `⏸ ${T("intro.pause")}`); if (resumeFn) resumeFn(); }
      else { Voice.stop(); if (skipNow) skipNow(); }
    };
    q("[data-a=next]").focus();
  }

  // Les 40 personnages défilent ; chacun parle (ou reste le temps de lire), puis le suivant arrive.
  async function runParade(start) {
    const run = ++paradeRun;
    for (let i = start; i <= 40;) {
      if (run !== paradeRun) return;
      index = i;
      forward = false;
      const floor = box.querySelector("[data-role=floor]");
      const text = i < 40
        ? inLang(() => presentation(Math.floor(i / 10), (i % 10) + 1))
        : inLang(() => T("intro.paradeEnd"));
      floor.innerHTML = i < 40
        ? `<div class="parade-char" style="--fam:var(--c-${COLORS[Math.floor(i / 10)]})">
             <div class="card intro-big" style="background-image:url(${img(Math.floor(i / 10), (i % 10) + 1)})" role="img" aria-label="${inLang(() => cardName({ s: Math.floor(i / 10), v: (i % 10) + 1 }))}"></div>
             <div class="intro-bubble"><p>${text}</p><p class="intro-count">${i + 1} / 40</p></div>
           </div>`
        : `<div class="parade-end">${[0, 1, 2, 3].map(s => `<div class="card" style="background-image:url(${img(s, 10)})"></div>`).join("")}
             <p class="intro-text">${text}</p></div>`;
      if (i < 40) Sound.sfx("click");
      const skip = new Promise(r => { skipNow = r; });
      const talk = sound && !paused ? Voice.speak(text, introLang) : Promise.resolve(false);
      await Promise.race([talk.then(spoken => wait(spoken ? 900 : Math.max(2500, text.length * 60))), skip]);
      if (run !== paradeRun) return;
      if (paused) {
        await new Promise(r => { resumeFn = r; });
        resumeFn = null;
        if (run !== paradeRun) return;
        if (!forward) continue;                     // reprise : le même personnage reparle
      }
      if (i === 40) { if (forward) close(true); return; }
      i++;
    }
  }

  /* ---------- Ouvrir et fermer ---------- */
  function open() {
    if (!box.isConnected) document.body.appendChild(box);
    box.hidden = false;
    document.body.classList.add("intro-open");
    Sound.music(introMusic ? "intro" : null);
    home();
  }
  // `animate` : la première donne sera distribuée avec l'animation.
  function close(animate) {
    paradeRun++;
    Voice.stop();
    Sound.music(config.music ? "game" : null);
    box.hidden = true;
    document.body.classList.remove("intro-open");
    if (!animate) dealPending = false;
    resolveReady();
  }
  box.addEventListener("keydown", e => {
    if (e.key === "Escape") close(false);
    if (view === "characters" && e.key === "ArrowRight" && index < 39) characters(index + 1);
    if (view === "characters" && e.key === "ArrowLeft" && index > 0) characters(index - 1);
  });

  /* ---------- Distribution animée (première donne seulement) ---------- */
  async function deal() {
    if (!dealPending) return;
    dealPending = false;
    if (reduced()) return;
    const table = $("table");
    const t = table.getBoundingClientRect();
    const cx = t.left + t.width / 2, cy = t.top + t.height / 2;
    const layer = document.createElement("div");
    layer.className = "deal-layer";
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "act ghost deal-skip";
    skip.textContent = T("intro.skip") + " ⏭";
    layer.appendChild(skip);
    document.body.appendChild(layer);
    table.classList.add("dealing");
    const order = ["O", "N", "E", "S"];
    const anims = [];
    for (let i = 0; i < 40; i++) {
      const seat = order[i % 4], n = Math.floor(i / 4);
      const h = $("hand-" + seat).getBoundingClientRect();
      const tx = h.left + h.width * (0.15 + 0.07 * n) - cx, ty = h.top + h.height / 2 - cy;
      const el = cardEl(null);
      el.classList.add("deal-card");
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      layer.appendChild(el);
      Sound.sfx("deal", i * 0.045);
      anims.push(el.animate([
        { transform: "translate(-50%, -50%) rotate(0deg) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -50%) rotate(0deg) scale(0.8)", opacity: 1, offset: 0.1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${(i % 2 ? 1 : -1) * 12}deg) scale(1)`, opacity: 1 },
      ], { duration: 420, delay: i * 45, easing: "ease-out", fill: "forwards" }));
    }
    await new Promise(resolve => {
      skip.onclick = resolve;
      Promise.all(anims.map(a => a.finished)).then(() => setTimeout(resolve, 150), resolve);
    });
    anims.forEach(a => a.cancel());
    layer.remove();
    table.classList.remove("dealing");
    table.classList.add("dealt");                    // les cartes se retournent
    setTimeout(() => table.classList.remove("dealt"), 700);
  }

  // Démarrage : l'accueil, sauf si le joueur l'a désactivé.
  window.addEventListener("DOMContentLoaded", () => {
    const logoEl = document.querySelector("header .logo");
    if (logoEl) {
      logoEl.classList.add("logo-btn");
      logoEl.setAttribute("role", "button");
      logoEl.setAttribute("tabindex", "0");
      logoEl.title = inLang(() => T("intro.reopen"));
      logoEl.onclick = open;
      logoEl.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
    }
    $("btn-parade").onclick = () => { open(); parade(0); };
    if (off) resolveReady(); else open();
  });

  return { ready, deal, open, parade: () => { open(); parade(0); } };
})();
