/* =====================================================================
   DDS KIBOO : solveur « double-mort » (à jeux ouverts) pour le petit
   bridge à 40 cartes, sans atout.
   Il calcule, en supposant que les 4 joueurs voient toutes les cartes et
   jouent parfaitement, combien de plis Nord-Sud feront à partir d'une
   position donnée (y compris au milieu d'un pli).

   Techniques (les mêmes idées que le DDS de Bo Haglund, en plus simple) :
   - recherche alpha-bêta en profondeur ;
   - cartes équivalentes : deux cartes « qui se touchent » dans une même
     main sont interchangeables, on n'en explore qu'une ;
   - table de transposition au début de chaque pli, avec une représentation
     relative des rangs (seul l'ordre des cartes restantes compte) ;
   - ordre des coups simple : coups gagnants économiques d'abord.

   Sièges : 0 = Nord, 1 = Est, 2 = Sud, 3 = Ouest (sens horaire).
   Couleurs 0..3, valeurs 1..10. Une main = 4 masques de 10 bits.
   ===================================================================== */
const DDS = (() => {
  const isNS = seat => (seat & 1) === 0;

  let hands;          // hands[seat][suit] = masque de bits (bit v-1)
  let trick;          // pli en cours : [{ seat, s, v }]
  let leader;         // siège qui a entamé le pli en cours
  let tricksLeft;     // nombre de plis restants (pli en cours compris)
  let tt = new Map(); // clé -> [borne basse, borne haute] des plis NS restants
  let nodes = 0;

  // Clé relative : pour chaque couleur, la suite des propriétaires des cartes
  // restantes (de la plus forte à la plus faible), codée sur 2 bits par carte.
  function key() {
    let k = leader;
    for (let s = 0; s < 4; s++) {
      const h0 = hands[0][s], h1 = hands[1][s], h2 = hands[2][s], h3 = hands[3][s];
      let code = 1;                                   // bit sentinelle pour la longueur
      for (let b = 512; b; b >>= 1) {
        if (h0 & b) code = code * 4;
        else if (h1 & b) code = code * 4 + 1;
        else if (h2 & b) code = code * 4 + 2;
        else if (h3 & b) code = code * 4 + 3;
      }
      k = k * 2097152 + code;                         // 2^21 > 4^10
      if (s === 1) { var k1 = k; k = 0; }
    }
    return k1 + "," + k;
  }

  // Coups à explorer pour le joueur `seat`, sans doublons d'équivalence, ordonnés.
  function moves(seat) {
    const h = hands[seat];
    let suits;
    if (trick.length > 0 && h[trick[0].s]) suits = [trick[0].s];
    else suits = [0, 1, 2, 3].filter(s => h[s]);

    // Carte gagnante actuelle du pli
    let bestV = 0, bestSeat = -1, led = -1;
    if (trick.length) {
      led = trick[0].s;
      for (const t of trick) if (t.s === led && t.v > bestV) { bestV = t.v; bestSeat = t.seat; }
    }
    const partnerWins = bestSeat >= 0 && isNS(bestSeat) === isNS(seat);

    const list = [];
    for (const s of suits) {
      let alive = hands[0][s] | hands[1][s] | hands[2][s] | hands[3][s];
      for (const t of trick) if (t.s === s) alive |= 1 << (t.v - 1);
      // Parcours de haut en bas ; on garde la plus petite carte de chaque groupe équivalent.
      let groupLow = 0;
      for (let v = 10; v >= 1; v--) {
        const b = 1 << (v - 1);
        if (!(alive & b)) continue;
        if (h[s] & b) {
          groupLow = v;
        } else if (groupLow) {
          list.push({ s, v: groupLow });
          groupLow = 0;
        }
      }
      if (groupLow) list.push({ s, v: groupLow });
    }

    // Ordre : heuristique simple
    for (const m of list) {
      let w;
      if (trick.length === 0) {
        // Entame : d'abord les cartes maîtresses, puis les petites cartes vers un partenaire maître.
        const all = hands[0][m.s] | hands[1][m.s] | hands[2][m.s] | hands[3][m.s];
        const top = 31 - Math.clz32(all);              // bit de la plus forte carte restante
        const owner = [0, 1, 2, 3].find(p => hands[p][m.s] & (1 << top));
        const range = ((1 << (top + 1)) - 1) & ~((1 << (m.v - 1)) - 1);
        if ((all & range) === (h[m.s] & range)) w = 80;   // carte (ou groupe) maître
        else if (owner === ((seat + 2) & 3)) w = 70 - m.v;
        else if (isNS(owner) === isNS(seat)) w = 50 - m.v;
        else w = 30 - m.v;
      } else if (m.s === led) {
        const beats = m.v > bestV;
        if (partnerWins) w = beats ? 10 - m.v : 40 - m.v;      // partenaire maître : on fournit petit
        else w = beats ? 60 - m.v : 20 - m.v;                   // sinon : la plus petite qui gagne
      } else {
        w = 10 - m.v;                                 // défausse : petite carte
      }
      m.w = w;
    }
    list.sort((a, b) => b.w - a.w);
    return list;
  }

  function play(seat, m) {
    hands[seat][m.s] &= ~(1 << (m.v - 1));
    trick.push({ seat, s: m.s, v: m.v });
  }
  function unplay(seat, m) {
    hands[seat][m.s] |= 1 << (m.v - 1);
    trick.pop();
  }
  function winnerOfTrick() {
    const led = trick[0].s;
    let best = trick[0];
    for (const t of trick) if (t.s === led && t.v > best.v) best = t;
    return best.seat;
  }

  // Renvoie le nombre de plis NS dans le reste de la donne (pli en cours compris).
  function search(alpha, beta) {
    nodes++;
    if (tricksLeft === 0) return 0;
    let k = null;
    if (trick.length === 0) {
      k = key();
      const e = tt.get(k);
      if (e) {
        if (e[0] === e[1]) return e[0];
        if (e[0] >= beta) return e[0];
        if (e[1] <= alpha) return e[1];
        if (e[0] > alpha) alpha = e[0];
        if (e[1] < beta) beta = e[1];
      }
      if (alpha >= tricksLeft) return tricksLeft;
      if (beta <= 0) return 0;
    }
    const a0 = alpha, b0 = beta;
    const seat = (leader + trick.length) & 3;
    const max = isNS(seat);
    let best = max ? -1 : 99;

    for (const m of moves(seat)) {
      play(seat, m);
      let val;
      if (trick.length === 4) {
        const saved = trick, savedLeader = leader;
        const w = winnerOfTrick();
        const gain = isNS(w) ? 1 : 0;
        trick = []; leader = w; tricksLeft--;
        val = gain + search(alpha - gain, beta - gain);
        tricksLeft++; leader = savedLeader; trick = saved;
      } else {
        val = search(alpha, beta);
      }
      unplay(seat, m);
      if (max) {
        if (val > best) best = val;
        if (best > alpha) alpha = best;
      } else {
        if (val < best) best = val;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }

    if (k !== null) {
      const e = tt.get(k) || [0, tricksLeft];
      if (best <= a0) e[1] = Math.min(e[1], best);
      else if (best >= b0) e[0] = Math.max(e[0], best);
      else { e[0] = best; e[1] = best; }
      tt.set(k, e);
    }
    return best;
  }

  function load(position) {
    hands = [0, 1, 2, 3].map(p => {
      const m = [0, 0, 0, 0];
      for (const c of position.hands[p]) m[c.s] |= 1 << (c.v - 1);
      return m;
    });
    trick = position.trick.map(t => ({ seat: t.seat, s: t.card.s, v: t.card.v }));
    leader = position.leader;
    const remaining = position.hands.reduce((n, h) => n + h.length, 0) + trick.length;
    tricksLeft = remaining / 4;
  }

  /* position = {
       hands:  [cartesN, cartesE, cartesS, cartesO]   (cartes restantes, {s, v})
       trick:  [{ seat, card }]                       (pli en cours)
       leader: siège qui a entamé le pli en cours
     }
     solve(position)    -> plis NS restants (pli en cours compris)
     analyze(position)  -> [{ card, ns }] pour chaque carte légale du joueur au trait */
  // Recherche par fenêtres nulles (« est-ce que NS fait au moins t plis ? »),
  // beaucoup plus rapide qu'une recherche à fenêtre complète.
  function exact() {
    let lo = 0, hi = tricksLeft;
    while (lo < hi) {
      const t = (lo + hi + 1) >> 1;
      if (search(t - 1, t) >= t) lo = t; else hi = t - 1;
    }
    return lo;
  }

  function solve(position) {
    load(position);
    return exact();
  }

  function analyze(position) {
    load(position);
    const seat = (leader + trick.length) & 3;
    const h = position.hands[seat];
    const led = trick.length ? trick[0].s : -1;
    const legal = trick.length && h.some(c => c.s === led) ? h.filter(c => c.s === led) : h.slice();
    const out = [];
    for (const card of legal) {
      const m = { s: card.s, v: card.v };
      play(seat, m);
      let val;
      if (trick.length === 4) {
        const saved = trick, savedLeader = leader;
        const w = winnerOfTrick();
        const gain = isNS(w) ? 1 : 0;
        trick = []; leader = w; tricksLeft--;
        val = gain + exact();
        tricksLeft++; leader = savedLeader; trick = saved;
      } else {
        val = exact();
      }
      unplay(seat, m);
      out.push({ card, ns: val });
    }
    return out;
  }

  /* Variante rapide d'analyze pour le PIMC. On calcule la valeur v de la
     position, puis pour chaque carte demandée un ou deux tests à fenêtre
     nulle : « cette carte garde-t-elle v ? v - 1 ? ». Une carte qui perd plus
     de maxLoss plis est notée comme en perdant maxLoss.
     analyzeFast(position, cards, maxLoss) -> [{ card, ns }] */
  function analyzeFast(position, cards, maxLoss = 2) {
    load(position);
    const seat = (leader + trick.length) & 3;
    const max = isNS(seat);
    const v = exact();
    // La carte jouée, NS fait-il au moins t plis ?
    const atLeast = t => {
      if (t <= 0) return true;
      if (trick.length < 4) return search(t - 1, t) >= t;
      const saved = trick, savedLeader = leader;
      const w = winnerOfTrick();
      const gain = isNS(w) ? 1 : 0;
      trick = []; leader = w; tricksLeft--;
      const ok = gain + search(t - 1 - gain, t - gain) >= t;
      tricksLeft++; leader = savedLeader; trick = saved;
      return ok;
    };
    const out = [];
    for (const card of cards) {
      const m = { s: card.s, v: card.v };
      play(seat, m);
      let loss = 0;
      if (max) while (loss < maxLoss && !atLeast(v - loss)) loss++;
      else while (loss < maxLoss && atLeast(v + loss + 1)) loss++;
      unplay(seat, m);
      out.push({ card, ns: max ? v - loss : v + loss });
    }
    return out;
  }

  return {
    solve, analyze, analyzeFast,
    reset() { tt = new Map(); },
    stats() { return { nodes, ttSize: tt.size }; },
  };
})();
if (typeof module !== "undefined") module.exports = DDS;
