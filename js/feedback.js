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
  const kindName = k => T("fb.kind." + k);
  let kind = "avis", stars = 0;

  // Ce qui aide à comprendre un retour, sans rien de personnel.
  function context() {
    const robots = game ? ["O", "E", "S"].map(s => `${seatName(s)} : ${PLAYER_TYPES[game.types[s]].label}`).join(", ") : "-";
    const options = [
      config.open && T("fb.opt.open"), config.hints && T("fb.opt.hints"),
      config.explain && T("fb.opt.explain"), config.quiz !== "off" && T("fb.opt.quiz") + " (" + T("setup.quiz." + config.quiz) + ")",
    ].filter(Boolean).join(", ") || T("fb.opt.none");
    const trick = !game ? "-" : game.over ? T("fb.ctx.over") : T("fb.ctx.trick", { n: game.tricksWon.NS + game.tricksWon.EO + 1, ns: game.tricksWon.NS, eo: game.tricksWon.EO });
    return [
      `${T("fb.ctx.version")} : ${VERSION}`,
      `${T("fb.ctx.lang")} : ${I18N.lang}`,
      `${T("fb.ctx.screen")} : ${window.innerWidth} × ${window.innerHeight}${matchMedia("(pointer: coarse)").matches ? T("fb.ctx.touch") : ""}`,
      `${T("fb.ctx.browser")} : ${navigator.userAgent}`,
      `${T("fb.ctx.players")} : ${robots}`,
      `${T("fb.ctx.options")} : ${options}`,
      `${T("fb.ctx.game")} : ${trick}`,
    ].join("\n");
  }

  function message() {
    const text = $("fb-text").value.trim();
    const who = $("fb-name").value.trim();
    return [
      T("fb.msg.title", { kind: kindName(kind) }),
      stars ? `${T("fb.msg.note")} : ${"★".repeat(stars)}${"☆".repeat(5 - stars)} (${stars}/5)` : null,
      who ? `${T("fb.msg.from")} : ${who}` : null,
      "",
      text || T("fb.msg.empty"),
      "",
      "---",
      context(),
    ].filter(l => l !== null).join("\n");
  }

  function refresh() {
    for (const b of document.querySelectorAll("#feedback [data-kind]")) b.setAttribute("aria-pressed", b.dataset.kind === kind);
    for (const b of document.querySelectorAll("#feedback [data-star]")) b.classList.toggle("on", +b.dataset.star <= stars);
    $("fb-context").textContent = context();
    const title = `[${kindName(kind)}] ${$("fb-text").value.trim().split("\n")[0].slice(0, 70) || T("fb.issueDefault")}`;
    $("fb-github").href = `${ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(message())}`;
  }

  function status(text) { $("fb-status").textContent = text; }

  async function copy() {
    const text = message();
    try {
      await navigator.clipboard.writeText(text);
      status(T("fb.copied"));
    } catch (e) {
      // Presse-papiers refusé : on montre le texte sélectionné pour une copie à la main.
      const area = $("fb-fallback");
      area.hidden = false;
      area.value = text;
      area.select();
      status(T("fb.copyFailed"));
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
