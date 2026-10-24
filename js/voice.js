"use strict";
/* =====================================================================
   LA VOIX : lecture à voix haute, pour les enfants qui ne savent pas
   encore lire.
   - Les boutons 🔊 lisent une version simplifiée du texte (clés voice.* de
     lang/*.js) : règles du jeu, aide, exercices et questions.
   - Réglage « Lire à voix haute » : les questions et les exercices sont lus
     d'office, et une petite phrase d'encouragement suit chaque réponse
     (« Bravo ! », « Presque ! »…).
   Utilise la synthèse vocale du navigateur (speechSynthesis) : la voix
   dépend de l'appareil. Le menu « Voix » des réglages liste les voix de
   la langue choisie installées sur l'appareil (choix gardé dans le
   navigateur) ; par défaut, une voix douce connue. Sans voix dans la
   langue, rien n'est lu (une voix d'une autre langue prononcerait mal).
   L'italien n'est pas lu pour l'instant (MUTED).
   ===================================================================== */
const Voice = (() => {
  const ok = "speechSynthesis" in window;
  const LOCALE = { fr: "fr-FR", en: "en-GB", it: "it-IT" };
  // Vitesse et hauteur par langue : un peu plus aiguë que la normale, pour une voix sympa.
  const RATE = { fr: 1.18, en: 0.95, it: 1.0 };
  const PITCH = 1.1;
  const KEY = "kiboo.voice.";                          // + langue : nom de la voix choisie
  // Voix agréables, par ordre de préférence (les noms varient selon les appareils).
  // En français, une voix d'homme : Thomas (Apple), Henri ou Paul (Microsoft)…
  const NICE = {
    fr: ["Thomas", "Henri", "Paul", "Nicolas", "Rémy", "Antoine", "Jérôme", "Mathieu", "Daniel", "Google français"],
    en: ["Samantha", "Karen", "Moira", "Tessa", "Libby", "Sonia", "Jenny", "Aria", "Google UK English Female", "Google US English"],
    it: ["Isabella", "Elsa", "Diego", "Alice", "Federica", "Luca", "Paola", "Google italiano"],
  };
  let voices = [];
  const load = () => { voices = ok ? speechSynthesis.getVoices() : []; fillMenu(); };
  // Langues sans voix pour l'instant (la voix italienne des appareils est de mauvaise qualité).
  const MUTED = new Set(["it"]);
  const ofLang = lang => (MUTED.has(lang) ? [] : voices.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith(lang)));
  const saved = lang => { try { return localStorage.getItem(KEY + lang) || ""; } catch (e) { return ""; } };
  if (ok) { load(); speechSynthesis.addEventListener("voiceschanged", load); }

  function pick(lang) {
    const list = ofLang(lang);
    const chosen = list.find(v => v.name === saved(lang));
    if (chosen) return chosen;
    // Les voix « naturelles » (Microsoft … Online (Natural), Apple Premium ou Améliorée) sont bien meilleures.
    const fine = v => /natural|online|premium|enhanced|amélior|neural|siri/i.test(v.name);
    for (const good of [true, false]) for (const name of NICE[lang] || []) {
      const v = list.find(x => x.name.includes(name) && fine(x) === good);
      if (v) return v;
    }
    const nat = list.find(fine);
    if (nat) return nat;
    return list.find(v => /female|femme|donna/i.test(v.name)) || list[0] || null;
  }

  // Menu « Voix » des réglages : les voix de la langue choisie sur cet appareil.
  function fillMenu() {
    const sel = $("cfg-voice-name");
    if (!sel || typeof I18N === "undefined") return;
    const lang = I18N.lang, list = ofLang(lang), cur = saved(lang);
    sel.innerHTML = list.length
      ? `<option value="">${T("voice.auto")}</option>` + list.map(v => `<option value="${v.name.replace(/"/g, "&quot;")}"${v.name === cur ? " selected" : ""}>${v.name}</option>`).join("")
      : `<option value="">${T("voice.none")}</option>`;
    sel.disabled = !list.length;
    for (const b of document.querySelectorAll(".voice-btn")) b.hidden = !list.length;
  }

  // Le texte sans balises HTML ni emoji.
  const plain = html => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
  };

  // `lang` : langue de lecture (par défaut celle du jeu ; l'accueil peut en choisir une autre).
  // Renvoie une promesse tenue à la fin de la lecture (tout de suite s'il n'y a rien à lire).
  function speak(html, lang = I18N.lang) {
    if (!ok || !html) return Promise.resolve(false);
    const v = pick(lang);
    if (!v) return Promise.resolve(false);              // pas de voix dans cette langue sur l'appareil
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(html));
    u.lang = LOCALE[lang] || "fr-FR";
    u.voice = v;
    u.rate = RATE[lang] || 1;
    u.pitch = PITCH;
    // Pendant que la voix parle, la musique baisse (js/sound.js).
    const done = new Promise(resolve => {
      u.onend = u.onerror = () => { Sound.duck(false); resolve(true); };
    });
    u.onstart = () => Sound.duck(true);
    speechSynthesis.speak(u);
    return done;
  }
  const stop = () => { if (ok) speechSynthesis.cancel(); };

  // Lecture d'office (réglage « Lire à voix haute »).
  const auto = html => { if (config.voice) speak(html); };

  // Petite phrase d'encouragement après une réponse, tirée au hasard.
  function cheer(good) {
    if (!config.voice) return;
    const list = T(good ? "voice.cheer.ok" : "voice.cheer.ko").split("|");
    speak(list[Math.floor(Math.random() * list.length)]);
  }

  // Bouton 🔊 : `text()` donne le texte à lire au moment du clic.
  // Un deuxième clic pendant la lecture l'arrête (le bouton montre alors ⏹ Arrêter).
  let playing = null;                                  // bouton dont la lecture est en cours
  function look(b, on) {
    b.innerHTML = on
      ? `<span class="emo" aria-hidden="true">⏹</span><span class="lbl">${T("voice.stop")}</span>`
      : `<span class="emo" aria-hidden="true">🔊</span><span class="lbl">${T("voice.listen")}</span>`;
    b.setAttribute("aria-pressed", on);
  }
  function button(text) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "act ghost voice-btn";
    look(b, false);
    b.setAttribute("aria-label", T("voice.listenAria"));
    b.hidden = !ok || !ofLang(I18N.lang).length;
    b.onclick = () => {
      if (playing === b) { stop(); playing = null; look(b, false); return; }
      if (playing) look(playing, false);
      playing = b;
      look(b, true);
      speak(text()).then(() => { if (playing === b) { playing = null; look(b, false); } });
    };
    return b;
  }

  // Les boutons fixes de la page : règles, aide, exercices, questions.
  function mount() {
    const add = (where, text) => { const el = $(where); if (el) el.replaceWith(Object.assign(button(text), { id: where })); };
    add("voice-rules", () => T("voice.rules"));
    add("voice-help", () => T("voice.help"));
    add("voice-ex", () => T("voice.ex." + Exercises.current));
    add("voice-quiz", () => Quiz.voiceText());
  }
  document.addEventListener("kiboo-lang", () => { stop(); mount(); fillMenu(); });
  window.addEventListener("DOMContentLoaded", () => {
    mount();
    fillMenu();
    $("cfg-voice-name").addEventListener("change", e => {
      try { localStorage.setItem(KEY + I18N.lang, e.target.value); } catch (err) { /* stockage indisponible */ }
      speak(T("voice.test"));                           // pour entendre la voix choisie
    });
  });
  // Une fenêtre fermée : on arrête de parler.
  document.addEventListener("close", stop, true);

  return { speak, stop, auto, cheer, button, ok };
})();
