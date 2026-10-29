// Stories: Ishaq, Yaqub, Yusuf, Ayyub, Shu'ayb, Musa, Harun, Dhul-Kifl (peace be upon them all).
// Sources: the Quran, sahih hadith and Ibn Kathir's Qasas al-Anbiya. People are never drawn.
import type { ComicAnim, ComicProp, ComicPropKind, ProphetStory } from '../types';

/** Shorthand for a scene prop. */
const p = (
  kind: ComicPropKind,
  x: number,
  y: number,
  scale = 1,
  anim: ComicAnim = 'none',
  extra: Partial<ComicProp> = {},
): ComicProp => ({ kind, x, y, scale, anim, ...extra });

const GOLD = '#E6AE4C';

export const groupB: ProphetStory[] = [
  // ───────────────────────────── ISHAQ ─────────────────────────────
  {
    id: 'ishaq',
    prophet: 'Prophet Ishaq',
    arabic: 'إسحاق',
    title: 'The Surprise Guests',
    tagline: 'Good news for an old couple who never stopped hoping.',
    tint: '#F2CF7E',
    cover: {
      sky: 'dusk',
      ground: 'desert',
      props: [p('tent', 0.35, 0.82, 1.1), p('star', 0.75, 0.3, 0.3, 'twinkle'), p('sparkles', 0.6, 0.45, 0.6, 'spin'), p('palm', 0.85, 0.82, 0.9, 'sway')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'desert', props: [p('tent', 0.4, 0.82, 1.1), p('palm', 0.82, 0.82, 0.9, 'sway'), p('sun', 0.15, 0.3, 0.5), p('cloud', 0.6, 0.25, 0.5, 'drift')] },
        caption: 'Prophet Ibrahim (AS) and his wife Sarah lived in a tent under the hot sun. They were kind and loved to welcome guests. But they were very old, and they had no children together.',
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('tent', 0.25, 0.82, 1), p('footprints', 0.65, 0.84, 0.8), p('wind', 0.7, 0.45, 0.6, 'drift')] },
        caption: 'One day, some guests appeared at the tent. They were angels sent by Allah, looking like men! Ibrahim (AS) did not know yet. He hurried to welcome them warmly.',
        bubble: { speaker: 'Ibrahim (AS)', text: 'Peace be upon you! Please, come in and rest.' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('tent', 0.3, 0.82, 1), p('fire', 0.68, 0.82, 0.6, 'flicker'), p('bread', 0.85, 0.82, 0.4), p('cup', 0.5, 0.82, 0.35)] },
        caption: 'Ibrahim (AS) quickly brought a fat roasted calf for them. The smell filled the air! But the guests did not touch the food. Ibrahim (AS) felt a little worried.',
        sfx: 'SIZZLE!',
        quran: { text: 'And he did not delay in bringing a roasted calf.', ref: 'Hud 11:69' },
      },
      {
        scene: { sky: 'golden', ground: 'desert', props: [p('light', 0.5, 0.75, 1.2, 'pulse'), p('sparkles', 0.3, 0.4, 0.6, 'spin'), p('sparkles', 0.72, 0.35, 0.5, 'spin'), p('tent', 0.15, 0.82, 0.7)] },
        caption: 'The guests said, "Do not be afraid! We are angels." Then they gave wonderful news: Sarah would have a baby boy named Ishaq, and after him a grandson named Yaqub!',
        quran: { text: 'And We gave her good tidings of Isaac and after Isaac, Jacob.', ref: 'Hud 11:71' },
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('tent', 0.4, 0.82, 1.1), p('heart', 0.72, 0.45, 0.5, 'pulse'), p('star', 0.85, 0.25, 0.3, 'twinkle')] },
        caption: 'Sarah was amazed and laughed with surprise. How could an old woman have a baby? The angels said that nothing is hard for Allah, and His mercy and blessings are upon this family.',
        bubble: { speaker: 'Sarah', text: 'Shall I have a child when I am old and my husband is an old man? This is amazing!' },
      },
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('cradle', 0.45, 0.82, 0.8, 'sway'), p('sun', 0.8, 0.4, 0.5), p('sparkles', 0.25, 0.4, 0.5, 'twinkle'), p('flower', 0.15, 0.82, 0.4, 'sway')] },
        caption: 'Just as Allah promised, baby Ishaq (AS) was born! He grew up to be a righteous prophet, calling people to worship Allah alone. And from his son Yaqub (AS) came many prophets.',
        quran: { text: 'And We gave him good tidings of Isaac, a prophet from among the righteous.', ref: 'As-Saffat 37:112' },
      },
    ],
    lessons: [
      'Never give up hoping for Allah\'s mercy, even when something seems impossible.',
      'Be generous and welcoming to guests, like Ibrahim (AS).',
      'Allah always keeps His promises.',
    ],
    sources: ['Surah Hud 11:69-73', 'Surah Adh-Dhariyat 51:24-30', 'Surah As-Saffat 37:112-113', 'Surah Al-Anbiya 21:72'],
  },

  // ───────────────────────────── YAQUB ─────────────────────────────
  {
    id: 'yaqub',
    prophet: 'Prophet Yaqub',
    arabic: 'يعقوب',
    title: 'The Beautiful Patience',
    tagline: 'A father who never lost hope in Allah.',
    tint: '#AEB6EE',
    cover: {
      sky: 'night',
      ground: 'grass',
      props: [p('house', 0.35, 0.82, 1), p('moon', 0.78, 0.35, 0.5), p('star', 0.6, 0.22, 0.3, 'twinkle'), p('heart', 0.55, 0.55, 0.4, 'pulse')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'grass', props: [p('house', 0.3, 0.82, 1), p('sheep', 0.65, 0.82, 0.5, 'bob'), p('sheep', 0.82, 0.82, 0.45, 'bob', { flip: true }), p('tree', 0.08, 0.82, 0.9, 'sway')] },
        caption: 'Prophet Yaqub (AS) was the son of Ishaq (AS) and grandson of Ibrahim (AS). He lived in the land of Canaan with his twelve sons, their sheep and green fields.',
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('house', 0.4, 0.82, 1.1), p('lamp', 0.4, 0.68, 0.35, 'pulse'), p('star', 0.8, 0.25, 0.3, 'twinkle'), p('moon', 0.15, 0.3, 0.45)] },
        caption: 'Yaqub (AS) especially loved his young sons Yusuf and Binyamin. One night, little Yusuf told him about a special dream. Yaqub (AS) knew Allah had chosen Yusuf for something great.',
        bubble: { speaker: 'Yaqub (AS)', text: 'My son, do not tell your brothers about your dream.' },
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('shirt', 0.5, 0.75, 0.7, 'sway', { color: '#E07A6E' }), p('wolf', 0.82, 0.82, 0.5), p('house', 0.15, 0.82, 0.7)] },
        caption: 'One evening the older brothers came home crying, holding Yusuf\'s shirt stained with fake blood. "A wolf ate him!" they said. But the shirt was not torn at all. Yaqub (AS) knew they were not telling the truth.',
        sfx: 'SOB! SOB!',
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('heart', 0.5, 0.6, 0.8, 'pulse'), p('light', 0.5, 0.78, 1, 'pulse'), p('sparkles', 0.25, 0.4, 0.5, 'twinkle')] },
        caption: 'His heart was broken, but he did not shout or give up. He chose "sabrun jameel" – a beautiful patience – and trusted Allah completely.',
        quran: { text: 'So patience is most fitting. And Allah is the one sought for help against what you describe.', ref: 'Yusuf 12:18' },
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('house', 0.35, 0.82, 1), p('lamp', 0.35, 0.68, 0.35, 'pulse'), p('moon', 0.78, 0.3, 0.45), p('star', 0.6, 0.2, 0.25, 'twinkle')] },
        caption: 'Years passed. Yaqub (AS) cried so much missing Yusuf that his eyes turned white and he could no longer see. Yet he never complained to people – only to Allah.',
        quran: { text: 'I only complain of my suffering and my grief to Allah, and I know from Allah that which you do not know.', ref: 'Yusuf 12:86' },
      },
      {
        scene: { sky: 'dawn', ground: 'desert', props: [p('camel', 0.3, 0.82, 0.7), p('camel', 0.55, 0.82, 0.65), p('sun', 0.85, 0.42, 0.5), p('footprints', 0.78, 0.86, 0.6)] },
        caption: 'Even when they lost Binyamin too, Yaqub (AS) sent his sons back to Egypt with hope in his heart.',
        bubble: { speaker: 'Yaqub (AS)', text: 'My sons, go and search for Yusuf and his brother. Never despair of the mercy of Allah!' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('shirt', 0.5, 0.6, 0.7, 'pulse'), p('wind', 0.25, 0.45, 0.7, 'drift'), p('house', 0.85, 0.82, 0.8), p('sparkles', 0.6, 0.35, 0.5, 'spin')] },
        caption: 'Then something wonderful happened. As the caravan left Egypt, Yaqub (AS) said, "I can smell Yusuf!" A son arrived and laid Yusuf\'s shirt over his father\'s face.',
        sfx: 'WHOOSH!',
        quran: { text: 'And when the caravan departed, their father said, "Indeed, I find the smell of Joseph."', ref: 'Yusuf 12:94' },
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('sun', 0.5, 0.4, 0.8, 'pulse'), p('heart', 0.25, 0.5, 0.45, 'pulse'), p('heart', 0.75, 0.5, 0.45, 'pulse'), p('flower', 0.15, 0.82, 0.4, 'sway'), p('flower', 0.85, 0.82, 0.4, 'sway')] },
        caption: 'His eyesight came back! Soon the whole family travelled to Egypt and was together again with Yusuf (AS). Yaqub\'s beautiful patience was rewarded by Allah.',
      },
    ],
    lessons: [
      '"Sabrun jameel" means being patient without complaining to people.',
      'We can share our sadness with Allah – He always listens.',
      'Never despair of Allah\'s mercy, even after many years.',
      'Yaqub (AS) taught his children to worship Allah alone until their last breath.',
    ],
    sources: ['Surah Yusuf 12:4-18, 12:83-100', 'Surah Al-Baqarah 2:132-133'],
  },

  // ───────────────────────────── YUSUF ─────────────────────────────
  {
    id: 'yusuf',
    prophet: 'Prophet Yusuf',
    arabic: 'يوسف',
    title: 'From the Well to the Palace',
    tagline: 'A dream of stars, a deep well, and a happy ending.',
    tint: '#C2B4EC',
    cover: {
      sky: 'night',
      ground: 'desert',
      props: [p('well', 0.3, 0.82, 0.9), p('moon', 0.75, 0.3, 0.5), p('sun', 0.5, 0.25, 0.35, 'pulse'), p('star', 0.2, 0.2, 0.25, 'twinkle'), p('star', 0.9, 0.2, 0.25, 'twinkle'), p('pyramid', 0.78, 0.82, 0.8)],
    },
    panels: [
      {
        scene: { sky: 'night', ground: 'grass', props: [p('moon', 0.8, 0.3, 0.5, 'pulse'), p('sun', 0.2, 0.3, 0.45, 'pulse'), p('star', 0.35, 0.18, 0.25, 'twinkle'), p('star', 0.5, 0.25, 0.25, 'twinkle'), p('star', 0.65, 0.15, 0.25, 'twinkle'), p('house', 0.5, 0.82, 0.8)] },
        caption: 'Young Yusuf (AS) woke up with a sparkle in his eyes. In his dream, eleven stars, the sun and the moon all bowed down to him! He ran to tell his father, Prophet Yaqub (AS).',
        quran: { text: 'O my father, indeed I have seen eleven stars and the sun and the moon; I saw them prostrating to me.', ref: 'Yusuf 12:4' },
      },
      {
        scene: { sky: 'dusk', ground: 'grass', props: [p('tree', 0.2, 0.82, 1, 'sway'), p('sheep', 0.6, 0.82, 0.5), p('sheep', 0.78, 0.82, 0.45), p('cloud', 0.6, 0.25, 0.6, 'drift', { color: '#8D877C' })] },
        caption: 'Yusuf\'s ten older brothers were jealous because their father loved him so much. They made a wicked plan: "Let\'s take him far away and get rid of him!"',
        bubble: { speaker: 'The brothers', text: 'Father, send him with us tomorrow to play. We will look after him!' },
      },
      {
        scene: { sky: 'dark', ground: 'desert', action: true, props: [p('well', 0.5, 0.82, 1.2), p('star', 0.2, 0.25, 0.25, 'twinkle'), p('light', 0.5, 0.6, 0.6, 'pulse')] },
        caption: 'Far from home, the brothers threw Yusuf (AS) into a dark, deep well and left him there. He was alone and scared, but Allah comforted him: one day he would tell his brothers about this.',
        sfx: 'SPLASH!',
        quran: { text: 'And We inspired to him, "You will surely inform them about this affair of theirs while they do not perceive."', ref: 'Yusuf 12:15' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('well', 0.25, 0.82, 0.9), p('camel', 0.6, 0.82, 0.7, 'bob'), p('camel', 0.85, 0.82, 0.65, 'bob'), p('sun', 0.8, 0.25, 0.45)] },
        caption: 'A caravan of travellers stopped at the well for water. When the water-carrier lowered his bucket, up came a boy instead!',
        bubble: { speaker: 'Water-carrier', text: 'Good news! Here is a boy!' },
        sfx: 'CREAK!',
      },
      {
        scene: { sky: 'day', ground: 'river', props: [p('pyramid', 0.25, 0.82, 1), p('palace', 0.72, 0.82, 1.1), p('palm', 0.92, 0.82, 0.7, 'sway'), p('sun', 0.5, 0.25, 0.5)] },
        caption: 'The travellers sold Yusuf (AS) in Egypt for just a few coins. A powerful minister called Al-Aziz bought him and took him home to his beautiful palace beside the Nile.',
        bubble: { speaker: 'Al-Aziz', text: 'Look after him well. Perhaps he will be useful to us, or we may adopt him as a son.' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('gate', 0.5, 0.82, 1.1), p('lamp', 0.2, 0.55, 0.4, 'pulse'), p('lamp', 0.8, 0.55, 0.4, 'pulse')] },
        caption: 'Yusuf (AS) grew up strong, wise and very handsome. The minister\'s wife tried to make him do something wrong, but he refused because he feared Allah. He ran for the door!',
        bubble: { speaker: 'Yusuf (AS)', text: 'I seek refuge in Allah!' },
        sfx: 'SLAM!',
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('prison', 0.5, 0.82, 1.2), p('lamp', 0.15, 0.55, 0.35, 'pulse'), p('moon', 0.8, 0.3, 0.35)] },
        caption: 'Even though Yusuf (AS) was innocent, he was sent to prison. He preferred prison to disobeying Allah. Inside, he was kind to everyone and taught them about Allah.',
        quran: { text: 'My Lord, prison is more beloved to me than that to which they invite me.', ref: 'Yusuf 12:33' },
      },
      {
        scene: { sky: 'night', ground: 'floor', props: [p('cup', 0.3, 0.75, 0.5, 'bob'), p('bread', 0.7, 0.72, 0.5, 'bob'), p('birds', 0.7, 0.45, 0.5, 'fly'), p('prison', 0.5, 0.82, 0.5)] },
        caption: 'Two prisoners had strange dreams. One squeezed grapes for the king. The other carried bread on his head while birds ate from it. Yusuf (AS) explained: the first would be freed, the second would not.',
      },
      {
        scene: { sky: 'golden', ground: 'river', action: true, props: [p('cow', 0.2, 0.82, 0.6), p('cow', 0.4, 0.82, 0.6), p('cow', 0.68, 0.82, 0.4, 'shake', { color: '#ECE4D5' }), p('wheat', 0.88, 0.82, 0.6, 'sway'), p('crown', 0.5, 0.35, 0.5, 'pulse')] },
        caption: 'Years later, the King of Egypt had a puzzling dream. Seven fat cows were eaten by seven skinny cows! He also saw seven green ears of wheat and seven dry ones. Nobody could explain it.',
        quran: { text: 'Indeed, I have seen seven fat cows being eaten by seven lean ones, and seven green spikes of grain and others that were dry.', ref: 'Yusuf 12:43' },
      },
      {
        scene: { sky: 'day', ground: 'grass', props: [p('wheat', 0.2, 0.82, 0.8, 'sway'), p('wheat', 0.4, 0.82, 0.8, 'sway'), p('sun', 0.75, 0.3, 0.5), p('jar', 0.7, 0.82, 0.6), p('jar', 0.88, 0.82, 0.55)] },
        caption: 'The freed prisoner remembered Yusuf (AS). From prison, Yusuf explained the dream: seven years of rich harvests, then seven years of famine. "Store the grain and keep it in its ears!"',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('palace', 0.3, 0.82, 1.1), p('crown', 0.3, 0.32, 0.4, 'pulse'), p('jar', 0.7, 0.82, 0.6), p('wheat', 0.85, 0.82, 0.6, 'sway'), p('sparkles', 0.6, 0.4, 0.4, 'twinkle')] },
        caption: 'The king was amazed! He freed Yusuf (AS) and cleared his name. Yusuf was put in charge of all of Egypt\'s storehouses. He saved grain carefully during the good years.',
        bubble: { speaker: 'Yusuf (AS)', text: 'Put me in charge of the storehouses of the land. I am a careful keeper who knows.' },
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('camel', 0.2, 0.82, 0.6, 'bob'), p('camel', 0.4, 0.82, 0.6, 'bob'), p('palace', 0.8, 0.82, 0.9), p('sun', 0.55, 0.42, 0.5)] },
        caption: 'When the famine came, people from far lands travelled to Egypt for food – including Yusuf\'s brothers! He recognised them at once, but they did not recognise him.',
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('cup', 0.5, 0.65, 0.6, 'pulse', { color: GOLD }), p('basket', 0.3, 0.82, 0.7), p('wheat', 0.72, 0.82, 0.6), p('sparkles', 0.55, 0.42, 0.4, 'twinkle')] },
        caption: 'On their next trip they brought young Binyamin. Yusuf (AS) wisely placed the king\'s golden cup in Binyamin\'s bag so he could keep his little brother with him.',
        sfx: 'CLINK!',
      },
      {
        scene: { sky: 'golden', ground: 'floor', props: [p('throne', 0.5, 0.82, 1), p('heart', 0.25, 0.45, 0.5, 'pulse'), p('heart', 0.75, 0.45, 0.5, 'pulse'), p('light', 0.5, 0.6, 0.8, 'pulse')] },
        caption: 'At last Yusuf (AS) revealed the truth: "I am Yusuf, and this is my brother!" The brothers were ashamed. But Yusuf forgave them completely.',
        quran: { text: 'No blame will there be upon you today. Allah will forgive you; and He is the most merciful of the merciful.', ref: 'Yusuf 12:92' },
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('shirt', 0.5, 0.55, 0.7, 'pulse'), p('camel', 0.25, 0.82, 0.6, 'bob'), p('wind', 0.75, 0.45, 0.6, 'drift')] },
        caption: 'Yusuf (AS) gave them his shirt. "Lay it over my father\'s face and he will see again." And by Allah\'s will, Yaqub\'s eyesight returned!',
      },
      {
        scene: { sky: 'night', ground: 'floor', props: [p('throne', 0.5, 0.82, 1), p('sun', 0.25, 0.3, 0.4, 'pulse'), p('moon', 0.75, 0.3, 0.4, 'pulse'), p('star', 0.4, 0.15, 0.25, 'twinkle'), p('star', 0.6, 0.18, 0.25, 'twinkle'), p('star', 0.1, 0.2, 0.2, 'twinkle')] },
        caption: 'The whole family came to Egypt. His parents and eleven brothers bowed to greet him, as was the custom then. The dream of the eleven stars, the sun and the moon had come true!',
        bubble: { speaker: 'Yusuf (AS)', text: 'O my father, this is the meaning of my dream long ago. My Lord has made it true!' },
      },
    ],
    lessons: [
      'Be patient during hard times – Allah has a plan.',
      'Always choose what pleases Allah, even when it is difficult.',
      'Forgive people who hurt you, like Yusuf (AS) forgave his brothers.',
      'Jealousy leads to bad actions; be happy for others.',
    ],
    sources: ['Surah Yusuf (12), the whole surah'],
  },

  // ───────────────────────────── AYYUB ─────────────────────────────
  {
    id: 'ayyub',
    prophet: 'Prophet Ayyub',
    arabic: 'أيوب',
    title: 'The Patient Servant',
    tagline: 'He lost almost everything – but never his faith.',
    tint: '#8FD1B0',
    cover: {
      sky: 'dawn',
      ground: 'grass',
      props: [p('spring', 0.5, 0.82, 1), p('sun', 0.8, 0.35, 0.5, 'pulse'), p('flower', 0.2, 0.82, 0.5, 'sway'), p('sparkles', 0.5, 0.45, 0.5, 'twinkle')],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'grass', props: [p('house', 0.25, 0.82, 1), p('cow', 0.55, 0.82, 0.55), p('sheep', 0.72, 0.82, 0.45, 'bob'), p('camel', 0.9, 0.82, 0.55), p('sun', 0.75, 0.25, 0.45)] },
        caption: 'Prophet Ayyub (AS) was blessed with so much: wide lands, many animals, a loving family and good health. And he thanked Allah for every single blessing.',
      },
      {
        scene: { sky: 'storm', ground: 'grass', action: true, props: [p('lightning', 0.3, 0.45, 0.7, 'twinkle'), p('rain', 0.5, 0.6, 1), p('house', 0.7, 0.82, 0.9, 'shake'), p('cloud', 0.6, 0.25, 0.7, 'drift')] },
        caption: 'Then Allah tested him. One by one, his animals were lost, his wealth disappeared and his children passed away. It was a terribly hard time.',
        sfx: 'CRASH!',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('house', 0.4, 0.82, 0.8), p('heart', 0.7, 0.5, 0.5, 'pulse'), p('lamp', 0.4, 0.66, 0.3, 'pulse')] },
        caption: 'Then Ayyub (AS) became very sick for many years. Most people stayed away from him. Only his faithful wife stayed by his side and cared for him.',
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('moon', 0.75, 0.3, 0.5), p('star', 0.3, 0.2, 0.25, 'twinkle'), p('star', 0.55, 0.15, 0.25, 'twinkle'), p('heart', 0.4, 0.55, 0.55, 'pulse'), p('tree', 0.12, 0.82, 0.8, 'sway')] },
        caption: 'Through it all, Ayyub (AS) never complained about Allah. He kept remembering Him day and night, saying "Alhamdulillah" with a patient heart.',
        bubble: { speaker: 'Ayyub (AS)', text: 'Allah gave me so many good years. I will be patient for His sake.' },
      },
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('light', 0.5, 0.78, 1.1, 'pulse'), p('sparkles', 0.3, 0.35, 0.5, 'spin'), p('sparkles', 0.7, 0.35, 0.5, 'spin')] },
        caption: 'Finally, he called out to his Lord in a soft, humble du\'a.',
        quran: { text: 'Indeed, adversity has touched me, and You are the Most Merciful of the merciful.', ref: 'Al-Anbiya 21:83' },
      },
      {
        scene: { sky: 'dawn', ground: 'grass', action: true, props: [p('spring', 0.5, 0.82, 1.1, 'pulse'), p('footprints', 0.3, 0.86, 0.5), p('sparkles', 0.5, 0.4, 0.6, 'spin'), p('sun', 0.85, 0.35, 0.45)] },
        caption: 'Allah answered him right away! He told Ayyub (AS) to strike the ground with his foot. Cool, fresh water bubbled up. He washed and drank – and all his sickness disappeared!',
        sfx: 'BUBBLE!',
        quran: { text: 'Strike the ground with your foot; this is a spring for a cool bath and drink.', ref: 'Sad 38:42' },
      },
      {
        scene: { sky: 'day', ground: 'garden', props: [p('house', 0.3, 0.82, 1), p('sheep', 0.6, 0.82, 0.45, 'bob'), p('cow', 0.8, 0.82, 0.5), p('sparkles', 0.6, 0.35, 0.4, 'twinkle', { color: GOLD }), p('flower', 0.1, 0.82, 0.4, 'sway')] },
        caption: 'Allah gave him back his health, his family and double the blessings. The Prophet ﷺ told us that golden locusts even rained down on him as a gift from Allah!',
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('heart', 0.5, 0.55, 0.8, 'pulse'), p('star', 0.25, 0.3, 0.3, 'twinkle'), p('star', 0.75, 0.3, 0.3, 'twinkle')] },
        caption: 'Allah praised Ayyub (AS) as a wonderful servant who always turned back to Him. Today, when people are very patient, we still say "the patience of Ayyub".',
        quran: { text: 'Indeed, We found him patient, an excellent servant. Indeed, he was one repeatedly turning back to Allah.', ref: 'Sad 38:44' },
      },
    ],
    lessons: [
      'Health, wealth and family are gifts from Allah – thank Him for them.',
      'When hard times come, be patient and keep remembering Allah.',
      'Make du\'a – Allah hears and answers.',
    ],
    sources: ['Surah Al-Anbiya 21:83-84', 'Surah Sad 38:41-44', 'Sahih al-Bukhari 279 (the golden locusts)'],
  },

  // ───────────────────────────── SHU'AYB ─────────────────────────────
  {
    id: 'shuayb',
    prophet: 'Prophet Shu\'ayb',
    arabic: 'شعيب',
    title: 'The Honest Scales',
    tagline: 'A whole town that cheated – and one prophet who said "Be fair!"',
    tint: '#8ED3CB',
    cover: {
      sky: 'dusk',
      ground: 'city',
      props: [p('scales', 0.5, 0.75, 1.1, 'sway'), p('tree', 0.15, 0.82, 0.8, 'sway'), p('sun', 0.82, 0.38, 0.5)],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'city', props: [p('house', 0.2, 0.82, 0.8), p('house', 0.45, 0.82, 0.7), p('tree', 0.75, 0.82, 1, 'sway'), p('tree', 0.92, 0.82, 0.8, 'sway'), p('sun', 0.6, 0.25, 0.45)] },
        caption: 'Long ago, the people of Madyan lived in a busy trading town full of thick, leafy trees. They had plenty of everything – but they had a very bad habit.',
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('scales', 0.5, 0.75, 1, 'shake'), p('wheat', 0.2, 0.82, 0.6), p('dates', 0.8, 0.82, 0.5), p('basket', 0.35, 0.82, 0.5)] },
        caption: 'When they sold things, they cheated! They gave a little less than they promised and tricked the scales. They also robbed travellers and worshipped idols instead of Allah.',
        sfx: 'TIP!',
      },
      {
        scene: { sky: 'golden', ground: 'city', props: [p('light', 0.5, 0.78, 1, 'pulse'), p('scales', 0.5, 0.65, 0.7, 'none'), p('sparkles', 0.25, 0.35, 0.4, 'twinkle')] },
        caption: 'Allah sent one of their own, Prophet Shu\'ayb (AS), to guide them. He spoke so beautifully that he was called "the preacher of the prophets".',
        quran: { text: 'O my people, worship Allah; you have no deity other than Him. Give full measure and weight, and do not cheat people of their things.', ref: 'Al-A\'raf 7:85' },
      },
      {
        scene: { sky: 'dusk', ground: 'city', props: [p('house', 0.25, 0.82, 0.9), p('idol', 0.6, 0.82, 0.7), p('idol', 0.8, 0.82, 0.6), p('cloud', 0.5, 0.25, 0.5, 'drift', { color: '#8D877C' })] },
        caption: 'The people laughed at him. They did not want to change their ways or leave the idols of their grandfathers.',
        bubble: { speaker: 'The people', text: 'Does your prayer tell you that we must leave what our fathers worshipped, and stop doing what we like with our money?' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('heart', 0.5, 0.55, 0.6, 'pulse'), p('scales', 0.2, 0.75, 0.6), p('house', 0.82, 0.82, 0.7)] },
        caption: 'Shu\'ayb (AS) kept explaining kindly and patiently. He wanted nothing for himself – only that his people would become good.',
        quran: { text: 'I only want to set things right as much as I am able. And my success is only through Allah.', ref: 'Hud 11:88' },
      },
      {
        scene: { sky: 'storm', ground: 'city', props: [p('house', 0.3, 0.82, 0.8), p('cloud', 0.4, 0.25, 0.8, 'drift', { color: '#4B463E' }), p('cloud', 0.75, 0.3, 0.7, 'drift', { color: '#4B463E' })] },
        caption: 'Instead of listening, they threatened to throw him and the believers out of the town. They even dared him to bring the punishment he warned about.',
        bubble: { speaker: 'The leaders', text: 'We will drive you out of our city, O Shu\'ayb, unless you return to our religion!' },
      },
      {
        scene: { sky: 'dark', ground: 'city', action: true, props: [p('house', 0.25, 0.82, 0.9, 'shake'), p('house', 0.6, 0.82, 0.8, 'shake'), p('lightning', 0.45, 0.4, 0.7, 'twinkle'), p('rock', 0.85, 0.82, 0.5, 'shake')] },
        caption: 'Then Allah\'s punishment came. A terrible blast of sound and a mighty earthquake shook the town. By morning, the cheaters were gone as if they had never lived there.',
        sfx: 'RUMBLE!!',
      },
      {
        scene: { sky: 'dawn', ground: 'grass', props: [p('footprints', 0.3, 0.86, 0.6), p('sun', 0.75, 0.38, 0.55, 'rise'), p('tree', 0.15, 0.82, 0.8, 'sway'), p('heart', 0.55, 0.5, 0.4, 'pulse')] },
        caption: 'But Allah saved Shu\'ayb (AS) and the believers by His mercy. They walked safely away into a fresh new morning, thankful to their Lord.',
        quran: { text: 'And when Our command came, We saved Shu\'ayb and those who believed with him, by mercy from Us.', ref: 'Hud 11:94' },
      },
    ],
    lessons: [
      'Always be honest and fair, especially when buying and selling.',
      'Cheating even a little is a big wrong in Allah\'s sight.',
      'Speak to people kindly when giving good advice.',
    ],
    sources: ['Surah Al-A\'raf 7:85-93', 'Surah Hud 11:84-95', 'Surah Ash-Shu\'ara 26:176-191'],
  },

  // ───────────────────────────── MUSA ─────────────────────────────
  {
    id: 'musa',
    prophet: 'Prophet Musa',
    arabic: 'موسى',
    title: 'The Staff and the Sea',
    tagline: 'A baby in a basket who stood up to Pharaoh.',
    tint: '#9DC3E6',
    cover: {
      sky: 'storm',
      ground: 'sea',
      action: true,
      props: [p('wave', 0.18, 0.82, 1.3, 'bob'), p('wave', 0.82, 0.82, 1.3, 'bob', { flip: true }), p('staff', 0.5, 0.82, 0.9, 'pulse'), p('lightning', 0.7, 0.35, 0.5, 'twinkle')],
    },
    panels: [
      {
        scene: { sky: 'dusk', ground: 'river', props: [p('palace', 0.3, 0.82, 1.1), p('pyramid', 0.75, 0.82, 0.9), p('crown', 0.3, 0.3, 0.45, 'pulse'), p('cloud', 0.6, 0.25, 0.5, 'drift', { color: '#8D877C' })] },
        caption: 'In Egypt lived a cruel king called Pharaoh (Fir\'awn). He claimed to be a god and made the Children of Israel his slaves. He ordered that their baby boys be killed.',
      },
      {
        scene: { sky: 'dawn', ground: 'river', props: [p('basket', 0.5, 0.78, 0.7, 'bob'), p('wave', 0.25, 0.82, 0.5, 'bob'), p('wave', 0.8, 0.82, 0.5, 'bob', { flip: true }), p('palm', 0.1, 0.82, 0.8, 'sway')] },
        caption: 'When baby Musa was born, his mother was so scared. Allah inspired her: place him in a basket and let the River Nile carry him. With a trembling heart, she obeyed.',
        quran: { text: 'Cast him into the river and do not fear and do not grieve. Indeed, We will return him to you and make him one of the messengers.', ref: 'Al-Qasas 28:7' },
        sfx: 'SPLOSH!',
      },
      {
        scene: { sky: 'day', ground: 'river', props: [p('palace', 0.72, 0.82, 1.1), p('basket', 0.3, 0.78, 0.6, 'bob'), p('flower', 0.5, 0.82, 0.4, 'sway'), p('sun', 0.15, 0.25, 0.45)] },
        caption: 'The basket floated right up to Pharaoh\'s palace! Pharaoh\'s kind wife Asiyah saw the baby and her heart filled with love.',
        bubble: { speaker: 'Asiyah', text: 'He will be a joy for me and for you. Do not kill him!' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('cradle', 0.5, 0.82, 0.9, 'sway'), p('heart', 0.5, 0.45, 0.5, 'pulse'), p('lamp', 0.2, 0.55, 0.35, 'pulse')] },
        caption: 'Baby Musa refused milk from every nurse. His clever sister said, "I know a family who can care for him!" And so Allah returned Musa to his own mother, just as He promised.',
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('well', 0.4, 0.82, 1), p('sheep', 0.7, 0.82, 0.45, 'bob'), p('sheep', 0.85, 0.82, 0.4, 'bob'), p('tree', 0.12, 0.82, 0.8, 'sway'), p('sun', 0.75, 0.25, 0.45)] },
        caption: 'Musa (AS) grew up strong. After leaving Egypt, he reached a well in Madyan. Two young women waited shyly with their sheep. Musa watered their flock for them, then rested in the shade.',
        quran: { text: 'My Lord, indeed I am, for whatever good You would send down to me, in need.', ref: 'Al-Qasas 28:24' },
      },
      {
        scene: { sky: 'dusk', ground: 'grass', props: [p('house', 0.35, 0.82, 1), p('sheep', 0.68, 0.82, 0.45, 'bob'), p('staff', 0.85, 0.82, 0.6)] },
        caption: 'Their wise old father invited Musa (AS) home. Musa married one of the daughters and worked as a shepherd for many years, caring for the flock.',
        bubble: { speaker: 'The daughter', text: 'Father, hire him! The best worker is one who is strong and trustworthy.' },
      },
      {
        scene: { sky: 'night', ground: 'mountains', props: [p('mountain', 0.5, 0.82, 1.3), p('fire', 0.5, 0.42, 0.5, 'flicker'), p('star', 0.2, 0.2, 0.25, 'twinkle'), p('star', 0.85, 0.25, 0.25, 'twinkle'), p('footprints', 0.2, 0.86, 0.5)] },
        caption: 'Travelling home on a cold, dark night, Musa (AS) saw a glowing fire on the side of Mount Tur. "Wait here," he told his family. "Maybe I can bring back a warm flame."',
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('tree', 0.5, 0.82, 1, 'pulse'), p('light', 0.5, 0.75, 1.3, 'pulse'), p('sparkles', 0.25, 0.4, 0.5, 'spin'), p('sparkles', 0.75, 0.4, 0.5, 'spin')] },
        caption: 'As he came near, he was called! Allah spoke to Musa (AS) directly. He was chosen to be a messenger.',
        quran: { text: 'Indeed, I am your Lord, so remove your sandals. Indeed, you are in the sacred valley of Tuwa.', ref: 'Ta-Ha 20:12' },
      },
      {
        scene: { sky: 'golden', ground: 'mountains', action: true, props: [p('snake', 0.4, 0.82, 1, 'sway'), p('staff', 0.75, 0.82, 0.6, 'shake'), p('light', 0.6, 0.6, 0.7, 'pulse')] },
        caption: 'Allah told him to throw down his staff – and it became a wriggling snake! Then Allah told him to put his hand under his arm, and it came out shining white. These were signs to show Pharaoh.',
        sfx: 'HISSSS!',
        bubble: { speaker: 'Musa (AS)', text: 'My Lord, open my heart, make my task easy, and untie the knot from my tongue.' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('throne', 0.5, 0.82, 1.1), p('crown', 0.5, 0.35, 0.45), p('staff', 0.15, 0.82, 0.6), p('lamp', 0.85, 0.55, 0.35, 'pulse')] },
        caption: 'With his brother Harun (AS) by his side, Musa (AS) went to Pharaoh\'s palace. Gently, he said: "Worship Allah, and let the Children of Israel go free." Pharaoh only laughed proudly.',
        quran: { text: 'And speak to him with gentle speech that perhaps he may be reminded or fear Allah.', ref: 'Ta-Ha 20:44' },
      },
      {
        scene: { sky: 'day', ground: 'desert', action: true, props: [p('snake', 0.5, 0.82, 1.3, 'sway'), p('staff', 0.2, 0.82, 0.4, 'shake'), p('staff', 0.8, 0.82, 0.4, 'shake'), p('pyramid', 0.85, 0.75, 0.6)] },
        caption: 'Pharaoh gathered his best magicians. They threw ropes and sticks that seemed to wriggle like snakes! But Musa (AS) threw his staff, and it swallowed up all their tricks.',
        sfx: 'GULP!',
      },
      {
        scene: { sky: 'golden', ground: 'desert', props: [p('light', 0.5, 0.78, 1, 'pulse'), p('heart', 0.3, 0.5, 0.5, 'pulse'), p('heart', 0.7, 0.5, 0.5, 'pulse'), p('sparkles', 0.5, 0.3, 0.5, 'spin')] },
        caption: 'The magicians knew this was no magic – it was real! They fell down in sujood. Even when Pharaoh threatened them, their faith stayed strong.',
        bubble: { speaker: 'The magicians', text: 'We believe in the Lord of Harun and Musa!' },
      },
      {
        scene: { sky: 'storm', ground: 'river', props: [p('rain', 0.5, 0.6, 1), p('wave', 0.4, 0.82, 0.7, 'bob', { color: '#E07A6E' }), p('cloud', 0.3, 0.25, 0.7, 'drift', { color: '#4B463E' }), p('palace', 0.8, 0.82, 0.8)] },
        caption: 'Pharaoh still refused. So Allah sent signs upon Egypt: floods, locusts, lice, frogs and water turning to blood. Each time Pharaoh promised to change – and each time he broke his word.',
        quran: { text: 'So We sent upon them the flood and locusts and lice and frogs and blood as distinct signs.', ref: 'Al-A\'raf 7:133' },
      },
      {
        scene: { sky: 'night', ground: 'sea', action: true, props: [p('wave', 0.5, 0.82, 1, 'bob'), p('footprints', 0.2, 0.86, 0.6), p('moon', 0.8, 0.3, 0.45), p('cloud', 0.3, 0.25, 0.5, 'drift')] },
        caption: 'One night, Musa (AS) led his people out of Egypt. By sunrise, they reached the sea – and Pharaoh\'s army was thundering behind them! The people cried, "We will be caught!"',
        bubble: { speaker: 'Musa (AS)', text: 'No! My Lord is with me. He will guide me!' },
        sfx: 'THUD THUD THUD!',
      },
      {
        scene: { sky: 'golden', ground: 'seabed', action: true, props: [p('wave', 0.15, 0.82, 1.4, 'bob'), p('wave', 0.85, 0.82, 1.4, 'bob', { flip: true }), p('staff', 0.5, 0.82, 0.8, 'pulse'), p('fish', 0.15, 0.4, 0.3, 'bob'), p('light', 0.5, 0.5, 0.6, 'pulse')] },
        caption: 'Allah told Musa (AS) to strike the sea with his staff. WHOOSH! The sea split into two giant walls of water, like mountains, with a dry path in the middle. The believers walked safely across.',
        sfx: 'WHOOSH!',
        quran: { text: 'Strike the sea with your staff. And it parted, and each portion was like a great towering mountain.', ref: 'Ash-Shu\'ara 26:63' },
      },
      {
        scene: { sky: 'storm', ground: 'flood', action: true, props: [p('wave', 0.3, 0.82, 1.3, 'shake'), p('wave', 0.7, 0.82, 1.3, 'shake', { flip: true }), p('crown', 0.5, 0.6, 0.4, 'sink')] },
        caption: 'When Pharaoh and his army followed into the path, the walls of water crashed back down. Pharaoh drowned, and his proud crown sank into the deep.',
        sfx: 'CRASH!!',
      },
      {
        scene: { sky: 'day', ground: 'desert', props: [p('rock', 0.5, 0.82, 1), p('spring', 0.3, 0.82, 0.5, 'pulse'), p('spring', 0.7, 0.82, 0.5, 'pulse'), p('cloud', 0.5, 0.25, 0.8, 'drift'), p('birds', 0.25, 0.35, 0.5, 'fly')] },
        caption: 'In the desert, Allah cared for them. Clouds gave them shade, and sweet manna and quail birds came as food. When Musa (AS) struck a rock with his staff, twelve springs gushed out – one for each tribe!',
        quran: { text: 'Strike the stone with your staff. And there gushed forth from it twelve springs.', ref: 'Al-Baqarah 2:60' },
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('mountain', 0.5, 0.82, 1.2), p('tablet', 0.5, 0.45, 0.6, 'pulse'), p('light', 0.5, 0.6, 0.9, 'pulse'), p('cow', 0.15, 0.82, 0.4, 'shake', { color: GOLD })] },
        caption: 'On the mountain, Allah gave Musa (AS) the Tawrah, written on tablets, full of guidance. But while he was away, some people foolishly worshipped a golden calf! Musa returned and taught them to repent to Allah alone.',
        quran: { text: 'And We wrote for him on the tablets something of every kind of instruction and explanation of all things.', ref: 'Al-A\'raf 7:145' },
      },
    ],
    lessons: [
      'Allah protects those who trust Him – even a tiny baby in a river.',
      'Stand up for the truth bravely but speak gently.',
      'When things look impossible, remember: "My Lord is with me."',
      'Thank Allah for His blessings and never worship anything besides Him.',
    ],
    sources: ['Surah Al-Qasas 28:3-46', 'Surah Ta-Ha 20:9-98', 'Surah Al-A\'raf 7:103-156', 'Surah Ash-Shu\'ara 26:10-68', 'Surah Al-Baqarah 2:49-61'],
  },

  // ───────────────────────────── HARUN ─────────────────────────────
  {
    id: 'harun',
    prophet: 'Prophet Harun',
    arabic: 'هارون',
    title: 'The Helping Brother',
    tagline: 'Two brothers, one mission.',
    tint: '#F0B3C8',
    cover: {
      sky: 'day',
      ground: 'mountains',
      props: [p('staff', 0.4, 0.82, 0.8), p('staff', 0.6, 0.82, 0.8), p('heart', 0.5, 0.45, 0.5, 'pulse'), p('sun', 0.82, 0.3, 0.45)],
    },
    panels: [
      {
        scene: { sky: 'day', ground: 'river', props: [p('house', 0.3, 0.82, 0.9), p('palm', 0.7, 0.82, 0.9, 'sway'), p('sun', 0.85, 0.25, 0.4)] },
        caption: 'Prophet Harun (AS) was the older brother of Musa (AS). He was gentle, patient, and spoke very clearly and beautifully.',
      },
      {
        scene: { sky: 'golden', ground: 'mountains', props: [p('light', 0.5, 0.78, 1.1, 'pulse'), p('sparkles', 0.3, 0.35, 0.5, 'spin'), p('heart', 0.7, 0.5, 0.4, 'pulse')] },
        caption: 'When Allah sent Musa (AS) to Pharaoh, Musa asked for his brother\'s help. What a beautiful du\'a – asking good things for your brother!',
        bubble: { speaker: 'Musa (AS)', text: 'My brother Harun speaks more clearly than me. Send him with me as a helper.' },
        quran: { text: 'We will strengthen your arm through your brother.', ref: 'Al-Qasas 28:35' },
      },
      {
        scene: { sky: 'indoor', ground: 'floor', props: [p('throne', 0.55, 0.82, 1), p('staff', 0.15, 0.82, 0.6), p('staff', 0.28, 0.82, 0.6), p('lamp', 0.85, 0.55, 0.35, 'pulse')] },
        caption: 'So Allah made Harun (AS) a prophet too. Together, the two brothers stood bravely before Pharaoh and called him to Allah.',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('tent', 0.25, 0.82, 0.8), p('cow', 0.6, 0.82, 0.7, 'shake', { color: GOLD }), p('fire', 0.85, 0.82, 0.4, 'flicker')] },
        caption: 'Later, Musa (AS) went up the mountain for forty nights and left Harun (AS) in charge. A man called As-Samiri made a golden calf, and many people started worshipping it!',
        sfx: 'MOOO?!',
      },
      {
        scene: { sky: 'dusk', ground: 'desert', props: [p('tent', 0.3, 0.82, 0.8), p('heart', 0.65, 0.5, 0.5, 'pulse'), p('cloud', 0.6, 0.25, 0.5, 'drift')] },
        caption: 'Harun (AS) warned them strongly, but they would not listen. He stayed patient to keep the people from splitting apart until Musa came back.',
        quran: { text: 'O my people, you are only being tested by it, and indeed your Lord is the Most Merciful, so follow me and obey my order.', ref: 'Ta-Ha 20:90' },
      },
      {
        scene: { sky: 'day', ground: 'mountains', props: [p('tablet', 0.5, 0.55, 0.6, 'pulse'), p('heart', 0.25, 0.5, 0.45, 'pulse'), p('heart', 0.75, 0.5, 0.45, 'pulse')] },
        caption: 'When Musa (AS) returned, he was very upset. Harun (AS) calmly explained what happened. Musa understood and made du\'a for both of them.',
        bubble: { speaker: 'Harun (AS)', text: 'O son of my mother, the people overpowered me. I feared you would say I divided them.' },
      },
      {
        scene: { sky: 'night', ground: 'desert', props: [p('moon', 0.75, 0.3, 0.5), p('star', 0.3, 0.2, 0.3, 'twinkle'), p('star', 0.5, 0.15, 0.25, 'twinkle'), p('tent', 0.35, 0.82, 0.8)] },
        caption: 'Harun (AS) passed away in the desert, before his brother. Allah sends peace upon both of these brothers in the Quran.',
        quran: { text: 'Peace upon Musa and Harun.', ref: 'As-Saffat 37:120' },
      },
    ],
    lessons: [
      'Help your brothers and sisters, and make du\'a for them.',
      'Teamwork makes big tasks easier.',
      'Stay calm and gentle, even when others are upset.',
    ],
    sources: ['Surah Ta-Ha 20:29-36, 20:85-94', 'Surah Al-Qasas 28:34-35', 'Surah As-Saffat 37:114-120'],
  },

  // ───────────────────────────── DHUL-KIFL ─────────────────────────────
  {
    id: 'dhulkifl',
    prophet: 'Prophet Dhul-Kifl',
    arabic: 'ذو الكفل',
    title: 'The Promise Keeper',
    tagline: 'A prophet known for patience and keeping his word.',
    tint: '#F4B48A',
    cover: {
      sky: 'night',
      ground: 'grass',
      props: [p('lamp', 0.5, 0.75, 0.8, 'pulse'), p('moon', 0.8, 0.3, 0.45), p('star', 0.25, 0.25, 0.3, 'twinkle'), p('star', 0.6, 0.2, 0.25, 'twinkle')],
    },
    panels: [
      {
        scene: { sky: 'golden', ground: 'grass', props: [p('scroll', 0.5, 0.65, 0.8, 'pulse'), p('sparkles', 0.25, 0.4, 0.4, 'twinkle'), p('sparkles', 0.75, 0.4, 0.4, 'twinkle')] },
        caption: 'Prophet Dhul-Kifl (AS) is mentioned twice in the Quran. Allah tells us only a little about him – but what He tells us is very special.',
        quran: { text: 'And Ismail and Idris and Dhul-Kifl – all were of the patient.', ref: 'Al-Anbiya 21:85' },
      },
      {
        scene: { sky: 'day', ground: 'city', props: [p('house', 0.3, 0.82, 0.9), p('house', 0.55, 0.82, 0.7), p('scales', 0.8, 0.75, 0.6), p('sun', 0.8, 0.25, 0.4)] },
        caption: 'His name means "the one with a promise" or "the one who took responsibility". Scholars narrate that he promised to lead and judge his people fairly.',
      },
      {
        scene: { sky: 'night', ground: 'grass', props: [p('lamp', 0.4, 0.7, 0.5, 'pulse'), p('moon', 0.78, 0.3, 0.45), p('star', 0.3, 0.2, 0.25, 'twinkle'), p('house', 0.15, 0.82, 0.7)] },
        caption: 'It is said that he promised to fast in the day, pray at night, and never judge people in anger. And he kept every promise, even when people tried to make him angry!',
        bubble: { speaker: 'Dhul-Kifl (AS)', text: 'I will stay calm and fair, for the sake of Allah.' },
      },
      {
        scene: { sky: 'golden', ground: 'garden', props: [p('heart', 0.5, 0.55, 0.7, 'pulse'), p('flower', 0.2, 0.82, 0.5, 'sway'), p('flower', 0.8, 0.82, 0.5, 'sway'), p('light', 0.5, 0.78, 0.9, 'pulse')] },
        caption: 'Allah praised him as one of the best and most patient people, and entered him into His mercy. A small story with a big lesson!',
        quran: { text: 'And We admitted them into Our mercy. Indeed, they were of the righteous.', ref: 'Al-Anbiya 21:86' },
      },
    ],
    lessons: [
      'Keep your promises, big or small.',
      'Control your anger, especially when deciding between people.',
      'Even a short mention in the Quran can teach us a lot.',
    ],
    sources: ['Surah Al-Anbiya 21:85-86', 'Surah Sad 38:48', 'Ibn Kathir, Qasas al-Anbiya'],
  },
];
