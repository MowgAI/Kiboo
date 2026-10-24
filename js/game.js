"use strict";
/* =====================================================================
   KIBOO : petit bridge à 40 cartes, sans atout.
   - 4 couleurs (bleu, vert, rouge, jaune) numérotées de 1 à 10.
   - 10 cartes par joueur, 10 plis. Sud déclarant, Nord le mort, Ouest entame.
   - Il faut fournir la couleur demandée ; la plus forte carte de cette
     couleur gagne le pli. La paire qui fait le plus de plis gagne (5-5 = égalité).
   ===================================================================== */

const COLORS = ["blue", "green", "red", "yellow"];
const SEATS = ["N", "E", "S", "O"];               // ordre de jeu, sens horaire
const DECLARER = "S", DUMMY = "N", OPENING_LEADER = "O";

const team = seat => (seat === "N" || seat === "S") ? "NS" : "EO";
const nextSeat = seat => SEATS[(SEATS.indexOf(seat) + 1) % 4];
const cardId = c => c.s * 10 + (c.v - 1);
// Noms des couleurs, places et cartes dans la langue choisie : voir js/i18n.js et lang/*.js.
const cardName = c => I18N.g("card")(c);

function makeDeck() {
  const deck = [];
  for (let s = 0; s < 4; s++) for (let v = 1; v <= 10; v++) deck.push({ s, v });
  return deck;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Tri pour l'affichage : par couleur, puis de la plus forte à la plus faible.
const sortForDisplay = h => h.slice().sort((a, b) => a.s - b.s || b.v - a.v);
// Tri « algorithmique » (comme le code de Samuel) : par couleur, puis croissant.
const sortAsc = h => h.slice().sort((a, b) => a.s - b.s || a.v - b.v);

function legalCards(hand, trick) {
  if (trick.length === 0) return hand.slice();
  const led = trick[0].card.s;
  const follow = hand.filter(c => c.s === led);
  return follow.length ? follow : hand.slice();
}
function trickWinner(trick) {
  const led = trick[0].card.s;
  let best = trick[0];
  for (const p of trick) if (p.card.s === led && p.card.v > best.card.v) best = p;
  return best.seat;
}

/* =====================================================================
   L'INTERFACE DE SIÈGE
   Chaque siège est occupé par un « contrôleur », humain ou robot.
   La table ne connaît que ce contrat :

     controller.choose(view)  ->  Promise<carte>

   « view » ne contient QUE ce que ce joueur a le droit de voir :
     seat        siège qui doit jouer (N si le déclarant joue le mort)
     hand        cartes de ce siège
     visible     { siège: cartes } de toutes les mains visibles pour lui
     trick       pli en cours [{ seat, card }]
     played      liste de toutes les cartes déjà jouées
     tricksWon   { NS, EO }
     legal       cartes autorisées
   La table vérifie toujours la légalité de la réponse.
   Pour brancher un nouveau robot (par exemple PIMC ou alpha-mu de Samuel,
   via WebAssembly ou un serveur), il suffit d'ajouter une entrée dans BOTS.
   ===================================================================== */

// PiperRand (robot hasard) : joue une carte légale au hasard.
class RandomBot {
  constructor(env = {}) { this.rand = env.rand || Math.random; }
  choose(view) { return view.legal[Math.floor(this.rand() * view.legal.length)]; }
}

// Règle d'entame du rapport (section 3.1) : couleur la plus longue
// (à égalité, la plus forte somme), puis la plus haute d'une séquence
// d'au moins deux cartes dont la plus haute vaut au moins 7, sinon la plus petite.
const SEQ_MIN = 7;
// Renvoie aussi les éléments qui ont décidé du choix, pour les explications.
function openingChoice(hand) {
  const bySuit = [0, 1, 2, 3].map(s => hand.filter(c => c.s === s).sort((a, b) => a.v - b.v));
  const maxLen = Math.max(...bySuit.map(x => x.length));
  let suit = -1, bestSum = -1;
  bySuit.forEach((cards, s) => {
    if (cards.length !== maxLen) return;
    const sum = cards.reduce((t, c) => t + c.v, 0);
    if (sum >= bestSum) { bestSum = sum; suit = s; }
  });
  const cards = bySuit[suit];
  let top = null;                                   // plus haute de la séquence la plus haute
  for (let i = 1; i < cards.length; i++) {
    const endsSeq = i === cards.length - 1 || cards[i + 1].v !== cards[i].v + 1;
    if (cards[i].v === cards[i - 1].v + 1 && endsSeq) top = cards[i];
  }
  if (top && top.v < SEQ_MIN) top = null;           // séquence trop petite (plus haute carte sous le 7) : ignorée
  const tied = bySuit.filter(x => x.length === maxLen).length > 1;
  return { card: top || cards[0], suit, len: maxLen, tied, seq: !!top };
}
const openingCard = hand => openingChoice(hand).card;

// Piperno : robot déterministe de Samuel (src/strategy/deterministic.rs), adapté.
// Après chaque choix, `this.reason` dit quelle règle a décidé : une liste de
// { k: clé de traduction, p: paramètres }, traduite à l'affichage (reasonText).
const reasonText = reason => reason.map(r => T(r.k, r.p)).join(" ");

class DeterministicBot {
  constructor() { this.mySuit = {}; }          // une couleur préférée par main jouée
  choose(view) {
    const { seat, hand, trick, played, legal } = view;
    if (played.length === 0 && trick.length === 0) {
      const o = openingChoice(hand);
      this.reason = [{ k: "pip.opening", p: { suit: o.suit, len: o.len, tied: o.tied, seq: o.seq } }];
      return o.card;
    }

    const note = [];
    if (this.mySuit[seat] === undefined || !hand.some(c => c.s === this.mySuit[seat])) {
      this.mySuit[seat] = openingCard(hand).s;
      note.push({ k: "pip.newSuit", p: { suit: this.mySuit[seat] } });
    }
    const my = this.mySuit[seat];

    if (trick.length === 0) {
      // Je détiens la plus forte carte restante de ma couleur ? je la joue, sinon la plus petite.
      const gone = new Set(played.map(cardId));
      let top = 0;
      for (let v = 10; v >= 1; v--) if (!gone.has(my * 10 + v - 1)) { top = v; break; }
      const mine = hand.filter(c => c.s === my).sort((a, b) => a.v - b.v);
      const strong = mine.some(c => c.v === top);
      this.reason = [...note, { k: strong ? "pip.leadStrong" : "pip.leadWeak", p: { suit: my, top } }];
      return strong ? mine[mine.length - 1] : mine[0];
    }

    const led = trick[0].card.s;
    const follows = legal[0].s === led;
    const partnerWins = team(trickWinner(trick)) === team(seat);
    const sorted = sortAsc(legal);
    // La plus petite carte qui fait gagner (provisoirement) mon camp.
    for (const c of sorted) {
      if (team(trickWinner([...trick, { seat, card: c }])) !== team(seat)) continue;
      if (partnerWins) {
        this.reason = [{ k: follows ? "pip.partnerFollow" : "pip.partnerDiscard", p: { led } }];
      } else {
        this.reason = [{ k: "pip.win", p: { now: trick.length < 3 } }];
      }
      return c;
    }
    // Sinon, je fournis la plus petite.
    if (follows) {
      this.reason = [{ k: "pip.cantWin" }];
      return sorted[0];
    }
    // Sinon, je défausse une petite carte en épargnant ma couleur préférée.
    const other = sorted.find(c => c.s !== my);
    this.reason = [...note, { k: other ? "pip.discardKeep" : "pip.discardOnly", p: { led, my } }];
    return other || sorted[0];
  }
}

// Cheater (robot expert) : utilise le DDS. Il « triche » : il voit toutes les cartes
// (omniscient), ce qui en fait un adversaire de référence, pas un vrai joueur.
class ExpertBot {
  constructor(env = {}) { this.omniscient = true; this.solver = env.solver || Solver; }
  async choose(view) {
    const res = await this.solver.analyze(view.position);
    if (!res) return view.legal[0];                   // calcul abandonné (nouvelle donne)
    const mine = team(view.seat) === "NS";
    let best = null;
    for (const r of res.sort((a, b) => a.card.v - b.card.v)) {
      const val = mine ? r.ns : -r.ns;
      if (!best || val > best.val) best = { card: r.card, val };
    }
    return best.card;
  }
}

// Averell (robot PIMC) : honnête, il ne voit que sa main et le mort. Il tire des donnes
// compatibles avec ce qu'il sait et joue la carte la meilleure en moyenne
// selon le DDS (voir js/pimc.js).
// Au premier pli, trop de cartes sont cachées : l'analyse serait lente et
// bruitée. Il joue alors comme Piperno, sans simulation.
class PimcBot {
  constructor(opts, env = {}) {
    this.opts = opts;
    this.solver = env.solver || Solver;
    this.seed = env.seed;
    this.piperno = new DeterministicBot();
  }
  async choose(view) {
    if (view.legal.length === 1) return view.legal[0];
    if (view.tricksWon.NS + view.tricksWon.EO === 0) return this.piperno.choose(view);
    // Avec une graine (évaluation), le même coup est toujours choisi dans la même position.
    const opts = this.seed === undefined ? this.opts
      : { ...this.opts, seed: (this.seed + view.played.length * 7919 + SEATS.indexOf(view.seat) * 104729) >>> 0 };
    const res = await this.solver.pimc(pimcInfo(view), opts);
    return res ? res.card : view.legal[0];
  }
}
// Nombre de donnes tirées par coup : au plus `samples`, au moins `minSamples`,
// et entre les deux tant que le calcul reste sous `timeMs` millisecondes.
const AVERELL_OPTS = { samples: 40, minSamples: 3, timeMs: 1500 };
const AVERELL250_OPTS = { samples: 250, minSamples: 3, timeMs: 8000 };

// Ce que sait le joueur au trait, au format de js/pimc.js.
function pimcInfo(view) {
  const known = new Set(view.played.map(cardId));
  const hands = SEATS.map(s => view.visible[s] ? view.visible[s].slice() : null);
  hands.forEach(h => h && h.forEach(c => known.add(cardId(c))));
  // Chicanes : un joueur qui n'a pas fourni n'a plus la couleur entamée.
  const voids = SEATS.map(() => [false, false, false, false]);
  const ledSuit = {};
  for (const h of view.history) {
    if (!(h.trickNo in ledSuit)) ledSuit[h.trickNo] = h.card.s;
    else if (h.card.s !== ledSuit[h.trickNo]) voids[SEATS.indexOf(h.seat)][ledSuit[h.trickNo]] = true;
  }
  return {
    seat: SEATS.indexOf(view.seat),
    hands,
    counts: SEATS.map(s => view.counts[s]),
    unknown: makeDeck().filter(c => !known.has(cardId(c))),
    voids,
    trick: view.trick.map(p => ({ seat: SEATS.indexOf(p.seat), card: p.card })),
    leader: SEATS.indexOf(view.leader),
    legal: view.legal,
  };
}

// Joueur humain : la promesse est résolue par un clic sur une carte.
class HumanController {
  constructor(seat) { this.seat = seat; this.human = true; }
  choose(view) {
    return new Promise(resolve => { game.waiting = { seat: view.seat, legal: view.legal, resolve }; render(); });
  }
}

const PLAYER_TYPES = {
// make(siège, env) : env = { solver, seed, rand } pour les parties rejouées par l'évaluation.
  humain:       { get label() { return T("player.human"); }, make: s => new HumanController(s) },
  deterministe: { label: "Piperno",       make: () => new DeterministicBot() },
  aleatoire:    { label: "PiperRand",     make: (s, env) => new RandomBot(env) },
  pimc:         { label: "Averell",       make: (s, env) => new PimcBot(AVERELL_OPTS, env) },
  pimc250:      { label: "Averell250",    make: (s, env) => new PimcBot(AVERELL250_OPTS, env) },
  expert:       { label: "Cheater",       make: (s, env) => new ExpertBot(env) },
};

/* ===================== État de la partie ===================== */
const config = { O: "deterministe", E: "deterministe", S: "humain", speed: 650, open: false, hints: false, explain: false, quiz: "off", eval: true, coco: "off", voice: false };
let game = null;
let runToken = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function dealHands() {
  const deck = shuffle(makeDeck());
  const hands = {};
  SEATS.forEach((s, i) => { hands[s] = deck.slice(i * 10, i * 10 + 10); });
  return hands;
}

function newGame(hands, opts = {}) {
  const initial = {};
  SEATS.forEach(s => { initial[s] = hands[s].slice(); });
  const types = { O: config.O, E: config.E, S: config.S };
  const controllers = {};
  for (const s of ["O", "E", "S"]) controllers[s] = PLAYER_TYPES[types[s]].make(s);
  controllers.N = controllers.S;                // le déclarant joue le mort
  game = {
    initial, types, controllers,
    hands: {}, trick: [], played: [], leader: OPENING_LEADER,
    tricksWon: { NS: 0, EO: 0 }, turn: OPENING_LEADER, lastTrick: null,
    dummyShown: false, waiting: null, over: false,
  };
  game.hands = {};
  SEATS.forEach(s => { game.hands[s] = initial[s].slice(); });
  Solver.reset();
  game.hint = null;
  game.revealed = new Map();                    // cartes cachées révélées par un cadeau : id -> siège
  game.assisted = false;                        // aide utilisée (meilleurs coups, jeux ouverts, carte révélée)
  game.replayed = !!opts.replay;                // « Rejouer la donne » : le joueur connaît déjà les cartes
  if (typeof Quiz !== "undefined") Quiz.reset();
  game.history = [];                            // un instantané avant chaque carte, pour le bilan
  game.review = null;
  game.explanations = [];                       // pourquoi Piperno a joué chaque carte, la plus récente d'abord
  const token = ++runToken;
  render();
  play(token);
  if (typeof Evaluation !== "undefined") Evaluation.start();   // parties fantômes du mode évaluation
}

function fullPosition(g = game) {
  return {
    hands: SEATS.map(s => g.hands[s].slice()),
    trick: g.trick.map(p => ({ seat: SEATS.indexOf(p.seat), card: p.card })),
    leader: SEATS.indexOf(g.leader),
  };
}

// `g` : l'état d'une partie (la partie affichée par défaut, ou une partie
// rejouée en coulisses par l'évaluation).
function viewFor(seat, g = game) {
  const visible = { [seat]: g.hands[seat].slice() };
  if (g.dummyShown) visible[DUMMY] = g.hands[DUMMY].slice();
  if (seat === DUMMY) visible[DECLARER] = g.hands[DECLARER].slice();
  return {
    seat,
    hand: g.hands[seat].slice(),
    visible,
    trick: g.trick.map(p => ({ seat: p.seat, card: p.card })),
    played: g.played.slice(),
    tricksWon: { ...g.tricksWon },
    // Informations publiques : qui a joué quoi, l'entameur du pli, la taille des mains.
    history: g.history.map(h => ({ seat: h.seat, card: h.card, trickNo: h.trickNo })),
    leader: g.leader,
    counts: Object.fromEntries(SEATS.map(s => [s, g.hands[s].length])),
    legal: legalCards(g.hands[seat], g.trick),
    // Uniquement pour les robots omniscients (expert) : la donne complète.
    position: g.controllers[seat].omniscient ? fullPosition(g) : undefined,
  };
}

async function play(token) {
  // Questions en cours de partie (js/quiz.js) : la partie attend la réponse puis reprend.
  await Quiz.at("start");
  if (token !== runToken) return;
  while (game.played.length < 40) {
    const seat = game.turn;
    const controller = game.controllers[seat];
    if (controller.human && game.trick.length) {
      await Quiz.at("play", { seat });
      if (token !== runToken) return;
    }
    const view = viewFor(seat);
    if (!controller.human) { render(); await sleep(config.speed); }
    if (token !== runToken) return;
    if (controller.human && (config.hints || config.open)) game.assisted = true;
    let card = await controller.choose(view);
    if (token !== runToken) return;
    game.waiting = null;
    const legal = legalCards(game.hands[seat], game.trick);
    if (!card || !legal.some(c => cardId(c) === cardId(card))) card = legal[0];   // sécurité
    card = game.hands[seat].find(c => cardId(c) === cardId(card));
    game.history.push({
      seat, card, pos: fullPosition(), ns: game.tricksWon.NS,
      trickNo: game.tricksWon.NS + game.tricksWon.EO + 1,
    });

    if (game.types[seatController(seat)] === "deterministe" && controller.reason) {
      game.explanations.unshift({ seat, card, reason: controller.reason, trickNo: game.tricksWon.NS + game.tricksWon.EO + 1 });
    }
    game.hands[seat] = game.hands[seat].filter(c => c !== card);
    game.trick.push({ seat, card, fresh: true });
    game.played.push(card);
    game.dummyShown = true;
    game.lastTrick = null;

    if (game.trick.length < 4) {
      game.turn = nextSeat(seat);
      render();
      game.trick.forEach(p => { p.fresh = false; });
      if (game.played.length === 1) {
        await Quiz.at("lead");
        if (token !== runToken) return;
      }
      if (card.s !== game.trick[0].card.s) {
        await Quiz.at("discard", { seat, card });
        if (token !== runToken) return;
      }
      continue;
    }
    if (card.s !== game.trick[0].card.s) {
      render();
      game.trick.forEach(p => { p.fresh = false; });
      await Quiz.at("discard", { seat, card });
      if (token !== runToken) return;
    }
    const winner = trickWinner(game.trick);
    game.winnerSeat = winner;
    // Avec un joueur humain, le pli reste visible jusqu'à son clic sur « Pli suivant » :
    // le temps de bien regarder et retenir les cartes jouées.
    render();
    game.trick.forEach(p => { p.fresh = false; });
    if (bottomSeatHuman()) await new Promise(resolve => { game.holding = resolve; render(); });
    else await sleep(Math.max(700, config.speed * 1.4));
    if (token !== runToken) return;
    game.holding = null;
    game.tricksWon[team(winner)]++;
    game.lastTrick = game.trick;
    game.trick = [];
    game.winnerSeat = null;
    game.leader = game.turn = winner;
    if (game.played.length < 40) {
      render();
      await Quiz.at("trick");
      if (token !== runToken) return;
    }
  }
  game.over = true;
  if (typeof Evaluation !== "undefined") Evaluation.dealOver();
  render();
  reviewDeal(token);
}

/* ===================== Bilan de la donne =====================
   Le DDS évalue la position avant chaque carte jouée. En notant T(i) le
   total de plis Nord-Sud attendu avec un jeu parfait à partir du coup i,
   une carte coûte T(i) - T(i+1) plis au camp Nord-Sud qui la joue
   (T(i+1) - T(i) pour Est-Ouest). T(0) est le résultat « par » de la donne. */
async function reviewDeal(token) {
  const steps = game.history;
  const T = [];
  for (const st of steps) {
    const v = await Solver.solve(st.pos);
    if (v === null || token !== runToken) return;
    T.push(st.ns + v);
  }
  T.push(game.tricksWon.NS);

  const errors = [];
  steps.forEach((st, i) => {
    const loss = team(st.seat) === "NS" ? T[i] - T[i + 1] : T[i + 1] - T[i];
    if (loss > 0) errors.push({ ...st, loss });
  });
  for (const e of errors) {
    const res = await Solver.analyze(e.pos);
    if (!res || token !== runToken) return;
    const val = r => team(e.seat) === "NS" ? r.ns : -r.ns;
    const top = Math.max(...res.map(val));
    e.best = sortForDisplay(res.filter(r => val(r) === top).map(r => r.card));
  }
  game.review = { par: T[0], errors };
  render();
}

function renderExplanations() {
  const box = $("explain");
  const piperno = ["O", "E", "S"].some(s => game.types[s] === "deterministe");
  box.hidden = !config.explain || !piperno;
  if (box.hidden) return;
  const items = game.explanations.map(e => {
    const who = e.seat === DUMMY ? T("who.dummy") : seatName(e.seat);
    return `<li>${T("explain.item", { trick: e.trickNo, who, card: cardName(e.card), reason: reasonText(e.reason) })}</li>`;
  }).join("");
  box.innerHTML = `<h2>${T("explain.title")}</h2>` +
    (items ? `<ul>${items}</ul>` : `<p>${T("explain.none")}</p>`);
}

function renderReview() {
  const box = $("review");
  box.hidden = !game.over;
  if (!game.over) return;
  if (!game.review) { box.innerHTML = `<p>${T("review.pending")}</p>`; return; }
  const { par, errors } = game.review;
  const ns = game.tricksWon.NS;
  let html = `<h2>${T("review.title")}</h2><p>${T("review.par", { par, ns })}</p>`;
  if (!errors.length) {
    html += `<p>${T("review.none")}</p>`;
  } else {
    html += "<ol>" + errors.map(e => {
      const who = e.seat === DUMMY ? T("who.dummy") : seatName(e.seat);
      const alt = e.best.slice(0, 3).map(cardName).join(", ") + (e.best.length > 3 ? "…" : "");
      return `<li>${T("review.item", { trick: e.trickNo, who, card: cardName(e.card), loss: e.loss, camp: teamName(team(e.seat)), alt })}</li>`;
    }).join("") + "</ol>";
  }
  box.innerHTML = html;
}

/* ===================== Affichage ===================== */
const $ = id => document.getElementById(id);

function cardEl(card, opts = {}) {
  const el = document.createElement(opts.button ? "button" : "div");
  el.className = "card";
  if (opts.button) el.type = "button";
  if (card) {
    el.style.backgroundImage = `url(${IMAGES[COLORS[card.s] + "-" + card.v]})`;
    el.setAttribute("aria-label", cardName(card));
    if (!opts.button) el.setAttribute("role", "img");
  } else {
    el.classList.add("back");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="back-logo kiboo"><span>K</span><span>i</span><span>b</span><span>o</span><span>o</span></span>';
  }
  return el;
}

/* La table tourne pour que la place du joueur humain soit toujours en bas,
   en grand : Sud par défaut, sinon Ouest ou Est s'il défend. Les autres
   places suivent l'ordre du jeu (sens des aiguilles d'une montre) : à
   gauche le joueur suivant, en face le partenaire, à droite le précédent. */
const POSITIONS = ["south", "west", "north", "east"];
const SLOT_CLASS = { south: "s", west: "o", north: "n", east: "e" };
const bottomSeatHuman = () => !!game && ["S", "O", "E"].some(s => game.types[s] === "humain");
function bottomSeat() {
  if (game) for (const s of ["S", "O", "E"]) if (game.types[s] === "humain") return s;
  return "S";
}
function position(seat) {
  return POSITIONS[(SEATS.indexOf(seat) - SEATS.indexOf(bottomSeat()) + 4) % 4];
}

function seatController(seat) { return seat === DUMMY ? DECLARER : seat; }
function isHumanSeat(seat) { return game.types[seatController(seat)] === "humain"; }
function faceUp(seat) {
  // Partie entre robots : on regarde du côté du déclarant (Sud et Nord), les défenseurs restent cachés.
  if (!bottomSeatHuman() && (seat === DECLARER || seat === DUMMY)) return true;
  return config.open || isHumanSeat(seat) || (seat === DUMMY && game.dummyShown);
}

function render() {
  if (!game) return;
  for (const seat of SEATS) {
    const handEl = $("hand-" + seat);
    const pos = position(seat);
    $("seat-" + seat).className = "seat " + pos;
    handEl.className = "hand " + (pos === "west" || pos === "east" ? "side" : "main");
    handEl.innerHTML = "";
    const up = faceUp(seat);
    const waitingHere = game.waiting && game.waiting.seat === seat;
    const legalIds = waitingHere ? new Set(game.waiting.legal.map(cardId)) : null;
    const cards = up ? sortForDisplay(game.hands[seat]) : game.hands[seat];
    for (const c of cards) {
      if (!up) {
        // Une carte révélée par un cadeau reste visible dans la main cachée.
        if (game.revealed.has(cardId(c))) {
          const el = cardEl(c);
          el.classList.add("revealed");
          el.setAttribute("aria-label", T("card.revealed", { card: cardName(c) }));
          handEl.appendChild(el);
        } else handEl.appendChild(cardEl(null));
        continue;
      }
      const playable = waitingHere && legalIds.has(cardId(c));
      const el = cardEl(c, { button: waitingHere });
      if (playable && hintsReady()) {
        const h = game.hint.values.get(cardId(c));
        const badge = document.createElement("span");
        badge.className = "badge" + (h === game.hint.best ? " best" : "");
        badge.textContent = h;
        el.appendChild(badge);
        el.setAttribute("aria-label", T("card.hint", { card: cardName(c), n: h }));
      }
      if (waitingHere) {
        if (playable) {
          el.classList.add("playable");
          el.addEventListener("click", () => {
            if (game.waiting && game.waiting.seat === seat) game.waiting.resolve(c);
          });
        } else {
          el.disabled = true;
          el.classList.add("dim");
        }
      }
      handEl.appendChild(el);
    }
    // Étiquette du siège
    const tag = $("tag-" + seat);
    const ctrl = seatController(seat);
    const role = seat === DUMMY ? T("tag.dummy") : PLAYER_TYPES[game.types[ctrl]].label;
    tag.innerHTML = `<b>${seatName(seat)}</b><small>${role}</small>`;
    tag.classList.toggle("turn", !game.over && game.turn === seat);
    tag.dataset.team = team(seat);
  }

  // Centre : pli en cours ou résultat
  const center = $("center");
  center.innerHTML = "";
  if (game.over) {
    const ns = game.tricksWon.NS, eo = game.tricksWon.EO;
    const box = document.createElement("div");
    box.className = "result";
    const title = ns === eo ? T("result.tie") : T("result.win", { team: teamName(ns > eo ? "NS" : "EO") });
    box.innerHTML = `<h2>${title}</h2><p>${T("result.score", { ns, eo })}</p>
      <div class="btns"><button class="act ghost" type="button" data-a="replay"><span class="emo" aria-hidden="true">🔁</span>${T("btn.replayShort")}</button>
      <button class="act" type="button" data-a="new"><span class="emo" aria-hidden="true">🃏</span>${T("btn.new")}</button></div>`;
    box.querySelector('[data-a="replay"]').onclick = replayDeal;
    box.querySelector('[data-a="new"]').onclick = () => newGame(dealHands());
    center.appendChild(box);
  } else {
    for (const p of game.trick) {
      const slot = document.createElement("div");
      slot.className = "slot " + SLOT_CLASS[position(p.seat)];
      const el = cardEl(p.card);
      if (p.fresh) el.classList.add("enter");
      if (game.winnerSeat === p.seat) el.classList.add("win");
      slot.appendChild(el);
      center.appendChild(slot);
    }
  }
  // Pli terminé : il reste affiché jusqu'au clic sur « Pli suivant » (ou sur la table).
  const next = $("btn-next-trick"), wasHidden = next.hidden;
  next.hidden = !game.holding;
  next.querySelector(".lbl").textContent = game.played.length === 40 ? T("btn.endDeal") : T("btn.nextTrick");
  if (game.holding && wasHidden) next.focus({ preventScroll: true });

  // Score
  for (const t of ["NS", "EO"]) {
    const pips = $("pips-" + t);
    pips.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const d = document.createElement("span");
      d.className = "pip " + t.toLowerCase() + (i < game.tricksWon[t] ? " on" : "");
      pips.appendChild(d);
    }
    $("count-" + t).textContent = game.tricksWon[t];
  }

  // Statut
  let msg = "";
  if (game.over) {
    msg = T("status.over");
  } else if (game.winnerSeat) {
    msg = T("status.trickFor", { seat: seatName(game.winnerSeat), team: teamName(team(game.winnerSeat)) });
    if (game.holding) msg += T("status.holdHint");
  } else if (game.waiting) {
    const s = game.waiting.seat;
    msg = s === DUMMY ? T("status.dummyTurn") : T("status.yourTurn", { seat: seatName(s) });
    if (game.played.length === 0) msg = T("status.lead", { seat: seatName(s) });
  } else {
    msg = T("status.thinking", { seat: seatName(game.turn) });
  }
  if (config.hints && game.waiting && !hintsReady()) msg += T("status.hintsPending");
  else if (hintsReady()) msg += T("status.hintsReady");
  $("status").textContent = msg;
  renderExplanations();
  if (typeof Evaluation !== "undefined") Evaluation.render();
  if (typeof Coco !== "undefined") Coco.render();
  renderReview();
  scheduleHints();
}

/* Conseils : calcul DDS des meilleurs coups pour le joueur humain au trait */
function hintsReady() {
  return config.hints && game.waiting && game.hint && game.hint.at === game.played.length;
}
function scheduleHints() {
  if (!config.hints || !game.waiting || game.over) return;
  if (game.hint && (game.hint.at === game.played.length || game.hint.pending === game.played.length)) return;
  const at = game.played.length, token = runToken;
  game.hint = { pending: at };
  Solver.analyze(fullPosition()).then(res => {
    if (!res || token !== runToken || !game.waiting || game.played.length !== at) return;
    const seat = game.waiting.seat;
    const mine = team(seat) === "NS";
    // Plis restants (pli en cours compris) et plis déjà gagnés par le camp du joueur
    const remaining = 10 - game.tricksWon.NS - game.tricksWon.EO;
    const already = game.tricksWon[team(seat)];
    const values = new Map(res.map(r => [cardId(r.card), already + (mine ? r.ns : remaining - r.ns)]));
    game.hint = { at, values, best: Math.max(...values.values()) };
    render();
  });
}

function replayDeal() { if (game) newGame(game.initial, { replay: true }); }

/* ===================== Réglages ===================== */
for (const s of ["O", "E", "S"]) {
  const sel = $("cfg-" + s);
  for (const [k, t] of Object.entries(PLAYER_TYPES)) {
    const o = document.createElement("option");
    o.value = k; o.textContent = t.label;
    if (config[s] === k) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => { config[s] = sel.value; });
}
$("cfg-speed").addEventListener("change", e => { config.speed = +e.target.value; });
$("cfg-open").addEventListener("change", e => { config.open = e.target.checked; render(); });
$("cfg-hints").addEventListener("change", e => { config.hints = e.target.checked; render(); });
$("cfg-explain").addEventListener("change", e => { config.explain = e.target.checked; render(); });
$("cfg-quiz").addEventListener("change", e => { config.quiz = e.target.value; });
$("cfg-eval").addEventListener("change", e => { config.eval = e.target.checked; });
$("cfg-voice").addEventListener("change", e => { config.voice = e.target.checked; if (!config.voice) Voice.stop(); });
$("cfg-coco").addEventListener("change", e => { config.coco = e.target.value; render(); });
$("btn-new").addEventListener("click", () => newGame(dealHands()));
// Règles du jeu : fenêtre modale, fermée par le bouton ×, la touche Échap ou un clic à côté.
$("btn-rules").addEventListener("click", () => $("rules").showModal());
$("btn-rules-close").addEventListener("click", () => $("rules").close());
$("rules").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$("btn-replay").addEventListener("click", replayDeal);
$("btn-next-trick").addEventListener("click", () => game && game.holding && game.holding());
$("table").addEventListener("click", e => { if (game && game.holding && !e.target.closest("button")) game.holding(); });
// Aide des réglages : cachée par défaut, affichée à la demande.
$("btn-settings-help").addEventListener("click", e => {
  const help = $("settings-help"), open = help.hidden;
  help.hidden = !open;
  e.currentTarget.setAttribute("aria-expanded", open);
  e.currentTarget.querySelector(".lbl").textContent = open ? T("help.hide") : T("help.show");
});

// Changement de langue : libellés des menus, bouton d'aide, puis la table.
document.addEventListener("kiboo-lang", () => {
  for (const s of ["O", "E", "S"]) for (const o of $("cfg-" + s).options) o.textContent = PLAYER_TYPES[o.value].label;
  $("btn-settings-help").querySelector(".lbl").textContent = $("settings-help").hidden ? T("help.show") : T("help.hide");
  render();
});

// Première donne une fois tous les scripts chargés (exercices, cadeaux, questions).
window.addEventListener("DOMContentLoaded", () => newGame(dealHands()));
