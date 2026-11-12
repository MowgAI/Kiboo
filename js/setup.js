"use strict";
/* =====================================================================
   LES CHOIX IMPORTANTS ET L'ÉCRAN « PRÉPARE TA PARTIE »
   Quatre choix, en gros boutons, en haut des réglages : ta place, l'atout,
   l'aide de Goat et les questions pendant le jeu. Ils pilotent les menus
   d'origine (rangés dans les groupes repliables des réglages) : un clic
   change le menu et déclenche son événement « change », comme si le joueur
   l'avait choisi lui-même.
   Au démarrage, la partie ne commence pas toute seule : l'écran « Prépare ta
   partie » s'affiche sur la table avec les mêmes choix, et la donne part au
   clic sur « Commencer la partie ».
   ===================================================================== */
const Setup = (() => {
  const SEATS3 = ["S", "O", "E"];
  const lastRobot = { O: "deterministe", E: "deterministe", S: "deterministe" };

  // Change un menu des réglages comme si le joueur l'avait fait.
  function setSelect(id, value) {
    const sel = $(id);
    if (!sel || sel.value === value) return;
    sel.value = value;
    sel.dispatchEvent(new Event("change"));
  }

  // Ta place : le siège tenu par l'humain (ou aucun : partie entre robots).
  const place = () => SEATS3.find(s => config[s] === "humain") || "none";
  function setPlace(p) {
    for (const s of SEATS3) {
      if (s === p) { if (config[s] !== "humain") lastRobot[s] = config[s]; setSelect("cfg-" + s, "humain"); }
      else if (config[s] === "humain") setSelect("cfg-" + s, lastRobot[s] || "deterministe");
    }
  }

  // Les quatre choix : valeur actuelle, options, et ce que fait un clic.
  const CHOICES = [
    { key: "place", emo: "🪑", label: "setup.place", get: place, set: setPlace,
      opts: [["S", "place.S"], ["O", "place.O"], ["E", "place.E"], ["none", "place.none"]] },
    { key: "trump", emo: "♠️", label: "setup.trump", get: () => config.trump, set: v => setSelect("cfg-trump", v),
      opts: [["none", "setup.trump.none"], ["auto", "start.trumpYes"]] },
    { key: "help", emo: "🐐", label: "start.help", get: () => (config.coco === "goat" ? "goat" : "off"),
      set: v => { setHelp(v === "goat"); if (v === "off" && config.coco === "goat") setSelect("cfg-coco", "off"); },
      opts: [["off", "start.helpOff"], ["goat", "start.helpGoat"]] },
    { key: "quiz", emo: "🧠", label: "setup.quiz", get: () => config.quiz, set: v => setSelect("cfg-quiz", v),
      opts: [["off", "setup.quiz.off"], ["light", "setup.quiz.light"], ["all", "setup.quiz.all"]] },
  ];

  // Goat et les questions ne servent que si le joueur est le déclarant (Sud).
  const SOUTH_ONLY = ["help", "quiz"];
  function draw(box) {
    if (!box) return;
    const south = place() === "S";
    box.innerHTML = CHOICES.map(c => {
      const off = !south && SOUTH_ONLY.includes(c.key);
      return `<div class="choice${off ? " off" : ""}" role="group" aria-label="${T(c.label)}">
        <span class="choice-label"><span class="emo" aria-hidden="true">${c.emo}</span>${T(c.label)}${off ? ` <small>${T("start.onlySouth")}</small>` : ""}</span>
        <span class="seg">${c.opts.map(([v, k]) => `<button type="button" data-c="${c.key}" data-v="${v}" aria-pressed="${c.get() === v}"${off ? " disabled" : ""}>${T(k)}</button>`).join("")}</span>
      </div>`;
    }).join("");
    for (const b of box.querySelectorAll("[data-c]")) b.onclick = () => {
      CHOICES.find(c => c.key === b.dataset.c).set(b.dataset.v);
      refresh();
    };
  }
  function refresh() {
    draw($("main-choices"));
    if (!$("start").hidden) draw($("start-choices"));
  }

  /* ---------- L'écran « Prépare ta partie » ---------- */
  let starting = null;                     // résout l'attente de la première donne
  function showStart() {
    const box = $("start");
    box.hidden = false;
    box.innerHTML = `<div class="start-card">
        <div class="start-head"><h2>${T("start.title")}</h2><span id="voice-start"></span></div>
        <p>${T("start.guide")}</p>
        <div class="main-choices" id="start-choices"></div>
        <p class="start-more">${T("start.more")}</p>
        <div data-role="groups"></div>
        <button class="act start-go" type="button" data-a="go"><span class="emo" aria-hidden="true">▶️</span>${T("start.go")}</button>
      </div>`;
    box.querySelector("#voice-start").replaceWith(Voice.button(() => T("voice.start")));
    // Les autres réglages (robots, vitesse, aides, ambiance) viennent dans l'écran de départ ;
    // ils retournent à leur place, au-dessus de la table, quand la partie commence.
    box.querySelector("[data-role=groups]").appendChild(document.querySelector(".setup-groups"));
    draw($("start-choices"));
    box.querySelector("[data-a=go]").onclick = () => { hideStart(); if (starting) { starting(); starting = null; } };
    box.querySelector("[data-a=go]").focus({ preventScroll: true });
  }
  function hideStart() {
    const groups = document.querySelector(".setup-groups");
    if (groups && $("start").contains(groups)) document.querySelector(".setup .btns").after(groups);
    $("start").hidden = true;
    $("start").innerHTML = "";
  }
  // Attend que le joueur clique sur « Commencer la partie ».
  const waitStart = () => new Promise(resolve => { starting = resolve; showStart(); });

  // Les menus d'origine changés à la main : les gros boutons suivent.
  window.addEventListener("DOMContentLoaded", () => {
    for (const id of ["cfg-S", "cfg-O", "cfg-E", "cfg-trump", "cfg-coco", "cfg-quiz"]) $(id).addEventListener("change", () => setTimeout(refresh));
    refresh();
  });
  document.addEventListener("kiboo-lang", () => { refresh(); if (!$("start").hidden) showStart(); });

  return { refresh, waitStart, hideStart };
})();
