// Prophet stories, part C: Dawud → Muhammad ﷺ.
// Sources: the Quran, sahih hadith and mainstream seerah / Qasas al-Anbiya (Ibn Kathir).
// Scenes never show people or angels — see ../types.ts.
import type { ComicAnim, ComicProp, ComicPropKind, ProphetStory } from '../types';

const p = (kind: ComicPropKind, x: number, y: number, scale = 1, anim: ComicAnim = 'none', extra?: Partial<ComicProp>): ComicProp =>
  ({ kind, x, y, scale, anim, ...extra });

export const groupC: ProphetStory[] = [
  // ───────────────────────────── Dawud ─────────────────────────────
  {
    id: 'dawud',
    prophet: 'Prophet Dawud',
    arabic: 'داود',
    title: 'The Boy, the Giant and the Singing Mountains',
    tagline: 'A small stone, a big giant, and a voice that made the mountains praise Allah.',
    tint: '#F2CF7E',
    cover: {
      sky: 'dawn',
      ground: 'mountains',
      props: [p('sun', 0.75, 0.4, 0.6, 'pulse'), p('stones', 0.3, 0.82, 0.5), p('birds', 0.4, 0.35, 0.7, 'fly'), p('scroll', 0.62, 0.82, 0.55, 'bob')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'river', props: [p('tent', 0.2, 0.8, 0.7), p('tent', 0.38, 0.8, 0.55), p('sun', 0.8, 0.35, 0.5, 'pulse'), p('cloud', 0.5, 0.3, 0.6, 'drift')] },
        caption: "Long ago, the believers of Bani Israil marched out with their king, Talut, to face a mighty enemy. On the way they reached a cool, sparkling river. They were thirsty, but Allah tested them: only a handful of water was allowed!",
        quran: { text: "Indeed, Allah will be testing you with a river. Whoever drinks from it is not of me, except one who takes a scoop with his hand.", ref: 'Al-Baqarah 2:249' },
      },
      {
        scene: { sky: 'storm', ground: 'desert', props: [p('cloud', 0.3, 0.3, 0.8, 'drift'), p('lightning', 0.65, 0.45, 0.6, 'twinkle'), p('rock', 0.7, 0.82, 1.3, 'shake'), p('tent', 0.15, 0.82, 0.5)], action: true },
        caption: "Across the field stood the enemy army, led by Jalut — a huge, fearsome giant in heavy armour. His roar rolled across the valley like thunder. Many soldiers felt their knees shake.",
        bubble: { speaker: 'The believers', text: "How many a small group has defeated a big group by Allah's permission! Allah is with the patient." },
        sfx: 'ROAAR!',
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('stones', 0.25, 0.82, 0.6), p('wind', 0.55, 0.5, 0.8, 'drift'), p('sun', 0.85, 0.3, 0.45, 'pulse')], action: true },
        caption: "Then a young man named Dawud (AS) stepped forward. He had no giant sword — only a sling and a few smooth stones. But his heart was full of trust in Allah. He swung the sling round and round…",
        sfx: 'WHOOSH!',
      },
      {
        scene: { sky: 'golden', ground: 'desert', props: [p('rock', 0.6, 0.82, 0.9, 'sink'), p('sparkles', 0.5, 0.45, 0.8, 'spin'), p('crown', 0.25, 0.8, 0.5, 'bob')], action: true },
        caption: "The stone flew straight and true, and the mighty Jalut came crashing down! The enemy army ran away. The small, faithful army had won — not by strength, but by Allah's help.",
        quran: { text: 'And Dawud killed Jalut, and Allah gave him the kingship and wisdom and taught him from what He willed.', ref: 'Al-Baqarah 2:251' },
        sfx: 'THUD!',
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('light', 0.5, 0.75, 1.1, 'pulse'), p('scroll', 0.5, 0.82, 0.6, 'bob'), p('sparkles', 0.25, 0.4, 0.5, 'twinkle'), p('sparkles', 0.75, 0.35, 0.5, 'twinkle')] },
        caption: "Dawud (AS) became a wise king and a prophet. Allah blessed him with a holy book called the Zabur, full of praise and wisdom.",
        quran: { text: 'And to Dawud We gave the Zabur.', ref: 'An-Nisa 4:163' },
      },
      {
        scene: { sky: 'dawn', ground: 'mountains', props: [p('mountain', 0.25, 0.82, 1.1, 'shake'), p('mountain', 0.7, 0.82, 1.3), p('birds', 0.4, 0.35, 0.8, 'fly'), p('birds', 0.7, 0.25, 0.6, 'fly'), p('sun', 0.5, 0.45, 0.5, 'rise')] },
        caption: "Dawud (AS) had the most beautiful voice. When he praised Allah, something amazing happened: the mountains echoed his praise, and flocks of birds gathered in the sky, glorifying Allah with him!",
        quran: { text: 'O mountains, repeat praises with him, and the birds as well.', ref: "Saba' 34:10" },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('fire', 0.25, 0.82, 0.7, 'flicker'), p('armor', 0.6, 0.82, 0.9, 'pulse'), p('sparkles', 0.6, 0.4, 0.5, 'twinkle')] },
        caption: "Allah gave Dawud (AS) another miracle: hard iron became soft in his hands, like dough! He linked tiny iron rings together to make strong coats of armour to protect people.",
        quran: { text: 'And We made the iron soft for him, [saying], "Make full coats of armour and measure the links well."', ref: "Saba' 34:10-11" },
        sfx: 'CLINK! CLINK!',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('house', 0.25, 0.82, 0.8), p('bread', 0.6, 0.82, 0.5, 'bob'), p('armor', 0.8, 0.82, 0.5)] },
        caption: "Even though he was a king, Dawud (AS) loved to earn his own food. The Prophet Muhammad ﷺ told us that nobody eats better food than what he earns with his own hands — and Dawud (AS) ate from the work of his own hands.",
      },
      {
        scene: { sky: 'night', ground: 'city', props: [p('moon', 0.75, 0.35, 0.6, 'pulse'), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('star', 0.45, 0.2, 0.25, 'twinkle'), p('lamp', 0.35, 0.82, 0.5, 'flicker')] },
        caption: "At night, while others slept, Dawud (AS) stood in prayer. He fasted every other day. Our Prophet ﷺ said the prayer and fasting of Dawud were the most beloved to Allah.",
      },
    ],
    lessons: [
      'Trust in Allah is stronger than any giant.',
      'Praise Allah often — all of creation praises Him too.',
      'Work hard and earn honestly, even if you are important.',
      'Pray at night and fast with balance, like Dawud (AS).',
    ],
    sources: ['Surah Al-Baqarah 2:249-251', "Surah Saba' 34:10-11", 'Surah Sad 38:17-26', 'Sahih al-Bukhari 2072, 1131'],
  },

  // ───────────────────────────── Sulayman ─────────────────────────────
  {
    id: 'sulayman',
    prophet: 'Prophet Sulayman',
    arabic: 'سليمان',
    title: 'The King Who Heard the Ant',
    tagline: 'Wind, birds, jinn and a tiny ant — a kingdom like no other.',
    tint: '#C2B4EC',
    cover: {
      sky: 'golden',
      ground: 'grass',
      props: [p('palace', 0.5, 0.82, 1.1), p('hoopoe', 0.2, 0.4, 0.5, 'fly'), p('ant', 0.8, 0.82, 0.35, 'bob'), p('wind', 0.7, 0.35, 0.6, 'drift')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'grass', props: [p('palace', 0.6, 0.82, 1.1), p('birds', 0.25, 0.35, 0.7, 'fly'), p('sun', 0.85, 0.3, 0.45, 'pulse')] },
        caption: "Sulayman (AS) was the son of Prophet Dawud (AS). He became a prophet and a king, and Allah taught him something wonderful — he could understand the language of birds!",
        quran: { text: 'O people, we have been taught the language of birds and given from all things. Indeed, this is the clear favour.', ref: 'An-Naml 27:16' },
      },
      {
        scene: { sky: 'night', ground: 'floor', props: [p('lamp', 0.5, 0.82, 0.6, 'flicker'), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('moon', 0.8, 0.3, 0.5)] },
        caption: "Sulayman (AS) made a special dua. He asked Allah for forgiveness first, and then for a kingdom like no one after him would ever have. Allah answered his dua!",
        quran: { text: 'My Lord, forgive me and grant me a kingdom such as will not belong to anyone after me. Indeed, You are the Bestower.', ref: 'Sad 38:35' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('wind', 0.3, 0.45, 1.1, 'drift'), p('wind', 0.7, 0.3, 0.8, 'drift'), p('cloud', 0.5, 0.25, 0.7, 'drift'), p('throne', 0.55, 0.55, 0.5, 'bob')], action: true },
        caption: "Allah made the wind obey him! It carried Sulayman (AS) and his people across the land — a journey of a whole month in just one morning, and another month in one evening.",
        quran: { text: "And to Sulayman [We subjected] the wind — its morning journey was a month and its evening journey was a month.", ref: "Saba' 34:12" },
        sfx: 'WHOOOSH!',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('palace', 0.3, 0.82, 0.9), p('jar', 0.65, 0.82, 0.6), p('jar', 0.8, 0.82, 0.45), p('sparkles', 0.5, 0.35, 0.6, 'twinkle')] },
        caption: "Allah also placed the jinn under his command. By Allah's permission they built tall palaces, beautiful statues and giant cooking pots for him — work no human could do so fast!",
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('horse', 0.25, 0.82, 0.7), p('birds', 0.5, 0.3, 0.8, 'fly'), p('horse', 0.45, 0.82, 0.55), p('ant', 0.85, 0.82, 0.35, 'bob')] },
        caption: "One day, Sulayman (AS) marched with his great army of men, jinn and birds — all in neat rows. The ground rumbled as they came near a valley full of tiny ants.",
        sfx: 'STOMP STOMP!',
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('ant', 0.5, 0.82, 0.9, 'shake'), p('ant', 0.25, 0.82, 0.45, 'bob'), p('ant', 0.75, 0.82, 0.5, 'bob'), p('rock', 0.9, 0.82, 0.5)], action: true },
        caption: "A little ant saw them coming and shouted a warning to all the others! She even made an excuse for the army — they wouldn't hurt the ants on purpose, they just couldn't see them.",
        bubble: { speaker: 'The Ant', text: 'O ants! Go into your homes, so Sulayman and his soldiers do not crush you without noticing!' },
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('ant', 0.35, 0.82, 0.6, 'bob'), p('heart', 0.6, 0.45, 0.6, 'pulse'), p('flower', 0.8, 0.82, 0.5, 'sway')] },
        caption: "Sulayman (AS) heard the tiny ant and smiled! Instead of feeling proud, he thanked Allah for all His gifts and stopped his army to keep the ants safe.",
        quran: { text: 'My Lord, enable me to be grateful for Your favour which You have bestowed upon me and upon my parents, and to do righteousness that pleases You.', ref: 'An-Naml 27:19' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('birds', 0.4, 0.3, 0.9, 'fly'), p('tree', 0.8, 0.82, 0.9, 'sway'), p('palace', 0.15, 0.82, 0.6)] },
        caption: "Another day, Sulayman (AS) checked on the birds and noticed someone missing. “Where is the hoopoe?” he asked. The hoopoe had flown away without permission!",
        bubble: { speaker: 'Sulayman (AS)', text: 'Why do I not see the hoopoe? Or is he among the absent?' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('hoopoe', 0.3, 0.55, 0.7, 'bob'), p('sun', 0.75, 0.35, 0.6, 'pulse'), p('throne', 0.7, 0.82, 0.7)] },
        caption: "At last the hoopoe flew back with exciting news. He had found the land of Saba', ruled by a queen with a huge, dazzling throne. But her people bowed down to the sun instead of Allah!",
        bubble: { speaker: 'The Hoopoe', text: 'I found a woman ruling them, with a great throne. She and her people bow to the sun instead of Allah!' },
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('hoopoe', 0.5, 0.45, 0.6, 'fly'), p('scroll', 0.55, 0.55, 0.4, 'bob'), p('palace', 0.8, 0.82, 0.7)] },
        caption: "Sulayman (AS) wrote a letter, and the hoopoe carried it in its beak all the way to the queen's palace. It began with the name of Allah.",
        quran: { text: 'Indeed, it is from Sulayman, and indeed it reads: In the name of Allah, the Most Gracious, the Most Merciful. Do not be haughty with me, but come to me in submission.', ref: 'An-Naml 27:30-31' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('camel', 0.25, 0.82, 0.7), p('jar', 0.5, 0.82, 0.45), p('crown', 0.65, 0.82, 0.4, 'bob'), p('ring', 0.8, 0.8, 0.3, 'twinkle')] },
        caption: "The queen sent camels loaded with gold and gifts. But Sulayman (AS) didn't want treasure — he wanted them to worship Allah alone!",
        bubble: { speaker: 'Sulayman (AS)', text: 'Do you give me wealth? What Allah has given me is better than what He has given you.' },
      },
      {
        scene: { sky: 'golden', ground: 'floor', props: [p('throne', 0.5, 0.82, 1.1, 'pulse'), p('sparkles', 0.3, 0.4, 0.7, 'spin'), p('sparkles', 0.75, 0.35, 0.5, 'spin')], action: true },
        caption: "Before the queen arrived, a man with knowledge from the Book brought her throne from far away — in less than the blink of an eye! Sulayman (AS) saw it and thanked Allah.",
        bubble: { speaker: 'Sulayman (AS)', text: 'This is from the favour of my Lord, to test me whether I will be grateful or ungrateful.' },
        sfx: 'FLASH!',
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('palace', 0.5, 0.75, 1.0), p('fish', 0.3, 0.85, 0.35, 'bob'), p('fish', 0.7, 0.85, 0.3, 'bob'), p('sparkles', 0.5, 0.35, 0.5, 'twinkle')] },
        caption: "The queen entered a palace with a floor of smooth, clear glass. She thought it was water and lifted her dress! When she understood the wonders of Allah, she believed.",
        quran: { text: 'My Lord, I have wronged myself, and I submit with Sulayman to Allah, Lord of the worlds.', ref: 'An-Naml 27:44' },
      },
      {
        scene: { sky: 'dusk', ground: 'floor', props: [p('staff', 0.5, 0.82, 1.0, 'shake'), p('palace', 0.2, 0.82, 0.6), p('jar', 0.85, 0.82, 0.4)] },
        caption: "When Sulayman (AS) passed away, he was leaning on his staff. The jinn kept working, thinking he was watching them! Only when a little creature ate through the staff and it fell did they realise — the jinn don't know the unseen, only Allah does.",
        quran: { text: 'Nothing indicated his death to them except a creature of the earth eating his staff.', ref: "Saba' 34:14" },
        sfx: 'CRACK!',
      },
    ],
    lessons: [
      'The more Allah gives you, the more you should thank Him.',
      'Be kind even to the tiniest creatures, like the ant.',
      'Invite others to Allah with wisdom and good manners.',
      'Only Allah knows the unseen.',
    ],
    sources: ['Surah An-Naml 27:15-44', "Surah Saba' 34:12-14", 'Surah Sad 38:30-40', 'Surah Al-Anbiya 21:78-82'],
  },

  // ───────────────────────────── Ilyas ─────────────────────────────
  {
    id: 'ilyas',
    prophet: 'Prophet Ilyas',
    arabic: 'إلياس',
    title: 'The Idol Called Ba‘l',
    tagline: 'One brave voice against a giant idol.',
    tint: '#8ED3CB',
    cover: {
      sky: 'dusk',
      ground: 'city',
      props: [p('idol', 0.6, 0.82, 1.0, 'shake'), p('light', 0.25, 0.75, 0.8, 'pulse'), p('sun', 0.85, 0.4, 0.4)],
    },
    panels: [
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('idol', 0.55, 0.82, 1.2), p('house', 0.2, 0.82, 0.6), p('house', 0.85, 0.82, 0.5)] },
        caption: "Long ago, in a land of Bani Israil, people built a huge idol called Ba‘l. They bowed before it, brought it gifts and asked it for help — even though it couldn't hear or see anything.",
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('light', 0.3, 0.75, 0.9, 'pulse'), p('idol', 0.75, 0.82, 0.8), p('sun', 0.85, 0.3, 0.4)] },
        caption: "Allah sent Prophet Ilyas (AS) to them. He stood up bravely in front of everyone and called them back to Allah, the One who created them and their forefathers.",
        bubble: { speaker: 'Ilyas (AS)', text: 'Will you not fear Allah? Do you call upon Ba‘l and leave the Best of creators — Allah, your Lord and the Lord of your forefathers?' },
      },
      {
        scene: { sky: 'storm', ground: 'city', props: [p('cloud', 0.3, 0.3, 0.8, 'drift'), p('lightning', 0.6, 0.45, 0.5, 'twinkle'), p('idol', 0.7, 0.82, 0.8)], action: true },
        caption: "But most of the people refused to listen. They called him a liar and turned away from the truth.",
        quran: { text: 'But they denied him, so indeed they will be brought [for punishment].', ref: 'As-Saffat 37:127' },
        sfx: 'BOOM!',
      },
      {
        scene: { sky: 'night', ground: 'mountains', props: [p('moon', 0.7, 0.35, 0.5, 'pulse'), p('lamp', 0.35, 0.82, 0.5, 'flicker'), p('star', 0.2, 0.25, 0.3, 'twinkle')] },
        caption: "Ilyas (AS) stayed patient and kept calling to Allah. A few sincere believers followed him, and Allah saved His chosen servants.",
        quran: { text: 'Except the chosen servants of Allah.', ref: 'As-Saffat 37:128' },
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('light', 0.5, 0.75, 1.0, 'pulse'), p('dove', 0.3, 0.4, 0.5, 'fly'), p('flower', 0.75, 0.82, 0.5, 'sway')] },
        caption: "Allah honoured Ilyas (AS) forever. Every time we read the Quran, we read Allah sending peace upon him and calling him one of the righteous.",
        quran: { text: 'Peace be upon Ilyas. Indeed, We thus reward the doers of good.', ref: 'As-Saffat 37:130-131' },
      },
    ],
    lessons: [
      'Worship Allah alone — idols cannot help anyone.',
      'Speak the truth bravely, even if most people disagree.',
      'Allah honours those who stay patient on the right path.',
    ],
    sources: ['Surah As-Saffat 37:123-132', "Surah Al-An'am 6:85", 'Qasas al-Anbiya (Ibn Kathir)'],
  },

  // ───────────────────────────── Al-Yasa' ─────────────────────────────
  {
    id: 'alyasa',
    prophet: "Prophet Al-Yasa'",
    arabic: 'اليسع',
    title: 'The Quiet Helper',
    tagline: 'We know only a little about him — but Allah calls him one of the best.',
    tint: '#9DC3E6',
    cover: {
      sky: 'dawn',
      ground: 'grass',
      props: [p('lamp', 0.5, 0.82, 0.7, 'flicker'), p('sun', 0.75, 0.4, 0.5, 'rise'), p('dove', 0.3, 0.35, 0.4, 'fly')],
    },
    panels: [
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('scroll', 0.5, 0.8, 0.7, 'bob'), p('sun', 0.8, 0.4, 0.5, 'rise'), p('tree', 0.2, 0.82, 0.8, 'sway')] },
        caption: "Al-Yasa' (AS) is a prophet named twice in the Quran. Allah didn't tell us his whole story — and that's okay! What Allah tells us is exactly what we need.",
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('lamp', 0.3, 0.82, 0.5, 'flicker'), p('house', 0.65, 0.82, 0.7), p('house', 0.85, 0.82, 0.5)] },
        caption: "Scholars like Ibn Kathir tell us that Al-Yasa' (AS) came after Prophet Ilyas (AS). He carried on his work, gently calling the people of Bani Israil to worship Allah alone.",
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('light', 0.5, 0.75, 1.0, 'pulse'), p('sparkles', 0.25, 0.35, 0.5, 'twinkle'), p('sparkles', 0.75, 0.3, 0.5, 'twinkle')] },
        caption: "Allah praises Al-Yasa' (AS) together with other great prophets. He was chosen, trusted and favoured above others of his time.",
        quran: { text: "And remember Isma'il, Al-Yasa' and Dhul-Kifl — all are among the best.", ref: 'Sad 38:48' },
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('moon', 0.7, 0.35, 0.5, 'pulse'), p('star', 0.3, 0.25, 0.35, 'twinkle'), p('heart', 0.45, 0.6, 0.5, 'pulse')] },
        caption: "Some good people are quiet. Nobody writes long stories about them — but Allah sees every good deed. Like Al-Yasa' (AS), we can do good even when no one is watching.",
        quran: { text: "And Isma'il, Al-Yasa', Yunus and Lut — and all of them We preferred over the worlds.", ref: "Al-An'am 6:86" },
      },
    ],
    lessons: [
      'Allah honours good people even if we know little about them.',
      'Do good quietly — Allah sees everything.',
      'Continue the good work of those who came before you.',
    ],
    sources: ["Surah Al-An'am 6:86", 'Surah Sad 38:48', 'Qasas al-Anbiya (Ibn Kathir)'],
  },

  // ───────────────────────────── Yunus ─────────────────────────────
  {
    id: 'yunus',
    prophet: 'Prophet Yunus',
    arabic: 'يونس',
    title: 'Three Darknesses and One Dua',
    tagline: 'Swallowed by a whale, saved by a prayer.',
    tint: '#9DC3E6',
    cover: {
      sky: 'night',
      ground: 'sea',
      props: [p('whale', 0.5, 0.85, 1.3, 'bob'), p('moon', 0.8, 0.3, 0.5, 'pulse'), p('star', 0.2, 0.25, 0.3, 'twinkle')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'city', props: [p('house', 0.2, 0.82, 0.7), p('house', 0.45, 0.82, 0.6), p('palace', 0.75, 0.82, 0.8), p('sun', 0.85, 0.3, 0.45)] },
        caption: "Prophet Yunus (AS) was sent to the big city of Nineveh, home to more than one hundred thousand people. They worshipped idols and did not know Allah.",
        quran: { text: 'And We sent him to [his people of] a hundred thousand or more.', ref: 'As-Saffat 37:147' },
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('idol', 0.65, 0.82, 0.8), p('house', 0.25, 0.82, 0.6), p('wind', 0.4, 0.4, 0.6, 'drift')] },
        caption: "Yunus (AS) called them to Allah day after day. But they laughed and turned their backs. His heart grew heavy and tired.",
        bubble: { speaker: 'Yunus (AS)', text: 'Worship Allah alone! Leave these idols — they cannot help you!' },
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('footprints', 0.45, 0.85, 0.8), p('house', 0.1, 0.82, 0.4), p('sun', 0.8, 0.5, 0.6, 'sink')] },
        caption: "Feeling upset, Yunus (AS) left the city before Allah had given him permission to leave. He walked away towards the sea.",
        quran: { text: 'And [mention] Dhun-Nun, when he went off in anger and thought that We would not decree [anything] upon him.', ref: "Al-Anbiya' 21:87" },
      },
      {
        scene: { sky: 'storm', ground: 'sea', props: [p('boat', 0.5, 0.82, 1.1, 'sway'), p('wave', 0.2, 0.88, 0.7, 'bob'), p('wave', 0.8, 0.88, 0.7, 'bob'), p('lightning', 0.7, 0.4, 0.5, 'twinkle'), p('rain', 0.5, 0.5, 1.0)], action: true },
        caption: "He boarded a ship full of people. Far out at sea, a terrible storm struck! Waves crashed over the deck and the heavy ship rocked wildly.",
        sfx: 'CRASH!',
      },
      {
        scene: { sky: 'storm', ground: 'sea', props: [p('boat', 0.5, 0.82, 1.0, 'shake'), p('stones', 0.5, 0.55, 0.4, 'spin'), p('wave', 0.15, 0.88, 0.6, 'bob')], action: true },
        caption: "The sailors said the ship was too heavy — someone had to go overboard. They drew lots, and the name chosen was Yunus (AS). They drew again and again, and each time it was him.",
        quran: { text: 'And he drew lots and was among the losers.', ref: 'As-Saffat 37:141' },
      },
      {
        scene: { sky: 'underwater', ground: 'seabed', props: [p('whale', 0.5, 0.75, 1.4, 'bob'), p('fish', 0.2, 0.4, 0.35, 'drift'), p('fish', 0.8, 0.35, 0.3, 'drift')], action: true },
        caption: "Yunus (AS) went into the deep, dark sea. By Allah's command, a gigantic whale opened its mouth and swallowed him whole — but did not hurt him!",
        quran: { text: 'Then the whale swallowed him, while he was blameworthy.', ref: 'As-Saffat 37:142' },
        sfx: 'GULP!',
      },
      {
        scene: { sky: 'dark', ground: 'seabed', props: [p('heart', 0.5, 0.6, 0.6, 'pulse'), p('star', 0.3, 0.3, 0.2, 'twinkle')] },
        caption: "It was so dark! The darkness of the night, the darkness of the deep sea, and the darkness inside the whale's belly. Yunus (AS) was alone — but not really, because Allah was with him.",
      },
      {
        scene: { sky: 'dark', ground: 'none', props: [p('light', 0.5, 0.75, 0.9, 'pulse'), p('sparkles', 0.3, 0.35, 0.4, 'twinkle'), p('sparkles', 0.7, 0.4, 0.4, 'twinkle')] },
        caption: "In the darkness, Yunus (AS) turned to Allah with all his heart. He admitted his mistake and called out the most beautiful dua.",
        quran: { text: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.', ref: "Al-Anbiya' 21:87" },
      },
      {
        scene: { sky: 'golden', ground: 'sea', props: [p('whale', 0.5, 0.85, 1.1, 'bob'), p('light', 0.5, 0.6, 0.8, 'pulse'), p('fish', 0.2, 0.85, 0.3, 'bob')] },
        caption: "Allah heard him and saved him from his sorrow. Our Prophet ﷺ taught us that whenever a Muslim makes this same dua about anything, Allah answers him.",
        quran: { text: 'So We responded to him and saved him from the distress. And thus do We save the believers.', ref: "Al-Anbiya' 21:88" },
      },
      {
        scene: { sky: 'day', ground: 'sea', props: [p('whale', 0.3, 0.88, 0.9, 'sink'), p('gourd', 0.75, 0.82, 0.8, 'sway'), p('sun', 0.85, 0.3, 0.5, 'pulse')] },
        caption: "The whale swam to the shore and gently cast Yunus (AS) out onto the sand. He was weak and sick, so Allah grew a leafy gourd plant over him to give him shade and food.",
        quran: { text: 'And We caused to grow over him a gourd vine.', ref: 'As-Saffat 37:146' },
        sfx: 'SPLOOSH!',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('house', 0.25, 0.82, 0.7), p('mosque', 0.6, 0.82, 0.8), p('sun', 0.85, 0.4, 0.5, 'rise'), p('sparkles', 0.45, 0.3, 0.5, 'twinkle')] },
        caption: "Back in Nineveh, something amazing had happened: the whole city had believed in Allah and asked for forgiveness! Allah removed the punishment from them. Yunus (AS) returned to a city of believers.",
        quran: { text: 'And they believed, so We gave them enjoyment [of life] for a time.', ref: 'As-Saffat 37:148' },
      },
    ],
    lessons: [
      "Be patient, and don't give up on people too quickly.",
      'When you make a mistake, admit it and say sorry to Allah.',
      'No darkness is too deep for Allah to hear your dua.',
      "Memorise Yunus (AS)'s dua and use it when you are worried.",
    ],
    sources: ["Surah Al-Anbiya' 21:87-88", 'Surah As-Saffat 37:139-148', 'Surah Yunus 10:98', 'Surah Al-Qalam 68:48-50', 'Jami at-Tirmidhi 3505'],
  },

  // ───────────────────────────── Zakariya ─────────────────────────────
  {
    id: 'zakariya',
    prophet: 'Prophet Zakariya',
    arabic: 'زكريا',
    title: 'The Secret Dua',
    tagline: 'An old man, a quiet prayer and a miracle baby.',
    tint: '#F4B48A',
    cover: {
      sky: 'night',
      ground: 'floor',
      props: [p('mihrab', 0.5, 0.82, 1.0), p('lamp', 0.5, 0.6, 0.4, 'flicker'), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('moon', 0.82, 0.3, 0.45)],
    },
    panels: [
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('mihrab', 0.5, 0.82, 1.1), p('lamp', 0.25, 0.82, 0.45, 'flicker')] },
        caption: "Prophet Zakariya (AS) was a kind, old prophet who served in the house of worship in Jerusalem. He was chosen to look after a special girl named Maryam, who prayed in a small room called the mihrab.",
        quran: { text: 'And He put her in the care of Zakariya.', ref: "Al 'Imran 3:37" },
      },
      {
        scene: { sky: 'golden', ground: 'floor', props: [p('mihrab', 0.3, 0.82, 0.8), p('basket', 0.65, 0.82, 0.6, 'bob'), p('dates', 0.82, 0.82, 0.45), p('sparkles', 0.7, 0.4, 0.5, 'twinkle')] },
        caption: "Every time Zakariya (AS) visited her, he found fresh fruit beside her — summer fruit in winter, and winter fruit in summer! He asked where it came from.",
        bubble: { speaker: 'Maryam', text: 'It is from Allah. Indeed, Allah provides for whom He wills without measure.' },
      },
      {
        scene: { sky: 'night', ground: 'floor', props: [p('moon', 0.75, 0.35, 0.55, 'pulse'), p('lamp', 0.4, 0.82, 0.5, 'flicker'), p('star', 0.2, 0.25, 0.3, 'twinkle')] },
        caption: "This filled Zakariya (AS) with hope. He was very old and his wife could not have children. In the quiet of the night, he whispered a secret dua to Allah.",
        quran: { text: 'My Lord, indeed my bones have weakened, and my head has filled with white, and never have I been unhappy in my supplication to You, my Lord.', ref: 'Maryam 19:4' },
      },
      {
        scene: { sky: 'golden', ground: 'floor', props: [p('mihrab', 0.5, 0.82, 1.0), p('light', 0.5, 0.7, 1.0, 'pulse'), p('sparkles', 0.25, 0.35, 0.5, 'spin')], action: true },
        caption: "While he was standing in prayer, the angels called out to him with wonderful news!",
        quran: { text: 'O Zakariya, indeed We give you good tidings of a boy whose name will be Yahya. We have not given this name to anyone before.', ref: 'Maryam 19:7' },
        sfx: 'SHINE!',
      },
      {
        scene: { sky: 'dusk', ground: 'floor', props: [p('cradle', 0.5, 0.82, 0.7, 'sway'), p('heart', 0.75, 0.45, 0.4, 'pulse')] },
        caption: "Zakariya (AS) was amazed and full of joy. He was so old — how could it happen? But nothing is hard for Allah.",
        bubble: { speaker: 'Zakariya (AS)', text: 'My Lord, how will I have a boy when my wife cannot have children and I have reached old age?' },
        quran: { text: 'It is easy for Me, for I created you before, while you were nothing.', ref: 'Maryam 19:9' },
      },
      {
        scene: { sky: 'dawn', ground: 'floor', props: [p('mihrab', 0.3, 0.82, 0.8), p('sun', 0.8, 0.45, 0.5, 'rise'), p('sparkles', 0.6, 0.35, 0.4, 'twinkle')] },
        caption: "Allah gave him a sign: for three days he could not speak to people, even though he was perfectly healthy. So he made signs with his hands, telling everyone to glorify Allah morning and evening.",
        quran: { text: 'Your sign is that you will not speak to the people for three nights, being sound.', ref: 'Maryam 19:10' },
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('cradle', 0.5, 0.82, 0.8, 'sway'), p('flower', 0.2, 0.82, 0.5, 'sway'), p('flower', 0.8, 0.82, 0.45, 'sway'), p('dove', 0.7, 0.35, 0.4, 'fly')] },
        caption: "And just as Allah promised, baby Yahya was born! Allah tells us why Zakariya's family was so blessed.",
        quran: { text: 'Indeed, they used to hasten to good deeds and call upon Us in hope and fear, and they were humble before Us.', ref: "Al-Anbiya' 21:90" },
      },
    ],
    lessons: [
      'Never stop making dua, no matter how impossible it seems.',
      'Quiet, secret duas are beloved to Allah.',
      'Everything we have is provision from Allah.',
      'Remember Allah morning and evening.',
    ],
    sources: ['Surah Maryam 19:1-15', "Surah Al 'Imran 3:37-41", "Surah Al-Anbiya' 21:89-90"],
  },

  // ───────────────────────────── Yahya ─────────────────────────────
  {
    id: 'yahya',
    prophet: 'Prophet Yahya',
    arabic: 'يحيى',
    title: 'Wise From a Young Age',
    tagline: 'A gentle heart, a strong hold on the Book.',
    tint: '#8FD1B0',
    cover: {
      sky: 'day',
      ground: 'garden',
      props: [p('scroll', 0.5, 0.8, 0.7, 'bob'), p('dove', 0.25, 0.35, 0.5, 'fly'), p('sun', 0.8, 0.35, 0.5, 'pulse')],
    },
    panels: [
      {
        scene: { sky: 'dawn', ground: 'garden', props: [p('cradle', 0.5, 0.82, 0.8, 'sway'), p('sparkles', 0.3, 0.35, 0.5, 'twinkle'), p('sun', 0.8, 0.4, 0.5, 'rise')] },
        caption: "Yahya (AS) was the miracle son of Prophet Zakariya (AS). Allah chose his name Himself — nobody had ever been called Yahya before!",
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('scroll', 0.5, 0.78, 0.8, 'pulse'), p('light', 0.5, 0.7, 0.9, 'pulse')] },
        caption: "While he was still a young boy, Allah gave Yahya (AS) wisdom and understanding. Other children played, but Yahya loved to learn the Book of Allah.",
        quran: { text: 'O Yahya, take the Scripture with determination. And We gave him wisdom while he was a child.', ref: 'Maryam 19:12' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('heart', 0.5, 0.5, 0.7, 'pulse'), p('dove', 0.25, 0.4, 0.5, 'fly'), p('sheep', 0.75, 0.82, 0.5, 'bob')] },
        caption: "Yahya (AS) was soft-hearted and kind to everyone — people and animals alike. His heart was pure and he always tried to stay away from wrong.",
        quran: { text: 'And affection from Us and purity, and he was fearing of Allah.', ref: 'Maryam 19:13' },
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('house', 0.5, 0.82, 0.9), p('lamp', 0.8, 0.82, 0.4, 'flicker'), p('heart', 0.5, 0.35, 0.4, 'pulse')] },
        caption: "He was always good to his old parents, helping them and speaking gently. He was never proud or disobedient.",
        quran: { text: 'And dutiful to his parents, and he was not a disobedient tyrant.', ref: 'Maryam 19:14' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('mosque', 0.5, 0.82, 1.0), p('sun', 0.85, 0.3, 0.45), p('birds', 0.25, 0.3, 0.5, 'fly')] },
        caption: "Our Prophet ﷺ told us that Yahya (AS) gathered the people in the holy house of worship and taught them five things: worship Allah alone, pray, fast, give charity, and remember Allah often.",
        bubble: { speaker: 'Yahya (AS)', text: 'Remember Allah often — it is like a fortress that protects you from Shaytan!' },
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('light', 0.5, 0.75, 1.0, 'pulse'), p('flower', 0.2, 0.82, 0.5, 'sway'), p('flower', 0.8, 0.82, 0.5, 'sway'), p('sparkles', 0.5, 0.3, 0.5, 'spin')] },
        caption: "Allah sent special peace upon Yahya (AS) — at every moment of his life and beyond.",
        quran: { text: 'And peace be upon him the day he was born, the day he dies, and the day he is raised alive.', ref: 'Maryam 19:15' },
      },
    ],
    lessons: [
      'You are never too young to learn and love the Quran.',
      'Be gentle and kind-hearted to everyone.',
      'Be good to your parents.',
      'Remembering Allah protects you.',
    ],
    sources: ['Surah Maryam 19:7-15', "Surah Al 'Imran 3:39", 'Jami at-Tirmidhi 2863'],
  },

  // ───────────────────────────── Isa ─────────────────────────────
  {
    id: 'isa',
    prophet: 'Prophet Isa',
    arabic: 'عيسى',
    title: 'The Miracle Messenger',
    tagline: 'Born by a miracle, speaking from the cradle, raised up by Allah.',
    tint: '#AEB6EE',
    cover: {
      sky: 'golden',
      ground: 'desert',
      props: [p('palm', 0.35, 0.82, 1.1, 'sway'), p('star', 0.75, 0.3, 0.4, 'twinkle'), p('birds', 0.6, 0.4, 0.6, 'fly'), p('cradle', 0.65, 0.82, 0.5)],
    },
    panels: [
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('mihrab', 0.5, 0.82, 1.1), p('lamp', 0.2, 0.82, 0.45, 'flicker'), p('sparkles', 0.75, 0.35, 0.4, 'twinkle')] },
        caption: "Maryam was the most pure and pious woman. She spent her days worshipping Allah in her quiet prayer room. Allah chose her above all the women of the world.",
        quran: { text: 'O Maryam, indeed Allah has chosen you and purified you and chosen you above the women of the worlds.', ref: "Al 'Imran 3:42" },
      },
      {
        scene: { sky: 'golden', ground: 'floor', props: [p('light', 0.5, 0.75, 1.2, 'pulse'), p('sparkles', 0.25, 0.3, 0.6, 'spin'), p('sparkles', 0.75, 0.35, 0.5, 'spin')], action: true },
        caption: "One day, Allah sent the angel Jibril to her with astonishing news: she would have a baby boy — a special messenger from Allah!",
        quran: { text: 'O Maryam, Allah gives you good tidings of a word from Him, whose name will be the Messiah, Isa, the son of Maryam.', ref: "Al 'Imran 3:45" },
        sfx: 'GLOW!',
      },
      {
        scene: { sky: 'dusk', ground: 'floor', props: [p('mihrab', 0.3, 0.82, 0.8), p('heart', 0.7, 0.45, 0.5, 'pulse')] },
        caption: "Maryam was amazed — she had no husband! But Allah creates whatever He wills. He created Adam (AS) with no father and no mother, and He can create Isa with no father.",
        bubble: { speaker: 'Maryam', text: 'How can I have a boy when no man has touched me?' },
        quran: { text: 'Thus Allah creates what He wills. When He decrees a matter, He only says to it, "Be," and it is.', ref: "Al 'Imran 3:47" },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('palm', 0.5, 0.82, 1.3, 'sway'), p('dates', 0.45, 0.55, 0.4, 'sink'), p('spring', 0.75, 0.84, 0.6, 'pulse'), p('sun', 0.85, 0.3, 0.4)] },
        caption: "When the time came, Maryam went to a far place and rested against a palm tree. She was in pain and felt alone. Then Allah comforted her: a stream of cool water flowed beneath her, and she was told to shake the palm tree — fresh, sweet dates fell down!",
        quran: { text: 'And shake toward you the trunk of the palm tree; it will drop upon you ripe, fresh dates.', ref: 'Maryam 19:25' },
        sfx: 'THUMP THUMP!',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('cradle', 0.5, 0.82, 0.7), p('house', 0.15, 0.82, 0.6), p('house', 0.85, 0.82, 0.6)], action: true },
        caption: "Maryam came back to her people carrying her baby. They were shocked and began accusing her. Allah had told her not to argue, so she stayed silent.",
        bubble: { speaker: 'The people', text: 'O Maryam! You have done a terrible thing! Your father was a good man and your mother was pure!' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('cradle', 0.5, 0.82, 0.9, 'sway'), p('house', 0.15, 0.82, 0.5)] },
        caption: "Maryam simply pointed to the baby. The people grew even angrier — how can anyone talk to a newborn baby?",
        bubble: { speaker: 'The people', text: 'How can we speak to a baby in the cradle?' },
      },
      {
        scene: { sky: 'golden', ground: 'city', props: [p('cradle', 0.5, 0.82, 1.0, 'pulse'), p('sparkles', 0.3, 0.35, 0.6, 'spin'), p('sparkles', 0.7, 0.4, 0.6, 'spin'), p('light', 0.5, 0.7, 0.8, 'pulse')], action: true },
        caption: "Then — a miracle! The tiny baby Isa (AS) spoke, clearly and beautifully, defending his mother and telling everyone who he was.",
        bubble: { speaker: 'Baby Isa (AS)', text: 'Indeed, I am the servant of Allah. He has given me the Scripture and made me a prophet.' },
        sfx: 'GASP!',
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('scroll', 0.5, 0.8, 0.8, 'bob'), p('light', 0.5, 0.75, 1.0, 'pulse'), p('dove', 0.8, 0.35, 0.4, 'fly')] },
        caption: "Isa (AS) grew up to be a messenger to Bani Israil. Allah gave him a holy book called the Injil, full of guidance and light.",
        quran: { text: 'And We gave him the Injil, in which was guidance and light.', ref: "Al-Ma'idah 5:46" },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('birds', 0.5, 0.35, 0.9, 'fly'), p('rock', 0.3, 0.82, 0.4), p('sparkles', 0.6, 0.5, 0.5, 'twinkle')], action: true },
        caption: "Allah gave Isa (AS) amazing miracles to show he was truly a prophet. He shaped a bird out of clay, breathed into it — and it flapped its wings and flew away, by Allah's permission!",
        bubble: { speaker: 'Isa (AS)', text: 'I make for you from clay the form of a bird, then I breathe into it, and it becomes a bird by permission of Allah.' },
        sfx: 'FLAP FLAP!',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('heart', 0.5, 0.5, 0.7, 'pulse'), p('sparkles', 0.3, 0.35, 0.5, 'twinkle'), p('sparkles', 0.7, 0.3, 0.5, 'twinkle'), p('house', 0.85, 0.82, 0.5)] },
        caption: "By Allah's permission, he healed people who were born blind and those with painful skin disease, and even brought the dead back to life. But Isa (AS) always reminded them: this is Allah's power, not mine.",
        quran: { text: 'And I cure the blind and the leper, and I give life to the dead — by permission of Allah.', ref: "Al 'Imran 3:49" },
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('bread', 0.4, 0.75, 0.6, 'sink'), p('fish', 0.6, 0.75, 0.5, 'sink'), p('light', 0.5, 0.6, 1.0, 'pulse'), p('cloud', 0.5, 0.25, 0.6, 'drift')] },
        caption: "His close followers, the disciples, asked for a table of food from the sky. Isa (AS) prayed to Allah, and Allah sent it down as a sign and a blessing.",
        bubble: { speaker: 'Isa (AS)', text: 'O Allah, our Lord, send down to us a table spread with food from the heaven, to be a festival for us and a sign from You.' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('light', 0.5, 0.75, 0.9, 'pulse'), p('sun', 0.8, 0.3, 0.5, 'pulse'), p('scroll', 0.25, 0.8, 0.5)] },
        caption: "Isa (AS) taught everyone the same message as all the prophets before him: worship Allah alone. He never said he was God — he was a servant and messenger of Allah.",
        bubble: { speaker: 'Isa (AS)', text: 'Indeed, Allah is my Lord and your Lord, so worship Him. That is the straight path.' },
      },
      {
        scene: { sky: 'night', ground: 'city', props: [p('light', 0.5, 0.75, 1.1, 'rise'), p('moon', 0.8, 0.3, 0.5), p('star', 0.2, 0.25, 0.3, 'twinkle'), p('star', 0.35, 0.15, 0.25, 'twinkle')], action: true },
        caption: "Some enemies made a wicked plan to kill him. But Allah's plan was greater. They did not kill him and they did not crucify him — Allah saved Isa (AS) and raised him up to Himself.",
        quran: { text: 'They did not kill him, nor did they crucify him… Rather, Allah raised him to Himself. And Allah is ever Exalted in Might and Wise.', ref: "An-Nisa' 4:157-158" },
        sfx: 'WHOOSH!',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('mosque', 0.5, 0.82, 1.0), p('sun', 0.8, 0.45, 0.6, 'rise'), p('dove', 0.25, 0.35, 0.4, 'fly')] },
        caption: "Our Prophet ﷺ told us that Isa (AS) will return before the Day of Judgement. He will come down near a white minaret in Damascus, follow Islam, and fill the earth with justice and peace.",
      },
    ],
    lessons: [
      'Allah can do anything — He only says "Be!" and it is.',
      'Isa (AS) is a beloved prophet and servant of Allah, and Muslims love him.',
      'Miracles happen only by Allah’s permission.',
      'Be kind and devoted to your mother, like Isa (AS).',
    ],
    sources: ["Surah Al 'Imran 3:42-59", 'Surah Maryam 19:16-36', "Surah Al-Ma'idah 5:46, 110-118", "Surah An-Nisa' 4:157-159", 'Sahih al-Bukhari 3448', 'Sahih Muslim 2937'],
  },

  // ───────────────────────────── Muhammad ﷺ ─────────────────────────────
  {
    id: 'muhammad',
    prophet: 'Prophet Muhammad ﷺ',
    arabic: 'محمد ﷺ',
    title: 'A Mercy to All the Worlds',
    tagline: 'The final Messenger — from the Year of the Elephant to the Farewell Sermon.',
    tint: '#8FD1B0',
    cover: {
      sky: 'golden',
      ground: 'desert',
      props: [p('kaaba', 0.5, 0.82, 1.0), p('light', 0.5, 0.6, 1.0, 'pulse'), p('moon', 0.8, 0.3, 0.45), p('palm', 0.15, 0.82, 0.8, 'sway')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'desert', props: [p('elephant', 0.3, 0.82, 1.0, 'bob'), p('elephant', 0.55, 0.82, 0.7, 'bob'), p('kaaba', 0.88, 0.82, 0.5), p('sun', 0.8, 0.3, 0.45)] },
        caption: "Long ago, a proud king of Yemen named Abrahah wanted everyone to stop visiting the Kaaba. So he marched towards Makkah with a huge army and giant war elephants to destroy it. The ground trembled under their heavy feet!",
        sfx: 'STOMP! STOMP!',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('elephant', 0.4, 0.82, 1.1, 'shake'), p('kaaba', 0.85, 0.82, 0.6), p('camel', 0.15, 0.82, 0.5)] },
        caption: "Near Makkah, the lead elephant suddenly knelt down and refused to walk towards the Kaaba — no matter how hard the soldiers pushed! The leader of Makkah, Abdul-Muttalib, had already said the Kaaba had its own Protector.",
        bubble: { speaker: 'Abdul-Muttalib', text: 'I am the owner of the camels. The House has a Lord who will protect it!' },
        sfx: 'THUD!',
      },
      {
        scene: { sky: 'storm', ground: 'desert', props: [p('birds', 0.3, 0.3, 1.0, 'fly'), p('birds', 0.65, 0.2, 0.8, 'fly'), p('stones', 0.5, 0.6, 0.5, 'sink'), p('elephant', 0.6, 0.82, 0.7, 'shake')], action: true },
        caption: "Then the sky filled with flocks of small birds! Each one carried tiny stones of baked clay and dropped them on the army. The mighty army was defeated, and the Kaaba stood safe.",
        quran: { text: 'And He sent against them birds in flocks, striking them with stones of baked clay.', ref: 'Al-Fil 105:3-4' },
        sfx: 'PING! PING! PING!',
      },
      {
        scene: { sky: 'dawn', ground: 'city', props: [p('kaaba', 0.6, 0.82, 0.7), p('house', 0.25, 0.82, 0.7), p('sun', 0.85, 0.45, 0.6, 'rise'), p('sparkles', 0.4, 0.3, 0.4, 'twinkle')] },
        caption: "In that very same year — the Year of the Elephant — a special baby was born in Makkah. His name was Muhammad ﷺ, and he would become the final Messenger of Allah.",
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('tent', 0.3, 0.82, 0.7), p('house', 0.7, 0.82, 0.6), p('moon', 0.85, 0.3, 0.4, 'pulse')] },
        caption: "His father Abdullah died before he was born, and his mother Aminah died when he was only six. He was cared for by his loving grandfather, and then by his uncle Abu Talib. But Allah was always taking care of him.",
        quran: { text: 'Did He not find you an orphan and give you shelter?', ref: 'Ad-Duha 93:6' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('sheep', 0.3, 0.82, 0.6, 'bob'), p('sheep', 0.5, 0.82, 0.5, 'bob'), p('camel', 0.78, 0.82, 0.8), p('sun', 0.85, 0.3, 0.4)] },
        caption: "As a young man he looked after sheep and later worked as a trader. He never lied and never cheated. Everyone in Makkah called him “Al-Amin” — the Trustworthy One — and kept their valuables with him.",
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('kaaba', 0.5, 0.82, 1.0), p('shirt', 0.5, 0.88, 0.6, 'rise'), p('rock', 0.5, 0.65, 0.25, 'rise')] },
        caption: "When the Kaaba was being rebuilt, the tribes argued about who would place the sacred Black Stone. They almost fought! Then Muhammad ﷺ placed the stone on a cloth, and every tribe held a corner and lifted it together. Problem solved — peacefully!",
        bubble: { speaker: 'The people of Makkah', text: 'It is Al-Amin! We accept his decision!' },
      },
      {
        scene: { sky: 'night', ground: 'mountains', props: [p('mountain', 0.5, 0.82, 1.3), p('cave', 0.5, 0.65, 0.5), p('moon', 0.8, 0.3, 0.5, 'pulse'), p('star', 0.2, 0.2, 0.3, 'twinkle'), p('star', 0.35, 0.3, 0.25, 'twinkle')] },
        caption: "When he was about forty, Muhammad ﷺ often went to a quiet cave called Hira on top of a mountain near Makkah. There he would think about Allah and worship Him, far from the noise of the city.",
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('cave', 0.5, 0.8, 1.0), p('light', 0.5, 0.75, 1.3, 'pulse'), p('sparkles', 0.25, 0.3, 0.6, 'spin'), p('sparkles', 0.75, 0.35, 0.6, 'spin')], action: true },
        caption: "One night in Ramadan, the cave filled with light — the angel Jibril had come! He said “Read!” and Muhammad ﷺ answered, “I am not a reader.” Then Jibril recited the very first words of the Quran.",
        quran: { text: 'Read in the name of your Lord who created — created man from a clinging clot. Read, and your Lord is the Most Generous.', ref: "Al-'Alaq 96:1-3" },
        sfx: 'IQRA!',
      },
      {
        scene: { sky: 'night', ground: 'floor', props: [p('house', 0.5, 0.82, 1.0), p('lamp', 0.75, 0.82, 0.45, 'flicker'), p('heart', 0.3, 0.45, 0.5, 'pulse')] },
        caption: "He hurried home, his heart trembling. His wife Khadijah wrapped him in a blanket and comforted him with loving words. She became the very first person to believe in him.",
        bubble: { speaker: 'Khadijah (RA)', text: 'Allah will never disgrace you! You are kind to your family, you help the weak and the poor, and you are generous to guests.' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('mountain', 0.4, 0.82, 1.0), p('kaaba', 0.82, 0.82, 0.5), p('sun', 0.8, 0.3, 0.4)] },
        caption: "Allah commanded him to call the people. He climbed Mount Safa and asked: “If I told you an army was behind this hill, would you believe me?” They all said yes — he had never lied! Then he called them to worship Allah alone.",
        bubble: { speaker: 'The people of Quraysh', text: 'We have never known you to tell a lie!' },
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('rock', 0.5, 0.82, 1.1), p('sun', 0.8, 0.35, 0.7, 'pulse'), p('heart', 0.3, 0.45, 0.4, 'pulse')], action: true },
        caption: "Many leaders of Makkah became angry. They mocked the Prophet ﷺ and hurt the believers. Bilal, a Muslim slave, was laid on hot sand with a heavy rock on his chest — but he would not give up his faith!",
        bubble: { speaker: 'Bilal (RA)', text: 'Ahad! Ahad! (Allah is One! Allah is One!)' },
      },
      {
        scene: { sky: 'dusk', ground: 'garden', props: [p('stones', 0.4, 0.75, 0.6, 'sink'), p('tree', 0.75, 0.82, 0.8, 'sway'), p('mountain', 0.2, 0.82, 0.8)] },
        caption: "He travelled to the town of Ta'if to invite them to Islam. They chased him out and threw stones until his feet bled. The angel of the mountains offered to crush the town — but the Prophet ﷺ chose mercy instead.",
        bubble: { speaker: 'Prophet Muhammad ﷺ', text: 'No — I hope that Allah will bring from their children people who will worship Allah alone.' },
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('footprints', 0.4, 0.85, 0.8), p('moon', 0.8, 0.3, 0.5, 'pulse'), p('camel', 0.75, 0.82, 0.6), p('star', 0.2, 0.2, 0.3, 'twinkle')] },
        caption: "Allah gave permission to move to the city of Madinah — the Hijrah. In the dark of night, the Prophet ﷺ slipped out of Makkah with his best friend Abu Bakr, while enemies waited outside his house.",
      },
      {
        scene: { sky: 'night', ground: 'mountains', props: [p('cave', 0.5, 0.8, 1.0), p('web', 0.5, 0.62, 0.6, 'pulse'), p('dove', 0.72, 0.65, 0.4, 'bob'), p('footprints', 0.2, 0.86, 0.5)], action: true },
        caption: "They hid in the cave of Thawr. The enemies tracked them right to the entrance! But a spider had spun a web across it and a dove had nested there, so the enemies thought nobody was inside. Abu Bakr was worried, but the Prophet ﷺ was calm.",
        quran: { text: 'Do not grieve; indeed Allah is with us.', ref: 'At-Tawbah 9:40' },
        sfx: 'SHHH…',
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('mosque', 0.5, 0.82, 1.1), p('palm', 0.15, 0.82, 0.9, 'sway'), p('palm', 0.88, 0.82, 0.8, 'sway'), p('sun', 0.75, 0.25, 0.4, 'pulse')] },
        caption: "The people of Madinah welcomed him with huge joy! He helped build the first mosques with his own hands, carrying bricks with everyone. The Muslims of Makkah and Madinah became like brothers.",
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('kaaba', 0.5, 0.82, 1.0), p('idol', 0.2, 0.82, 0.6, 'shake'), p('idol', 0.82, 0.82, 0.55, 'shake'), p('light', 0.5, 0.6, 0.9, 'pulse')], action: true },
        caption: "Years later, the Prophet ﷺ returned to Makkah with ten thousand believers — almost without a fight. He forgave the people who had hurt him for so long. Then he cleared all 360 idols away from the Kaaba.",
        quran: { text: 'Truth has come, and falsehood has vanished. Indeed, falsehood is bound to vanish.', ref: "Al-Isra' 17:81" },
        sfx: 'CRASH!',
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('mountain', 0.5, 0.82, 1.1), p('sun', 0.8, 0.3, 0.5, 'pulse'), p('heart', 0.25, 0.4, 0.5, 'pulse'), p('scroll', 0.75, 0.8, 0.4)] },
        caption: "At his Farewell Hajj, on the plain of Arafat, he taught everyone: all people are equal — no one is better except by goodness and taqwa. Be kind, be fair and hold on to the Quran. He was sent as a mercy to the whole world.",
        quran: { text: 'And We have not sent you except as a mercy to the worlds.', ref: "Al-Anbiya' 21:107" },
      },
    ],
    lessons: [
      'Allah protects what is His — just like He protected the Kaaba.',
      'Be honest and trustworthy so people call you “Al-Amin” too.',
      'Answer harm with patience, mercy and forgiveness.',
      'Send salawat on the Prophet ﷺ: Allahumma salli ‘ala Muhammad!',
    ],
    sources: [
      'Surah Al-Fil 105',
      'Surah Ad-Duha 93:6-8',
      "Surah Al-'Alaq 96:1-5",
      'Surah At-Tawbah 9:40',
      "Surah Al-Isra' 17:81",
      "Surah Al-Anbiya' 21:107",
      'Sahih al-Bukhari 3, 3231, 3653, 4287, 4770',
      'Ar-Raheeq al-Makhtum (seerah)',
    ],
  },
];
