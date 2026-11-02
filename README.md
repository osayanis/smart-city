# The City That Listens

Maquette 3D animée d'une ville, pour l'oral d'anglais « Smart city » (BTS CIEL).
Elle répond surtout à la dernière question de la fiche : *How to convince people this is beneficial for their way of life?*

- La ville commence **ordinaire** : grise, dans le smog, bouchons, bacs pleins, lampadaires allumés pour rien.
- La touche `S` la **réveille** : une onde part de l'endroit regardé et rallume la ville quartier par quartier (couleurs, air propre, feux et lampadaires intelligents, données protégées). On voit la frontière entre les deux villes avancer.
- Le fil rouge est **la journée d'un habitant**, de 7h30 à 22h30, avec la lumière du jour qui change. Chaque moment compare *Today* et *Smart town*, puis dit ce que ça change pour lui. Le dernier moment donne la réponse : cinq façons de convaincre les gens.

## Lancer

Ouvrir `index.html` dans Chrome (double-clic). Aucune installation, tout marche hors ligne.
Seules les polices viennent de Google Fonts : sans internet, le navigateur prend des polices système.

## Pendant l'oral

| Touche | Action |
| --- | --- |
| `→` / `←` | moment suivant / précédent (marche avec une télécommande de présentation) |
| `S` | réveiller la ville (ou la rendormir) |
| `N` | notes à dire pour le moment affiché |
| `A` | simuler une cyberattaque sur la salle des serveurs |
| `C` | carnet : les 11 moments de la journée |
| `F` | plein écran |
| `Échap` | revenir à la vue d'ensemble |

## Structure

- `index.html` : la page et ses textes d'interface
- `css/style.css` : le style, repris de yanis.pro (polices, couleurs, verre)
- `js/city.js` : la ville en Three.js, l'onde ordinaire → smart, l'heure du jour, la simulation (feux, voitures, bus, camion poubelle, lampadaires) et les 11 moments
- `vendor/three.min.js` : Three.js r128

Les chiffres du tableau de bord sont calculés par la simulation, pas tirés d'une vraie ville.
