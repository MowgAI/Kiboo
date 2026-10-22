"use strict";
/* =====================================================================
   LANGUES (français, anglais, italien)
   Les textes sont rangés par langue dans lang/fr.js, lang/en.js et
   lang/it.js (window.KIBOO_LANGS.<code> = { clé: texte | fonction }).
   Un texte peut contenir des {paramètres}, ou être une fonction quand la
   grammaire dépend des valeurs (pluriels, accords, articles).

     T("cle", { n: 3 })      texte traduit dans la langue choisie
     I18N.g("color")(s)      outil de grammaire de la langue (voir lang/fr.js)
     I18N.set("en")          change de langue (gardée dans ce navigateur)

   Dans la page, data-i18n="cle" remplace le texte d'un élément,
   data-i18n-html="cle" son contenu HTML, data-i18n-aria="cle" son
   aria-label et data-i18n-ph="cle" son placeholder.
   Une clé absente d'une langue retombe sur le français.
   ===================================================================== */
const KIBOO_LANGS = window.KIBOO_LANGS || {};

const I18N = (() => {
  const KEY = "kiboo.lang";
  const SUPPORTED = Object.keys(KIBOO_LANGS);

  function initial() {
    try {
      const saved = localStorage.getItem(KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch (e) { /* stockage indisponible */ }
    for (const l of navigator.languages || [navigator.language || ""]) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }
    return "fr";
  }
  let lang = initial();

  const pack = () => KIBOO_LANGS[lang] || KIBOO_LANGS.fr;

  function t(key, p = {}) {
    let v = pack()[key];
    if (v === undefined) v = KIBOO_LANGS.fr[key];
    if (v === undefined) return key;
    if (typeof v === "function") return v(p);
    return String(v).replace(/\{(\w+)\}/g, (m, k) => (p[k] !== undefined ? p[k] : m));
  }

  // Outil de grammaire (fonction) de la langue courante.
  const g = name => pack()[name] || KIBOO_LANGS.fr[name];

  // Traduit les textes fixes de la page.
  function apply(root = document) {
    document.documentElement.lang = lang;
    for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll("[data-i18n-html]")) el.innerHTML = t(el.dataset.i18nHtml);
    for (const el of root.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
    for (const el of root.querySelectorAll("[data-i18n-ph]")) el.setAttribute("placeholder", t(el.dataset.i18nPh));
    const sel = document.getElementById("lang");
    if (sel) sel.value = lang;
  }

  function set(l) {
    if (!SUPPORTED.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* idem */ }
    apply();
    // Chaque module se met à jour (table, exercices, collection…).
    document.dispatchEvent(new CustomEvent("kiboo-lang", { detail: l }));
  }

  return { t, g, apply, set, SUPPORTED, get lang() { return lang; } };
})();

const T = (key, p) => I18N.t(key, p);
// Grammaire de la langue courante (définie dans lang/*.js).
const colorName = s => I18N.g("color")(s);          // « bleu » / "blue" / "blu"
const theColor = s => I18N.g("theColor")(s);        // « le bleu » / "blue" / "il blu"
const cardAdj = (s, n) => I18N.g("cardAdj")(s, n);  // accordé avec « carte » : « bleues » / "blue" / "rosse"
const seatName = x => I18N.g("seat")(x);            // « Ouest » / "West" / "Ovest"
const teamName = t => I18N.g("team")(t);            // « Nord-Sud » / "North-South"…
const familyName = s => I18N.g("family")(s);        // « animaux » / "animals" / "animali"
const plural = (n, one, many) => (I18N.g("isPlural")(n) ? many : one);

// Menu Langue et première traduction de la page.
(() => {
  const sel = document.getElementById("lang");
  if (sel) {
    for (const code of I18N.SUPPORTED) {
      const o = document.createElement("option");
      o.value = code;
      o.textContent = KIBOO_LANGS[code].langName;
      sel.appendChild(o);
    }
    sel.addEventListener("change", () => I18N.set(sel.value));
  }
  I18N.apply();
})();
