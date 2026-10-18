/* Web Worker : exécute le DDS et le PIMC hors du thread de l'interface.
   Message reçu : { id, op, arg } avec op = "solve", "analyze" ou "pimc".
   Réponse : { id, result }. */
// Même numéro de version que la page (?v=...), pour ne pas charger d'anciens fichiers en cache.
importScripts("dds.js" + self.location.search, "pimc.js" + self.location.search);
onmessage = e => {
  const { id, op, arg } = e.data;
  const result = op === "pimc" ? PIMC.choose(arg.info, arg.opts) : DDS[op](arg);
  postMessage({ id, result });
};
