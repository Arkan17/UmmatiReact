// Prophets Adam → Ismail (AS). Sources: the Quran, sahih hadith and Ibn Kathir's Qasas al-Anbiya.
// Scenes never show people, prophets or angels — only places, objects, animals, light and weather.
import type { ComicAnim, ComicProp, ComicPropKind, ProphetStory } from '../types';

const p = (kind: ComicPropKind, x: number, y: number, scale = 1, anim: ComicAnim = 'none', flip = false): ComicProp =>
  ({ kind, x, y, scale, anim, flip });

export const groupA: ProphetStory[] = [
  // ---------------------------------------------------------------- ADAM
  {
    id: 'adam',
    prophet: 'Prophet Adam',
    arabic: 'آدم',
    title: 'The First Human',
    tagline: 'How it all began — and the first "sorry" ever said.',
    tint: '#8FD1B0',
    cover: { sky: 'golden', ground: 'garden', props: [p('tree', 0.25, 0.8, 1.1, 'sway'), p('flower', 0.6, 0.82, 0.5, 'sway'), p('light', 0.5, 0.6, 1.2, 'pulse'), p('sparkles', 0.75, 0.35, 0.6, 'twinkle')] },
    panels: [
      {
        scene: { sky: 'golden', ground: 'none', props: [p('light', 0.5, 0.75, 1.3, 'pulse'), p('sparkles', 0.2, 0.35, 0.6, 'twinkle'), p('sparkles', 0.8, 0.4, 0.5, 'twinkle'), p('cloud', 0.15, 0.3, 0.6, 'drift')] },
        caption: 'Long, long ago, before there were any people on earth, Allah told the angels about a wonderful plan.',
        quran: { text: 'Indeed, I will make upon the earth a successive authority (khalifah).', ref: 'Al-Baqarah 2:30' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('rock', 0.3, 0.82, 0.6), p('jar', 0.62, 0.82, 0.5), p('sparkles', 0.5, 0.45, 0.8, 'twinkle'), p('sun', 0.85, 0.3, 0.5, 'spin')] },
        caption: 'Allah created Adam (AS) from clay, gathered from every kind of soil on earth — red, white, black and brown. That is why people come in so many beautiful colours! Then Allah breathed life into him.',
      },
      {
        scene: { sky: 'golden', ground: 'none', props: [p('scroll', 0.3, 0.75, 0.7, 'bob'), p('tablet', 0.7, 0.75, 0.6, 'bob'), p('sparkles', 0.5, 0.35, 0.7, 'twinkle'), p('light', 0.5, 0.8, 0.9, 'pulse')] },
        caption: 'Allah taught Adam (AS) the names of all things — the trees, the animals, the stars. The angels did not know these names, but Adam (AS) could tell them every one!',
        quran: { text: 'And He taught Adam the names — all of them.', ref: 'Al-Baqarah 2:31' },
      },
      {
        scene: { sky: 'golden', ground: 'none', props: [p('light', 0.5, 0.8, 1.2, 'pulse'), p('sparkles', 0.2, 0.4, 0.6, 'spin'), p('sparkles', 0.8, 0.4, 0.6, 'spin'), p('star', 0.5, 0.25, 0.4, 'twinkle')] },
        caption: 'Allah commanded the angels to bow down to Adam (AS) as a sign of honour. All the angels obeyed at once.',
      },
      {
        scene: { sky: 'dark', ground: 'none', action: true, props: [p('fire', 0.5, 0.8, 1.0, 'flicker'), p('lightning', 0.2, 0.5, 0.6, 'twinkle'), p('lightning', 0.82, 0.5, 0.5, 'twinkle')] },
        caption: 'But Iblis, who was made from fire, refused! He was full of pride and thought he was better than Adam (AS).',
        bubble: { speaker: 'Iblis', text: 'I am better than him! You made me from fire and him from clay.' },
        sfx: 'HMPH!',
      },
      {
        scene: { sky: 'day', ground: 'garden', props: [p('tree', 0.2, 0.8, 1.0, 'sway'), p('palm', 0.8, 0.8, 1.0, 'sway', true), p('spring', 0.5, 0.84, 0.6), p('flower', 0.38, 0.84, 0.4, 'sway'), p('birds', 0.6, 0.35, 0.5, 'fly')] },
        caption: 'Allah gave Adam (AS) and his wife Hawwa a home in Jannah — a garden with rivers, sweet fruits and endless shade. They could eat from anything they liked… except one tree.',
        quran: { text: 'Eat from it in abundance from wherever you will, but do not approach this tree.', ref: 'Al-Baqarah 2:35' },
      },
      {
        scene: { sky: 'dusk', ground: 'garden', props: [p('tree', 0.5, 0.8, 1.3, 'sway'), p('snake', 0.2, 0.84, 0.5, 'sway'), p('wind', 0.8, 0.45, 0.6, 'drift')] },
        caption: 'Shaytan was jealous. He whispered to them again and again, tricking them into thinking the tree would make them live forever.',
        sfx: 'pssst…',
      },
      {
        scene: { sky: 'dusk', ground: 'garden', props: [p('tree', 0.35, 0.8, 1.2, 'shake'), p('flower', 0.75, 0.84, 0.4), p('heart', 0.72, 0.5, 0.4, 'pulse')] },
        caption: 'They forgot Allah\'s warning and ate from the tree. Straight away they felt sorry, and they turned to Allah with tears.',
        bubble: { speaker: 'Adam & Hawwa', text: 'Our Lord, we have wronged ourselves. If You do not forgive us, we will be lost!' },
      },
      {
        scene: { sky: 'golden', ground: 'none', props: [p('heart', 0.5, 0.7, 0.8, 'pulse'), p('light', 0.5, 0.85, 1.1, 'pulse'), p('sparkles', 0.25, 0.4, 0.5, 'twinkle'), p('sparkles', 0.75, 0.4, 0.5, 'twinkle')] },
        caption: 'Allah, the Most Merciful, forgave them. Saying sorry sincerely is always the way back to Allah!',
        quran: { text: 'Then Adam received from his Lord words, and He accepted his repentance. Indeed, He is the Accepting of repentance, the Merciful.', ref: 'Al-Baqarah 2:37' },
      },
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('mountain', 0.75, 0.8, 1.2), p('sun', 0.3, 0.45, 0.6, 'rise'), p('tree', 0.15, 0.8, 0.7, 'sway'), p('sheep', 0.5, 0.82, 0.4)] },
        caption: 'Then Allah sent Adam (AS) and Hawwa down to earth to live, work and worship Him. Adam (AS) became the very first prophet, teaching his children to love Allah.',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('crow', 0.5, 0.75, 0.6, 'bob'), p('rock', 0.25, 0.82, 0.5), p('footprints', 0.7, 0.85, 0.5)] },
        caption: 'Years later, one of Adam\'s sons, out of jealousy, hurt his brother. Allah sent a crow scratching the ground to show him what to do. He felt deep regret — a lesson that jealousy leads to sorrow.',
        quran: { text: 'Then Allah sent a crow searching in the ground to show him how to hide the body of his brother.', ref: 'Al-Ma\'idah 5:31' },
      },
    ],
    lessons: [
      'Pride ruined Iblis — be humble, never think you are better than others.',
      'Everyone makes mistakes; the best people say sorry to Allah quickly.',
      'Allah gave humans knowledge and honour, so use it to do good.',
    ],
    sources: ['Al-Baqarah 2:30-39', 'Al-A\'raf 7:11-27', 'Ta-Ha 20:115-123', 'Al-Ma\'idah 5:27-31'],
  },

  // ---------------------------------------------------------------- IDRIS
  {
    id: 'idris',
    prophet: 'Prophet Idris',
    arabic: 'إدريس',
    title: 'The Truthful Prophet',
    tagline: 'A prophet raised to a high place.',
    tint: '#AEB6EE',
    cover: { sky: 'night', ground: 'grass', props: [p('moon', 0.75, 0.35, 0.6, 'bob'), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('scroll', 0.45, 0.82, 0.6), p('lamp', 0.65, 0.82, 0.4, 'flicker')] },
    panels: [
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('house', 0.3, 0.8, 0.8), p('tree', 0.75, 0.8, 0.8, 'sway'), p('sun', 0.6, 0.45, 0.5, 'rise')] },
        caption: 'Many generations after Adam (AS), Allah sent Prophet Idris (AS). The Quran tells us only a little about him — but every word is special.',
      },
      {
        scene: { sky: 'golden', ground: 'none', props: [p('light', 0.5, 0.8, 1.1, 'pulse'), p('star', 0.25, 0.35, 0.4, 'twinkle'), p('star', 0.78, 0.3, 0.35, 'twinkle')] },
        caption: 'Allah describes him as a man of complete truthfulness, who never lied.',
        quran: { text: 'And mention in the Book, Idris. Indeed, he was a man of truth and a prophet.', ref: 'Maryam 19:56' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('scroll', 0.35, 0.82, 0.8), p('lamp', 0.68, 0.82, 0.5, 'flicker'), p('sparkles', 0.5, 0.4, 0.5, 'twinkle')] },
        caption: 'Some scholars say Idris (AS) was among the first people to write with a pen. He taught people to remember Allah and to be fair to one another.',
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('wheat', 0.25, 0.82, 0.6, 'sway'), p('wheat', 0.4, 0.82, 0.5, 'sway'), p('tree', 0.75, 0.8, 0.8, 'sway'), p('cloud', 0.5, 0.3, 0.6, 'drift')] },
        caption: 'He was very patient, working hard and worshipping Allah through good days and hard days.',
        quran: { text: 'And Ismail and Idris and Dhul-Kifl — all were of the patient.', ref: 'Al-Anbiya 21:85' },
      },
      {
        scene: { sky: 'night', ground: 'none', props: [p('light', 0.5, 0.85, 1.2, 'pulse'), p('star', 0.2, 0.3, 0.4, 'twinkle'), p('star', 0.8, 0.25, 0.4, 'twinkle'), p('moon', 0.7, 0.45, 0.5, 'bob'), p('sparkles', 0.35, 0.5, 0.5, 'spin')] },
        caption: 'Allah honoured Idris (AS) greatly. On the Night Journey, Prophet Muhammad ﷺ met him in the fourth heaven, where he welcomed him warmly.',
        quran: { text: 'And We raised him to a high station.', ref: 'Maryam 19:57' },
      },
    ],
    lessons: [
      'Always tell the truth — Allah praised Idris for it.',
      'Learning and writing are gifts from Allah.',
      'Patience brings you closer to Allah.',
    ],
    sources: ['Maryam 19:56-57', 'Al-Anbiya 21:85-86', 'Sahih al-Bukhari 3207 (Night Journey)'],
  },

  // ---------------------------------------------------------------- NUH
  {
    id: 'nuh',
    prophet: 'Prophet Nuh',
    arabic: 'نوح',
    title: 'The Great Ark',
    tagline: 'A ship in the desert, and a flood like no other.',
    tint: '#9DC3E6',
    cover: { sky: 'storm', ground: 'flood', action: true, props: [p('ark', 0.5, 0.78, 1.3, 'sway'), p('lightning', 0.2, 0.4, 0.6, 'twinkle'), p('rain', 0.5, 0.6, 1.2), p('cloud', 0.8, 0.3, 0.7, 'drift')] },
    panels: [
      {
        scene: { sky: 'day', ground: 'city', props: [p('idol', 0.3, 0.82, 0.6), p('idol', 0.45, 0.82, 0.5), p('idol', 0.6, 0.82, 0.55), p('sun', 0.85, 0.3, 0.5)] },
        caption: 'After Adam (AS), people slowly forgot Allah. They made statues named Wadd, Suwa\', Yaghuth, Ya\'uq and Nasr — and began to worship them.',
        quran: { text: 'And they said: never leave your gods, and never leave Wadd or Suwa\' or Yaghuth and Ya\'uq and Nasr.', ref: 'Nuh 71:23' },
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('house', 0.25, 0.8, 0.7), p('house', 0.7, 0.8, 0.8), p('sun', 0.5, 0.45, 0.5, 'rise')] },
        caption: 'Allah sent Nuh (AS) to guide them. He called them in the morning and at night, in public and in secret.',
        bubble: { speaker: 'Nuh (AS)', text: 'O my people, worship Allah alone! Ask your Lord for forgiveness — He is the Most Forgiving.' },
      },
      {
        scene: { sky: 'night', ground: 'city', props: [p('moon', 0.75, 0.35, 0.6, 'bob'), p('house', 0.3, 0.8, 0.8), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('star', 0.55, 0.2, 0.3, 'twinkle')] },
        caption: 'For 950 years he kept calling! But the people put their fingers in their ears and covered their faces with their clothes so they would not hear.',
        quran: { text: 'And indeed, every time I invited them… they put their fingers in their ears, covered themselves with their garments, and were arrogant.', ref: 'Nuh 71:7' },
        sfx: 'LA LA LA!',
      },
      {
        scene: { sky: 'golden', ground: 'desert', props: [p('light', 0.5, 0.75, 1.1, 'pulse'), p('tree', 0.2, 0.8, 0.8), p('tree', 0.8, 0.8, 0.8)] },
        caption: 'Only a few people believed. Then Allah told Nuh (AS) to build a giant ship — an Ark — right in the middle of dry land!',
        quran: { text: 'And construct the ship under Our eyes and Our inspiration.', ref: 'Hud 11:37' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('ark', 0.5, 0.82, 1.1), p('axe', 0.15, 0.82, 0.4, 'shake'), p('tree', 0.85, 0.8, 0.6), p('sun', 0.8, 0.25, 0.4, 'spin')] },
        caption: 'Day after day, Nuh (AS) and the believers sawed wood and hammered planks. The smell of fresh wood filled the hot desert air.',
        sfx: 'BANG! BANG!',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('ark', 0.65, 0.82, 0.9), p('house', 0.2, 0.8, 0.6), p('donkey', 0.4, 0.82, 0.4)] },
        caption: 'Whenever the leaders walked past, they laughed and mocked him. "A ship? Here? Where is the sea, Nuh?"',
        bubble: { speaker: 'Nuh (AS)', text: 'If you laugh at us now, soon we will see who was right.' },
        sfx: 'HA HA HA!',
      },
      {
        scene: { sky: 'storm', ground: 'desert', action: true, props: [p('spring', 0.3, 0.84, 0.8, 'pulse'), p('cloud', 0.5, 0.3, 1.0, 'drift'), p('ark', 0.72, 0.82, 0.8)] },
        caption: 'Then the sign came: water gushed out of the ground like a fountain, and dark clouds rolled across the sky.',
        quran: { text: 'Until when Our command came and the oven overflowed…', ref: 'Hud 11:40' },
        sfx: 'WHOOSH!',
      },
      {
        scene: { sky: 'storm', ground: 'desert', props: [p('ark', 0.6, 0.82, 1.0), p('camel', 0.2, 0.84, 0.4), p('sheep', 0.33, 0.84, 0.3), p('elephant', 0.08, 0.84, 0.35), p('birds', 0.5, 0.35, 0.5, 'fly')] },
        caption: 'Nuh (AS) brought a pair of every kind of animal onto the Ark — two by two — along with the believers.',
        bubble: { speaker: 'Nuh (AS)', text: 'Get on board! In the name of Allah it sails and in His name it anchors.' },
      },
      {
        scene: { sky: 'storm', ground: 'flood', action: true, props: [p('rain', 0.5, 0.6, 1.4), p('lightning', 0.8, 0.45, 0.7, 'twinkle'), p('wave', 0.25, 0.85, 1.0, 'bob'), p('ark', 0.6, 0.75, 1.0, 'sway')] },
        caption: 'The sky opened and rain poured down. Water burst from the earth. The Ark rose up on waves as tall as mountains!',
        sfx: 'KRAKOOOM!',
      },
      {
        scene: { sky: 'storm', ground: 'flood', props: [p('mountain', 0.2, 0.8, 1.0), p('ark', 0.7, 0.75, 0.8, 'sway'), p('wave', 0.4, 0.85, 0.8, 'bob')] },
        caption: 'Nuh\'s own son refused to come. He thought a high mountain would save him. Nuh (AS) begged him, but a wave came between them.',
        bubble: { speaker: 'Nuh (AS)', text: 'O my son, come with us! Do not be with the disbelievers!' },
        quran: { text: 'There is no protector today from the decree of Allah, except for whom He gives mercy.', ref: 'Hud 11:43' },
      },
      {
        scene: { sky: 'dawn', ground: 'sea', props: [p('ark', 0.5, 0.78, 1.0, 'bob'), p('cloud', 0.2, 0.3, 0.6, 'drift'), p('sun', 0.8, 0.4, 0.6, 'rise')] },
        caption: 'Then Allah commanded the earth to swallow its water and the sky to stop. The waves grew calm and quiet.',
        quran: { text: 'O earth, swallow your water, and O sky, withhold your rain.', ref: 'Hud 11:44' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('ark', 0.5, 0.6, 0.8), p('dove', 0.75, 0.35, 0.4, 'fly'), p('flower', 0.25, 0.82, 0.4, 'sway'), p('tree', 0.85, 0.8, 0.6, 'sway')] },
        caption: 'The Ark came to rest on Mount Judi. Nuh (AS), the believers and all the animals stepped out onto fresh, clean land, thanking Allah.',
        quran: { text: 'O Nuh, disembark in safety from Us and blessings upon you.', ref: 'Hud 11:48' },
      },
    ],
    lessons: [
      'Never give up inviting people to good — Nuh tried for 950 years!',
      'Trust Allah even when others laugh at you.',
      'Being related to a good person is not enough — each of us must choose to believe.',
    ],
    sources: ['Hud 11:25-49', 'Nuh 71:1-28', 'Al-Ankabut 29:14-15', 'Al-Mu\'minun 23:23-30'],
  },

  // ---------------------------------------------------------------- HUD
  {
    id: 'hud',
    prophet: 'Prophet Hud',
    arabic: 'هود',
    title: 'The People of the Pillars',
    tagline: 'The strongest nation meets the mightiest wind.',
    tint: '#F4B48A',
    cover: { sky: 'storm', ground: 'dunes', action: true, props: [p('wall', 0.3, 0.8, 1.0, 'shake'), p('wind', 0.6, 0.5, 1.2, 'drift'), p('palm', 0.85, 0.8, 0.8, 'sway')] },
    panels: [
      {
        scene: { sky: 'day', ground: 'dunes', props: [p('palace', 0.35, 0.8, 1.1), p('wall', 0.75, 0.8, 0.8), p('sun', 0.85, 0.25, 0.5, 'spin')] },
        caption: 'In the sandy land of Al-Ahqaf lived the people of \'Ad. They were tall and incredibly strong, and they built a city of giant pillars called Iram.',
        quran: { text: 'Iram — who had lofty pillars, the likes of whom had never been created in the lands.', ref: 'Al-Fajr 89:7-8' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('palm', 0.2, 0.8, 0.9, 'sway'), p('spring', 0.45, 0.84, 0.6), p('camel', 0.7, 0.82, 0.5), p('horse', 0.88, 0.82, 0.4)] },
        caption: 'Allah gave them gardens, springs, cattle and many children. But instead of thanking Allah, they became proud and worshipped idols.',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('idol', 0.25, 0.82, 0.6), p('house', 0.65, 0.8, 0.7), p('sun', 0.5, 0.45, 0.5, 'rise')] },
        caption: 'Allah sent one of their own brothers, Hud (AS), to guide them.',
        bubble: { speaker: 'Hud (AS)', text: 'O my people, worship Allah! You have no god but Him. I ask no payment from you.' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('palace', 0.5, 0.8, 1.0), p('wall', 0.15, 0.8, 0.6), p('wall', 0.85, 0.8, 0.6)] },
        caption: 'They laughed at him. They boasted about their muscles and their huge buildings.',
        bubble: { speaker: 'The people of \'Ad', text: 'Who is stronger than us?!' },
        quran: { text: 'Did they not see that Allah who created them was mightier than them in strength?', ref: 'Fussilat 41:15' },
        sfx: 'BOAST!',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('tree', 0.3, 0.8, 0.7), p('rock', 0.6, 0.82, 0.5), p('sun', 0.75, 0.35, 0.7)] },
        caption: 'Then the rain stopped. The springs dried up and the gardens turned brown and crunchy. Still, the people would not listen.',
      },
      {
        scene: { sky: 'dusk', ground: 'dunes', props: [p('cloud', 0.5, 0.35, 1.3, 'drift'), p('palm', 0.2, 0.8, 0.7, 'sway')] },
        caption: 'One day a huge dark cloud appeared over the valleys. The people cheered — "Rain at last!" But it was not rain.',
        quran: { text: 'Rather, it is that which you were impatient for: a wind, within it a painful punishment.', ref: 'Al-Ahqaf 46:24' },
      },
      {
        scene: { sky: 'storm', ground: 'dunes', action: true, props: [p('wind', 0.4, 0.5, 1.4, 'drift'), p('wall', 0.75, 0.8, 0.8, 'shake'), p('palm', 0.2, 0.8, 0.8, 'shake')] },
        caption: 'A freezing, howling wind roared through the land for seven nights and eight days without stopping. Their mighty pillars could not protect them.',
        quran: { text: 'A screaming, violent wind… for seven nights and eight days in succession.', ref: 'Al-Haqqah 69:6-7' },
        sfx: 'WHOOOOOSH!',
      },
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('tent', 0.35, 0.8, 0.8), p('palm', 0.75, 0.8, 0.8, 'sway'), p('sun', 0.55, 0.45, 0.5, 'rise'), p('heart', 0.5, 0.35, 0.3, 'pulse')] },
        caption: 'But Allah saved Hud (AS) and those who believed with him. The wind did not harm them at all.',
        quran: { text: 'And when Our command came, We saved Hud and those who believed with him, by mercy from Us.', ref: 'Hud 11:58' },
      },
    ],
    lessons: [
      'Strength and wealth are gifts from Allah — never boast about them.',
      'True power belongs to Allah alone.',
      'Thank Allah for blessings so they stay with you.',
    ],
    sources: ['Hud 11:50-60', 'Al-A\'raf 7:65-72', 'Al-Ahqaf 46:21-26', 'Al-Haqqah 69:6-8', 'Al-Fajr 89:6-8'],
  },

  // ---------------------------------------------------------------- SALIH
  {
    id: 'salih',
    prophet: 'Prophet Salih',
    arabic: 'صالح',
    title: 'The Camel from the Rock',
    tagline: 'A miracle camel and a test of trust.',
    tint: '#F2CF7E',
    cover: { sky: 'dusk', ground: 'mountains', props: [p('rock', 0.5, 0.8, 1.2, 'shake'), p('camel', 0.5, 0.8, 0.8, 'rise'), p('sparkles', 0.5, 0.35, 0.6, 'spin')] },
    panels: [
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('cave', 0.3, 0.8, 1.0), p('cave', 0.7, 0.8, 0.9), p('palm', 0.5, 0.82, 0.6, 'sway')] },
        caption: 'The people of Thamud were amazing builders. They carved beautiful houses right into the sides of the mountains.',
        quran: { text: 'And you carve out of the mountains, homes.', ref: 'Al-A\'raf 7:74' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('palm', 0.2, 0.8, 0.8, 'sway'), p('spring', 0.5, 0.84, 0.6), p('wheat', 0.75, 0.82, 0.6, 'sway'), p('idol', 0.9, 0.82, 0.4)] },
        caption: 'They had gardens, springs and fields full of crops. But they forgot Allah and worshipped idols.',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('cave', 0.25, 0.8, 0.8), p('house', 0.7, 0.8, 0.7), p('sun', 0.5, 0.45, 0.5, 'rise')] },
        caption: 'Allah sent Salih (AS), a kind and wise man everyone respected. He invited them to worship Allah alone.',
        bubble: { speaker: 'Salih (AS)', text: 'O my people, worship Allah! He made you from the earth and settled you in it.' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('rock', 0.5, 0.82, 1.2), p('cloud', 0.25, 0.3, 0.5, 'drift')] },
        caption: 'The leaders tested him. They pointed at a huge rock and demanded a miracle: "Bring a she-camel out of this rock, then we will believe!"',
      },
      {
        scene: { sky: 'golden', ground: 'mountains', action: true, props: [p('rock', 0.5, 0.82, 1.2, 'shake'), p('camel', 0.5, 0.75, 0.9, 'rise'), p('sparkles', 0.3, 0.4, 0.6, 'spin'), p('sparkles', 0.7, 0.4, 0.6, 'spin')] },
        caption: 'Salih (AS) prayed to Allah. The rock trembled and cracked open — and out stepped a magnificent she-camel!',
        sfx: 'CRAAACK!',
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('camel', 0.35, 0.82, 0.9), p('well', 0.72, 0.82, 0.7), p('palm', 0.9, 0.8, 0.6, 'sway')] },
        caption: 'The camel was a sign from Allah. She would drink from the well one day, and the people the next. In return, she gave milk for everyone!',
        quran: { text: 'This is the she-camel of Allah — a sign for you. So leave her to eat in Allah\'s land and do not touch her with harm.', ref: 'Hud 11:64' },
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('camel', 0.6, 0.82, 0.8), p('moon', 0.2, 0.35, 0.5), p('star', 0.4, 0.25, 0.3, 'twinkle')] },
        caption: 'Some believed, but the proud leaders hated the camel. One night, the worst of them sneaked out and killed her.',
        quran: { text: 'But they denied him and hamstrung her.', ref: 'Ash-Shams 91:14' },
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('cave', 0.3, 0.8, 0.8), p('sun', 0.7, 0.45, 0.5, 'sink')] },
        caption: 'Salih (AS) warned them sadly that the punishment was coming.',
        bubble: { speaker: 'Salih (AS)', text: 'Enjoy yourselves in your homes for three days. This is a promise that will not be broken.' },
      },
      {
        scene: { sky: 'storm', ground: 'mountains', action: true, props: [p('cave', 0.3, 0.8, 0.9, 'shake'), p('cave', 0.72, 0.8, 0.8, 'shake'), p('lightning', 0.5, 0.45, 0.8, 'twinkle')] },
        caption: 'On the fourth morning, a mighty blast and an earthquake shook Thamud. Their strong stone houses could not protect them.',
        sfx: 'BOOOM!',
      },
      {
        scene: { sky: 'dawn', ground: 'desert', props: [p('footprints', 0.4, 0.85, 0.6), p('palm', 0.8, 0.8, 0.7, 'sway'), p('sun', 0.6, 0.45, 0.5, 'rise')] },
        caption: 'But Allah saved Salih (AS) and the believers. They walked away safely to a new land.',
        quran: { text: 'So when Our command came, We saved Salih and those who believed with him, by mercy from Us.', ref: 'Hud 11:66' },
      },
    ],
    lessons: [
      'Be kind to animals — they are part of Allah\'s creation.',
      'Keep your promises, especially to Allah.',
      'Clever buildings mean nothing without faith.',
    ],
    sources: ['Hud 11:61-68', 'Al-A\'raf 7:73-79', 'Ash-Shu\'ara 26:141-159', 'Ash-Shams 91:11-15'],
  },

  // ---------------------------------------------------------------- IBRAHIM
  {
    id: 'ibrahim',
    prophet: 'Prophet Ibrahim',
    arabic: 'إبراهيم',
    title: 'The Friend of Allah',
    tagline: 'From the stars to the fire to the Kaaba.',
    tint: '#F0B3C8',
    cover: { sky: 'golden', ground: 'desert', props: [p('fire', 0.3, 0.82, 0.9, 'flicker'), p('flower', 0.3, 0.84, 0.4, 'sway'), p('kaaba', 0.72, 0.8, 0.9), p('sparkles', 0.5, 0.35, 0.6, 'twinkle')] },
    panels: [
      {
        scene: { sky: 'day', ground: 'city', props: [p('idol', 0.25, 0.82, 0.7), p('idol', 0.45, 0.82, 0.6), p('idol', 0.65, 0.82, 0.65), p('house', 0.88, 0.8, 0.6)] },
        caption: 'In the city of Babylon, a boy named Ibrahim (AS) grew up surrounded by idols. His own father, Azar, carved them from wood and stone.',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('idol', 0.5, 0.82, 0.9), p('heart', 0.8, 0.45, 0.3, 'pulse')] },
        caption: 'Even as a young man, Ibrahim (AS) knew something was wrong. How could statues that people made with their own hands be gods?',
        bubble: { speaker: 'Ibrahim (AS)', text: 'O my father, why do you worship something that cannot hear, cannot see and cannot help you at all?' },
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('star', 0.5, 0.3, 0.8, 'twinkle'), p('star', 0.2, 0.2, 0.3, 'twinkle'), p('star', 0.8, 0.25, 0.3, 'twinkle')] },
        caption: 'To teach his people, Ibrahim (AS) looked up at a bright star in the night sky. "Is this my Lord?" But when it faded away, he said, "I do not love things that disappear."',
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('moon', 0.5, 0.4, 1.0, 'rise'), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('cloud', 0.75, 0.3, 0.5, 'drift')] },
        caption: 'Then the moon rose, big and glowing. "Is this my Lord?" But the moon set too.',
      },
      {
        scene: { sky: 'dawn', ground: 'desert', props: [p('sun', 0.5, 0.45, 1.1, 'rise'), p('palm', 0.15, 0.8, 0.6, 'sway')] },
        caption: 'Then the sun came up, the biggest of all! But when it set in the evening, Ibrahim (AS) told his people the truth.',
        quran: { text: 'Indeed, I have turned my face toward He who created the heavens and the earth, inclining toward truth.', ref: 'Al-An\'am 6:79' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', action: true, props: [p('idol', 0.2, 0.82, 0.5, 'shake'), p('idol', 0.4, 0.82, 0.5, 'shake'), p('idol', 0.75, 0.82, 1.0), p('axe', 0.75, 0.6, 0.5)] },
        caption: 'One festival day, everyone left the city. Ibrahim (AS) went into the temple and broke the idols into pieces — all except the biggest one. He hung the axe on its shoulder.',
        sfx: 'CRASH! SMASH!',
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('idol', 0.6, 0.82, 1.0), p('axe', 0.6, 0.6, 0.5), p('stones', 0.3, 0.85, 0.6)] },
        caption: 'The people came back and were furious. "Who did this to our gods?" Ibrahim (AS) gave them something to think about.',
        bubble: { speaker: 'Ibrahim (AS)', text: 'Rather, this biggest one did it! Ask them — if they can speak.' },
        quran: { text: 'Then do you worship instead of Allah that which does not benefit you at all or harm you?', ref: 'Al-Anbiya 21:66' },
      },
      {
        scene: { sky: 'dusk', ground: 'city', action: true, props: [p('fire', 0.5, 0.82, 1.4, 'flicker'), p('fire', 0.25, 0.82, 0.8, 'flicker'), p('fire', 0.75, 0.82, 0.8, 'flicker')] },
        caption: 'Instead of thinking, the king and the people became angry. They built a gigantic fire, so hot that birds flying above could feel it, and threw Ibrahim (AS) into it.',
        bubble: { speaker: 'Ibrahim (AS)', text: 'Allah is enough for me, and He is the best Protector!' },
        sfx: 'FWOOOSH!',
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('fire', 0.5, 0.82, 1.0, 'flicker'), p('flower', 0.3, 0.84, 0.5, 'sway'), p('flower', 0.7, 0.84, 0.5, 'sway'), p('sparkles', 0.5, 0.35, 0.8, 'spin')] },
        caption: 'But Allah gave the fire a command. The flames could not burn him! Ibrahim (AS) sat safe and cool in the middle, and only his ropes burned away.',
        quran: { text: 'We said: O fire, be coolness and safety upon Ibrahim.', ref: 'Al-Anbiya 21:69' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('birds', 0.3, 0.35, 0.6, 'fly'), p('dove', 0.7, 0.3, 0.5, 'fly'), p('mountain', 0.2, 0.8, 0.7), p('mountain', 0.8, 0.8, 0.8)] },
        caption: 'Ibrahim (AS) asked Allah to show him how He brings the dead to life. Allah told him to place parts of four birds on different hills and call them. The birds came flying back to him, alive!',
        quran: { text: 'Then call them; they will come to you in haste. And know that Allah is Exalted in Might and Wise.', ref: 'Al-Baqarah 2:260' },
        sfx: 'FLAP FLAP!',
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('sun', 0.8, 0.25, 0.7, 'spin'), p('rock', 0.3, 0.82, 0.5), p('jar', 0.5, 0.84, 0.4), p('dates', 0.6, 0.84, 0.35)] },
        caption: 'Later, Allah commanded Ibrahim (AS) to take his wife Hajar and baby Ismail to a dry valley in Makkah, with only some dates and water.',
        bubble: { speaker: 'Hajar', text: 'Did Allah command you to do this? Then He will never let us be lost.' },
      },
      {
        scene: { sky: 'day', ground: 'desert', action: true, props: [p('mountain', 0.15, 0.8, 0.6), p('mountain', 0.85, 0.8, 0.6), p('spring', 0.5, 0.84, 0.8, 'pulse'), p('footprints', 0.35, 0.86, 0.5)] },
        caption: 'When the water ran out, Hajar ran seven times between the hills of Safa and Marwah looking for help. Then — water burst out of the ground near baby Ismail! It was the well of Zamzam.',
        sfx: 'SPLOOSH!',
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('moon', 0.75, 0.35, 0.5), p('ram', 0.4, 0.82, 0.7, 'bob'), p('light', 0.4, 0.75, 0.8, 'pulse')] },
        caption: 'Years later, Ibrahim (AS) saw in a dream that he must sacrifice his beloved son. It was a huge test. He told Ismail, who bravely agreed. Just at that moment, Allah sent a ram to sacrifice instead!',
        bubble: { speaker: 'Ismail (AS)', text: 'O my father, do as you are commanded. You will find me, if Allah wills, among the patient.' },
        quran: { text: 'And We ransomed him with a great sacrifice.', ref: 'As-Saffat 37:107' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('kaaba', 0.5, 0.8, 1.1), p('stones', 0.2, 0.85, 0.5), p('stones', 0.82, 0.85, 0.4), p('sun', 0.85, 0.25, 0.4, 'spin')] },
        caption: 'Then father and son built the Kaaba together, stone by stone, as the first house of worship for Allah. As they worked, they made dua.',
        bubble: { speaker: 'Ibrahim & Ismail', text: 'Our Lord, accept this from us! You are the All-Hearing, the All-Knowing.' },
        sfx: 'CLACK! CLACK!',
      },
      {
        scene: { sky: 'golden', ground: 'desert', props: [p('kaaba', 0.5, 0.8, 1.0), p('camel', 0.15, 0.82, 0.4), p('camel', 0.85, 0.82, 0.4, 'none', true), p('light', 0.5, 0.6, 1.0, 'pulse')] },
        caption: 'Allah told Ibrahim (AS) to call all people to come for Hajj. Today, millions of Muslims answer that call every year!',
        quran: { text: 'And proclaim to the people the Hajj; they will come to you on foot and on every lean camel, from every distant pass.', ref: 'Al-Hajj 22:27' },
      },
    ],
    lessons: [
      'Use your mind to see that only Allah deserves worship.',
      'When you trust Allah completely, even fire cannot harm you.',
      'Obeying Allah brings blessings — like Zamzam, Hajj and Eid al-Adha.',
      'Make dua that Allah accepts your good deeds.',
    ],
    sources: ['Al-An\'am 6:74-83', 'Maryam 19:41-48', 'Al-Anbiya 21:51-70', 'Al-Baqarah 2:124-129, 2:260', 'Ibrahim 14:37', 'As-Saffat 37:99-111', 'Al-Hajj 22:26-27', 'Sahih al-Bukhari 3364'],
  },

  // ---------------------------------------------------------------- LUT
  {
    id: 'lut',
    prophet: 'Prophet Lut',
    arabic: 'لوط',
    title: 'Don\'t Look Back',
    tagline: 'One family escapes before dawn.',
    tint: '#C2B4EC',
    cover: { sky: 'night', ground: 'desert', props: [p('footprints', 0.4, 0.86, 0.7), p('moon', 0.75, 0.35, 0.5, 'bob'), p('star', 0.25, 0.25, 0.3, 'twinkle'), p('mountain', 0.85, 0.8, 0.7)] },
    panels: [
      {
        scene: { sky: 'day', ground: 'grass', props: [p('house', 0.3, 0.8, 0.7), p('tree', 0.6, 0.8, 0.7, 'sway'), p('sun', 0.8, 0.3, 0.5)] },
        caption: 'Lut (AS) was the nephew of Prophet Ibrahim (AS). He believed in Allah and travelled with his uncle.',
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('house', 0.25, 0.8, 0.7), p('house', 0.5, 0.8, 0.8), p('house', 0.78, 0.8, 0.7)] },
        caption: 'Allah sent Lut (AS) to the people of Sodom. They did very wicked, shameful things, robbed travellers, and refused to stop.',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('house', 0.6, 0.8, 0.8), p('scales', 0.25, 0.8, 0.5)] },
        caption: 'Lut (AS) warned them again and again, gently and patiently.',
        bubble: { speaker: 'Lut (AS)', text: 'Will you not fear Allah? I am a trustworthy messenger to you — so fear Allah and obey me.' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('gate', 0.5, 0.8, 1.0), p('house', 0.15, 0.8, 0.5)] },
        caption: 'Instead of listening, they threatened him and laughed.',
        bubble: { speaker: 'The people', text: 'Throw Lut and his family out of our town!' },
        sfx: 'GET OUT!',
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('house', 0.5, 0.8, 0.9), p('lamp', 0.5, 0.65, 0.3, 'flicker'), p('light', 0.5, 0.6, 0.8, 'pulse')] },
        caption: 'One evening, special guests arrived at Lut\'s house. They were really angels sent by Allah, though they looked like men. The wicked people came banging at the door.',
        sfx: 'BANG! BANG!',
      },
      {
        scene: { sky: 'golden', ground: 'none', props: [p('light', 0.5, 0.85, 1.2, 'pulse'), p('sparkles', 0.3, 0.4, 0.5, 'twinkle'), p('sparkles', 0.7, 0.4, 0.5, 'twinkle')] },
        caption: 'The angels comforted Lut (AS) and told him what to do.',
        quran: { text: 'O Lut, indeed we are messengers of your Lord; they will never reach you. So set out with your family during a portion of the night and let not any among you look back.', ref: 'Hud 11:81' },
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('footprints', 0.35, 0.86, 0.8), p('moon', 0.8, 0.35, 0.5), p('star', 0.3, 0.25, 0.3, 'twinkle'), p('star', 0.55, 0.2, 0.25, 'twinkle')] },
        caption: 'In the dark of night, Lut (AS) and his believing daughters hurried away without looking back. His wife, who had sided with the wicked people, stayed behind.',
      },
      {
        scene: { sky: 'storm', ground: 'city', action: true, props: [p('stones', 0.3, 0.4, 0.7, 'sink'), p('stones', 0.7, 0.35, 0.6, 'sink'), p('house', 0.5, 0.8, 0.8, 'shake'), p('lightning', 0.15, 0.4, 0.5, 'twinkle')] },
        caption: 'At sunrise, Allah\'s command came. The town was turned upside down, and stones of hard clay rained down upon it.',
        quran: { text: 'We made its highest part its lowest and rained upon them stones of layered hard clay.', ref: 'Hud 11:82' },
        sfx: 'RUMBLE!',
      },
      {
        scene: { sky: 'dawn', ground: 'sea', props: [p('sun', 0.5, 0.5, 0.6, 'rise'), p('mountain', 0.15, 0.8, 0.6), p('rock', 0.8, 0.82, 0.4)] },
        caption: 'Many scholars say that the land is near the Dead Sea today — a quiet reminder for anyone who passes by.',
        quran: { text: 'And indeed, you pass by them in the morning and at night. Then will you not use reason?', ref: 'As-Saffat 37:137-138' },
      },
    ],
    lessons: [
      'Stand up for what is right, even if you are the only one.',
      'Obey Allah\'s instructions exactly — "don\'t look back."',
      'Being close to a prophet doesn\'t save you; your own choices do.',
    ],
    sources: ['Hud 11:77-83', 'Al-A\'raf 7:80-84', 'Ash-Shu\'ara 26:160-175', 'Al-Hijr 15:57-77', 'As-Saffat 37:133-138'],
  },

  // ---------------------------------------------------------------- ISMAIL
  {
    id: 'ismail',
    prophet: 'Prophet Ismail',
    arabic: 'إسماعيل',
    title: 'The Boy of Zamzam',
    tagline: 'A baby in the desert, a miracle spring, and a promise kept.',
    tint: '#8ED3CB',
    cover: { sky: 'day', ground: 'desert', props: [p('spring', 0.4, 0.84, 0.9, 'pulse'), p('kaaba', 0.75, 0.8, 0.7), p('birds', 0.4, 0.35, 0.5, 'fly')] },
    panels: [
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('rock', 0.4, 0.82, 0.5), p('jar', 0.55, 0.84, 0.4), p('dates', 0.65, 0.84, 0.3), p('sun', 0.8, 0.25, 0.6, 'spin')] },
        caption: 'Ismail (AS) was the first son of Prophet Ibrahim (AS). When he was just a baby, Allah commanded that he and his mother Hajar stay in the empty valley of Makkah.',
        quran: { text: 'Our Lord, I have settled some of my descendants in an uncultivated valley near Your sacred House.', ref: 'Ibrahim 14:37' },
      },
      {
        scene: { sky: 'day', ground: 'desert', action: true, props: [p('mountain', 0.12, 0.8, 0.6), p('mountain', 0.88, 0.8, 0.6), p('footprints', 0.5, 0.86, 0.8), p('sun', 0.5, 0.25, 0.6, 'spin')] },
        caption: 'The sun was scorching. When their water ran out, baby Ismail cried with thirst. Hajar ran between the hills of Safa and Marwah, searching — seven times!',
        sfx: 'THUMP THUMP',
      },
      {
        scene: { sky: 'golden', ground: 'desert', action: true, props: [p('spring', 0.5, 0.84, 1.1, 'pulse'), p('sparkles', 0.3, 0.45, 0.5, 'spin'), p('sparkles', 0.7, 0.45, 0.5, 'spin')] },
        caption: 'Then, by Allah\'s mercy, cool water gushed up from the ground beside the baby! Hajar made a wall of sand around it, saying "Zam, zam!" — "Stop, stop!" — so it would not flow away.',
        sfx: 'GUSH!',
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('birds', 0.5, 0.35, 0.7, 'fly'), p('well', 0.5, 0.82, 0.6), p('camel', 0.15, 0.82, 0.5), p('tent', 0.85, 0.8, 0.6)] },
        caption: 'A travelling tribe called Jurhum saw birds circling above the valley and knew there must be water. They asked Hajar if they could stay, and Makkah began to grow.',
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('tent', 0.3, 0.8, 0.7), p('sheep', 0.6, 0.82, 0.4), p('sheep', 0.75, 0.82, 0.35), p('palm', 0.9, 0.8, 0.6, 'sway')] },
        caption: 'Ismail (AS) grew up strong among the Jurhum. He learned their Arabic language, cared for animals and became a skilled hunter.',
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('ram', 0.5, 0.82, 0.8, 'bob'), p('light', 0.5, 0.7, 1.0, 'pulse'), p('star', 0.25, 0.25, 0.3, 'twinkle')] },
        caption: 'When his father told him about the dream to sacrifice him, young Ismail (AS) did not run away. He trusted Allah completely — and Allah sent a ram in his place.',
        bubble: { speaker: 'Ismail (AS)', text: 'O my father, do as you are commanded. You will find me, if Allah wills, among the patient.' },
        quran: { text: 'And We ransomed him with a great sacrifice.', ref: 'As-Saffat 37:107' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('kaaba', 0.5, 0.8, 1.0), p('stones', 0.2, 0.85, 0.5), p('rock', 0.82, 0.82, 0.4)] },
        caption: 'Ismail (AS) helped his father build the Kaaba. He carried the heavy stones while Ibrahim (AS) placed them.',
        quran: { text: 'And when Ibrahim was raising the foundations of the House, and Ismail…', ref: 'Al-Baqarah 2:127' },
        sfx: 'HEAVE!',
      },
      {
        scene: { sky: 'dawn', ground: 'desert', props: [p('kaaba', 0.6, 0.8, 0.7), p('tent', 0.2, 0.8, 0.6), p('sun', 0.4, 0.45, 0.5, 'rise'), p('heart', 0.85, 0.4, 0.3, 'pulse')] },
        caption: 'Ismail (AS) became a prophet. He always kept his promises and told his family to pray and give charity. Prophet Muhammad ﷺ is from his family line!',
        quran: { text: 'Indeed, he was true to his promise, and he was a messenger and a prophet. And he used to enjoin on his people prayer and zakah.', ref: 'Maryam 19:54-55' },
      },
    ],
    lessons: [
      'Allah\'s help comes when we try our best and trust Him — like Hajar running.',
      'Respect and obey your parents in good things.',
      'Always keep your promises.',
    ],
    sources: ['Ibrahim 14:37', 'Al-Baqarah 2:125-129', 'As-Saffat 37:100-111', 'Maryam 19:54-55', 'Sahih al-Bukhari 3364'],
  },
];
