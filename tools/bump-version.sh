#!/bin/sh
# Change le numéro de version de tous les fichiers chargés par index.html.
# Les navigateurs (et GitHub Pages, qui met les fichiers en cache 10 minutes)
# téléchargent alors forcément les nouveaux fichiers après une mise à jour.
# Usage : tools/bump-version.sh [version]   (par défaut : date et heure)
set -e
cd "$(dirname "$0")/.."
v="${1:-$(date -u +%Y-%m-%d-%H%M)}"
sed -i -E "s/\?v=[0-9A-Za-z.-]+\"/?v=$v\"/g; s/KIBOO_VERSION = \"[^\"]*\"/KIBOO_VERSION = \"$v\"/" index.html
echo "Version : $v"
