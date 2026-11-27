/* Polls and quizzes for the audience's phones. `beat` is the moment (beat id) where it opens; it stays open for `span` moments.
   A quiz has an `answer`; the board shows the right answer once the story has moved on. Shared by the server, the board and the phones. */
(function (root) {
  'use strict';
  const POLLS = [
    { id: 'traffic', beat: 'town', span: 2,
      q: { en: 'How much time do you lose in traffic, every day?', fr: 'Combien de temps perdez-vous dans les bouchons, chaque jour ?' },
      options: [{ en: 'Less than 10 min', fr: 'Moins de 10 min' }, { en: '10 to 30 min', fr: '10 à 30 min' }, { en: '30 min to 1 hour', fr: '30 min à 1 h' }, { en: 'More than 1 hour', fr: 'Plus d’1 h' }] },
    { id: 'annoying', beat: 'p1-bed', span: 2,
      q: { en: 'In Tom’s day, what would annoy you the most?', fr: 'Dans la journée de Tom, qu’est-ce qui vous énerverait le plus ?' },
      options: [{ en: '🚦 Red lights', fr: '🚦 Les feux rouges' }, { en: '🅿️ Parking', fr: '🅿️ Le parking' }, { en: '🗑️ Full bins', fr: '🗑️ Les poubelles pleines' }, { en: '🏛️ Town hall hours', fr: '🏛️ Les horaires de la mairie' }, { en: '💡 The dark street', fr: '💡 La rue sombre' }] },
    { id: 'sensor', beat: 'p2-sensor', span: 2,
      q: { en: 'Would you accept this sensor in your street?', fr: 'Accepteriez-vous ce capteur dans votre rue ?' },
      options: [{ en: '✅ Yes', fr: '✅ Oui' }, { en: '🤔 Only if the data is deleted', fr: '🤔 Seulement si les données sont effacées' }, { en: '❌ No', fr: '❌ Non' }] },
    { id: 'biogas', beat: 'p3-skip', span: 3, answer: 1,
      q: { en: 'Quiz: what can green waste become?', fr: 'Quiz : que peuvent devenir les déchets verts ?' },
      options: [{ en: 'Only compost', fr: 'Seulement du compost' }, { en: 'Gas, electricity and compost', fr: 'Du gaz, de l’électricité et du compost' }, { en: 'Nothing, it is burnt', fr: 'Rien, on les brûle' }] },
    { id: 'night', beat: 'p3-grid', span: 2, answer: 1,
      q: { en: 'Quiz: at night, where does the town’s energy come from?', fr: 'Quiz : la nuit, d’où vient l’énergie de la ville ?' },
      options: [{ en: '☀️ The solar panels', fr: '☀️ Les panneaux solaires' }, { en: '🔋 The batteries', fr: '🔋 Les batteries' }, { en: '🌙 The moon', fr: '🌙 La lune' }] },
    { id: 'first', beat: 'p3-recap', span: 2,
      q: { en: 'Which smart idea would you want first in your town?', fr: 'Quelle idée voudriez-vous en premier dans votre ville ?' },
      options: [{ en: '🚦 Smart lights', fr: '🚦 Feux intelligents' }, { en: '🅿️ Smart parking', fr: '🅿️ Parking intelligent' }, { en: '🗑️ Smart bins', fr: '🗑️ Poubelles connectées' }, { en: '🏛️ Online town hall', fr: '🏛️ Mairie en ligne' }, { en: '⚡ Smart grid', fr: '⚡ Réseau intelligent' }] },
    { id: 'convinced', beat: 'final', span: 1,
      q: { en: 'So… are you convinced?', fr: 'Alors… vous êtes convaincus ?' },
      options: [{ en: '😍 Yes!', fr: '😍 Oui !' }, { en: '🙂 Partly', fr: '🙂 En partie' }, { en: '🤨 Not yet', fr: '🤨 Pas encore' }] },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = POLLS; else root.POLLS = POLLS;
})(typeof window !== 'undefined' ? window : globalThis);
