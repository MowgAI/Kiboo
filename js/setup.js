"use strict";
/* =====================================================================
   LES CHOIX IMPORTANTS ET L'ÉCRAN « PRÉPARE TA PARTIE »
   Cinq choix, en gros boutons, en haut des réglages : ta place, les robots, l'atout,
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
  const lastRobot = { O: "aleatoire", E: "aleatoire", S: "aleatoire" };
  // Les robots, du plus facile au plus fort, avec leur avatar (une carte de la famille des robots)
  // et leur nombre d'étoiles. Par défaut, ce sont les plus faciles (PiperRand).
  const ROBOTS = [
    { type: "aleatoire", card: "red-2", stars: 1 },
    { type: "deterministe", card: "red-1", stars: 2 },
    { type: "pimc", card: "red-4", stars: 3 },
    { type: "pimc250", card: "red-8", stars: 4 },
    { type: "expert", card: "red-9", stars: 5 },
  ];
  const starsOf = n => "★".repeat(n) + "☆".repeat(5 - n);

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
      else if (config[s] === "humain") setSelect("cfg-" + s, lastRobot[s] || "aleatoire");
    }
  }

  // Le niveau des robots : le même robot à toutes les places des robots
  // (« mix » si on a choisi des robots différents dans les réglages détaillés).
  const robotSeats = () => SEATS3.filter(s => config[s] !== "humain");
  function robotLevel() {
    const t = robotSeats().map(s => config[s]);
    return t.length && t.every(x => x === t[0]) ? t[0] : "mix";
  }
  function setRobots(v) {
    for (const s of SEATS3) { lastRobot[s] = v; if (config[s] !== "humain") setSelect("cfg-" + s, v); }
  }

  // Les cinq choix : valeur actuelle, options, et ce que fait un clic.
  const CHOICES = [
    { key: "place", emo: "🪑", label: "setup.place", get: place, set: setPlace,
      opts: [["S", "place.S"], ["O", "place.O"], ["E", "place.E"], ["none", "place.none"]] },
    { key: "robots", emo: "🤖", label: "setup.robots", get: robotLevel, set: setRobots, note: "start.robotsDefault",
      opts: ROBOTS.map(r => [r.type, null]),
      text: v => { const r = ROBOTS.find(x => x.type === v); return `${PLAYER_TYPES[v].label} <span class="stars" aria-label="${T("robot.stars", { n: r.stars })}">${starsOf(r.stars)}</span>`; } },
    { key: "trump", emo: "♠️", label: "setup.trump", get: () => config.trump, set: v => setSelect("cfg-trump", v),
      opts: [["none", "setup.trump.none"], ["auto", "start.trumpYes"]] },
    { key: "help", emo: "🐐", label: "start.help", get: () => (config.coco === "goat" ? "goat" : "off"),
      set: v => { setHelp(v === "goat"); if (v === "off" && config.coco === "goat") setSelect("cfg-coco", "off"); },
      opts: [["off", "start.helpOff"], ["goat", "start.helpGoat"]] },
    { key: "quiz", emo: "🧠", label: "setup.quiz", get: () => config.quiz, set: v => setSelect("cfg-quiz", v),
      opts: [["off", "setup.quiz.off"], ["light", "setup.quiz.light"], ["all", "setup.quiz.all"]] },
  ];

  // La présentation des robots : avatar, nom, niveau en étoiles et quelques mots simples.
  function robotCards() {
    return `<div class="robot-cards">${ROBOTS.map(r => `<div class="robot-card">
        <span class="robot-face" style="background-image:url('${IMAGES[r.card]}')" aria-hidden="true"></span>
        <div><strong>${PLAYER_TYPES[r.type].label}</strong> <span class="stars" aria-label="${T("robot.stars", { n: r.stars })}">${starsOf(r.stars)}</span>
          <em>${T("robot." + r.type + ".level")}</em>
          <p>${T("robot." + r.type + ".text")}</p></div>
      </div>`).join("")}</div>`;
  }
  let showRobots = false;                  // présentation des robots ouverte ?

  // Goat et les questions ne servent que si le joueur est le déclarant (Sud).
  const SOUTH_ONLY = ["help", "quiz"];
  function draw(box) {
    if (!box) return;
    const south = place() === "S";
    box.innerHTML = CHOICES.map(c => {
      const off = !south && SOUTH_ONLY.includes(c.key);
      return `<div class="choice${off ? " off" : ""}" role="group" aria-label="${T(c.label)}">
        <span class="choice-label"><span class="emo" aria-hidden="true">${c.emo}</span>${T(c.label)}${off ? ` <small>${T("start.onlySouth")}</small>` : ""}</span>
        <span class="seg">${c.opts.map(([v, k]) => `<button type="button" data-c="${c.key}" data-v="${v}" aria-pressed="${c.get() === v}"${off ? " disabled" : ""}>${c.text ? c.text(v) : T(k)}</button>`).join("")}</span>
        ${c.note ? `<span class="choice-note">${T(c.note)} <button type="button" class="link" data-a="robots" aria-expanded="${showRobots}">${T(showRobots ? "robot.hide" : "robot.show")}</button></span>${showRobots ? robotCards() : ""}` : ""}
      </div>`;
    }).join("");
    for (const b of box.querySelectorAll("[data-c]")) b.onclick = () => {
      CHOICES.find(c => c.key === b.dataset.c).set(b.dataset.v);
      refresh();
    };
    for (const b of box.querySelectorAll("[data-a=robots]")) b.onclick = () => { showRobots = !showRobots; refresh(); };
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
