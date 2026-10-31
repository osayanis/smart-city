# The City That Listens

Maquette 3D animée d'une ville, pour l'oral d'anglais « Smart city » (BTS CIEL).
Le maire demande trois choses : quels problèmes une smart city règle, comment protéger les données, comment convaincre les habitants. Chacun des 12 lieux de la ville répond à une de ces questions.

## Lancer

Ouvrir `index.html` dans Chrome (double-clic). Aucune installation, tout marche hors ligne.
Seules les polices viennent de Google Fonts : sans internet, le navigateur prend des polices système.

## Pendant l'oral

| Touche | Action |
| --- | --- |
| `→` / `←` | lieu suivant / précédent (marche avec une télécommande de présentation) |
| `S` | passer la ville en mode ordinaire ou smart |
| `N` | notes à dire pour le lieu affiché |
| `A` | simuler une cyberattaque sur la salle des serveurs |
| `C` | carnet : la liste des 12 lieux |
| `F` | plein écran |
| `Échap` | revenir à la vue d'ensemble |

## Structure

- `index.html` : la page et ses textes d'interface
- `css/style.css` : le style, repris de yanis.pro (polices, couleurs, verre)
- `js/city.js` : la ville en Three.js, la simulation (feux, voitures, bus, camion poubelle, lampadaires) et les 12 lieux
- `vendor/three.min.js` : Three.js r128

Les chiffres du tableau de bord sont calculés par la simulation, pas tirés d'une vraie ville.
