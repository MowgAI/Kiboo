/* Web Worker : exécute le DDS hors du thread de l'interface.
   Message reçu : { id, op, arg } avec op = "solve" ou "analyze".
   Réponse : { id, result }. */
importScripts("dds.js");
onmessage = e => {
  const { id, op, arg } = e.data;
  postMessage({ id, result: DDS[op](arg) });
};
