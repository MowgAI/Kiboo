/* Web Worker : exécute le DDS et le PIMC hors du thread de l'interface.
   Message reçu : { id, op, arg } avec op = "solve", "analyze" ou "pimc".
   Réponse : { id, result }. */
importScripts("dds.js", "pimc.js");
onmessage = e => {
  const { id, op, arg } = e.data;
  const result = op === "pimc" ? PIMC.choose(arg.info, arg.opts) : DDS[op](arg);
  postMessage({ id, result });
};
