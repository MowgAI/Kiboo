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
- `js/solver.js` : accès asynchrone au DDS via un Web Worker (`js/dds-worker.js`)
- `js/images.js` : correspondance carte → image
- `js/game.js` : règles, robots, état de la partie, affichage et réglages
- `assets/cards/` : images des 40 cartes (WebP)

## Le DDS dans Kiboo

`js/dds.js` est un solveur « double-mort » : il calcule le nombre de plis que fera Nord-Sud si les quatre joueurs jouent parfaitement à jeux ouverts. Kiboo s'en sert de trois façons :

- **Robot expert** : à chaque coup, il joue une carte qui maximise les plis de son camp. Il voit toutes les cartes.
- **Montrer les meilleurs coups** : chaque carte jouable du joueur humain affiche le nombre de plis que son camp fera en fin de donne.
- **Bilan de la donne** : en fin de donne, le DDS donne le résultat avec un jeu parfait, et la liste des cartes qui ont coûté des plis avec les meilleures cartes possibles.

Les calculs tournent dans un Web Worker (`js/solver.js`, `js/dds-worker.js`) pour ne pas figer l'interface. Si la page est ouverte en `file://`, Chrome refuse les Workers : Kiboo calcule alors sur le thread principal, avec de petits gels possibles. D'où l'intérêt de `python3 -m http.server`.
