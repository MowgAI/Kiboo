"use strict";
/* Testi in italiano. Stesse chiavi di lang/fr.js (la lingua di riferimento).
   Da far rileggere a un madrelingua: accordi, articoli e termini del bridge
   (presa, dichiarante, morto, attacco, rispondere al colore, scartare). */
(() => {
  const C = ["blu", "verde", "rosso", "giallo"];                         // il colore (maschile)
  const F1 = ["blu", "verde", "rossa", "gialla"];                       // una carta …
  const FN = ["blu", "verdi", "rosse", "gialle"];                       // delle carte …
  const S = (n, one, many) => (n === 1 ? one : many);
  const art = v => (v === 1 || v === 8 ? "l'" : "il ") + v;              // il 7, l'8, l'1
  const del = v => (v === 1 || v === 8 ? "dell'" : "del ") + v;          // del 7, dell'8
  const artc = name => (/^(1|8)\b/.test(name) ? "l'" : "il ") + name;   // il 7 blu, l'8 blu (nome di carta)
  const K = '<span class="kiboo" aria-label="Kiboo"><span>K</span><span>i</span><span>b</span><span>o</span><span>o</span></span>';

  (window.KIBOO_LANGS = window.KIBOO_LANGS || {}).it = {
    langName: "Italiano",

    /* ---------- Grammatica ---------- */
    color: s => C[s],
    theColor: s => "il " + C[s],
    cardAdj: (s, n) => (n === 1 ? F1 : FN)[s],
    card: c => `${c.v} ${C[c.s]}`,
    seat: x => ({ N: "Nord", E: "Est", S: "Sud", O: "Ovest" })[x],
    team: t => ({ NS: "Nord-Sud", EO: "Est-Ovest" })[t],
    family: s => ["animali", "dinosauri", "robot", "mestieri"][s],
    isPlural: n => n !== 1,
    num: n => n.toLocaleString("it-IT"),
    orList: a => a.join(" o "),
    andList: a => a.join(" e "),

    /* ---------- Intestazione e impostazioni ---------- */
    "head.lang": "Lingua",
    "head.feedback": "Dai il tuo parere",
    "head.progress": "Progressi",
    "head.exercises": "Esercizi",
    "head.rules": "Regole del gioco",
    "setup.aria": "Impostazioni del tavolo",
    "setup.west": "Ovest",
    "setup.north": "Nord",
    "setup.northFixed": "il morto, giocato da Sud",
    "setup.east": "Est",
    "setup.south": "Sud (dichiarante)",
    "setup.speed": "Velocità dei robot",
    "setup.slow": "Lenta",
    "setup.normal": "Normale",
    "setup.fast": "Veloce",
    "setup.open": "Carte scoperte",
    "setup.hints": "Mostra le giocate migliori",
    "setup.explain": "Spiegazioni di Piperno",
    "setup.quiz": "Domande durante la partita",
    "setup.eval": "Modalità valutazione",
    "help.show": "Aiuto",
    "help.hide": "Nascondi l'aiuto",
    "btn.replay": "Rigioca la smazzata",
    "btn.new": "Nuova smazzata",
    "btn.replayShort": "Rigioca",
    "btn.close": "Chiudi",
    "help.list": `<ul>
        <li>I cambi di giocatori valgono dalla <strong>prossima smazzata</strong>.</li>
        <li><strong>Carte scoperte</strong> mostra tutte le mani.</li>
        <li><strong>Giocate migliori</strong>: su ogni carta giocabile, il numero di prese che farà la tua linea se tutti giocano perfettamente a carte scoperte.</li>
        <li><strong>Piperno</strong> gioca con regole semplici (spunta Spiegazioni di Piperno per vedere quale applica a ogni carta), <strong>PiperRand</strong> gioca a caso.</li>
        <li><strong>Averell</strong> vede solo la sua mano e il morto: dalla seconda presa, simula fino a 40 smazzate possibili e le analizza con il DDS. <strong>Averell250</strong> ne simula fino a 250, più forte ma più lento. <strong>Cheater</strong>, invece, vede tutte le carte.</li>
        <li>A fine smazzata, il DDS fa il <strong>bilancio</strong> delle carte che sono costate prese.</li>
        <li><strong>Modalità valutazione</strong>: confronta la tua smazzata (in Sud) con quella di Piperno, Averell e Averell250 con le stesse carte; il tuo punteggio duplicato appare a fine smazzata.</li>
        <li><strong>Domande durante la partita</strong> (quando sei il dichiarante, in Sud): <strong>Alcune</strong> ne pone almeno una per smazzata, estratte a sorte; <strong>Tutte</strong> le pone tutte, per allenarsi. Ogni 3 risposte giuste, scegli un regalo.</li>
        <li>Quando giochi, ogni presa resta sul tavolo finché non clicchi su <strong>Presa successiva</strong>: prenditi il tempo di ricordare le carte giocate.</li>
      </ul>`,
    "player.human": "Umano",
    "score.aria": "Prese vinte",
    "team.NS": "Nord-Sud",
    "team.EO": "Est-Ovest",

    /* ---------- La partita ---------- */
    "tag.dummy": "il morto",
    "who.dummy": "Nord (morto)",
    "card.revealed": p => `${p.card} (scoperta)`,
    "card.hint": p => `${p.card}, ${p.n} prese per la tua linea`,
    "result.tie": "Pareggio",
    "result.win": p => `Vince ${p.team}`,
    "result.score": p => `${p.ns} prese a ${p.eo}`,
    "status.over": "Smazzata finita.",
    "status.trickFor": p => `Presa per ${p.seat} (${p.team}).`,
    "status.dummyTurn": "Tocca a te giocare una carta del morto (Nord).",
    "status.yourTurn": p => `Tocca a ${p.seat}: scegli una carta.`,
    "status.lead": p => `${p.seat} attacca: scegli una carta.`,
    "status.thinking": p => `${p.seat} sta pensando…`,
    "status.hintsPending": " Calcolo delle giocate migliori…",
    "status.hintsReady": " Bollini: prese della tua linea a fine smazzata.",

    /* ---------- Spiegazioni di Piperno ---------- */
    "explain.title": "Spiegazioni di Piperno",
    "explain.none": "Piperno non ha ancora giocato.",
    "explain.item": p => `<b>Presa ${p.trick}</b> · ${p.who} gioca <b>${p.card}</b>. ${p.reason}`,
    "pip.opening": p => `Attacco: il ${C[p.suit]} è il suo colore più lungo (${p.len} carte)` +
      (p.tied ? ", il più forte tra i colori della stessa lunghezza" : "") + ". " +
      (p.seq ? "Gioca la carta più alta della sua sequenza." : "Senza una sequenza (almeno due carte consecutive, la più alta almeno 7), gioca la più bassa."),
    "pip.newSuit": p => `Il suo colore preferito diventa il ${C[p.suit]} (il suo colore più lungo).`,
    "pip.leadStrong": p => `Attacca nel suo colore preferito, il ${C[p.suit]}. Ha la carta più alta rimasta (${art(p.top)}): gioca la sua più alta.`,
    "pip.leadWeak": p => `Attacca nel suo colore preferito, il ${C[p.suit]}. Non ha la carta più alta rimasta (${art(p.top)}): gioca la sua più bassa.`,
    "pip.partnerFollow": "Il suo compagno vince già la presa: risponde con la sua carta più bassa.",
    "pip.partnerDiscard": p => `Il suo compagno vince già la presa e lui non ha più ${C[p.led]}: scarta la prima carta della sua mano, nell'ordine blu, verde, rosso, giallo.`,
    "pip.win": p => `Gioca la carta più bassa che fa vincere la sua linea${p.now ? " per ora" : ""}.`,
    "pip.cantWin": "Non può far vincere la sua linea: risponde con la sua carta più bassa.",
    "pip.discardKeep": p => `Non ha più ${C[p.led]} e non può vincere la presa: scarta una carta bassa tenendo il suo colore preferito (il ${C[p.my]}).`,
    "pip.discardOnly": p => `Non ha più ${C[p.led]} e non può vincere la presa: gli resta solo il suo colore preferito (il ${C[p.my]}), scarta la più bassa.`,

    /* ---------- Bilancio della smazzata ---------- */
    "review.pending": "Il DDS sta analizzando la smazzata…",
    "review.title": "Bilancio della smazzata",
    "review.par": p => `Con un gioco perfetto dei quattro giocatori, Nord-Sud avrebbe fatto <b>${p.par}</b> ${S(p.par, "presa", "prese")} (risultato: ${p.ns}).`,
    "review.none": "Nessun errore: ogni carta giocata era una delle migliori.",
    "review.item": p => `<b>Presa ${p.trick}</b> · ${p.who} gioca ${p.card}: costa ${p.loss} ${S(p.loss, "presa", "prese")} a ${p.camp}. Meglio: ${p.alt}.`,

    /* ---------- Esercizi ---------- */
    "ex.title": "Esercizi",
    "ex.close": "Chiudi gli esercizi",
    "ex.tabs": "Scelta dell'esercizio",
    "ex.tab.count": "Conta la tua mano",
    "ex.tab.longest": "Colore più lungo",
    "ex.tab.legal": "Carte giocabili",
    "ex.sort": "Ordina la mano per colore",
    "ex.count.intro": "Ecco una mano di 10 carte.",
    "ex.count.q": p => `${p.intro} Per ogni colore, quante <strong>carte</strong> e quanti <strong>punti</strong> hai? I punti di un colore sono la somma dei valori delle sue carte.`,
    "ex.col.color": "Colore",
    "ex.col.cards": "Carte",
    "ex.col.points": "Punti",
    "ex.col.fix": "Correzione",
    "ex.ph.cards": "carte",
    "ex.ph.points": "punti",
    "ex.aria.cards": p => `Numero di carte ${FN[p.s]}`,
    "ex.aria.points": p => `Punti del ${C[p.s]}`,
    "ex.total": "Totale dei punti",
    "ex.check": "Verifica",
    "ex.count.fix": p => `${p.n} ${S(p.n, "carta", "carte")}: ${p.values} = ${p.pts} ${S(p.pts, "punto", "punti")}`,
    "ex.count.fixNone": "0 carte: 0 punti",
    "ex.count.fixTotal": p => `${p.sums} = ${p.total} ${S(p.total, "punto", "punti")}`,
    "ex.count.wrong": p => `${p.n} ${S(p.n, "risposta", "risposte")} da rivedere: la correzione è indicata su ogni riga.`,
    "ex.allRight": "Bravo, è tutto giusto!",
    "ex.ok": "Bravo! ",
    "ex.notQuite": "Non proprio. ",
    "ex.longest.q": "Qual è il tuo <strong>colore più lungo</strong>, cioè quello in cui hai più carte?",
    "ex.aria.colors": "Colori",
    "ex.longest.result": p => (p.ok ? "Bravo! " : `Non proprio: il tuo colore più lungo è ${p.longest.map(s => "il " + C[s]).join(" o ")}. `) +
      `Numero di carte: ${p.counts.map((n, s) => `${C[s]} ${n}`).join(", ")}.` +
      (p.longest.length > 1
        ? ` Il ${p.longest.map(s => C[s]).join(" e il ")} hanno ciascuno ${p.max} carte: ${p.longest.length === 2 ? "le due risposte sono giuste" : "tutte queste risposte sono giuste"}.`
        : ""),
    "ex.legal.lead": p => `${p.seat} attacca con <strong>${artc(p.card)}</strong>`,
    "ex.legal.playedItem": p => `${p.seat}: <strong>${p.card}</strong>`,
    "ex.legal.played": p => `Già giocato in questa presa: ${p.list}`,
    "ex.legal.ledSuit": p => `Il colore richiesto è il ${p.suit}.`,
    "ex.legal.q.me": "Clicca su <strong>tutte le carte</strong> che hai il diritto di giocare, poi verifica.",
    "ex.legal.q.dummy": "Clicca su <strong>tutte le carte</strong> che il morto ha il diritto di giocare, poi verifica.",
    "ex.legal.why": p => p.follows
      ? `Hai del ${C[p.led]}: devi rispondere al colore. ` + (p.n === 1
        ? `Solo la tua carta ${F1[p.led]} è giocabile.`
        : `Solo le tue ${p.n} carte ${FN[p.led]} sono giocabili.`)
      : `Non hai ${C[p.led]}: puoi scartare qualsiasi carta. ${p.hand === 1 ? "La tua carta è giocabile." : `Tutte le ${p.hand} sono giocabili.`}`,
    "ex.legal.legend": " Le carte con il bordo tratteggiato erano giocabili ma non scelte; quelle con il bordo rosso non lo erano.",
    "ex.newHand": "Nuova mano",
    "ex.openGift": "Apri il tuo regalo",
    "ex.continue": "Continua gli esercizi",
    "ex.score": p => `Esercizi riusciti: ${p.ok} su ${p.done}`,
    "ex.scoreNone": "Scegli un esercizio. I tuoi risultati appariranno qui.",

    /* ---------- Domande durante la partita ---------- */
    "quiz.title": "Domanda",
    "quiz.skip": "Salta la domanda",
    "quiz.title.start": "Domanda: prima dell'attacco",
    "quiz.title.lead": "Domanda: dopo l'attacco",
    "quiz.title.play": "Domanda: prima di giocare",
    "quiz.start.intro": "La smazzata comincia. Ecco la tua mano.",
    "quiz.resume": "Riprendi la partita",
    "quiz.yes": "Sì, per forza",
    "quiz.no": "No, è impossibile",
    "quiz.maybe": "Non si può sapere",
    "quiz.q.same": p => `Ovest può avere <strong>tante carte</strong> in un altro colore quante nel ${p.suit}?`,
    "quiz.rule.same": "A parità di lunghezza, la regola d'attacco sceglie il colore con più punti (a parità di punti, l'ultimo nell'ordine blu, verde, rosso, giallo). Un altro colore altrettanto lungo è quindi possibile se ha meno punti.",
    "quiz.q.higher": p => `Ovest ha attaccato con ${art(p.v)} ${C[p.s]}. Può avere una <strong>carta ${F1[p.s]} più alta</strong> ${del(p.v)}?`,
    "quiz.q.lower": p => `Ovest ha attaccato con ${art(p.v)} ${C[p.s]}. Può avere una <strong>carta ${F1[p.s]} più bassa</strong> ${del(p.v)}?`,
    "quiz.rule.seq": "La regola d'attacco fa giocare la carta più alta di una sequenza (almeno due carte consecutive, la più alta almeno 7); altrimenti, la carta più bassa del colore.",
    "quiz.col.me": "La tua mano",
    "quiz.col.dummy": "Il morto",
    "quiz.col.rest": "Restano per Est e Ovest",
    "quiz.col.pts": "Punti rimasti",
    "quiz.rest.lead": p => `, compreso ${art(p.v)} d'attacco`,
    "quiz.led": p => `Ovest (${p.bot}) ha attaccato con <strong>${artc(p.card)}</strong>. Segue la regola d'attacco di Piperno.`,
    "quiz.rule.hide": "Nascondi la regola d'attacco",
    "quiz.rule.show": "Mostra la regola d'attacco",
    "quiz.dummy": "Il morto (Nord)",
    "quiz.me": "La tua mano (Sud, dichiarante)",
    "quiz.hint": "Ovest ha 10 carte, scelte tra le 20 che non vedi (né nella tua mano, né nel morto).",
    "quiz.aria.answers": "Risposte",
    "quiz.follow.q": p => `Quali colori possono avere <strong>tante carte</strong> quante il ${p.suit} nella mano di Ovest? Spunta tutte le risposte giuste.`,
    "quiz.unseen": "Le carte che non vedi, colore per colore:",
    "quiz.perSuit": "Colore per colore:",
    "quiz.same.possible": p => `${p.suit}: <strong>possibile</strong>. Per esempio ${p.k} carte ${FN[p.L]} (${p.pL} punti) e ${p.k} carte ${FN[p.s]} (${p.pS} punti): Ovest attacca proprio nel ${C[p.L]}` +
      (p.tie ? ` (stessi punti, ma il ${C[p.L]} viene dopo il ${C[p.s]} nell'ordine blu, verde, rosso, giallo)` : "") + ".",
    "quiz.same.short": p => `${p.suit}: <strong>impossibile</strong>. Il ${C[p.L]} è il colore più lungo di Ovest: ne ha almeno ${p.minL} carte. Ma ` +
      (p.rest === 0 ? `non resta nessuna carta ${F1[p.s]}` : `${S(p.rest, `resta solo ${p.rest} carta ${F1[p.s]}`, `restano solo ${p.rest} carte ${FN[p.s]}`)} per Est e Ovest`) +
      ": non abbastanza per averne altrettante.",
    "quiz.same.points": p => `a parità di lunghezza, il ${C[p.s]} avrebbe più punti del ${C[p.L]} (le carte ${FN[p.s]} rimaste valgono ${p.pts} punti in tutto), e Ovest avrebbe attaccato nel ${C[p.s]}`,
    "quiz.same.card": p => `a parità di lunghezza, Ovest avrebbe anche una sequenza o una carta ${F1[p.L]} più bassa, e non avrebbe attaccato con ${art(p.v)}`,
    "quiz.same.other": p => `la regola d'attacco gli avrebbe fatto giocare un'altra carta invece ${del(p.v)} ${C[p.L]}`,
    "quiz.same.or": "; oppure ",
    "quiz.same.rule": p => `${p.suit}: <strong>impossibile</strong>. Restano abbastanza carte ${FN[p.s]}, ma ${p.parts}.`,
    "quiz.total": p => `In tutto, Ovest può avere <strong>${p.totalTxt}</strong> ${S(p.total, "mano diversa che rispetta", "mani diverse che rispettano")} la regola d'attacco.
        La risposta alla domanda è sì in <strong>${p.yesTxt}</strong> di esse${p.maybe ? ` e no in ${p.noTxt}` : ""}.`,
    "quiz.ex.yes": "Una mano possibile di Ovest in cui la risposta è sì:",
    "quiz.ex.no": "Una mano possibile di Ovest in cui la risposta è no:",
    "quiz.ex.any": "Per esempio, Ovest potrebbe avere:",
    "quiz.goodAnswer": p => `La risposta giusta: ${p.answer.toLowerCase()}.`,
    "quiz.follow.result": p => (p.list.length > 1 ? "I colori possibili: " : "L'unico colore possibile: il ") + p.list.map(s => C[s]).join(", ") + ". I dettagli sono qui sotto.",

    /* ---------- Domande: modi, fine della presa, carte rimaste, distribuzioni, carte vincenti ---------- */
    "setup.quiz.off": "Nessuna",
    "setup.quiz.light": "Alcune",
    "setup.quiz.all": "Tutte (allenamento)",
    "btn.nextTrick": "Presa successiva",
    "btn.endDeal": "Fine della smazzata",
    "status.holdHint": " Guarda bene le carte, poi clicca su «Presa successiva».",
    "ex.tab.rest": "Carte rimaste",
    "ex.tab.split": "Distribuzione dell'attacco",
    "quiz.title.trick1": "Domanda: dopo la prima presa",
    "quiz.title.trick3": "Domanda: dopo la terza presa",
    "quiz.title.discard": "Domanda: uno scarto",
    "rest.intro.game": "La smazzata comincia. Ecco la tua mano e quella del morto.",
    "rest.intro.game1": "La prima presa è finita. Ti ricordi le carte giocate?",
    "rest.intro.before": "Ecco la tua mano (Sud) e quella del morto (Nord), prima dell'attacco.",
    "rest.intro.trick": p => `La prima presa è appena stata giocata: ${p.list}.`,
    "rest.q.before": "Quante carte di ogni colore hanno <strong>Est e Ovest</strong> in tutto?",
    "rest.q.after": "Quante carte di ogni colore restano nelle mani di <strong>Est e Ovest</strong> in tutto? Pensa alle carte già giocate.",
    "rest.col": "A Est e Ovest",
    "rest.aria": p => `Carte ${FN[p.s]} a Est e Ovest`,
    "rest.fix": p => `10 − ${p.me} (la tua mano) − ${p.dummy} (il morto)` +
      (p.gone.length ? ` − ${p.gone.length} (già ${S(p.gone.length, "giocata", "giocate")}: ${p.gone.join(", ")})` : "") + ` = ${p.rest}`,
    "split.q": p => `${S(p.rest, "Resta", "Restano")} <strong>${p.rest}</strong> ${S(p.rest, "carta", "carte")} ${(p.rest === 1 ? F1 : FN)[p.L]} per Ovest ed Est, compreso ${art(p.v)} d'attacco. Come possono essere <strong>distribuite</strong>? Seleziona tutte le distribuzioni possibili.`,
    "split.choice": p => `Ovest ${p.w} – Est ${p.e}`,
    "split.result": p => (p.list.length > 1 ? "Le distribuzioni possibili: " : "L'unica distribuzione possibile: ") + p.list.join("; ") + ". I dettagli sono qui sotto.",
    "split.detail": "Distribuzione per distribuzione:",
    "split.possible": p => `${p.label}: <strong>possibile</strong> (${p.nTxt} ${S(p.n, "mano di Ovest rispetta", "mani di Ovest rispettano")} la regola d'attacco).`,
    "split.none": p => `${p.label}: <strong>impossibile</strong> con le carte che vedi.`,
    "split.short": p => `${p.label}: <strong>impossibile</strong>. Con solo ${p.w} ${S(p.w, "carta", "carte")} ${(p.w === 1 ? F1 : FN)[p.L]}, Ovest avrebbe per forza un colore più lungo` +
      (p.pigeon ? ` (gli resterebbero ${10 - p.w} carte per tre colori)` : "") + `, e avrebbe attaccato in quel colore.`,
    "split.card": p => `la regola d'attacco gli avrebbe fatto giocare un'altra carta ${F1[p.L]} invece ${del(p.v)}`,
    "split.suit": p => `avrebbe un altro colore altrettanto lungo con più punti del ${C[p.L]}, e avrebbe attaccato in quel colore`,
    "split.rule": p => `${p.label}: <strong>impossibile</strong>. Il ${C[p.L]} potrebbe essere il suo colore più lungo, ma ${p.parts}.`,
    "split.example": p => `Per esempio, una mano possibile di Ovest (${p.label}):`,
    "masters.q": "Clicca su <strong>tutte le carte vincenti</strong> della tua mano e del morto, poi verifica. Una carta è vincente quando Est e Ovest non hanno più nessuna carta più alta nel suo colore. Guarda la tua mano e il morto <strong>insieme</strong>: con 10 9 8 3 al morto e 7 6 4 nella tua mano, se Est e Ovest hanno solo il 5, il 2 e l'1, le vincenti sono 10 9 8 7 6.",
    "masters.none": "Nessuna carta era vincente. ",
    "masters.rule": "Per sapere se una carta è vincente, bisogna ricordarsi delle carte più alte già giocate: le altre sono ancora a Est e Ovest, tranne quelle della tua mano e del morto.",
    "masters.suit": p => `${p.suit}: ` +
      (p.top ? `la carta più alta ancora a Est e Ovest è ${art(p.top).replace(/(\d+)$/, "<strong>$1</strong>")}` : `Est e Ovest non hanno più carte ${FN[p.s]}`) +
      (p.gone.length ? ` (già ${S(p.gone.length, "giocata", "giocate")}: ${p.gone.join(", ")})` : " (nessuna carta giocata)") +
      (p.masters.length ? `. ${S(p.masters.length, "Vincente", "Vincenti")}: ${p.masters.join(", ")}.` : ". Nessuna vincente."),
    "discard.intro": p => `${p.who[0].toUpperCase() + p.who.slice(1)} non risponde al colore (${p.suit}): scarta ${artc(p.card).replace(/^(il |l')(.*)$/, "$1<strong>$2</strong>")}.`,
    "discard.q": p => `Com'era <strong>distribuito all'inizio</strong> il ${p.suit}? Indica il numero di carte di ogni giocatore, cominciando da Ovest (per esempio 4-3-2-1).`,
    "discard.hint": "Non ha più carte di questo colore: ne aveva tante quante ne ha giocate.",
    "discard.col.seat": "Giocatore",
    "discard.aria": p => `Carte ${FN[p.s]} di ${p.seat} all'inizio`,
    "discard.how.me": p => `la tua mano all'inizio: ${p.n}`,
    "discard.how.dummy": p => `il morto all'inizio: ${p.n}`,
    "discard.how.void": p => p.n ? `non ne ha più e ne ha ${S(p.n, "giocata", "giocate")} ${p.n}: ${p.cards.join(", ")}` : "non ne aveva nessuna",
    "discard.how.rest": p => `il resto: 10 − ${p.others.join(" − ")} = ${p.n}`,
    "discard.result": p => `La distribuzione iniziale del ${p.suit}: ${p.split} (Ovest, Nord, Est, Sud).`,

    /* ---------- Regali e collezione ---------- */
    "gift.next": "Prossimo regalo:",
    "gift.aria": p => `Prossimo regalo: ${p.n} ${S(p.n, "risposta giusta", "risposte giuste")} su ${p.goal}`,
    "album.btn": p => `Collezione ${p.n}/40`,
    "album.title": "La mia collezione",
    "album.close": "Chiudi la collezione",
    "gift.title": p => `Bravo, ${p.goal} risposte giuste! Scegli il tuo regalo.`,
    "gift.revealO": "Vedi una carta nascosta di Ovest",
    "gift.revealE": "Vedi una carta nascosta di Est",
    "gift.collect": "Vinci una carta per la mia collezione",
    "gift.won": p => `Nuova carta per la tua collezione: <strong>${artc(p.card)}</strong> della famiglia dei ${familyName(p.s)}. ` +
      `Ora hai ${p.n} ${S(p.n, "carta", "carte")} su 40` +
      (p.fam === 10 ? `, e la famiglia dei ${familyName(p.s)} è completa!` : ` (${p.fam} su 10 tra i ${familyName(p.s)}).`),
    "gift.revealed": p => `Carta di ${p.seat === "O" ? "Ovest" : "Est"} scoperta: <strong>${artc(p.card)}</strong>. Resta visibile, bordata di giallo, finché non viene giocata.`,
    "album.famCount": p => `${p.n} su 10`,
    "album.missing": p => `${p.card}: non ancora vinta`,
    "album.complete": "Bravo, la tua collezione è completa!",
    "album.count": p => `${p.n} ${S(p.n, "carta", "carte")} su 40. Vincine altre con 3 risposte giuste agli esercizi o alle domande durante la partita.`,

    /* ---------- Valutazione e progressi ---------- */
    "level.0": "Principiante",
    "level.1": "Livello Piperno",
    "level.2": "Livello Averell",
    "level.3": "Livello Averell250",
    "level.4": "Esperto",
    "level.who.4": "il gioco perfetto",
    "eval.title": "Valutazione",
    "eval.defense": "La modalità valutazione funziona solo quando giochi in Sud (dichiarante). In difesa, il tuo risultato dipende anche dal tuo compagno robot: il confronto non sarebbe giusto.",
    "eval.waiting": p => `Calcolo in corso: ${p.who} rigioca la tua smazzata…`,
    "eval.theRobots": "i robot",
    "eval.better": "hai fatto meglio",
    "eval.equal": "pareggio",
    "eval.more": p => `${p.n} ${S(p.n, "presa", "prese")} in più`,
    "eval.notCounted": p => `Smazzata non contata nei tuoi progressi (${p.replayed ? "smazzata rigiocata" : "aiuto usato: giocate migliori, carte scoperte o carta scoperta in regalo"}).`,
    "eval.levelUp": p => `Nuovo livello: <strong>${p.name}</strong>!${p.card ? ` Vinci <strong>${artc(p.card)}</strong> per la tua collezione.` : ""}`,
    "eval.score": p => `Il tuo punteggio duplicato: <strong>${p.pct}%</strong>`,
    "eval.col.declarer": "Dichiarante",
    "eval.col.tricks": "Prese Nord-Sud",
    "eval.col.cmp": "Confronto",
    "eval.you": "Tu",
    "eval.how": p => `Stessa smazzata, stessi difensori. 2 punti per ogni robot battuto, 1 per un pareggio, su un massimo di ${p.max} punti.`,
    "eval.seeProgress": "Vedi i miei progressi",
    "eval.levelTop": p => `<strong>${p.name}</strong>: il livello più alto. Bravo!`,
    "eval.levelNext": p => `<strong>${p.name}</strong>. Per passare al <strong>${p.next}</strong>, fai almeno come ${p.who} in ${p.needed} delle ultime ${p.window} smazzate: <strong>${p.progress} su ${p.needed}</strong> per ora.`,
    "prog.title": "I miei progressi",
    "prog.step": p => `<strong>${p.name}</strong>: almeno come ${p.who} in ${p.n} delle ultime ${p.of} smazzate${p.done ? " ✓" : ` (ne servono ${p.needed} su ${p.window})`}`,
    "prog.scores": p => `Punteggio duplicato delle ultime ${p.n} smazzate${p.avg !== null ? ` (media ${p.avg}%)` : ""}:`,
    "prog.aria": p => `Punteggi: ${p.list}`,
    "prog.col.deal": "Smazzata",
    "prog.col.score": "Punteggio",
    "prog.empty": "Nessuna smazzata ancora valutata. Gioca una smazzata in Sud (dichiarante) con la modalità valutazione: il tuo punteggio apparirà alla fine, e i tuoi progressi qui.",

    /* ---------- Dai il tuo parere ---------- */
    "fb.title": "Dai il tuo parere",
    "fb.intro": "Grazie per provare Kiboo! Il tuo parere aiuta a migliorare il gioco.",
    "fb.kinds": "Tipo di parere",
    "fb.kind.bug": "Un problema",
    "fb.kind.idee": "Un'idea",
    "fb.kind.avis": "Il mio parere",
    "fb.stars": "Voto su 5",
    "fb.yourNote": "Il tuo voto:",
    "fb.star1": "1 su 5", "fb.star2": "2 su 5", "fb.star3": "3 su 5", "fb.star4": "4 su 5", "fb.star5": "5 su 5",
    "fb.message": "Il tuo messaggio",
    "fb.messagePh": "Cosa ti è piaciuto, cosa non funziona, cosa stavi facendo quando è successo il problema…",
    "fb.name": "Il tuo nome (facoltativo)",
    "fb.auto": "Informazioni aggiunte automaticamente",
    "fb.copy": "Copia il mio parere",
    "fb.github": "Invia su GitHub",
    "fb.hint": "«Copia il mio parere»: poi incollalo in un messaggio alla persona che ti ha mandato il link. «Invia su GitHub» richiede un account GitHub.",
    "fb.fallbackAria": "Testo del tuo parere da copiare",
    "fb.copied": "Parere copiato. Incollalo in un messaggio (e-mail, SMS…) alla persona che ti ha mandato il link. Grazie!",
    "fb.copyFailed": "La copia automatica non ha funzionato: il testo è selezionato qui sotto, copialo con Ctrl+C (o con una pressione lunga).",
    "fb.ctx.version": "Versione",
    "fb.ctx.lang": "Lingua",
    "fb.ctx.screen": "Schermo",
    "fb.ctx.touch": " (touch)",
    "fb.ctx.browser": "Browser",
    "fb.ctx.players": "Giocatori",
    "fb.ctx.options": "Opzioni",
    "fb.ctx.game": "Partita",
    "fb.opt.open": "carte scoperte",
    "fb.opt.hints": "giocate migliori",
    "fb.opt.explain": "spiegazioni di Piperno",
    "fb.opt.quiz": "domande durante la partita",
    "fb.opt.none": "nessuna",
    "fb.ctx.over": "smazzata finita",
    "fb.ctx.trick": p => `presa ${p.n}, Nord-Sud ${p.ns} - Est-Ovest ${p.eo}`,
    "fb.msg.title": p => `Parere su Kiboo: ${p.kind.toLowerCase()}`,
    "fb.msg.note": "Voto",
    "fb.msg.from": "Da",
    "fb.msg.empty": "(nessun messaggio)",
    "fb.issueDefault": "Parere su Kiboo",

    /* ---------- Regole del gioco (finestra) ---------- */
    "rules.title": `Regole di ${K}`,
    "rules.close": "Chiudi le regole",
    "rules.body": `
    <p>${K} è un gioco di carte <strong>ispirato al bridge</strong>. Si gioca in <strong>4 giocatori</strong>, divisi in <strong>2 squadre</strong> indicate dal loro posto: <strong>Nord-Sud</strong> contro <strong>Est-Ovest</strong>. I compagni siedono uno di fronte all'altro. Come il bridge, Kiboo è un <strong>gioco di prese</strong>: una <dfn>presa</dfn> è l'insieme delle quattro carte giocate a turno da ciascuno dei quattro giocatori intorno al tavolo.</p>

    <h3>Le carte</h3>
    <ul>
      <li><strong>40 carte</strong>: <strong>4 famiglie</strong> (<span class="fam blue">animali</span>, <span class="fam green">dinosauri</span>, <span class="fam red">robot</span> e <span class="fam yellow">mestieri</span>), indicate dal loro colore (rispettivamente blu, verde, rosso e giallo). Ogni carta ha un <strong>valore da 1 a 10</strong>: il <strong>10 è la carta più alta</strong>, l'1 la più bassa.</li>
      <li>Ogni giocatore riceve <strong>10 carte</strong>.</li>
    </ul>

    <h3>Il dichiarante e il morto</h3>
    <ul>
      <li>Sud è il <dfn>dichiarante</dfn>. Gioca le sue carte e anche quelle del suo compagno Nord, chiamato il <dfn>morto</dfn>.</li>
      <li>Ovest gioca la prima carta: è l'<dfn>attacco</dfn>. Il morto stende allora le sue carte <strong>scoperte</strong>, e tutti le vedono fino alla fine della smazzata.</li>
    </ul>

    <h3>La regola d'attacco dei robot</h3>
    <div id="lead-rule">
      <p>Piperno, Averell e Averell250 scelgono sempre il loro attacco allo stesso modo:</p>
      <ol>
        <li>Prendono il loro <strong>colore più lungo</strong>, quello in cui hanno più carte.</li>
        <li>Se due colori hanno <strong>tante carte quanto l'altro</strong>, prendono quello con <strong>più punti</strong> (la somma dei valori). A parità di punti, prendono l'ultimo nell'ordine blu, verde, rosso, giallo.</li>
        <li>In quel colore, se hanno una <dfn>sequenza</dfn> (almeno due carte consecutive, come il 7 e l'8), giocano la <strong>carta più alta della sequenza</strong>, ma solo se questa carta vale <strong>almeno 7</strong>. Se hanno più sequenze, prendono la più alta.</li>
        <li>Senza sequenza (o con una sequenza troppo bassa, come il 3 e il 4), giocano la <strong>carta più bassa</strong> del colore.</li>
      </ol>
      <p>Esempi: con il 2, il 7 e l'8 blu, attaccano con l'8 blu (sequenza 7-8). Con il 2, il 5 e il 9 blu, attaccano con il 2 blu (nessuna sequenza). Con il 3, il 4 e il 9 blu, attaccano con il 3 blu (la sequenza 3-4 non arriva al 7).</p>
    </div>

    <h3>Come si gioca una presa</h3>
    <ul>
      <li>Si gioca a turno <strong>in senso orario</strong>: Ovest, Nord, Est, Sud.</li>
      <li>Il primo giocatore della presa sceglie liberamente la sua carta. Il suo colore è il <dfn>colore richiesto</dfn> per il resto della presa.</li>
      <li>Gli altri giocatori <strong>devono rispondere al colore</strong> con una carta del colore richiesto, se ne hanno. Altrimenti giocano una carta qualsiasi: questa azione si chiama <dfn>scartare</dfn>.</li>
      <li>In questa versione non c'è <strong>atout</strong>: la <strong>carta più alta del colore richiesto</strong> vince quindi la presa. Una carta di un altro colore non vince mai la presa.</li>
      <li>Il giocatore che vince la presa <strong>gioca la prima carta della presa successiva</strong>.</li>
    </ul>

    <h3>Chi vince?</h3>
    <p>Alla fine delle 10 prese, la squadra che ne ha <strong>vinte di più</strong> vince la smazzata. Con <strong>5 prese a testa</strong>, è un pareggio.</p>

    <h3>Giocare a ${K}</h3>
    <ul>
      <li>Scegli chi gioca ogni posto nelle <strong>impostazioni</strong>: tu (<strong>Umano</strong>) o un robot. I cambi valgono dalla prossima smazzata.</li>
      <li>Quando tocca a te, <strong>clicca su una carta evidenziata</strong>. Le carte che non hai il diritto di giocare sono in grigio.</li>
      <li><strong>Rigioca la smazzata</strong> ridistribuisce le stesse carte, per provare un altro modo di giocare.</li>
    </ul>`,
  };
})();
