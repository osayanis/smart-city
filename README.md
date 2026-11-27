# One Day, Two Towns

Film 3D interactif pour l'oral d'anglais « Smart city » (BTS CIEL).
Il répond à la dernière question de la fiche : *How to convince people this is beneficial for their way of life?*

On suit **Tom** de son réveil jusqu'au coucher, deux fois :

1. **Dans une ville ordinaire** (grise, polluée), il enchaîne les galères : il se réveille dans une maison froide, attend aux feux rouges, tourne pour trouver une place, mange à côté de poubelles qui débordent, tousse, trouve la mairie fermée et rentre dans une rue au lampadaire cassé. Il a perdu 1 h 02.
2. **On rembobine.** Une onde rose réveille la ville rue après rue.
3. **Dans la smart city**, c'est la même journée, mais cette fois tout s'arrange : chauffage intelligent, feux qui voient les voitures, place de parking indiquée par l'appli, poubelles vidées quand elles sont pleines, démarche en ligne, lampadaires qui s'allument au passage. Un capteur compte sans filmer, et les données sont protégées (RGPD). Il n'a perdu que 14 min.
4. **L'énergie et les déchets** (partie 3, uniquement le côté positif) : on suit la ligne électrique jusqu'à une deuxième carte, une île juste à côté de la ville.
   - **Parc éolien** : des capteurs mesurent le vent chaque seconde, les éoliennes se tournent toutes seules face au vent, et une pièce usée est signalée avant la panne (la camionnette des techniciens part).
   - **Déchèterie** : la carte d'habitant ouvre la barrière ; Tom jette son carton depuis le quai ; chaque benne a un capteur de remplissage et appelle le camion quand elle est pleine ; une benne vide la remplace.
   - **Méthaniseur** : les déchets verts deviennent du gaz, puis de l'électricité, et le reste du compost.
   - **Parc solaire** : la journée défile en accéléré et les panneaux suivent le soleil.
   - **Réseau intelligent** : l'écran du poste montre en direct ce que produisent le vent, le soleil et le biogaz. Le jour, les batteries se chargent ; la nuit, elles rendent l'énergie à la ville. Les points lumineux sur les câbles montrent où va l'énergie.
5. **Conclusion** : le tableau qui compare les deux journées, puis la définition.

En bas de l'écran, la phrase en sous-titre est **ce qu'on dit à l'oral** (en anglais). Tom réagit avec des bulles (😤, BEEP!, cough!), et son téléphone reçoit des notifications.

## Lancer

Ouvrir `index.html` dans Chrome (double-clic). Aucune installation, tout marche hors ligne.
Seules les polices viennent de Google Fonts : sans internet, le navigateur prend des polices système.

## Pendant l'oral

| Touche | Action |
| --- | --- |
| `→` `Espace` ou clic | moment suivant (marche avec une télécommande de présentation) |
| `←` | moment précédent |
| `R` | rejouer le moment affiché |
| `T` | afficher la traduction française sous la phrase (pour répéter) |
| `P` | lecture automatique (pour répéter seul) |
| `M` | son (réveil, klaxon, toux, notifications) |
| `F` | plein écran |
| `Début` / `Fin` | premier / dernier moment |

On peut ouvrir directement un moment avec son numéro : `index.html#18`. La partie 3 commence à `#30`, la conclusion à `#43`.
La souris tourne la caméra (glisser) et zoome (molette) ; le moment suivant remet le bon cadrage.

## Les chiffres

Les minutes perdues par Tom (1 h 02 et 14 min), comme les mégawatts et les pourcentages de la partie 3, viennent **de notre histoire**.
Les deux chiffres réels sont cités avec leur source à l'écran :

- **Pittsburgh** : environ −40 % d'attente aux feux rouges avec les feux Surtrac. Ces chiffres ont été donnés par l'équipe de Carnegie Mellon pour le premier pilote.
- **Dijon** : un objectif de −65 % d'énergie pour l'éclairage, inscrit au contrat OnDijon (2017). C'est un objectif, pas un résultat mesuré.

## Structure

- `index.html` : la page, l'écran titre, le tableau final et la conclusion
- `css/style.css` : le style repris de yanis.pro (polices, couleurs, verre), les sous-titres et les bulles
- `js/city.js` : la ville en Three.js, la maison de Tom, Tom et ses poses, sa voiture, le parking, l'île de l'énergie (éoliennes, panneaux sur trackers, batteries, méthaniseur, déchèterie, camion), l'onde ordinaire → smart, l'heure du jour, la simulation (feux, voitures, bus, camion poubelle, lampadaires) et les 44 moments de l'histoire (tableau `B`)
- `vendor/three.min.js` : Three.js r128

Pour changer une phrase, il suffit de modifier `cap` (anglais) ou `fr` (français) dans le tableau `B` de `js/city.js`.
