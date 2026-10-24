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
   dépend de l'appareil. On choisit de préférence une voix douce connue, un
   peu plus aiguë et un peu plus lente que la normale.
   ===================================================================== */
const Voice = (() => {
  const ok = "speechSynthesis" in window;
  const LOCALE = { fr: "fr-FR", en: "en-GB", it: "it-IT" };
  // Voix agréables, par ordre de préférence (les noms varient selon les appareils).
  const NICE = {
    fr: ["Amélie", "Audrey", "Aurélie", "Marie", "Julie", "Denise", "Google français"],
    en: ["Samantha", "Karen", "Moira", "Tessa", "Libby", "Sonia", "Jenny", "Aria", "Google UK English Female", "Google US English"],
    it: ["Alice", "Federica", "Elsa", "Isabella", "Google italiano"],
  };
  let voices = [];
  const load = () => { voices = ok ? speechSynthesis.getVoices() : []; };
  if (ok) { load(); speechSynthesis.addEventListener("voiceschanged", load); }

  function pick(lang) {
    const list = voices.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    for (const name of NICE[lang] || []) {
      const v = list.find(x => x.name.includes(name));
      if (v) return v;
    }
    return list.find(v => /female|femme|donna/i.test(v.name)) || list[0] || null;
  }

  // Le texte sans balises HTML ni emoji.
  const plain = html => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
  };

  function speak(html) {
    if (!ok || !html) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(html));
    u.lang = LOCALE[I18N.lang] || "fr-FR";
    const v = pick(I18N.lang);
    if (v) u.voice = v;
    u.rate = 0.92;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
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
  function button(text) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "act ghost voice-btn";
    b.innerHTML = `<span class="emo" aria-hidden="true">🔊</span><span class="lbl">${T("voice.listen")}</span>`;
    b.setAttribute("aria-label", T("voice.listenAria"));
    b.hidden = !ok;
    b.onclick = () => speak(text());
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
  document.addEventListener("kiboo-lang", () => { stop(); mount(); });
  window.addEventListener("DOMContentLoaded", mount);
  // Une fenêtre fermée : on arrête de parler.
  document.addEventListener("close", stop, true);

  return { speak, stop, auto, cheer, button, ok };
})();
