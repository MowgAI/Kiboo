"use strict";
/* =====================================================================
   DONNER MON AVIS
   Une petite fenêtre pour les testeurs : type de retour, note, message.
   Le site est statique (GitHub Pages) : rien n'est envoyé tout seul.
   Le testeur copie son avis pour l'envoyer à la personne qui lui a donné
   le lien, ou l'ouvre directement comme « issue » GitHub (compte requis).
   Le contexte utile pour reproduire un bug (appareil, réglages, pli en
   cours) est ajouté au message et montré au testeur avant l'envoi.
   ===================================================================== */
const Feedback = (() => {
  const VERSION = window.KIBOO_VERSION || "?";
  const ISSUES = "https://github.com/MowgAI/Kiboo/issues/new";
  const KINDS = { bug: "Un problème", idee: "Une idée", avis: "Mon avis" };
  let kind = "avis", stars = 0;

  // Ce qui aide à comprendre un retour, sans rien de personnel.
  function context() {
    const robots = game ? ["O", "E", "S"].map(s => `${SEAT_NAMES[s]} : ${PLAYER_TYPES[game.types[s]].label}`).join(", ") : "-";
    const options = [
      config.open && "jeux ouverts", config.hints && "meilleurs coups",
      config.explain && "explications de Piperno", config.quiz && "questions pendant la partie",
    ].filter(Boolean).join(", ") || "aucune";
    const trick = !game ? "-" : game.over ? "donne terminée" : `pli ${game.tricksWon.NS + game.tricksWon.EO + 1}, Nord-Sud ${game.tricksWon.NS} - Est-Ouest ${game.tricksWon.EO}`;
    return [
      `Version : ${VERSION}`,
      `Écran : ${window.innerWidth} × ${window.innerHeight}${matchMedia("(pointer: coarse)").matches ? " (tactile)" : ""}`,
      `Navigateur : ${navigator.userAgent}`,
      `Joueurs : ${robots}`,
      `Options : ${options}`,
      `Partie : ${trick}`,
    ].join("\n");
  }

  function message() {
    const text = $("fb-text").value.trim();
    const who = $("fb-name").value.trim();
    return [
      `Avis sur Kiboo : ${KINDS[kind].toLowerCase()}`,
      stars ? `Note : ${"★".repeat(stars)}${"☆".repeat(5 - stars)} (${stars}/5)` : null,
      who ? `De : ${who}` : null,
      "",
      text || "(pas de message)",
      "",
      "---",
      context(),
    ].filter(l => l !== null).join("\n");
  }

  function refresh() {
    for (const b of document.querySelectorAll("#feedback [data-kind]")) b.setAttribute("aria-pressed", b.dataset.kind === kind);
    for (const b of document.querySelectorAll("#feedback [data-star]")) b.classList.toggle("on", +b.dataset.star <= stars);
    $("fb-context").textContent = context();
    const title = `[${KINDS[kind]}] ${$("fb-text").value.trim().split("\n")[0].slice(0, 70) || "Avis sur Kiboo"}`;
    $("fb-github").href = `${ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(message())}`;
  }

  function status(text) { $("fb-status").textContent = text; }

  async function copy() {
    const text = message();
    try {
      await navigator.clipboard.writeText(text);
      status("Avis copié. Colle-le dans un message (e-mail, SMS…) à la personne qui t'a envoyé le lien. Merci !");
    } catch (e) {
      // Presse-papiers refusé : on montre le texte sélectionné pour une copie à la main.
      const area = $("fb-fallback");
      area.hidden = false;
      area.value = text;
      area.select();
      status("La copie automatique n'a pas marché : le texte est sélectionné ci-dessous, copie-le avec Ctrl+C (ou un appui long).");
    }
  }

  for (const b of document.querySelectorAll("#feedback [data-kind]")) b.onclick = () => { kind = b.dataset.kind; refresh(); };
  for (const b of document.querySelectorAll("#feedback [data-star]")) b.onclick = () => { stars = +b.dataset.star === stars ? 0 : +b.dataset.star; refresh(); };
  $("fb-text").addEventListener("input", refresh);
  $("fb-name").addEventListener("input", refresh);
  $("fb-copy").addEventListener("click", copy);
  $("btn-feedback").addEventListener("click", () => {
    status("");
    $("fb-fallback").hidden = true;
    refresh();
    $("feedback").showModal();
    $("fb-text").focus();
  });
  $("btn-fb-close").addEventListener("click", () => $("feedback").close());
  $("feedback").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  return { message };
})();
