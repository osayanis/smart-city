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

## Mode interactif : le public suit sur son téléphone

```
npm start
```

Le serveur (Node 18 ou plus, aucune dépendance à installer) ouvre le tableau sur `http://localhost:8080` et affiche dans le terminal l'adresse et le QR code des téléphones.
L'ordinateur et les téléphones doivent être sur le **même Wi-Fi**. Au premier lancement, macOS demande d'autoriser les connexions entrantes pour `node` : cliquer sur « Autoriser ».

- **Au tableau** : le QR code est sur l'écran titre ; ensuite, `Q` (ou le bouton 📱 en haut, qui compte les téléphones connectés) l'affiche en grand. Les réactions du public s'envolent à droite, et les résultats des sondages s'affichent en haut à gauche pendant le moment concerné (`V` pour les masquer).
- **Sur les téléphones** : la page suit le tableau moment par moment, avec la phrase dite (et sa traduction en FR), « Dans les coulisses » (comment ça marche) et « Pour vous » (ce que ça change), le temps perdu par Tom, 6 emojis pour réagir, 5 sondages et 2 quiz, puis à la fin un calcul « Et vous ? » du temps perdu par an.
- **Vie privée** : pas de nom ni de compte ; les votes restent en mémoire dans le serveur et disparaissent quand on l'arrête. Seul l'ordinateur qui présente peut changer de moment.
- Si les téléphones n'arrivent pas à se connecter, le Wi-Fi de l'école isole sans doute les appareils : utiliser le partage de connexion d'un téléphone (l'ordinateur et le public dessus), puis relancer `npm start`. Autre port : `PORT=8081 npm start`.

Ouverte directement (double-clic sur `index.html`), la présentation marche toujours, sans la partie téléphone.

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
| `Q` | QR code en grand pour les téléphones (mode interactif) |
| `V` | masquer / afficher les résultats de sondage |

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
- `server.js` : le serveur local (fichiers, synchronisation en direct par Server-Sent Events, votes, réactions)
- `js/live.js` : la partie live du tableau (QR, compteur, réactions, résultats)
- `js/qr.js` : un générateur de QR code fait maison (pas besoin d'internet)
- `js/polls.js` : les sondages et les quiz, et le moment où chacun s'ouvre
- `phone/` : la page des téléphones (`content.js` = les textes « Dans les coulisses » et « Pour vous » de chaque moment)

Pour changer une phrase, il suffit de modifier `cap` (anglais) ou `fr` (français) dans le tableau `B` de `js/city.js`.
