"use strict";
/* Textes en français (langue de référence : une clé absente des autres langues retombe ici).
   Une valeur est un texte, avec éventuellement des {paramètres}, ou une fonction
   quand la grammaire dépend des valeurs. Les outils de grammaire (color,
   cardAdj…) sont utilisés partout dans le jeu : voir js/i18n.js. */
(() => {
  const C = ["bleu", "vert", "rouge", "jaune"];
  const S = (n, one, many) => (n > 1 ? many : one);
  const K = '<span class="kiboo" aria-label="Kiboo"><span>K</span><span>i</span><span>b</span><span>o</span><span>o</span></span>';

  (window.KIBOO_LANGS = window.KIBOO_LANGS || {}).fr = {
    langName: "Français",

    /* ---------- Grammaire ---------- */
    color: s => C[s],
    theColor: s => "le " + C[s],
    cardAdj: (s, n) => ["bleue", "verte", "rouge", "jaune"][s] + (n > 1 ? "s" : ""),   // accordé avec « carte »
    card: c => `${c.v} ${C[c.s]}`,
    seat: x => ({ N: "Nord", E: "Est", S: "Sud", O: "Ouest" })[x],
    team: t => ({ NS: "Nord-Sud", EO: "Est-Ouest" })[t],
    family: s => ["animaux", "dinosaures", "robots", "métiers"][s],
    isPlural: n => n > 1,
    num: n => n.toLocaleString("fr-FR"),
    orList: a => a.join(" ou "),
    andList: a => a.join(" et "),

    /* ---------- En-tête et réglages ---------- */
    "head.lang": "Langue",
    "head.feedback": "Donner mon avis",
    "head.progress": "Progression",
    "head.exercises": "Exercices",
    "head.rules": "Règles du jeu",
    "setup.aria": "Réglages de la table",
    "setup.west": "Ouest",
    "setup.north": "Nord",
    "setup.northFixed": "le mort, joué par Sud",
    "setup.east": "Est",
    "setup.south": "Sud (déclarant)",
    "setup.speed": "Vitesse des robots",
    "setup.slow": "Lente",
    "setup.normal": "Normale",
    "setup.fast": "Rapide",
    "setup.open": "Jeux ouverts",
    "setup.hints": "Montrer les meilleurs coups",
    "setup.explain": "Explications de Piperno",
    "setup.quiz": "Questions pendant la partie",
    "setup.eval": "Mode évaluation",
    "help.show": "Aide",
    "help.hide": "Cacher l'aide",
    "btn.replay": "Rejouer la donne",
    "btn.new": "Nouvelle donne",
    "btn.help": "Jouer avec Goat",
    "btn.noHelp": "Jouer sans aide",
    "btn.replayShort": "Rejouer",
    "btn.close": "Fermer",
    "help.list": `<ul>
        <li>Les changements de joueurs s'appliquent à la <strong>prochaine donne</strong>.</li>
        <li><strong>Jeux ouverts</strong> montre toutes les mains.</li>
        <li><strong>Meilleurs coups</strong> : sur chaque carte jouable, le nombre de plis que ton camp fera si tout le monde joue parfaitement à jeux ouverts.</li>
        <li><strong>Piperno</strong> joue avec des règles simples (coche Explications de Piperno pour voir laquelle il applique à chaque carte), <strong>PiperRand</strong> au hasard.</li>
        <li><strong>Averell</strong> ne voit que sa main et le mort : à partir du deuxième pli, il simule jusqu'à 40 donnes possibles et les analyse avec le DDS. <strong>Averell250</strong> en simule jusqu'à 250, plus fort mais plus lent. <strong>Cheater</strong>, lui, voit toutes les cartes.</li>
        <li>En fin de donne, le DDS fait le <strong>bilan</strong> des cartes qui ont coûté des plis.</li>
        <li><strong>Mode évaluation</strong> : compare ta donne (en Sud) à celle de Piperno, Averell et Averell250 sur les mêmes cartes ; ton score duplicate s'affiche en fin de donne.</li>
        <li><strong>Questions pendant la partie</strong> (quand tu es le déclarant, en Sud) : <strong>Quelques-unes</strong> en pose au moins une par donne, tirées au sort ; <strong>Toutes</strong> les pose toutes, pour s'entraîner. Toutes les 3 bonnes réponses, tu choisis un cadeau.</li>
        <li><strong>Carré de Coco</strong> : pendant la donne, un tableau des cartes de départ de chaque couleur chez chaque joueur (Nord et Sud remplis d'office), à compléter pour Ouest et Est au fil des plis. Le bouton <strong>🐐 Jouer avec Goat</strong> lance une donne avec Goat (et redevient « Jouer sans aide »). Avec <strong>Goat</strong>, le carré se remplit tout seul et chaque déduction est expliquée (c'est une aide : la donne n'est pas évaluée).</li>
        <li><strong>Lire à voix haute</strong> : les questions et les exercices sont lus (en version simple), avec un petit encouragement après chaque réponse. Les boutons 🔊 Écouter lisent aussi les règles et cette aide. La voix dépend de l'appareil.</li>
        <li><strong>Musique</strong> : une petite musique rétro pendant la partie. <strong>Bruitages</strong> : carte posée, pli gagné ou perdu, résultat, bonne ou mauvaise réponse. Le bouton <strong>Parade</strong> fait défiler les 40 personnages, qui se présentent un par un ; un clic sur le logo Kiboo rouvre l'accueil.</li>
        <li>Quand tu joues, chaque pli reste sur la table jusqu'à ton clic sur <strong>Pli suivant</strong> : prends le temps de retenir les cartes jouées.</li>
      </ul>`,
    "player.human": "Humain",
    "score.aria": "Plis gagnés",
    "team.NS": "Nord-Sud",
    "team.EO": "Est-Ouest",

    /* ---------- La partie ---------- */
    "tag.dummy": "le mort",
    "who.dummy": "Nord (mort)",
    "card.revealed": p => `${p.card} (révélée)`,
    "card.hint": p => `${p.card}, ${p.n} plis pour votre camp`,
    "result.tie": "Égalité",
    "result.win": p => `${p.team} gagne`,
    "result.score": p => `${p.ns} plis à ${p.eo}`,
    "status.over": "Donne terminée.",
    "status.trickFor": p => `Pli pour ${p.seat} (${p.team}).`,
    "status.dummyTurn": "À vous de jouer une carte du mort (Nord).",
    "status.yourTurn": p => `À ${p.seat} de jouer : choisissez une carte.`,
    "status.lead": p => `${p.seat} entame : choisissez une carte.`,
    "status.thinking": p => `${p.seat} réfléchit…`,
    "status.hintsPending": " Calcul des meilleurs coups…",
    "status.hintsReady": " Pastilles : plis de votre camp en fin de donne.",

    /* ---------- Explications de Piperno ---------- */
    "explain.title": "Explications de Piperno",
    "explain.none": "Piperno n'a pas encore joué.",
    "explain.item": p => `<b>Pli ${p.trick}</b> · ${p.who} joue <b>${p.card}</b>. ${p.reason}`,
    "pip.opening": p => `Entame : ${theColor(p.suit)} est sa couleur la plus longue (${p.len} cartes)` +
      (p.tied ? ", la plus forte des couleurs de même longueur" : "") + ". " +
      (p.seq ? "Il joue la plus haute carte de sa séquence." : "Sans séquence (au moins deux cartes qui se suivent, la plus haute valant au moins 7), il joue la plus petite."),
    "pip.newSuit": p => `Sa couleur préférée devient ${theColor(p.suit)} (sa couleur la plus longue).`,
    "pip.leadStrong": p => `Il entame dans sa couleur préférée, ${theColor(p.suit)}. Il détient la plus forte carte restante (le ${p.top}) : il joue sa plus haute.`,
    "pip.leadWeak": p => `Il entame dans sa couleur préférée, ${theColor(p.suit)}. Il n'a pas la plus forte carte restante (le ${p.top}) : il joue sa plus petite.`,
    "pip.partnerFollow": "Son partenaire gagne déjà le pli : il fournit sa plus petite carte.",
    "pip.partnerDiscard": p => `Son partenaire gagne déjà le pli et il n'a plus de ${colorName(p.led)} : il défausse la première carte de sa main, dans l'ordre bleu, vert, rouge, jaune.`,
    "pip.win": p => `Il joue la plus petite carte qui fait gagner son camp${p.now ? " pour l'instant" : ""}.`,
    "pip.cantWin": "Il ne peut pas faire gagner son camp : il fournit sa plus petite carte.",
    "pip.discardKeep": p => `Il n'a plus de ${colorName(p.led)} et ne peut pas gagner le pli : il défausse une petite carte en gardant sa couleur préférée (${theColor(p.my)}).`,
    "pip.discardOnly": p => `Il n'a plus de ${colorName(p.led)} et ne peut pas gagner le pli : il ne lui reste que sa couleur préférée (${theColor(p.my)}), il défausse sa plus petite.`,

    /* ---------- Bilan de la donne ---------- */
    "review.pending": "Analyse de la donne par le DDS…",
    "review.title": "Bilan de la donne",
    "review.par": p => `Avec un jeu parfait des quatre joueurs, Nord-Sud faisait <b>${p.par}</b> ${S(p.par, "pli", "plis")} (résultat : ${p.ns}).`,
    "review.none": "Aucune erreur : chaque carte jouée était un meilleur coup.",
    "review.item": p => `<b>Pli ${p.trick}</b> · ${p.who} joue ${p.card} : coûte ${p.loss} ${S(p.loss, "pli", "plis")} à ${p.camp}. Mieux : ${p.alt}.`,

    /* ---------- Exercices ---------- */
    "ex.title": "Exercices",
    "ex.close": "Fermer les exercices",
    "ex.tabs": "Choix de l'exercice",
    "ex.tab.count": "Compter sa main",
    "ex.tab.longest": "Couleur la plus longue",
    "ex.tab.legal": "Cartes jouables",
    "ex.sort": "Ranger la main par couleur",
    "ex.count.intro": "Voici une main de 10 cartes.",
    "ex.count.q": p => `${p.intro} Pour chaque couleur, combien as-tu de <strong>cartes</strong> et combien de <strong>points</strong> ? Les points d'une couleur sont la somme des valeurs de ses cartes.`,
    "ex.col.color": "Couleur",
    "ex.col.cards": "Cartes",
    "ex.col.points": "Points",
    "ex.col.fix": "Correction",
    "ex.ph.cards": "cartes",
    "ex.ph.points": "points",
    "ex.aria.cards": p => `Nombre de cartes ${colorName(p.s)}`,
    "ex.aria.points": p => `Points ${colorName(p.s)}`,
    "ex.total": "Total des points",
    "ex.check": "Vérifier",
    "ex.count.fix": p => `${p.n} ${S(p.n, "carte", "cartes")} : ${p.values} = ${p.pts} ${S(p.pts, "point", "points")}`,
    "ex.count.fixNone": "0 carte : 0 point",
    "ex.count.fixTotal": p => `${p.sums} = ${p.total} ${S(p.total, "point", "points")}`,
    "ex.count.wrong": p => `${p.n} ${S(p.n, "réponse", "réponses")} à revoir : la correction est indiquée pour chaque ligne.`,
    "ex.allRight": "Bravo, tout est juste !",
    "ex.ok": "Bravo ! ",
    "ex.notQuite": "Pas tout à fait. ",
    "ex.longest.q": "Quelle est ta <strong>couleur la plus longue</strong>, c'est-à-dire celle où tu as le plus de cartes ?",
    "ex.aria.colors": "Couleurs",
    "ex.longest.result": p => (p.ok ? "Bravo ! " : `Pas tout à fait : ta couleur la plus longue est ${p.longest.map(theColor).join(" ou ")}. `) +
      `Nombre de cartes : ${p.counts.map((n, s) => `${C[s]} ${n}`).join(", ")}.` +
      (p.longest.length > 1
        ? ` ${p.longest.map(s => C[s]).join(" et ")} ont chacune ${p.max} cartes : ${p.longest.length === 2 ? "les deux réponses sont justes" : "toutes ces réponses sont justes"}.`
        : ""),
    "ex.legal.lead": p => `${p.seat} entame le <strong>${p.card}</strong>`,
    "ex.legal.playedItem": p => `${p.seat} : <strong>${p.card}</strong>`,
    "ex.legal.played": p => `Déjà joué dans ce pli : ${p.list}`,
    "ex.legal.ledSuit": p => `La couleur demandée est le ${p.suit}.`,
    "ex.legal.q.me": "Clique sur <strong>toutes les cartes</strong> que tu as le droit de jouer, puis vérifie.",
    "ex.legal.q.dummy": "Clique sur <strong>toutes les cartes</strong> que le mort a le droit de jouer, puis vérifie.",
    "ex.legal.why": p => p.follows
      ? `Tu as du ${C[p.led]} : tu dois fournir. ` + (p.n === 1
        ? `Seule ta carte ${cardAdj(p.led, 1)} est jouable.`
        : `Seules tes ${p.n} cartes ${cardAdj(p.led, 2)} sont jouables.`)
      : `Tu n'as pas de ${C[p.led]} : tu peux défausser n'importe quelle carte. ${p.hand === 1 ? "Ta carte est jouable." : `Les ${p.hand} sont jouables.`}`,
    "ex.legal.legend": " Les cartes entourées en pointillés étaient jouables mais non choisies ; celles entourées de rouge ne l'étaient pas.",
    "ex.newHand": "Nouvelle main",
    "ex.openGift": "Ouvrir ton cadeau",
    "ex.continue": "Continuer les exercices",
    "ex.score": p => `Exercices réussis : ${p.ok} sur ${p.done}`,
    "ex.scoreNone": "Choisis un exercice. Tes réussites s'affichent ici.",

    /* ---------- Questions pendant la partie ---------- */
    "quiz.title": "Question",
    "quiz.skip": "Passer la question",
    "quiz.title.start": "Question : avant l'entame",
    "quiz.title.lead": "Question : après l'entame",
    "quiz.title.play": "Question : avant de jouer",
    "quiz.start.intro": "La donne commence. Voici ta main.",
    "quiz.resume": "Reprendre la partie",
    "quiz.yes": "Oui, forcément",
    "quiz.no": "Non, c'est impossible",
    "quiz.maybe": "On ne peut pas savoir",
    "quiz.q.same": p => `Ouest peut-il avoir <strong>autant de cartes</strong> dans une autre couleur que le ${p.suit} ?`,
    "quiz.rule.same": "À longueur égale, la règle d'entame choisit la couleur qui a le plus de points (à points égaux, la dernière dans l'ordre bleu, vert, rouge, jaune). Une autre couleur aussi longue est donc possible si elle a moins de points.",
    "quiz.q.higher": p => `Ouest a entamé le ${p.v} ${C[p.s]}. Peut-il avoir une <strong>carte ${cardAdj(p.s, 1)} plus forte</strong> que le ${p.v} ?`,
    "quiz.q.lower": p => `Ouest a entamé le ${p.v} ${C[p.s]}. Peut-il avoir une <strong>carte ${cardAdj(p.s, 1)} plus faible</strong> que le ${p.v} ?`,
    "quiz.rule.seq": "La règle d'entame fait jouer la plus haute carte d'une séquence (au moins deux cartes qui se suivent, la plus haute valant au moins 7) ; sinon, la plus petite carte de la couleur.",
    "quiz.col.me": "Ta main",
    "quiz.col.dummy": "Le mort",
    "quiz.col.rest": "Restent pour Est et Ouest",
    "quiz.col.pts": "Points restants",
    "quiz.rest.lead": p => `, dont le ${p.v} entamé`,
    "quiz.led": p => `Ouest (${p.bot}) a entamé le <strong>${p.card}</strong>. Il suit la règle d'entame de Piperno.`,
    "quiz.rule.hide": "Cacher la règle d'entame",
    "quiz.rule.show": "Voir la règle d'entame",
    "quiz.dummy": "Le mort (Nord)",
    "quiz.me": "Ta main (Sud, déclarant)",
    "quiz.hint": "Ouest a 10 cartes, choisies parmi les 20 que tu ne vois pas (ni dans ta main, ni chez le mort).",
    "quiz.aria.answers": "Réponses",
    "quiz.follow.q": p => `Quelles couleurs peuvent avoir <strong>autant de cartes</strong> que le ${p.suit} dans la main d'Ouest ? Coche toutes les bonnes réponses.`,
    "quiz.unseen": "Les cartes que tu ne vois pas, couleur par couleur :",
    "quiz.perSuit": "Couleur par couleur :",
    "quiz.same.possible": p => `${p.suit} : <strong>possible</strong>. Par exemple ${p.k} cartes ${cardAdj(p.L, p.k)} (${p.pL} points) et ${p.k} cartes ${cardAdj(p.s, p.k)} (${p.pS} points) : Ouest entame bien ${theColor(p.L)}` +
      (p.tie ? ` (autant de points, mais ${theColor(p.L)} passe après ${theColor(p.s)} dans l'ordre bleu, vert, rouge, jaune)` : "") + ".",
    "quiz.same.short": p => `${p.suit} : <strong>impossible</strong>. Le ${C[p.L]} est la couleur la plus longue d'Ouest : il en a au moins ${p.minL} cartes. Or ` +
      (p.rest === 0 ? `il ne reste aucune carte ${cardAdj(p.s, 1)}` : `il ne reste que ${p.rest} ${S(p.rest, "carte", "cartes")} ${cardAdj(p.s, p.rest)} pour Est et Ouest`) +
      " : pas assez pour en avoir autant.",
    "quiz.same.points": p => `à longueur égale, le ${C[p.s]} aurait plus de points que le ${C[p.L]} (les cartes ${cardAdj(p.s, 2)} qui restent valent ${p.pts} points en tout), et Ouest aurait entamé le ${C[p.s]}`,
    "quiz.same.card": p => `à longueur égale, Ouest aurait aussi une séquence ou une carte ${cardAdj(p.L, 1)} plus petite, et n'aurait pas entamé le ${p.v}`,
    "quiz.same.other": p => `la règle d'entame lui aurait fait jouer une autre carte que le ${p.v} ${C[p.L]}`,
    "quiz.same.or": " ; ou bien ",
    "quiz.same.rule": p => `${p.suit} : <strong>impossible</strong>. Il reste assez de cartes ${cardAdj(p.s, 2)}, mais ${p.parts}.`,
    "quiz.total": p => `En tout, Ouest peut avoir <strong>${p.totalTxt}</strong> ${S(p.total, "main différente qui respecte", "mains différentes qui respectent")} la règle d'entame.
        La réponse à la question est oui dans <strong>${p.yesTxt}</strong> d'entre elles${p.maybe ? ` et non dans ${p.noTxt}` : ""}.`,
    "quiz.ex.yes": "Une main possible d'Ouest où la réponse est oui :",
    "quiz.ex.no": "Une main possible d'Ouest où la réponse est non :",
    "quiz.ex.any": "Par exemple, Ouest pourrait avoir :",
    "quiz.goodAnswer": p => `La bonne réponse : ${p.answer.toLowerCase()}.`,
    "quiz.follow.result": p => (p.list.length > 1 ? "Les couleurs possibles : " : "La seule couleur possible : le ") + p.list.map(s => C[s]).join(", ") + ". Le détail est ci-dessous.",
    /* ---------- Mon compte ---------- */
    "account.login": "Se connecter",
    "account.me": "Mon compte",
    "account.title": "Mon compte",
    "account.intro": "Kiboo se joue sans compte. Si tu as été <strong>invité</strong>, connecte-toi pour retrouver ta progression, ta collection et ton historique sur tous tes appareils. Entre ton adresse e-mail : tu recevras un lien de connexion, sans mot de passe.",
    "account.email": "Adresse e-mail",
    "account.send": "Recevoir le lien de connexion",
    "account.sending": "Envoi en cours…",
    "account.sent": p => `C'est envoyé ! Ouvre l'e-mail reçu sur ${p.email} et clique sur le lien : tu reviendras ici, connecté. Pense à regarder dans les courriers indésirables.`,
    "account.notInvited": p => `Cette adresse n'a pas été invitée : l'accès aux comptes se fait sur invitation. Pour en recevoir une, écris à ${p.mail}.`,
    "account.ask": p => `Pas encore de compte ? Envoie un e-mail à <a href="mailto:${p.mail}?subject=Invitation%20Kiboo">${p.mail}</a> pour recevoir un lien de création de compte.`,
    "account.rate": "Trop de demandes d'un coup : attends une minute, puis réessaie.",
    "account.error": p => `Un problème est survenu : ${p.msg}`,
    "account.loadError": "Impossible de joindre le service des comptes. Vérifie ta connexion internet.",
    "account.linkError": "Le lien de connexion n'est plus valable (il ne sert qu'une fois et expire au bout d'une heure). Demandes-en un nouveau.",
    "account.elsewhere": p => `Les comptes fonctionnent sur le site de Kiboo : <a href="${p.url}">${p.url}</a>`,
    "account.connected": p => `Tu es connecté avec <strong>${p.email}</strong>. Ta sauvegarde suit ton compte.`,
    "account.pseudo": "Pseudo",
    "account.save": "Enregistrer",
    "account.saved": "C'est enregistré.",
    "account.syncing": "Synchronisation en cours…",
    "account.synced": p => `Sauvegardé à ${p.when}.`,
    "account.syncError": "La synchronisation n'a pas marché. Elle sera retentée plus tard.",
    "account.syncNow": "Sauvegarder maintenant",
    "account.logout": "Se déconnecter",
    "account.loggedOut": "Tu es déconnecté. Tu peux continuer à jouer sans compte.",
    "account.delete": "Supprimer mon compte et mes données",
    "account.deleteConfirm": "Supprimer ton compte et toutes les données enregistrées en ligne ? Cette action est définitive. (Ce qui est dans ce navigateur reste, pour continuer à jouer sans compte.)",
    "account.deleted": "Ton compte et tes données en ligne ont été supprimés.",
    "account.privacyTitle": "Confidentialité : ce qui est enregistré",
    "account.privacy": `<ul>
        <li><strong>Ton adresse e-mail</strong>, pour la connexion.</li>
        <li><strong>Ton pseudo</strong>, si tu en choisis un.</li>
        <li><strong>Ta sauvegarde</strong> : progression, collection, historique d'évaluation et réglages.</li>
        <li><strong>Un journal de jeu</strong> : donnes jouées, réponses aux questions et aux exercices, scores, pour adapter Kiboo à ta façon de jouer.</li>
      </ul>
      <p>Ces données sont hébergées par Supabase, en Europe (Londres). Elles ne servent qu'à Kiboo, ne sont ni vendues ni partagées, et il n'y a pas de publicité. Toi seul peux lire tes données ; l'organisatrice de Kiboo peut voir les statistiques pour améliorer le jeu. Tu peux tout supprimer à tout moment avec le bouton ci-dessous.</p>`,
    /* ---------- Accueil, familles et personnages ---------- */
    "head.parade": "Parade",
    "setup.music": "Musique",
    "setup.sfx": "Bruitages",
    "intro.parade": "La parade de Kiboo",
    "intro.music": "Musique",
    "intro.pause": "Pause",
    "intro.resume": "Reprendre",
    "intro.paradeEnd": "Et voilà ! Les quarante personnages de Kiboo t'ont dit bonjour. Maintenant, on joue ?",
    "intro.play": "Jouer",
    "intro.playHelp": "Jouer avec l'aide de Goat",
    "intro.families": "Les familles",
    "intro.characters": "Les personnages",
    "intro.noShow": "Ne plus afficher l'accueil au démarrage",
    "intro.skip": "Passer",
    "intro.prev": "Précédent",
    "intro.next": "Suivant",
    "intro.back": "Accueil",
    "intro.sound": "Son",
    "intro.reopen": "Revoir l'accueil, les familles et les personnages",
    "intro.famTitle": p => `La famille des ${familyName(p.s)}`,
    "intro.fam.0": "Voici la famille des animaux, en bleu ! Dix animaux, du 1 au 10. La petite souris est le 1, et le lapin est le 10 : c'est le plus fort.",
    "intro.fam.1": "Voici la famille des dinosaures, en vert ! Dix dinosaures, du 1 au 10. Le grand dino violet est le 10 : c'est le plus fort.",
    "intro.fam.2": "Voici la famille des robots, en rouge ! Dix robots, du 1 au 10. Le roi des robots est le 10 : c'est le plus fort.",
    "intro.fam.3": "Voici la famille des métiers, en jaune ! Dix métiers, du 1 au 10 : policier, fée, cow-boy, footballeur, pompière, astronaute… Le 10, la scientifique, est la plus forte.",
    /* ---------- Voix : textes simplifiés lus à voix haute ---------- */
    "setup.voice": "Lire à voix haute",
    "voice.choose": "Voix",
    "voice.auto": "Automatique",
    "voice.none": "Pas de voix française sur cet appareil",
    "voice.test": "Bonjour ! Je suis la voix de Kiboo. On joue ?",
    "voice.stop": "Arrêter",
    "voice.listen": "Écouter",
    "voice.listenAria": "Écouter (version simple, à voix haute)",
    "voice.cheer.ok": "Bravo !|Super !|Génial !|Bien joué !|Excellent !|Tu es trop fort !",
    "voice.cheer.ko": "Pas trop mal !|Presque !|Ce n'est pas grave, on continue !|Pas tout à fait. Regarde la correction.|Tu y es presque !",
    "voice.rules": "Kiboo, c'est un jeu de cartes pour quatre joueurs. Nord et Sud jouent ensemble, contre Est et Ouest. Il y a quarante cartes, de quatre couleurs : bleu, vert, rouge et jaune. Chaque carte a un nombre, de un à dix. Le dix est le plus fort. Chaque joueur a dix cartes. Toi, tu es Sud. Tu joues tes cartes, et aussi celles de ton partenaire Nord. On l'appelle le mort : ses cartes sont posées sur la table, tout le monde les voit. Ouest joue la première carte. Puis chacun pose une carte, à son tour. Il faut jouer la même couleur que la première carte, si tu en as. Sinon, tu joues la carte que tu veux. La plus forte carte de la couleur demandée gagne : on appelle ça un pli. Celui qui gagne le pli joue en premier au pli suivant. À la fin, l'équipe qui a gagné le plus de plis gagne la partie.",
    "voice.help": "Dans les réglages, tu choisis qui joue à chaque place : toi, ou un robot. Tu peux choisir la vitesse des robots. Tu peux demander des questions pendant la partie : toutes les trois bonnes réponses, tu gagnes un cadeau. Le carré de Coco t'aide à compter les cartes. Clique sur Nouvelle donne pour commencer une partie.",
    "voice.ex.count": "Compte tes cartes ! Pour chaque couleur, combien as-tu de cartes, et combien de points ? Les points, c'est l'addition des nombres écrits sur les cartes.",
    "voice.ex.longest": "Quelle est ta couleur la plus longue ? C'est la couleur où tu as le plus de cartes.",
    "voice.ex.legal": "Quelles cartes as-tu le droit de jouer ? Il faut jouer la couleur demandée, si tu en as. Clique sur toutes les bonnes cartes, puis vérifie.",
    "voice.ex.rest": "Regarde ta main et celle du mort. Combien de cartes de chaque couleur ont Est et Ouest ? Chaque couleur a dix cartes en tout.",
    "voice.ex.split": "Ouest a joué la première carte, avec la règle d'entame. Combien de cartes de cette couleur peuvent avoir Ouest et Est ? Coche toutes les réponses possibles.",
    "voice.ex.coco": "Voici le carré de Coco. Chaque ligne et chaque colonne fait dix. Trouve les nombres qui manquent !",
    "voice.q.count": "La partie commence. Compte tes cartes ! Pour chaque couleur, combien as-tu de cartes, et combien de points ?",
    "voice.q.rest0": "Regarde ta main et celle du mort. Combien de cartes de chaque couleur ont Est et Ouest ? Chaque couleur a dix cartes en tout.",
    "voice.q.lead": "Ouest a joué la première carte, avec la règle d'entame. Réfléchis à ce qu'il peut avoir dans sa main, puis choisis ta réponse.",
    "voice.q.split": "Ouest a joué la première carte. Combien de cartes de cette couleur peuvent avoir Ouest et Est ? Coche toutes les réponses possibles.",
    "voice.q.rest1": "Le premier pli est fini. Combien de cartes de chaque couleur restent chez Est et Ouest ? N'oublie pas les cartes déjà jouées.",
    "voice.q.masters": "Clique sur toutes tes cartes maîtresses, dans ta main et chez le mort. Une carte est maîtresse quand Est et Ouest n'ont plus de carte plus forte dans sa couleur.",
    "voice.q.play": "Quelles cartes as-tu le droit de jouer ? Il faut jouer la couleur demandée, si tu en as. Clique sur toutes les bonnes cartes.",
    "voice.q.discard": "Un joueur n'a plus de cartes de la couleur demandée. Combien de cartes de cette couleur avait chaque joueur au début ? Commence par Ouest.",
    /* ---------- Carré de Coco ---------- */
    "setup.coco": "Carré de Coco",
    "setup.coco.off": "Non",
    "setup.coco.manual": "Je le remplis",
    "setup.coco.goat": "Goat (automatique)",
    "goat.title": "Le carré de Coco, mode Goat",
    "goat.intro": "Goat remplit le carré tout seul pendant la donne et explique chaque déduction : défausses, totaux à 10, cartes déjà jouées et règle d'entame. En jaune : ce qu'il vient de trouver. « 3–6 » : entre 3 et 6, ce qui est encore possible.",
    "goat.why": "Les déductions de Goat (la plus récente en haut) :",
    "goat.trick": p => `Pli ${p.n}`,
    "goat.start": p => `Début de la donne : Nord (le mort) et Sud (ta main) sont comptés. Ouest et Est ont ensemble ${p.rest.map((n, s) => `${n} ${S(n, "carte", "cartes")} ${cardAdj(s, n)}`).join(", ")}.`,
    "goat.void": p => `${seatName(p.seat)} ne fournit pas en ${C[p.s]} (il défausse le ${cardName(p.card)}) : il n'en a plus. ` +
      (p.n ? `Il en a joué ${p.n} (${p.cards.join(", ")}) : il avait donc <strong>${p.n}</strong> ${S(p.n, "carte", "cartes")} ${cardAdj(p.s, p.n)} au départ.` : `Il n'en avait <strong>aucune</strong> au départ.`),
    "goat.bound.row": p => { const t = p.cells.reduce((a, c) => a + c.n, 0); return `Ligne ${C[p.s]} : il reste ${10 - p.known.reduce((a, b) => a + b, 0)} ${S(t, "carte", "cartes")} ${cardAdj(p.s, t)} pour ${p.cells.map(c => seatName(c.seat)).join(" et ")}, et ${S(p.cells.length, "il en a", "ils en ont")} déjà joué ${t} : ${p.cells.map(c => `<strong>${c.n}</strong> chez ${seatName(c.seat)}`).join(", ")}, il n'y en a pas d'autres.`; },
    "goat.bound.col": p => `Colonne ${seatName(p.seat)} : ses cartes connues et celles déjà jouées font déjà 10 : ${p.cells.map(c => `<strong>${c.n}</strong> ${S(c.n, "carte", "cartes")} ${cardAdj(c.s, c.n)}`).join(", ")}.`,
    "goat.lead": p => `${seatName("O")} entame le ${cardName(p.card)} en suivant la règle d'entame : le ${C[p.L]} est sa couleur la plus longue, il en a donc <strong>au moins 3</strong> (10 cartes pour 4 couleurs). En passant en revue ses ${p.n.toLocaleString("fr-FR")} mains possibles, Ouest avait au départ : ${p.ranges.map(([a, b], s) => `${a === b ? `<strong>${a}</strong>` : `${a} à ${b}`} ${S(b, "carte", "cartes")} ${cardAdj(s, b)}`).join(", ")}.`,
    "goat.rule": p => `${p.lead ? "Avec la règle d'entame et les cartes déjà jouées" : "Avec les cartes déjà jouées"}, toutes les mains possibles d'Ouest (${p.n.toLocaleString("fr-FR")}) donnent la même valeur : ${p.cells.map(c => `<strong>${c.v}</strong> ${S(c.v, "carte", "cartes")} ${cardAdj(c.s, c.v)} chez ${seatName(c.seat)}`).join(", ")}.`,
    "goat.none": "Pas encore de déduction : Goat attend qu'un défenseur ne fournisse pas.",
    "goat.done": "Le carré est complet : Goat connaît toute la distribution de départ !",
    "ex.tab.coco": "Carré de Coco",
    "coco.title": "Le carré de Coco",
    "coco.intro": "Au départ, chaque joueur a <strong>10 cartes</strong>, et chaque couleur a aussi <strong>10 cartes</strong>. Dans le carré de Coco, chaque case donne le nombre de cartes d'une couleur (la ligne) chez un joueur (la colonne) au départ de la donne : chaque ligne et chaque colonne font donc <strong>10</strong>. Complète les cases vides.",
    "coco.levels": "Niveau",
    "coco.level.easy": "Facile",
    "coco.level.medium": "Moyen",
    "coco.level.table": "Comme à la table",
    "coco.table.intro": "Comme à la table : tu connais ta main (Sud) et le mort (Nord), leurs colonnes sont remplies. Pendant la donne, tu as appris que :",
    "coco.clue": p => `${p.seat} avait <strong>${p.n}</strong> ${S(p.n, "carte", "cartes")} ${cardAdj(p.s, p.n)} au départ.`,
    "coco.total": "Total",
    "coco.aria": p => `${p.seat}, cartes ${cardAdj(p.s, 2)}`,
    "coco.showTotals": "Afficher les totaux pendant que je remplis",
    "coco.legend": "Cases bleues : données. Les totaux se remplissent pendant que tu écris : ils deviennent verts à 10.",
    "coco.ok": "Bravo, le carré de Coco est complet !",
    "coco.wrong": p => `Pas tout à fait : ${p.n} ${S(p.n, "case", "cases")} à revoir (en rouge, la bonne réponse).`,
    "coco.steps": "Comment déduire les cases, dans l'ordre :",
    "coco.step.row": p => `Ligne ${C[p.s]} : 10 − ${p.others.join(" − ")} = <strong>${p.v}</strong> ${S(p.v, "carte", "cartes")} ${cardAdj(p.s, p.v)} chez ${seatName(p.seat)}.`,
    "coco.step.col": p => `Colonne ${seatName(p.seat)} : 10 − ${p.others.join(" − ")} = <strong>${p.v}</strong> ${S(p.v, "carte", "cartes")} ${cardAdj(p.s, p.v)}.`,
    "coco.game.intro": "Nord et Sud sont remplis d'office (le mort et ta main). Remplis Ouest et Est au fur et à mesure de la donne : quand un défenseur ne fournit pas, il avait autant de cartes de la couleur qu'il en a jouées, et les totaux à 10 font le reste.",
    "coco.game.check": "Vérifier ce qui est sûr",
    "coco.game.result": p => `${p.ok} ${S(p.ok, "case juste", "cases justes")}, ${p.ko} ${S(p.ko, "fausse", "fausses")}, ${p.unsure} pas encore ${S(p.unsure, "sûre", "sûres")}` +
      (p.todo ? `, et ${p.todo} ${S(p.todo, "case", "cases")} que tu peux déjà trouver (en jaune).` : "."),
    "coco.game.legend": "Vert : juste. Rouge : faux. Pointillés : on ne peut pas encore en être sûr. Jaune : déjà déductible, à toi de la remplir.",
    "coco.game.end": p => `Fin de la donne : voici le vrai carré de Coco. Tu avais ${p.ok} ${S(p.ok, "case juste", "cases justes")} sur 8.`,

    /* ---------- Questions : modes, fin de pli, cartes restantes, répartitions, cartes maîtresses ---------- */
    "setup.quiz.off": "Aucune",
    "setup.quiz.light": "Quelques-unes",
    "setup.quiz.all": "Toutes (entraînement)",
    "btn.nextTrick": "Pli suivant",
    "btn.endDeal": "Fin de la donne",
    "status.holdHint": " Regarde bien les cartes, puis clique sur « Pli suivant ».",
    "ex.tab.rest": "Cartes restantes",
    "ex.tab.split": "Répartition de l'entame",
    "quiz.title.trick1": "Question : après le premier pli",
    "quiz.title.trick3": "Question : après le troisième pli",
    "quiz.title.discard": "Question : une défausse",
    "rest.intro.game": "La donne commence. Voici ta main et celle du mort.",
    "rest.intro.game1": "Le premier pli est terminé. Te souviens-tu des cartes jouées ?",
    "rest.intro.before": "Voici ta main (Sud) et celle du mort (Nord), avant l'entame.",
    "rest.intro.trick": p => `Le premier pli vient d'être joué : ${p.list}.`,
    "rest.q.before": "Combien de cartes de chaque couleur ont <strong>Est et Ouest</strong> à eux deux ?",
    "rest.q.after": "Combien de cartes de chaque couleur restent dans les mains d'<strong>Est et Ouest</strong> à eux deux ? Pense aux cartes déjà jouées.",
    "rest.col": "Chez Est et Ouest",
    "rest.aria": p => `Cartes ${cardAdj(p.s, 2)} chez Est et Ouest`,
    "rest.fix": p => `10 − ${p.me} (ta main) − ${p.dummy} (le mort)` +
      (p.gone.length ? ` − ${p.gone.length} (${S(p.gone.length, "déjà jouée", "déjà jouées")} : ${p.gone.join(", ")})` : "") + ` = ${p.rest}`,
    "split.q": p => `Il reste <strong>${p.rest}</strong> ${S(p.rest, "carte", "cartes")} ${cardAdj(p.L, p.rest)} pour Ouest et Est, le ${p.v} entamé compris. Comment peuvent-elles être <strong>réparties</strong> ? Coche toutes les répartitions possibles.`,
    "split.choice": p => `Ouest ${p.w} – Est ${p.e}`,
    "split.result": p => (p.list.length > 1 ? "Les répartitions possibles : " : "La seule répartition possible : ") + p.list.join(" ; ") + ". Le détail est ci-dessous.",
    "split.detail": "Répartition par répartition :",
    "split.possible": p => `${p.label} : <strong>possible</strong> (${p.nTxt} ${S(p.n, "main d'Ouest respecte", "mains d'Ouest respectent")} la règle d'entame).`,
    "split.none": p => `${p.label} : <strong>impossible</strong> avec les cartes que tu vois.`,
    "split.short": p => `${p.label} : <strong>impossible</strong>. Avec seulement ${p.w} ${S(p.w, "carte", "cartes")} ${cardAdj(p.L, p.w)}, Ouest aurait forcément une couleur plus longue` +
      (p.pigeon ? ` (il lui resterait ${10 - p.w} cartes pour trois couleurs)` : "") + `, et il l'aurait entamée.`,
    "split.card": p => `la règle d'entame lui aurait fait jouer une autre carte ${cardAdj(p.L, 1)} que le ${p.v}`,
    "split.suit": p => `il aurait une autre couleur aussi longue avec plus de points que le ${C[p.L]}, et il l'aurait entamée`,
    "split.rule": p => `${p.label} : <strong>impossible</strong>. Le ${C[p.L]} pourrait être sa couleur la plus longue, mais ${p.parts}.`,
    "split.example": p => `Par exemple, une main possible d'Ouest (${p.label}) :`,
    "masters.q": "Clique sur <strong>toutes les cartes maîtresses</strong> de ta main et du mort, puis vérifie. Une carte est maîtresse quand Est et Ouest n'ont plus aucune carte plus forte dans sa couleur. Regarde ta main et le mort <strong>ensemble</strong> : avec 10 9 8 3 au mort et 7 6 4 dans ta main, si Est et Ouest n'ont plus que le 5, le 2 et le 1, les maîtresses sont 10 9 8 7 6.",
    "masters.none": "Aucune carte n'était maîtresse. ",
    "masters.rule": "Pour savoir si une carte est maîtresse, il faut se souvenir des cartes plus fortes déjà jouées : les autres sont encore chez Est et Ouest, sauf celles de ta main et du mort.",
    "masters.suit": p => `${p.suit} : ` +
      (p.top ? `la plus forte carte encore chez Est et Ouest est le <strong>${p.top}</strong>` : `Est et Ouest n'ont plus de cartes ${cardAdj(p.s, 2)}`) +
      (p.gone.length ? ` (déjà ${S(p.gone.length, "jouée", "jouées")} : ${p.gone.join(", ")})` : " (aucune carte jouée)") +
      (p.masters.length ? `. ${S(p.masters.length, "Maîtresse", "Maîtresses")} : ${p.masters.join(", ")}.` : ". Aucune maîtresse."),
    "discard.intro": p => `${p.who[0].toUpperCase() + p.who.slice(1)} ne fournit pas en ${p.suit} : il défausse le <strong>${p.card}</strong>.`,
    "discard.q": p => `Comment le ${p.suit} était-il <strong>réparti au départ</strong> ? Donne le nombre de cartes de chaque joueur, en commençant par Ouest (par exemple 4-3-2-1).`,
    "discard.hint": "Il n'a plus de cartes de cette couleur : il en avait autant qu'il en a jouées.",
    "discard.col.seat": "Joueur",
    "discard.aria": p => `Cartes ${cardAdj(p.s, 2)} de ${p.seat} au départ`,
    "discard.how.me": p => `ta main au départ : ${p.n}`,
    "discard.how.dummy": p => `le mort au départ : ${p.n}`,
    "discard.how.void": p => p.n ? `il n'en a plus et en a joué ${p.n} : ${p.cards.join(", ")}` : "il n'en avait aucune",
    "discard.how.rest": p => `le reste : 10 − ${p.others.join(" − ")} = ${p.n}`,
    "discard.result": p => `La répartition de départ du ${p.suit} : ${p.split} (Ouest, Nord, Est, Sud).`,

    /* ---------- Cadeaux et collection ---------- */
    "gift.next": "Prochain cadeau :",
    "gift.aria": p => `Prochain cadeau : ${p.n} ${S(p.n, "bonne réponse", "bonnes réponses")} sur ${p.goal}`,
    "album.btn": p => `Collection ${p.n}/40`,
    "album.title": "Ma collection",
    "album.close": "Fermer la collection",
    "gift.title": p => `Bravo, ${p.goal} bonnes réponses ! Choisis ton cadeau.`,
    "gift.revealO": "Voir une carte cachée d'Ouest",
    "gift.revealE": "Voir une carte cachée d'Est",
    "gift.collect": "Gagner une carte pour ma collection",
    "gift.won": p => `Nouvelle carte pour ta collection : le <strong>${p.card}</strong> de la famille des ${familyName(p.s)}. ` +
      `Tu as maintenant ${p.n} ${S(p.n, "carte", "cartes")} sur 40` +
      (p.fam === 10 ? `, et la famille des ${familyName(p.s)} est complète !` : ` (${p.fam} sur 10 chez les ${familyName(p.s)}).`),
    "gift.revealed": p => `Carte ${p.seat === "O" ? "d'Ouest" : "d'Est"} révélée : le <strong>${p.card}</strong>. Elle reste visible, entourée de jaune, jusqu'à ce qu'elle soit jouée.`,
    "album.famCount": p => `${p.n} sur 10`,
    "album.missing": p => `${p.card} : pas encore gagnée`,
    "album.complete": "Bravo, ta collection est complète !",
    "album.count": p => `${p.n} ${S(p.n, "carte", "cartes")} sur 40. Gagne-en de nouvelles avec 3 bonnes réponses aux exercices ou aux questions pendant la partie.`,

    /* ---------- Évaluation et progression ---------- */
    "level.0": "Débutant",
    "level.1": "Niveau Piperno",
    "level.2": "Niveau Averell",
    "level.3": "Niveau Averell250",
    "level.4": "Expert",
    "level.who.4": "le jeu parfait",
    "eval.title": "Évaluation",
    "eval.defense": "Le mode évaluation ne fonctionne que quand tu joues en Sud (déclarant). En défense, ton résultat dépend aussi de ton partenaire robot : la comparaison ne serait pas juste.",
    "eval.waiting": p => `Calcul en cours : ${p.who} rejoue ta donne…`,
    "eval.theRobots": "les robots",
    "eval.better": "tu fais mieux",
    "eval.equal": "égalité",
    "eval.more": p => `${p.n} ${S(p.n, "pli", "plis")} de plus`,
    "eval.notCounted": p => `Donne non comptée dans ta progression (${p.replayed ? "donne rejouée" : "aide utilisée : meilleurs coups, jeux ouverts, carte révélée ou Goat"}).`,
    "eval.levelUp": p => `Nouveau niveau : <strong>${p.name}</strong> !${p.card ? ` Tu gagnes le <strong>${p.card}</strong> pour ta collection.` : ""}`,
    "eval.score": p => `Ton score duplicate : <strong>${p.pct} %</strong>`,
    "eval.col.declarer": "Déclarant",
    "eval.col.tricks": "Plis Nord-Sud",
    "eval.col.cmp": "Comparaison",
    "eval.you": "Toi",
    "eval.how": p => `Même donne, mêmes défenseurs. 2 points par robot battu, 1 par égalité, rapportés au maximum de ${p.max} points.`,
    "eval.seeProgress": "Voir ma progression",
    "eval.levelTop": p => `<strong>${p.name}</strong> : le plus haut niveau. Bravo !`,
    "eval.levelNext": p => `<strong>${p.name}</strong>. Pour passer au <strong>${p.next}</strong>, fais au moins aussi bien que ${p.who} sur ${p.needed} des ${p.window} dernières donnes : <strong>${p.progress} sur ${p.needed}</strong> pour l'instant.`,
    "prog.title": "Ma progression",
    "prog.step": p => `<strong>${p.name}</strong> : au moins aussi bien que ${p.who} sur ${p.n} des ${p.of} dernières donnes${p.done ? " ✓" : ` (il en faut ${p.needed} sur ${p.window})`}`,
    "prog.scores": p => `Score duplicate des ${p.n} dernières donnes${p.avg !== null ? ` (moyenne ${p.avg} %)` : ""} :`,
    "prog.aria": p => `Scores : ${p.list}`,
    "prog.col.deal": "Donne",
    "prog.col.score": "Score",
    "prog.empty": "Pas encore de donne évaluée. Joue une donne en Sud (déclarant) avec le mode évaluation : ton score s'affichera à la fin, et ta progression ici.",

    /* ---------- Donner mon avis ---------- */
    "fb.title": "Donner mon avis",
    "fb.intro": "Merci de tester Kiboo ! Ton retour aide à améliorer le jeu.",
    "fb.kinds": "Type de retour",
    "fb.kind.bug": "Un problème",
    "fb.kind.idee": "Une idée",
    "fb.kind.avis": "Mon avis",
    "fb.stars": "Note sur 5",
    "fb.yourNote": "Ta note :",
    "fb.star1": "1 sur 5", "fb.star2": "2 sur 5", "fb.star3": "3 sur 5", "fb.star4": "4 sur 5", "fb.star5": "5 sur 5",
    "fb.message": "Ton message",
    "fb.messagePh": "Ce qui t'a plu, ce qui ne marche pas, ce que tu faisais quand le problème est arrivé…",
    "fb.name": "Ton prénom (facultatif)",
    "fb.auto": "Informations ajoutées automatiquement",
    "fb.copy": "Copier mon avis",
    "fb.github": "Envoyer sur GitHub",
    "fb.hint": "« Copier mon avis » : colle-le ensuite dans un message à la personne qui t'a envoyé le lien. « Envoyer sur GitHub » demande un compte GitHub.",
    "fb.fallbackAria": "Texte de ton avis à copier",
    "fb.copied": "Avis copié. Colle-le dans un message (e-mail, SMS…) à la personne qui t'a envoyé le lien. Merci !",
    "fb.copyFailed": "La copie automatique n'a pas marché : le texte est sélectionné ci-dessous, copie-le avec Ctrl+C (ou un appui long).",
    "fb.ctx.version": "Version",
    "fb.ctx.lang": "Langue",
    "fb.ctx.screen": "Écran",
    "fb.ctx.touch": " (tactile)",
    "fb.ctx.browser": "Navigateur",
    "fb.ctx.players": "Joueurs",
    "fb.ctx.options": "Options",
    "fb.ctx.game": "Partie",
    "fb.opt.open": "jeux ouverts",
    "fb.opt.hints": "meilleurs coups",
    "fb.opt.explain": "explications de Piperno",
    "fb.opt.quiz": "questions pendant la partie",
    "fb.opt.none": "aucune",
    "fb.ctx.over": "donne terminée",
    "fb.ctx.trick": p => `pli ${p.n}, Nord-Sud ${p.ns} - Est-Ouest ${p.eo}`,
    "fb.msg.title": p => `Avis sur Kiboo : ${p.kind.toLowerCase()}`,
    "fb.msg.note": "Note",
    "fb.msg.from": "De",
    "fb.msg.empty": "(pas de message)",
    "fb.issueDefault": "Avis sur Kiboo",

    /* ---------- Règles du jeu (fenêtre) ---------- */
    "rules.title": `Règles de ${K}`,
    "rules.close": "Fermer les règles",
    "rules.body": `
    <p>${K} est un jeu de cartes <strong>inspiré du jeu de bridge</strong>. Il se joue à <strong>4 joueurs</strong>, séparés en <strong>2 équipes</strong> représentées par leur place : <strong>Nord-Sud</strong> contre <strong>Est-Ouest</strong>. Les partenaires sont assis l'un en face de l'autre. Comme le bridge, Kiboo est un <strong>jeu de plis</strong> : un <dfn>pli</dfn> est l'ensemble des quatre cartes jouées à tour de rôle par chacun des quatre joueurs autour de la table.</p>

    <h3>Les cartes</h3>
    <ul>
      <li><strong>40 cartes</strong> : <strong>4 familles</strong> (<span class="fam blue">animaux</span>, <span class="fam green">dinosaures</span>, <span class="fam red">robots</span> et <span class="fam yellow">métiers</span>), représentées par leur couleur (respectivement bleu, vert, rouge et jaune). Chaque carte a une <strong>valeur de 1 à 10</strong> : le <strong>10 est la plus forte</strong> carte, le 1 la plus faible.</li>
      <li>Chaque joueur reçoit <strong>10 cartes</strong>.</li>
    </ul>

    <h3>Le déclarant et le mort</h3>
    <ul>
      <li>Sud est le <dfn>déclarant</dfn>. Il joue ses cartes et aussi celles de son partenaire Nord, appelé le <dfn>mort</dfn>.</li>
      <li>Ouest joue la première carte : c'est la phase d'<dfn>entame</dfn>. Le mort étale alors ses cartes <strong>face visible</strong>, et tout le monde les voit jusqu'à la fin de la donne.</li>
    </ul>

    <h3>La règle d'entame des robots</h3>
    <div id="lead-rule">
      <p>Piperno, Averell et Averell250 choisissent toujours leur entame de la même façon :</p>
      <ol>
        <li>Ils prennent leur <strong>couleur la plus longue</strong>, celle où ils ont le plus de cartes.</li>
        <li>Si deux couleurs ont <strong>autant de cartes</strong>, ils prennent celle qui a le <strong>plus de points</strong> (la somme des valeurs). À points égaux aussi, ils prennent la dernière dans l'ordre bleu, vert, rouge, jaune.</li>
        <li>Dans cette couleur, s'ils ont une <dfn>séquence</dfn> (au moins deux cartes qui se suivent, comme le 7 et le 8), ils jouent la <strong>plus haute carte de la séquence</strong>, mais seulement si cette carte vaut <strong>au moins 7</strong>. S'ils ont plusieurs séquences, ils prennent la plus haute.</li>
        <li>Sans séquence (ou avec une séquence trop petite, comme le 3 et le 4), ils jouent la <strong>plus petite carte</strong> de la couleur.</li>
      </ol>
      <p>Exemples : avec le 2, le 7 et le 8 bleus, ils entament le 8 bleu (séquence 7-8). Avec le 2, le 5 et le 9 bleus, ils entament le 2 bleu (pas de séquence). Avec le 3, le 4 et le 9 bleus, ils entament le 3 bleu (la séquence 3-4 n'atteint pas le 7).</p>
    </div>

    <h3>Le déroulement d'un pli</h3>
    <ul>
      <li>On joue chacun son tour <strong>dans le sens des aiguilles d'une montre</strong> : Ouest, Nord, Est, Sud.</li>
      <li>Le premier joueur du pli choisit librement sa carte. Sa couleur est la <dfn>couleur demandée</dfn> pour le reste du pli.</li>
      <li>Les autres joueurs <strong>doivent fournir</strong> une carte de la couleur demandée s'ils en ont. Sinon, ils jouent n'importe quelle carte : on appelle cette action <dfn>défausser</dfn>.</li>
      <li>Dans cette version, il n'y a <strong>pas d'atout</strong> : la <strong>plus forte carte de la couleur demandée</strong> remporte donc le pli. Une carte d'une autre couleur ne remporte jamais le pli.</li>
      <li>Le joueur qui remporte le pli <strong>joue la première carte du pli suivant</strong>.</li>
    </ul>

    <h3>Qui gagne ?</h3>
    <p>À la fin des 10 plis, l'équipe qui en a <strong>remporté le plus</strong> gagne la donne. À <strong>5 plis partout</strong>, c'est une égalité.</p>

    <h3>Jouer dans ${K}</h3>
    <ul>
      <li>Choisissez qui joue chaque place dans les <strong>réglages</strong> : vous (<strong>Humain</strong>) ou un robot. Les changements s'appliquent à la prochaine donne.</li>
      <li>Quand c'est votre tour, <strong>cliquez sur une carte mise en avant</strong>. Les cartes que vous n'avez pas le droit de jouer sont grisées.</li>
      <li><strong>Rejouer la donne</strong> redistribue les mêmes cartes, pour essayer une autre façon de jouer.</li>
    </ul>`,
  };
})();
