# Kiboo

Le petit bridge, sans atout, à quatre autour de la table.

- 40 cartes : 4 couleurs (bleu, vert, rouge, jaune) numérotées de 1 à 10.
- 10 cartes par joueur, 10 plis. Sud déclarant, Nord le mort, Ouest entame.
- Il faut fournir la couleur demandée ; la plus forte carte de cette couleur gagne le pli.
- La paire qui fait le plus de plis gagne (5-5 = égalité).

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
- `js/exercises.js` : exercices (compter sa main, couleur la plus longue, cartes jouables)
- `js/game.js` : règles, robots, état de la partie, affichage et réglages
- `assets/cards/` : images des 40 cartes (WebP)

## Exercices

Le bouton « Exercices » ouvre trois exercices sur une main de 10 cartes tirée au hasard :

- **Compter sa main** : nombre de cartes et points par couleur, puis total des points. Dans Kiboo, les points d'une couleur sont la somme des valeurs de ses cartes.
- **Couleur la plus longue** : en cas d'égalité, toutes les couleurs les plus longues sont acceptées.
- **Cartes jouables** : une couleur est demandée, il faut sélectionner toutes les cartes autorisées (fournir si possible, sinon défausser n'importe quelle carte).

Chaque réponse est corrigée avec le détail du calcul, et un compteur suit les réussites de la session. Le code est dans `js/exercises.js`.

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
