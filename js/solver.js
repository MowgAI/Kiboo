/* =====================================================================
   SOLVER : accès asynchrone au DDS.
   Les calculs tournent dans un Web Worker (js/dds-worker.js) pour ne pas
   figer l'interface : une analyse d'entame peut prendre plusieurs secondes.
   Si le Worker est indisponible (page ouverte en file:// dans Chrome, par
   exemple), on retombe sur le DDS du thread principal.

     Solver.solve(position)    -> Promise<plis NS restants>
     Solver.analyze(position)  -> Promise<[{ card, ns }]>
     Solver.pimc(info, opts)   -> Promise<{ card, samples, scores }> (js/pimc.js)
     Solver.reset()            -> abandonne les calculs en cours (leurs
                                  promesses renvoient null) et vide la table
                                  de transposition
   ===================================================================== */
const Solver = (() => {
  let worker = null;
  let useWorker = typeof Worker !== "undefined";
  let nextId = 0;
  const pending = new Map();          // id -> { op, arg, resolve }

  function local(op, arg) {
    const run = op === "pimc" ? () => PIMC.choose(arg.info, arg.opts) : () => DDS[op](arg);
    return new Promise(resolve => setTimeout(() => resolve(run()), 0));
  }

  // Le Worker a échoué : on rejoue ses demandes en attente sur le thread principal.
  function fallback() {
    useWorker = false;
    if (worker) worker.terminate();
    worker = null;
    for (const p of pending.values()) local(p.op, p.arg).then(p.resolve);
    pending.clear();
  }

  function start() {
    if (!useWorker) return;
    try {
      worker = new Worker("js/dds-worker.js?v=" + (window.KIBOO_VERSION || ""));
    } catch (e) {
      fallback();
      return;
    }
    worker.onmessage = e => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      p.resolve(e.data.result);
    };
    worker.onerror = e => { e.preventDefault(); fallback(); };
  }

  function call(op, arg) {
    if (!worker) return local(op, arg);
    return new Promise(resolve => {
      const id = ++nextId;
      pending.set(id, { op, arg, resolve });
      worker.postMessage({ id, op, arg });
    });
  }

  function reset() {
    if (worker) worker.terminate();     // coupe net un calcul devenu inutile
    worker = null;
    for (const p of pending.values()) p.resolve(null);
    pending.clear();
    DDS.reset();
    start();
  }

  start();
  return {
    solve: position => call("solve", position),
    analyze: position => call("analyze", position),
    pimc: (info, opts) => call("pimc", { info, opts }),
    reset,
  };
})();
