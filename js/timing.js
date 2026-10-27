"use strict";
/* =====================================================================
   LES TEMPS DE RÉFLEXION
   Combien de temps le joueur met pour choisir une carte, répondre à une
   question ou faire un exercice. Seul compte le temps « actif » : pas
   quand la page est cachée (autre onglet, téléphone en veille), ni quand
   la voix lit un texte à voix haute.
   - Chaque carte jouée par le joueur humain : son temps est noté dans
     l'historique de la donne (js/game.js) ; le premier coup du déclarant
     après l'entame est le « temps de plan de jeu », noté à part.
   - Chaque réponse (questions et exercices) : son temps est noté avec le
     résultat (js/account.js).
   Les derniers temps de chaque sorte sont gardés dans le navigateur
   (clé kiboo.times.v1, synchronisée avec le compte) pour la
   personnalisation, et envoyés au journal du compte si le joueur est
   connecté.
   ===================================================================== */
const Timing = (() => {
  const KEY = "kiboo.times.v1";
  const KEEP = 50;                     // derniers temps gardés par sorte
  let active = 0, last = performance.now(), visible = !document.hidden, speaking = false;

  // L'horloge n'avance que quand la page est visible et que la voix ne parle pas.
  function tick() {
    const t = performance.now();
    if (visible && !speaking) active += t - last;
    last = t;
  }
  document.addEventListener("visibilitychange", () => { tick(); visible = !document.hidden; });
  const now = () => { tick(); return active; };
  function setSpeaking(on) { tick(); speaking = on; }
  // Chronomètre : renvoie une fonction qui donne les millisecondes actives écoulées.
  function stopwatch() {
    const t0 = now();
    return () => Math.round(now() - t0);
  }

  // Garde les derniers temps de chaque sorte : { sorte: [[ms, juste (1/0/null), date], …] }.
  function record(kind, ms, ok = null) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* stockage indisponible */ }
    const list = (all[kind] = all[kind] || []);
    list.push([ms, ok === null ? null : ok ? 1 : 0, Date.now()]);
    if (list.length > KEEP) list.splice(0, list.length - KEEP);
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* idem */ }
  }

  return { stopwatch, setSpeaking, record };
})();
