# Kiboo

Le petit bridge, sans atout, à quatre autour de la table.

- 40 cartes : 4 couleurs (bleu, vert, rouge, jaune) numérotées de 1 à 10.
- 10 cartes par joueur, 10 plis. Sud déclarant, Nord le mort, Ouest entame.
- Il faut fournir la couleur demandée ; la plus forte carte de cette couleur gagne le pli.
- La paire qui fait le plus de plis gagne (5-5 = égalité).

## Jouer en ligne

**https://mowgai.github.io/Kiboo/** (GitHub Pages, branche `main`) : aucun compte ni installation, sur ordinateur ou téléphone.

## Tester et donner son avis

Le bouton « Donner mon avis » ouvre un petit formulaire : type de retour (un problème, une idée, mon avis), note sur 5, message et prénom facultatif. Les informations utiles pour reproduire un problème (version, taille d'écran, navigateur, joueurs, options, pli en cours) sont ajoutées au message et visibles avant l'envoi. Le testeur peut :

- **Copier son avis** et l'envoyer par le moyen de son choix (e-mail, SMS…) ;
- **L'envoyer sur GitHub** : une « issue » pré-remplie s'ouvre dans le dépôt (compte GitHub requis).

## Lancer

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```sh
python3 -m http.server 8000
```

## Structure

- `index.html` : page et table de jeu
- `css/style.css` : styles (thème clair/sombre, responsive)
- `js/dds.js` : solveur « double-mort » (alpha-bêta, cartes équivalentes, table de transposition) ; utilisable aussi sous Node (`require("./js/dds.js")`)
- `js/pimc.js` : Averell, le robot PIMC (Perfect Information Monte Carlo), construit sur le DDS
- `js/solver.js` : accès asynchrone au DDS et au PIMC via un Web Worker (`js/dds-worker.js`)
- `js/images.js` : correspondance carte → image
- `js/i18n.js` : choix de la langue et traduction des textes
- `lang/fr.js`, `lang/en.js`, `lang/it.js` : tous les textes du jeu en français, anglais et italien
- `tools/bump-version.sh` : change le numéro de version des fichiers (`?v=` dans `index.html`) pour que les navigateurs chargent la nouvelle version après une mise à jour ; à lancer avant chaque envoi sur GitHub
- `js/evaluation.js` : mode évaluation (score duplicate), historique et niveaux
- `js/feedback.js` : formulaire « Donner mon avis »
- `js/quiz.js` : questions pendant la partie et moteur de déduction
- `js/rewards.js` : cadeaux, progression et collection
- `js/exercises.js` : exercices (compter sa main, couleur la plus longue, cartes jouables)
- `js/game.js` : règles, robots (la table tourne pour que la place du joueur humain, Sud, Ouest ou Est, soit toujours en bas), état de la partie, affichage et réglages
- `assets/cards/` : images des 40 cartes (WebP)

## Langues

Kiboo existe en français, en anglais et en italien. Le menu en haut de la page change la langue ; le choix est gardé dans le navigateur. À la première visite, Kiboo prend la langue du navigateur (français si elle n'est pas disponible).

Tous les textes sont dans `lang/` : un fichier par langue, avec les mêmes clés. Le français (`lang/fr.js`) sert de référence : si un texte manque dans une langue, c'est le texte français qui s'affiche. Pour relire ou corriger l'italien, il suffit de modifier `lang/it.js` (les petites fonctions en haut du fichier gèrent les accords : « il 7 blu », « l'8 rossa »…). Pour ajouter une langue, copier `lang/en.js`, traduire les textes et ajouter le fichier dans `index.html`.

## Exercices

Le bouton « Exercices » ouvre cinq exercices sur des cartes tirées au hasard :

- **Compter sa main** : nombre de cartes et points par couleur, puis total des points. Dans Kiboo, les points d'une couleur sont la somme des valeurs de ses cartes.
- **Couleur la plus longue** : en cas d'égalité, toutes les couleurs les plus longues sont acceptées.
- **Cartes jouables** : une couleur est demandée, il faut sélectionner toutes les cartes autorisées (fournir si possible, sinon défausser n'importe quelle carte).
- **Cartes restantes** : en voyant sa main et le mort, combien de cartes de chaque couleur ont Est et Ouest ? Une fois sur deux, le premier pli est déjà joué (par des robots Piperno).
- **Répartition de l'entame** : Ouest entame selon la règle de Piperno ; il faut cocher toutes les répartitions possibles de la couleur entamée entre Ouest et Est.

Chaque réponse est corrigée avec le détail du calcul, et un compteur suit les réussites de la session. Le code est dans `js/exercises.js`.

## Questions pendant la partie, cadeaux et collection

Le réglage « Questions pendant la partie » propose trois choix : **Aucune**, **Quelques-unes** (des questions tirées au sort, au moins une par donne) ou **Toutes** (mode entraînement). Les questions ne sont posées que quand le joueur humain est le déclarant (Sud). La partie s'arrête sur la question, puis reprend exactement où elle en était après la réponse (ou « Passer la question ») :

- **Avant l'entame** : compter sa main (cartes et points par couleur, total) ; puis, en voyant sa main et le mort, combien de cartes de chaque couleur ont Est et Ouest.
- **Après l'entame**, quand Ouest est Piperno, Averell ou Averell250 (il suit la règle d'entame) :
  - questions de déduction sur la main cachée d'Ouest (a-t-il autant de cartes dans une autre couleur ? si oui, lesquelles ? une carte plus forte, plus faible dans la couleur d'entame ?), avec les réponses « Oui, forcément », « Non, c'est impossible » ou « On ne peut pas savoir » ;
  - comment les cartes de la couleur entamée peuvent-elles être réparties entre Ouest et Est ? (cocher toutes les répartitions possibles).

  La règle d'entame est affichée pendant la question (un bouton permet de la cacher). La correction passe en revue toutes les mains qu'Ouest peut avoir compte tenu de ce que voit le joueur et de la règle d'entame, sans regarder les vraies cartes, et en montre des exemples.
- **Après le premier pli** : combien de cartes de chaque couleur restent chez Est et Ouest ? Les cartes jouées ne sont pas rappelées : il faut s'en souvenir.
- **Après le troisième pli** : cliquer sur toutes les cartes maîtresses de sa main et du mort (Est et Ouest n'ont plus de carte plus forte dans la couleur).
- **Quand un joueur défausse** (pas à chaque fois) : comment la couleur demandée était-elle répartie au départ, en commençant par Ouest (par exemple 4-3-2-1) ? La question n'est posée que si la réponse est déductible, c'est-à-dire si un défenseur n'a plus la couleur.
- **Avant de jouer** sur un pli commencé (jamais au dernier pli ni quand une seule carte est jouable) : quelles cartes as-tu le droit de jouer ?

Quand un joueur humain est à la table, chaque pli terminé reste affiché jusqu'au clic sur « Pli suivant » (ou sur la table), pour avoir le temps de retenir les cartes jouées.

Toutes les 3 bonnes réponses (cumulées, exercices compris), le joueur choisit un cadeau : voir une carte cachée d'Ouest ou d'Est (pendant une partie), ou gagner une carte pour sa collection. Le bouton « Collection » montre l'album des 40 cartes. La progression et la collection sont gardées dans le navigateur. Le code est dans `js/quiz.js` et `js/rewards.js`.

## Mode évaluation (score duplicate)

Comme au bridge en tournoi, on compare son résultat à celui d'autres joueurs **sur les mêmes cartes**. Quand Sud est humain et que la case « Mode évaluation » est cochée (par défaut), la donne est rejouée en coulisses avec **Piperno, Averell et Averell250 en déclarant, contre les mêmes défenseurs**. Ces parties fantômes démarrent dès le début de la donne, dans un Worker séparé.

- **Score duplicate** : 2 points par robot battu, 1 par égalité, rapportés au maximum (6 points), en pourcentage. Le résultat avec un jeu parfait (DDS) est affiché pour information.
- **Résultats reproductibles** : le hasard d'Averell (et de PiperRand en défense) est fixé par une graine tirée de la donne ; avec une graine, Averell fait toujours exactement 40 (ou 250) simulations.
- **Historique et niveaux** (bouton « Progression », gardés dans le navigateur) : Débutant, puis Niveau Piperno, Niveau Averell, Niveau Averell250 et Expert, en faisant au moins aussi bien que le robot (ou que le jeu parfait) sur 7 des 10 dernières donnes. Chaque nouveau niveau rapporte une carte pour la collection.
- Une donne n'est **pas comptée** si le joueur a eu de l'aide (meilleurs coups, jeux ouverts, carte révélée) ou s'il l'a rejouée.

Le code est dans `js/evaluation.js`.

## Explications de Piperno

La case « Explications de Piperno » affiche, sous la table, pourquoi Piperno a joué chaque carte : règle d'entame, entame dans sa couleur préférée (plus haute s'il détient la plus forte carte restante, sinon plus petite), plus petite carte qui fait gagner son camp, partenaire déjà maître, fourniture de la plus petite carte ou défausse qui garde sa couleur préférée. Seules les cartes jouées par Piperno sont expliquées (pas celles d'Averell au premier pli).

## Le DDS dans Kiboo

`js/dds.js` est un solveur « double-mort » : il calcule le nombre de plis que fera Nord-Sud si les quatre joueurs jouent parfaitement à jeux ouverts. Kiboo s'en sert de quatre façons :

- **Averell** (robot PIMC) : un robot honnête, qui ne voit que sa main et le mort. À chaque coup, il tire jusqu'à 40 donnes compatibles avec ce qu'il sait (cartes jouées, chicanes révélées), les analyse avec le DDS et joue la carte qui rapporte le plus de plis en moyenne. Au premier pli, il joue comme Piperno, sans simulation.
- **Averell250** : comme Averell, mais avec jusqu'à 250 donnes par coup (budget de 8 s au lieu de 1,5 s). Plus précis, plus lent.
- **Cheater** (robot expert) : à chaque coup, il joue une carte qui maximise les plis de son camp. Il voit toutes les cartes.
- **Montrer les meilleurs coups** : chaque carte jouable du joueur humain affiche le nombre de plis que son camp fera en fin de donne.
- **Bilan de la donne** : en fin de donne, le DDS donne le résultat avec un jeu parfait, et la liste des cartes qui ont coûté des plis avec les meilleures cartes possibles.

Les calculs tournent dans un Web Worker (`js/solver.js`, `js/dds-worker.js`) pour ne pas figer l'interface. Si la page est ouverte en `file://`, Chrome refuse les Workers : Kiboo calcule alors sur le thread principal, avec de petits gels possibles. D'où l'intérêt de `python3 -m http.server`.
