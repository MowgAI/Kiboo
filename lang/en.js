"use strict";
/* English texts. Same keys as lang/fr.js (the reference language). */
(() => {
  const C = ["blue", "green", "red", "yellow"];
  const S = (n, one, many) => (n === 1 ? one : many);
  const K = '<span class="kiboo" aria-label="Kiboo"><span>K</span><span>i</span><span>b</span><span>o</span><span>o</span></span>';

  (window.KIBOO_LANGS = window.KIBOO_LANGS || {}).en = {
    langName: "English",

    /* ---------- Grammar ---------- */
    color: s => C[s],
    theColor: s => C[s],
    cardAdj: s => C[s],
    card: c => `${C[c.s]} ${c.v}`,
    seat: x => ({ N: "North", E: "East", S: "South", O: "West" })[x],
    team: t => ({ NS: "North-South", EO: "East-West" })[t],
    family: s => ["animals", "dinosaurs", "robots", "jobs"][s],
    isPlural: n => n !== 1,
    num: n => n.toLocaleString("en-GB"),
    orList: a => a.join(" or "),
    andList: a => a.join(" and "),

    /* ---------- Header and settings ---------- */
    "head.lang": "Language",
    "head.feedback": "Give feedback",
    "head.progress": "Progress",
    "head.exercises": "Exercises",
    "head.rules": "Rules",
    "setup.aria": "Table settings",
    "setup.west": "West",
    "setup.north": "North",
    "setup.northFixed": "dummy, played by South",
    "setup.east": "East",
    "setup.south": "South (declarer)",
    "setup.speed": "Robot speed",
    "setup.slow": "Slow",
    "setup.normal": "Normal",
    "setup.fast": "Fast",
    "setup.open": "Open hands",
    "setup.hints": "Show best plays",
    "setup.explain": "Piperno's explanations",
    "setup.quiz": "Questions during play",
    "setup.eval": "Evaluation mode",
    "help.show": "Help",
    "help.hide": "Hide help",
    "btn.replay": "Replay the deal",
    "btn.new": "New deal",
    "btn.help": "Play with Goat",
    "btn.noHelp": "Play without help",
    "btn.replayShort": "Replay",
    "btn.close": "Close",
    "help.list": `<ul>
        <li>Changes of players apply from the <strong>next deal</strong>.</li>
        <li><strong>Open hands</strong> shows every hand.</li>
        <li><strong>Best plays</strong>: on each playable card, the number of tricks your side will take if everyone plays perfectly with all hands visible.</li>
        <li><strong>Piperno</strong> plays by simple rules (tick Piperno's explanations to see which one he uses for each card), <strong>PiperRand</strong> plays at random.</li>
        <li><strong>Averell</strong> only sees his own hand and the dummy: from the second trick on, he simulates up to 40 possible deals and analyses them with the DDS. <strong>Averell250</strong> simulates up to 250, stronger but slower. <strong>Cheater</strong> sees every card.</li>
        <li>At the end of the deal, the DDS makes a <strong>review</strong> of the cards that cost tricks.</li>
        <li><strong>Evaluation mode</strong>: compares your deal (as South) with Piperno, Averell and Averell250 on the same cards; your duplicate score is shown at the end of the deal.</li>
        <li><strong>Questions during play</strong> (when you are declarer, as South): <strong>A few</strong> asks at least one per deal, drawn at random; <strong>All</strong> asks them all, for training. Every 3 right answers, you choose a gift.</li>
        <li><strong>Coco's square</strong>: during the deal, a table of each player's starting cards in each suit (North and South filled in for you), to complete for West and East as the tricks go by. The <strong>🐐 Play with Goat</strong> button starts a deal with Goat (and becomes “Play without help”). With <strong>Goat</strong>, the square fills in by itself and each deduction is explained (it's a help: the deal isn't evaluated).</li>
        <li><strong>Read aloud</strong>: questions and exercises are read out (in a simple version), with a little encouragement after each answer. The 🔊 Listen buttons also read the rules and this help. The voice depends on the device.</li>
        <li><strong>Music</strong>: a little retro tune during the game. <strong>Sound effects</strong>: card played, trick won or lost, result, right or wrong answer. The <strong>Parade</strong> button shows the 40 characters, who introduce themselves one by one; clicking the Kiboo logo reopens the welcome screen.</li>
        <li>When you play, each trick stays on the table until you click <strong>Next trick</strong>: take the time to remember the cards played.</li>
      </ul>`,
    "player.human": "Human",
    "score.aria": "Tricks won",
    "team.NS": "North-South",
    "team.EO": "East-West",

    /* ---------- The game ---------- */
    "tag.dummy": "dummy",
    "who.dummy": "North (dummy)",
    "card.revealed": p => `${p.card} (revealed)`,
    "card.hint": p => `${p.card}, ${p.n} tricks for your side`,
    "result.tie": "Tie",
    "result.win": p => `${p.team} wins`,
    "result.score": p => `${p.ns} tricks to ${p.eo}`,
    "status.over": "Deal over.",
    "status.trickFor": p => `Trick to ${p.seat} (${p.team}).`,
    "status.dummyTurn": "Your turn to play a card from dummy (North).",
    "status.yourTurn": p => `${p.seat} to play: choose a card.`,
    "status.lead": p => `${p.seat} leads: choose a card.`,
    "status.thinking": p => `${p.seat} is thinking…`,
    "status.hintsPending": " Working out the best plays…",
    "status.hintsReady": " Badges: tricks for your side at the end of the deal.",

    /* ---------- Piperno's explanations ---------- */
    "explain.title": "Piperno's explanations",
    "explain.none": "Piperno hasn't played yet.",
    "explain.item": p => `<b>Trick ${p.trick}</b> · ${p.who} plays <b>${p.card}</b>. ${p.reason}`,
    "pip.opening": p => `Opening lead: ${C[p.suit]} is his longest suit (${p.len} cards)` +
      (p.tied ? ", the strongest of the suits of the same length" : "") + ". " +
      (p.seq ? "He plays the top card of his sequence." : "Without a sequence (at least two touching cards, the top one at least a 7), he plays the lowest one."),
    "pip.newSuit": p => `His favourite suit becomes ${C[p.suit]} (his longest suit).`,
    "pip.leadStrong": p => `He leads his favourite suit, ${C[p.suit]}. He holds the highest card left (the ${p.top}): he plays his highest.`,
    "pip.leadWeak": p => `He leads his favourite suit, ${C[p.suit]}. He doesn't hold the highest card left (the ${p.top}): he plays his lowest.`,
    "pip.partnerFollow": "His partner is already winning the trick: he follows with his lowest card.",
    "pip.partnerDiscard": p => `His partner is already winning the trick and he has no ${C[p.led]} left: he discards the first card of his hand, in the order blue, green, red, yellow.`,
    "pip.win": p => `He plays the lowest card that makes his side win${p.now ? " for now" : ""}.`,
    "pip.cantWin": "He can't make his side win: he follows with his lowest card.",
    "pip.discardKeep": p => `He has no ${C[p.led]} left and can't win the trick: he discards a low card, keeping his favourite suit (${C[p.my]}).`,
    "pip.discardOnly": p => `He has no ${C[p.led]} left and can't win the trick: only his favourite suit (${C[p.my]}) is left, so he discards his lowest.`,

    /* ---------- Deal review ---------- */
    "review.pending": "The DDS is analysing the deal…",
    "review.title": "Deal review",
    "review.par": p => `With perfect play by all four players, North-South would take <b>${p.par}</b> ${S(p.par, "trick", "tricks")} (result: ${p.ns}).`,
    "review.none": "No mistakes: every card played was a best play.",
    "review.item": p => `<b>Trick ${p.trick}</b> · ${p.who} plays ${p.card}: costs ${p.camp} ${p.loss} ${S(p.loss, "trick", "tricks")}. Better: ${p.alt}.`,

    /* ---------- Exercises ---------- */
    "ex.title": "Exercises",
    "ex.close": "Close the exercises",
    "ex.tabs": "Choose an exercise",
    "ex.tab.count": "Count your hand",
    "ex.tab.longest": "Longest suit",
    "ex.tab.legal": "Playable cards",
    "ex.sort": "Sort the hand by suit",
    "ex.count.intro": "Here is a hand of 10 cards.",
    "ex.count.q": p => `${p.intro} For each suit, how many <strong>cards</strong> and how many <strong>points</strong> do you have? The points of a suit are the sum of the values of its cards.`,
    "ex.col.color": "Suit",
    "ex.col.cards": "Cards",
    "ex.col.points": "Points",
    "ex.col.fix": "Answer",
    "ex.ph.cards": "cards",
    "ex.ph.points": "points",
    "ex.aria.cards": p => `Number of ${C[p.s]} cards`,
    "ex.aria.points": p => `${C[p.s]} points`,
    "ex.total": "Total points",
    "ex.check": "Check",
    "ex.count.fix": p => `${p.n} ${S(p.n, "card", "cards")}: ${p.values} = ${p.pts} ${S(p.pts, "point", "points")}`,
    "ex.count.fixNone": "0 cards: 0 points",
    "ex.count.fixTotal": p => `${p.sums} = ${p.total} ${S(p.total, "point", "points")}`,
    "ex.count.wrong": p => `${p.n} ${S(p.n, "answer", "answers")} to check: the right answer is shown on each line.`,
    "ex.allRight": "Well done, everything is right!",
    "ex.ok": "Well done! ",
    "ex.notQuite": "Not quite. ",
    "ex.longest.q": "What is your <strong>longest suit</strong>, the one in which you have the most cards?",
    "ex.aria.colors": "Suits",
    "ex.longest.result": p => (p.ok ? "Well done! " : `Not quite: your longest suit is ${p.longest.map(s => C[s]).join(" or ")}. `) +
      `Number of cards: ${p.counts.map((n, s) => `${C[s]} ${n}`).join(", ")}.` +
      (p.longest.length > 1
        ? ` ${p.longest.map(s => C[s]).join(" and ")} each have ${p.max} cards: ${p.longest.length === 2 ? "both answers are right" : "all these answers are right"}.`
        : ""),
    "ex.legal.lead": p => `${p.seat} leads the <strong>${p.card}</strong>`,
    "ex.legal.playedItem": p => `${p.seat}: <strong>${p.card}</strong>`,
    "ex.legal.played": p => `Already played in this trick: ${p.list}`,
    "ex.legal.ledSuit": p => `The suit led is ${p.suit}.`,
    "ex.legal.q.me": "Click on <strong>all the cards</strong> you are allowed to play, then check.",
    "ex.legal.q.dummy": "Click on <strong>all the cards</strong> dummy is allowed to play, then check.",
    "ex.legal.why": p => p.follows
      ? `You have ${C[p.led]} cards: you must follow suit. ` + (p.n === 1
        ? `Only your ${C[p.led]} card can be played.`
        : `Only your ${p.n} ${C[p.led]} cards can be played.`)
      : `You have no ${C[p.led]}: you may discard any card. ${p.hand === 1 ? "Your card can be played." : `All ${p.hand} can be played.`}`,
    "ex.legal.legend": " Cards with a dotted outline could be played but weren't chosen; cards outlined in red couldn't be played.",
    "ex.newHand": "New hand",
    "ex.openGift": "Open your gift",
    "ex.continue": "Back to the exercises",
    "ex.score": p => `Exercises passed: ${p.ok} out of ${p.done}`,
    "ex.scoreNone": "Choose an exercise. Your results will appear here.",

    /* ---------- Questions during play ---------- */
    "quiz.title": "Question",
    "quiz.skip": "Skip the question",
    "quiz.title.start": "Question: before the opening lead",
    "quiz.title.lead": "Question: after the opening lead",
    "quiz.title.play": "Question: before you play",
    "quiz.start.intro": "The deal is starting. Here is your hand.",
    "quiz.resume": "Back to the game",
    "quiz.yes": "Yes, for sure",
    "quiz.no": "No, impossible",
    "quiz.maybe": "We can't know",
    "quiz.q.same": p => `Can West have <strong>as many cards</strong> in another suit as in ${p.suit}?`,
    "quiz.rule.same": "With suits of equal length, the opening lead rule chooses the one with the most points (with equal points too, the last one in the order blue, green, red, yellow). So another suit of the same length is possible if it has fewer points.",
    "quiz.q.higher": p => `West led the ${C[p.s]} ${p.v}. Can he have a <strong>higher ${C[p.s]} card</strong> than the ${p.v}?`,
    "quiz.q.lower": p => `West led the ${C[p.s]} ${p.v}. Can he have a <strong>lower ${C[p.s]} card</strong> than the ${p.v}?`,
    "quiz.rule.seq": "The opening lead rule plays the top card of a sequence (at least two touching cards, the top one at least a 7); otherwise, the lowest card of the suit.",
    "quiz.col.me": "Your hand",
    "quiz.col.dummy": "Dummy",
    "quiz.col.rest": "Left for East and West",
    "quiz.col.pts": "Points left",
    "quiz.rest.lead": p => `, including the ${p.v} led`,
    "quiz.led": p => `West (${p.bot}) led the <strong>${p.card}</strong>. He follows Piperno's opening lead rule.`,
    "quiz.rule.hide": "Hide the opening lead rule",
    "quiz.rule.show": "Show the opening lead rule",
    "quiz.dummy": "Dummy (North)",
    "quiz.me": "Your hand (South, declarer)",
    "quiz.hint": "West has 10 cards, chosen among the 20 you can't see (neither in your hand nor in dummy).",
    "quiz.aria.answers": "Answers",
    "quiz.follow.q": p => `Which suits can have <strong>as many cards</strong> as ${p.suit} in West's hand? Tick all the right answers.`,
    "quiz.unseen": "The cards you can't see, suit by suit:",
    "quiz.perSuit": "Suit by suit:",
    "quiz.same.possible": p => `${p.suit}: <strong>possible</strong>. For example ${p.k} ${C[p.L]} cards (${p.pL} points) and ${p.k} ${C[p.s]} cards (${p.pS} points): West does lead ${C[p.L]}` +
      (p.tie ? ` (as many points, but ${C[p.L]} comes after ${C[p.s]} in the order blue, green, red, yellow)` : "") + ".",
    "quiz.same.short": p => `${p.suit}: <strong>impossible</strong>. ${C[p.L][0].toUpperCase() + C[p.L].slice(1)} is West's longest suit: he has at least ${p.minL} of them. But ` +
      (p.rest === 0 ? `there is no ${C[p.s]} card left` : `only ${p.rest} ${C[p.s]} ${S(p.rest, "card is", "cards are")} left for East and West`) +
      ": not enough to have as many.",
    "quiz.same.points": p => `with equal length, ${C[p.s]} would have more points than ${C[p.L]} (the ${C[p.s]} cards left are worth ${p.pts} points in all), and West would have led ${C[p.s]}`,
    "quiz.same.card": p => `with equal length, West would also have a sequence or a lower ${C[p.L]} card, and wouldn't have led the ${p.v}`,
    "quiz.same.other": p => `the opening lead rule would have made him play another card than the ${C[p.L]} ${p.v}`,
    "quiz.same.or": "; or ",
    "quiz.same.rule": p => `${p.suit}: <strong>impossible</strong>. There are enough ${C[p.s]} cards left, but ${p.parts}.`,
    "quiz.total": p => `In all, West can have <strong>${p.totalTxt}</strong> different ${S(p.total, "hand that follows", "hands that follow")} the opening lead rule.
        The answer to the question is yes in <strong>${p.yesTxt}</strong> of them${p.maybe ? ` and no in ${p.noTxt}` : ""}.`,
    "quiz.ex.yes": "A possible hand for West where the answer is yes:",
    "quiz.ex.no": "A possible hand for West where the answer is no:",
    "quiz.ex.any": "For example, West could have:",
    "quiz.goodAnswer": p => `The right answer: ${p.answer.toLowerCase()}.`,
    "quiz.follow.result": p => (p.list.length > 1 ? "The possible suits: " : "The only possible suit: ") + p.list.map(s => C[s]).join(", ") + ". Details below.",
    /* ---------- Welcome, families and characters ---------- */
    "head.parade": "Parade",
    "setup.music": "Music",
    "setup.sfx": "Sound effects",
    "intro.parade": "The Kiboo parade",
    "intro.music": "Music",
    "intro.pause": "Pause",
    "intro.resume": "Resume",
    "intro.paradeEnd": "That's it! All forty Kiboo characters have said hello. Now, shall we play?",
    "intro.play": "Play",
    "intro.playHelp": "Play with Goat's help",
    "intro.families": "The families",
    "intro.characters": "The characters",
    "intro.noShow": "Don't show the welcome screen at start",
    "intro.skip": "Skip",
    "intro.prev": "Previous",
    "intro.next": "Next",
    "intro.back": "Home",
    "intro.sound": "Sound",
    "intro.reopen": "See the welcome screen, the families and the characters again",
    "intro.famTitle": p => `The ${familyName(p.s)} family`,
    "intro.fam.0": "Here is the animal family, in blue! Ten animals, from 1 to 10. The little mouse is the 1, and the rabbit is the 10: it's the strongest.",
    "intro.fam.1": "Here is the dinosaur family, in green! Ten dinosaurs, from 1 to 10. The big purple dino is the 10: it's the strongest.",
    "intro.fam.2": "Here is the robot family, in red! Ten robots, from 1 to 10. The king of the robots is the 10: it's the strongest.",
    "intro.fam.3": "Here is the jobs family, in yellow! Ten jobs, from 1 to 10: police officer, fairy, cowboy, footballer, firefighter, astronaut… The 10, the scientist, is the strongest.",
    /* ---------- Voice: simplified texts read aloud ---------- */
    "setup.voice": "Read aloud",
    "voice.choose": "Voice",
    "voice.auto": "Automatic",
    "voice.none": "No English voice on this device",
    "voice.test": "Hello! I'm the voice of Kiboo. Shall we play?",
    "voice.stop": "Stop",
    "voice.listen": "Listen",
    "voice.listenAria": "Listen (simple version, read aloud)",
    "voice.cheer.ok": "Well done!|Super!|Brilliant!|Great job!|Excellent!|You're a star!",
    "voice.cheer.ko": "Not bad!|Almost!|Never mind, let's carry on!|Not quite. Look at the answer.|You're nearly there!",
    "voice.rules": "Kiboo is a card game for four players. North and South play together, against East and West. There are forty cards, in four colours: blue, green, red and yellow. Each card has a number, from one to ten. Ten is the strongest. Each player has ten cards. You are South. You play your cards, and also the cards of your partner North. We call him the dummy: his cards are laid on the table, and everyone can see them. West plays the first card. Then everyone plays a card, in turn. You must play the same colour as the first card, if you have one. If not, you can play any card you like. The strongest card of the colour that was led wins: that is called a trick. Whoever wins the trick plays first in the next trick. At the end, the team that won the most tricks wins the game.",
    "voice.help": "In the settings, you choose who plays each seat: you, or a robot. You can choose how fast the robots play. You can ask for questions during the game: every three right answers, you win a gift. Coco's square helps you count the cards. Click New deal to start a game.",
    "voice.ex.count": "Count your cards! For each colour, how many cards do you have, and how many points? The points are the numbers on the cards added together.",
    "voice.ex.longest": "Which is your longest colour? It is the colour where you have the most cards.",
    "voice.ex.legal": "Which cards are you allowed to play? You must play the colour that was led, if you have it. Click on all the right cards, then check.",
    "voice.ex.rest": "Look at your hand and at the dummy. How many cards of each colour do East and West have? Each colour has ten cards in all.",
    "voice.ex.split": "West played the first card, following the opening lead rule. How many cards of this colour can West and East have? Tick all the possible answers.",
    "voice.ex.coco": "Here is Coco's square. Every row and every column adds up to ten. Find the missing numbers!",
    "voice.q.count": "The game begins. Count your cards! For each colour, how many cards do you have, and how many points?",
    "voice.q.rest0": "Look at your hand and at the dummy. How many cards of each colour do East and West have? Each colour has ten cards in all.",
    "voice.q.lead": "West played the first card, following the opening lead rule. Think about what he can have in his hand, then choose your answer.",
    "voice.q.split": "West played the first card. How many cards of this colour can West and East have? Tick all the possible answers.",
    "voice.q.rest1": "The first trick is over. How many cards of each colour are left for East and West? Don't forget the cards already played.",
    "voice.q.masters": "Click on all your winners, in your hand and in the dummy. A card is a winner when East and West have no higher card left in its colour.",
    "voice.q.play": "Which cards are you allowed to play? You must play the colour that was led, if you have it. Click on all the right cards.",
    "voice.q.discard": "A player has no more cards in the colour that was led. How many cards of this colour did each player have at the start? Start with West.",
    /* ---------- Coco's square ---------- */
    "setup.coco": "Coco's square",
    "setup.coco.off": "Off",
    "setup.coco.manual": "I fill it in",
    "setup.coco.goat": "Goat (automatic)",
    "goat.title": "Coco's square, Goat mode",
    "goat.intro": "Goat fills in the square by itself during the deal and explains each deduction: discards, totals of 10, cards already played and the opening lead rule. In yellow: what it has just found. “3–6”: between 3 and 6, what is still possible.",
    "goat.why": "Goat's deductions (most recent first):",
    "goat.trick": p => `Trick ${p.n}`,
    "goat.start": p => `Start of the deal: North (dummy) and South (your hand) are counted. Between them, West and East have ${p.rest.map((n, s) => `${n} ${C[s]} ${S(n, "card", "cards")}`).join(", ")}.`,
    "goat.void": p => `${seatName(p.seat)} can't follow in ${C[p.s]} (he discards the ${cardName(p.card)}): he has none left. ` +
      (p.n ? `He has played ${p.n} (${p.cards.join(", ")}): so he had <strong>${p.n}</strong> ${C[p.s]} ${S(p.n, "card", "cards")} at the start.` : `He had <strong>none</strong> at the start.`),
    "goat.bound.row": p => { const t = p.cells.reduce((a, c) => a + c.n, 0); return `Row ${C[p.s]}: ${10 - p.known.reduce((a, b) => a + b, 0)} ${C[p.s]} ${S(t, "card is", "cards are")} left for ${p.cells.map(c => seatName(c.seat)).join(" and ")}, and ${S(p.cells.length, "he has", "they have")} already played ${t}: ${p.cells.map(c => `<strong>${c.n}</strong> for ${seatName(c.seat)}`).join(", ")}, there are no others.`; },
    "goat.bound.col": p => `Column ${seatName(p.seat)}: his known cards and the ones already played already make 10: ${p.cells.map(c => `<strong>${c.n}</strong> ${C[c.s]} ${S(c.n, "card", "cards")}`).join(", ")}.`,
    "goat.lead": p => `West leads the ${cardName(p.card)} following the opening lead rule: ${C[p.L]} is his longest suit, so he has <strong>at least 3</strong> of them (10 cards for 4 suits). Going through his ${p.n.toLocaleString("en-GB")} possible hands, West started with: ${p.ranges.map(([a, b], s) => `${a === b ? `<strong>${a}</strong>` : `${a} to ${b}`} ${C[s]}`).join(", ")}.`,
    "goat.rule": p => `${p.lead ? "With the opening lead rule and the cards already played" : "With the cards already played"}, all of West's possible hands (${p.n.toLocaleString("en-GB")}) give the same value: ${p.cells.map(c => `<strong>${c.v}</strong> ${C[c.s]} ${S(c.v, "card", "cards")} for ${seatName(c.seat)}`).join(", ")}.`,
    "goat.none": "No deduction yet: Goat is waiting for a defender who can't follow suit.",
    "goat.done": "The square is complete: Goat knows the whole starting distribution!",
    "ex.tab.coco": "Coco's square",
    "coco.title": "Coco's square",
    "coco.intro": "At the start, each player has <strong>10 cards</strong>, and each suit also has <strong>10 cards</strong>. In Coco's square, each box gives the number of cards of a suit (the row) held by a player (the column) at the start of the deal: so every row and every column adds up to <strong>10</strong>. Fill in the empty boxes.",
    "coco.levels": "Level",
    "coco.level.easy": "Easy",
    "coco.level.medium": "Medium",
    "coco.level.table": "Like at the table",
    "coco.table.intro": "Like at the table: you know your hand (South) and dummy (North), their columns are filled in. During the deal, you have learnt that:",
    "coco.clue": p => `${p.seat} had <strong>${p.n}</strong> ${C[p.s]} ${S(p.n, "card", "cards")} at the start.`,
    "coco.total": "Total",
    "coco.aria": p => `${p.seat}, ${C[p.s]} cards`,
    "coco.showTotals": "Show the totals while I fill in",
    "coco.legend": "Blue boxes: given. The totals update as you type: they turn green at 10.",
    "coco.ok": "Well done, Coco's square is complete!",
    "coco.wrong": p => `Not quite: ${p.n} ${S(p.n, "box", "boxes")} to check (the right answer in red).`,
    "coco.steps": "How to work out the boxes, in order:",
    "coco.step.row": p => `Row ${C[p.s]}: 10 − ${p.others.join(" − ")} = <strong>${p.v}</strong> ${C[p.s]} ${S(p.v, "card", "cards")} for ${seatName(p.seat)}.`,
    "coco.step.col": p => `Column ${seatName(p.seat)}: 10 − ${p.others.join(" − ")} = <strong>${p.v}</strong> ${C[p.s]} ${S(p.v, "card", "cards")}.`,
    "coco.game.intro": "North and South are filled in for you (dummy and your hand). Fill in West and East as the deal goes on: when a defender can't follow suit, he had as many cards of that suit as he has played, and the totals of 10 do the rest.",
    "coco.game.check": "Check what is certain",
    "coco.game.result": p => `${p.ok} right, ${p.ko} wrong, ${p.unsure} not certain yet` +
      (p.todo ? `, and ${p.todo} ${S(p.todo, "box", "boxes")} you can already work out (in yellow).` : "."),
    "coco.game.legend": "Green: right. Red: wrong. Dotted: can't be certain yet. Yellow: can already be worked out, your turn to fill it in.",
    "coco.game.end": p => `End of the deal: here is the real Coco's square. You had ${p.ok} right ${S(p.ok, "box", "boxes")} out of 8.`,

    /* ---------- Questions: modes, end of trick, cards left, distributions, winners ---------- */
    "setup.quiz.off": "None",
    "setup.quiz.light": "A few",
    "setup.quiz.all": "All (training)",
    "btn.nextTrick": "Next trick",
    "btn.endDeal": "End of the deal",
    "status.holdHint": " Take a good look at the cards, then click “Next trick”.",
    "ex.tab.rest": "Cards left",
    "ex.tab.split": "Lead suit distribution",
    "quiz.title.trick1": "Question: after the first trick",
    "quiz.title.trick3": "Question: after the third trick",
    "quiz.title.discard": "Question: a discard",
    "rest.intro.game": "The deal begins. Here are your hand and dummy's.",
    "rest.intro.game1": "The first trick is over. Do you remember the cards played?",
    "rest.intro.before": "Here are your hand (South) and dummy's (North), before the opening lead.",
    "rest.intro.trick": p => `The first trick has just been played: ${p.list}.`,
    "rest.q.before": "How many cards of each suit do <strong>East and West</strong> hold between them?",
    "rest.q.after": "How many cards of each suit are left in the hands of <strong>East and West</strong> between them? Think of the cards already played.",
    "rest.col": "East and West",
    "rest.aria": p => `${C[p.s]} cards held by East and West`,
    "rest.fix": p => `10 − ${p.me} (your hand) − ${p.dummy} (dummy)` +
      (p.gone.length ? ` − ${p.gone.length} (already played: ${p.gone.join(", ")})` : "") + ` = ${p.rest}`,
    "split.q": p => `There ${S(p.rest, "is", "are")} <strong>${p.rest}</strong> ${C[p.L]} ${S(p.rest, "card", "cards")} left for West and East, including the ${p.v} led. How can they be <strong>split</strong>? Tick every possible distribution.`,
    "split.choice": p => `West ${p.w} – East ${p.e}`,
    "split.result": p => (p.list.length > 1 ? "The possible distributions: " : "The only possible distribution: ") + p.list.join("; ") + ". Details below.",
    "split.detail": "Distribution by distribution:",
    "split.possible": p => `${p.label}: <strong>possible</strong> (${p.nTxt} West ${S(p.n, "hand follows", "hands follow")} the opening lead rule).`,
    "split.none": p => `${p.label}: <strong>impossible</strong> with the cards you can see.`,
    "split.short": p => `${p.label}: <strong>impossible</strong>. With only ${p.w} ${C[p.L]} ${S(p.w, "card", "cards")}, West would have a longer suit` +
      (p.pigeon ? ` (${10 - p.w} cards left for three suits)` : "") + `, and would have led it.`,
    "split.card": p => `the opening lead rule would have made him lead another ${C[p.L]} card than the ${p.v}`,
    "split.suit": p => `he would have another suit just as long with more points than ${C[p.L]}, and would have led it`,
    "split.rule": p => `${p.label}: <strong>impossible</strong>. ${C[p.L][0].toUpperCase() + C[p.L].slice(1)} could be his longest suit, but ${p.parts}.`,
    "split.example": p => `For example, a possible West hand (${p.label}):`,
    "masters.q": "Click on <strong>every winner</strong> in your hand and in dummy, then check. A card is a winner when East and West have no higher card left in its suit. Look at your hand and dummy <strong>together</strong>: with 10 9 8 3 in dummy and 7 6 4 in your hand, if East and West only have 5, 2, 1 left, the winners are 10 9 8 7 6.",
    "masters.none": "None of the cards was a winner. ",
    "masters.rule": "To know whether a card is a winner, you need to remember the higher cards already played: the others are still with East and West, except those in your hand and in dummy.",
    "masters.suit": p => `${p.suit}: ` +
      (p.top ? `the highest card still held by East and West is the <strong>${p.top}</strong>` : `East and West have no ${C[p.s]} cards left`) +
      (p.gone.length ? ` (already played: ${p.gone.join(", ")})` : " (no card played)") +
      (p.masters.length ? `. ${S(p.masters.length, "Winner", "Winners")}: ${p.masters.join(", ")}.` : ". No winner."),
    "discard.intro": p => `${p.who[0].toUpperCase() + p.who.slice(1)} can't follow suit in ${p.suit} and discards the <strong>${p.card}</strong>.`,
    "discard.q": p => `How was ${p.suit} <strong>split at the start</strong>? Give the number of cards of each player, starting with West (for example 4-3-2-1).`,
    "discard.hint": "He has no cards left in this suit: he had as many as he has played.",
    "discard.col.seat": "Player",
    "discard.aria": p => `${p.seat}'s ${C[p.s]} cards at the start`,
    "discard.how.me": p => `your hand at the start: ${p.n}`,
    "discard.how.dummy": p => `dummy at the start: ${p.n}`,
    "discard.how.void": p => p.n ? `none left, and he played ${p.n}: ${p.cards.join(", ")}` : "he had none",
    "discard.how.rest": p => `the rest: 10 − ${p.others.join(" − ")} = ${p.n}`,
    "discard.result": p => `The starting distribution of ${p.suit}: ${p.split} (West, North, East, South).`,

    /* ---------- Gifts and collection ---------- */
    "gift.next": "Next gift:",
    "gift.aria": p => `Next gift: ${p.n} right ${S(p.n, "answer", "answers")} out of ${p.goal}`,
    "album.btn": p => `Collection ${p.n}/40`,
    "album.title": "My collection",
    "album.close": "Close the collection",
    "gift.title": p => `Well done, ${p.goal} right answers! Choose your gift.`,
    "gift.revealO": "See one of West's hidden cards",
    "gift.revealE": "See one of East's hidden cards",
    "gift.collect": "Win a card for my collection",
    "gift.won": p => `New card for your collection: the <strong>${p.card}</strong> from the ${familyName(p.s)} family. ` +
      `You now have ${p.n} ${S(p.n, "card", "cards")} out of 40` +
      (p.fam === 10 ? `, and the ${familyName(p.s)} family is complete!` : ` (${p.fam} out of 10 ${familyName(p.s)}).`),
    "gift.revealed": p => `${p.seat === "O" ? "West's" : "East's"} card revealed: the <strong>${p.card}</strong>. It stays visible, outlined in yellow, until it is played.`,
    "album.famCount": p => `${p.n} out of 10`,
    "album.missing": p => `${p.card}: not won yet`,
    "album.complete": "Well done, your collection is complete!",
    "album.count": p => `${p.n} ${S(p.n, "card", "cards")} out of 40. Win more with 3 right answers to the exercises or to the questions during play.`,

    /* ---------- Evaluation and progress ---------- */
    "level.0": "Beginner",
    "level.1": "Piperno level",
    "level.2": "Averell level",
    "level.3": "Averell250 level",
    "level.4": "Expert",
    "level.who.4": "perfect play",
    "eval.title": "Evaluation",
    "eval.defense": "Evaluation mode only works when you play South (declarer). In defence, your result also depends on your robot partner: the comparison wouldn't be fair.",
    "eval.waiting": p => `Working: ${p.who} is replaying your deal…`,
    "eval.theRobots": "the robots",
    "eval.better": "you did better",
    "eval.equal": "tie",
    "eval.more": p => `${p.n} more ${S(p.n, "trick", "tricks")}`,
    "eval.notCounted": p => `Deal not counted in your progress (${p.replayed ? "replayed deal" : "help used: best plays, open hands, revealed card or Goat"}).`,
    "eval.levelUp": p => `New level: <strong>${p.name}</strong>!${p.card ? ` You win the <strong>${p.card}</strong> for your collection.` : ""}`,
    "eval.score": p => `Your duplicate score: <strong>${p.pct}%</strong>`,
    "eval.col.declarer": "Declarer",
    "eval.col.tricks": "North-South tricks",
    "eval.col.cmp": "Comparison",
    "eval.you": "You",
    "eval.how": p => `Same deal, same defenders. 2 points per robot beaten, 1 per tie, out of a maximum of ${p.max} points.`,
    "eval.seeProgress": "See my progress",
    "eval.levelTop": p => `<strong>${p.name}</strong>: the highest level. Well done!`,
    "eval.levelNext": p => `<strong>${p.name}</strong>. To reach the <strong>${p.next}</strong>, do at least as well as ${p.who} in ${p.needed} of your last ${p.window} deals: <strong>${p.progress} out of ${p.needed}</strong> so far.`,
    "prog.title": "My progress",
    "prog.step": p => `<strong>${p.name}</strong>: at least as well as ${p.who} in ${p.n} of your last ${p.of} deals${p.done ? " ✓" : ` (${p.needed} out of ${p.window} needed)`}`,
    "prog.scores": p => `Duplicate score of your last ${p.n} deals${p.avg !== null ? ` (average ${p.avg}%)` : ""}:`,
    "prog.aria": p => `Scores: ${p.list}`,
    "prog.col.deal": "Deal",
    "prog.col.score": "Score",
    "prog.empty": "No deal evaluated yet. Play a deal as South (declarer) with evaluation mode on: your score will appear at the end, and your progress here.",

    /* ---------- Give feedback ---------- */
    "fb.title": "Give feedback",
    "fb.intro": "Thank you for testing Kiboo! Your feedback helps improve the game.",
    "fb.kinds": "Type of feedback",
    "fb.kind.bug": "A problem",
    "fb.kind.idee": "An idea",
    "fb.kind.avis": "My opinion",
    "fb.stars": "Rating out of 5",
    "fb.yourNote": "Your rating:",
    "fb.star1": "1 out of 5", "fb.star2": "2 out of 5", "fb.star3": "3 out of 5", "fb.star4": "4 out of 5", "fb.star5": "5 out of 5",
    "fb.message": "Your message",
    "fb.messagePh": "What you liked, what doesn't work, what you were doing when the problem happened…",
    "fb.name": "Your first name (optional)",
    "fb.auto": "Information added automatically",
    "fb.copy": "Copy my feedback",
    "fb.github": "Send on GitHub",
    "fb.hint": "“Copy my feedback”: then paste it in a message to the person who sent you the link. “Send on GitHub” needs a GitHub account.",
    "fb.fallbackAria": "Text of your feedback to copy",
    "fb.copied": "Feedback copied. Paste it in a message (email, text…) to the person who sent you the link. Thank you!",
    "fb.copyFailed": "Automatic copy didn't work: the text is selected below, copy it with Ctrl+C (or a long press).",
    "fb.ctx.version": "Version",
    "fb.ctx.lang": "Language",
    "fb.ctx.screen": "Screen",
    "fb.ctx.touch": " (touch)",
    "fb.ctx.browser": "Browser",
    "fb.ctx.players": "Players",
    "fb.ctx.options": "Options",
    "fb.ctx.game": "Game",
    "fb.opt.open": "open hands",
    "fb.opt.hints": "best plays",
    "fb.opt.explain": "Piperno's explanations",
    "fb.opt.quiz": "questions during play",
    "fb.opt.none": "none",
    "fb.ctx.over": "deal over",
    "fb.ctx.trick": p => `trick ${p.n}, North-South ${p.ns} - East-West ${p.eo}`,
    "fb.msg.title": p => `Kiboo feedback: ${p.kind.toLowerCase()}`,
    "fb.msg.note": "Rating",
    "fb.msg.from": "From",
    "fb.msg.empty": "(no message)",
    "fb.issueDefault": "Kiboo feedback",

    /* ---------- Rules (window) ---------- */
    "rules.title": `${K} rules`,
    "rules.close": "Close the rules",
    "rules.body": `
    <p>${K} is a card game <strong>inspired by bridge</strong>. It is played by <strong>4 players</strong>, split into <strong>2 teams</strong> named after their seats: <strong>North-South</strong> against <strong>East-West</strong>. Partners sit opposite each other. Like bridge, Kiboo is a <strong>trick-taking game</strong>: a <dfn>trick</dfn> is the set of four cards played in turn by each of the four players around the table.</p>

    <h3>The cards</h3>
    <ul>
      <li><strong>40 cards</strong>: <strong>4 families</strong> (<span class="fam blue">animals</span>, <span class="fam green">dinosaurs</span>, <span class="fam red">robots</span> and <span class="fam yellow">jobs</span>), shown by their colour (blue, green, red and yellow respectively). Each card has a <strong>value from 1 to 10</strong>: the <strong>10 is the highest</strong> card, the 1 the lowest.</li>
      <li>Each player gets <strong>10 cards</strong>.</li>
    </ul>

    <h3>The declarer and the dummy</h3>
    <ul>
      <li>South is the <dfn>declarer</dfn>. He plays his own cards and also those of his partner North, called the <dfn>dummy</dfn>.</li>
      <li>West plays the first card: this is the <dfn>opening lead</dfn>. The dummy then lays out his cards <strong>face up</strong>, and everyone sees them until the end of the deal.</li>
    </ul>

    <h3>The robots' opening lead rule</h3>
    <div id="lead-rule">
      <p>Piperno, Averell and Averell250 always choose their opening lead the same way:</p>
      <ol>
        <li>They take their <strong>longest suit</strong>, the one in which they have the most cards.</li>
        <li>If two suits have <strong>as many cards</strong>, they take the one with the <strong>most points</strong> (the sum of the values). With equal points too, they take the last one in the order blue, green, red, yellow.</li>
        <li>In that suit, if they have a <dfn>sequence</dfn> (at least two touching cards, like the 7 and the 8), they play the <strong>top card of the sequence</strong>, but only if that card is <strong>at least a 7</strong>. If they have several sequences, they take the highest.</li>
        <li>Without a sequence (or with a sequence that is too low, like the 3 and the 4), they play the <strong>lowest card</strong> of the suit.</li>
      </ol>
      <p>Examples: with the blue 2, 7 and 8, they lead the blue 8 (sequence 7-8). With the blue 2, 5 and 9, they lead the blue 2 (no sequence). With the blue 3, 4 and 9, they lead the blue 3 (the 3-4 sequence doesn't reach the 7).</p>
    </div>

    <h3>How a trick is played</h3>
    <ul>
      <li>Players take turns <strong>clockwise</strong>: West, North, East, South.</li>
      <li>The first player of the trick chooses any card. Its suit is the <dfn>suit led</dfn> for the rest of the trick.</li>
      <li>The other players <strong>must follow suit</strong> with a card of the suit led if they have one. Otherwise, they play any card: this is called <dfn>discarding</dfn>.</li>
      <li>In this version, there are <strong>no trumps</strong>: the <strong>highest card of the suit led</strong> wins the trick. A card of another suit never wins the trick.</li>
      <li>The player who wins the trick <strong>leads the first card of the next trick</strong>.</li>
    </ul>

    <h3>Who wins?</h3>
    <p>After the 10 tricks, the team that <strong>won the most</strong> wins the deal. At <strong>5 tricks each</strong>, it's a tie.</p>

    <h3>Playing ${K}</h3>
    <ul>
      <li>Choose who plays each seat in the <strong>settings</strong>: you (<strong>Human</strong>) or a robot. Changes apply from the next deal.</li>
      <li>When it's your turn, <strong>click on a highlighted card</strong>. Cards you aren't allowed to play are greyed out.</li>
      <li><strong>Replay the deal</strong> deals the same cards again, to try another way of playing.</li>
    </ul>`,
  };
})();
