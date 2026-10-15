/* =====================================================================
   PIMC KIBOO : « Perfect Information Monte Carlo ».
   Un robot honnête : il ne voit que ce qu'un vrai joueur voit.
   À chaque coup :
   1. il tire au hasard des donnes compatibles avec ce qu'il sait (ses
      cartes, celles du mort une fois étalé, les cartes déjà jouées et les
      chicanes révélées quand un joueur n'a pas fourni) ;
   2. il analyse chaque donne avec le DDS (js/dds.js) ;
   3. il joue la carte qui donne à son camp le plus de plis en moyenne.

   info = {
     seat:    siège au trait (0 = Nord, 1 = Est, 2 = Sud, 3 = Ouest)
     hands:   [4] cartes connues de chaque siège, ou null si la main est cachée
     counts:  [4] nombre de cartes restant dans chaque main
     unknown: cartes encore en jeu dont on ignore la place
     voids:   [4][4] voids[siège][couleur] = true si le siège n'a plus la couleur
     trick:   pli en cours [{ seat, card }]
     leader:  siège qui a entamé le pli en cours
     legal:   cartes jouables
   }
   opts = { samples, minSamples, timeMs } : nombre de donnes et budget de temps.
   choose(info, opts) -> { card, samples, scores: [{ card, avg }] }
   ===================================================================== */
const PIMC = (() => {
  const id = c => c.s * 10 + (c.v - 1);

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Répartit les cartes inconnues entre les mains cachées, en respectant
  // le nombre de cartes de chaque main et les chicanes. Les couleurs que
  // peu de joueurs peuvent détenir sont placées en premier ; un tirage
  // pondéré par la place restante garde la répartition proche de l'uniforme.
  function sampleDeal(info) {
    const hidden = [0, 1, 2, 3].filter(p => !info.hands[p]);
    const eligible = s => hidden.filter(p => !info.voids[p][s]).length;
    for (let attempt = 0; attempt < 200; attempt++) {
      const cap = hidden.map(p => info.counts[p]);
      const out = hidden.map(() => []);
      const cards = shuffle(info.unknown.slice()).sort((a, b) => eligible(a.s) - eligible(b.s));
      let ok = true;
      for (const c of cards) {
        const el = [];
        hidden.forEach((p, i) => { if (cap[i] > 0 && !info.voids[p][c.s]) el.push(i); });
        if (!el.length) { ok = false; break; }
        let r = Math.random() * el.reduce((t, i) => t + cap[i], 0);
        let pick = el[el.length - 1];
        for (const i of el) { r -= cap[i]; if (r < 0) { pick = i; break; } }
        out[pick].push(c);
        cap[pick]--;
      }
      if (!ok) continue;
      const hands = info.hands.map(h => h && h.slice());
      hidden.forEach((p, i) => { hands[p] = out[i]; });
      return hands;
    }
    return null;
  }

  // Deux cartes de la même main qui se touchent parmi les cartes encore en
  // jeu sont équivalentes dans toutes les donnes tirées : on n'en analyse
  // qu'une. Renvoie Map(id de la carte -> carte représentante).
  function representatives(info) {
    const alive = new Set(info.unknown.map(id));
    info.hands.forEach(h => h && h.forEach(c => alive.add(id(c))));
    info.trick.forEach(t => alive.add(id(t.card)));
    const mine = new Set(info.hands[info.seat].map(id));
    const rep = new Map();
    for (const c of info.legal) {
      let r = c;                                       // remonte jusqu'à la plus forte carte du groupe
      for (let v = c.v + 1; v <= 10; v++) {
        const k = c.s * 10 + v - 1;
        if (!alive.has(k)) continue;
        if (!mine.has(k)) break;
        r = { s: c.s, v };
      }
      rep.set(id(c), r);
    }
    return rep;
  }

  function choose(info, opts = {}) {
    const maxSamples = opts.samples || 40;
    const minSamples = opts.minSamples || 3;
    const timeMs = opts.timeMs || 1500;
    const legal = info.legal;
    if (legal.length === 1) return { card: legal[0], samples: 0, scores: [] };

    const ns = (info.seat & 1) === 0;
    const rep = representatives(info);
    const toAnalyze = [...new Map([...rep.values()].map(c => [id(c), c])).values()];
    const total = new Map(toAnalyze.map(c => [id(c), 0]));
    const t0 = Date.now();
    let n = 0;
    while (n < maxSamples && (n < minSamples || Date.now() - t0 < timeMs)) {
      const hands = sampleDeal(info);
      if (!hands) break;
      DDS.reset();                                   // garde la mémoire du Worker sous contrôle
      const position = { hands, trick: info.trick, leader: info.leader };
      for (const r of DDS.analyzeFast(position, toAnalyze, opts.maxLoss || 2)) {
        total.set(id(r.card), total.get(id(r.card)) + (ns ? r.ns : -r.ns));
      }
      n++;
    }
    if (!n) return { card: legal[0], samples: 0, scores: [] };

    // Meilleure moyenne ; à égalité, la plus petite carte.
    const scores = legal.map(c => ({ card: c, avg: total.get(id(rep.get(id(c)))) / n }))
      .sort((a, b) => b.avg - a.avg || a.card.v - b.card.v);
    for (const s of scores) if (!ns) s.avg = -s.avg;   // moyenne de plis NS, plus lisible
    return { card: scores[0].card, samples: n, scores };
  }

  return { choose, sampleDeal };
})();
if (typeof module !== "undefined") module.exports = PIMC;
