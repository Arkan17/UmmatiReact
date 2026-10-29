// Comic-style Prophet stories for the Kids corner.
//
// IMPORTANT: following the Islamic etiquette of not depicting Prophets, angels or Sahabah, scenes never
// draw people. Every panel is told through landscapes, objects, animals, light and weather, while the
// caption, speech bubbles and Quran boxes carry the narration.

/** Sky / backdrop of a panel. */
export type ComicSky =
  | 'day'        // bright blue sky
  | 'dawn'       // purple → pink morning
  | 'dusk'       // warm orange sunset
  | 'night'      // deep navy
  | 'storm'      // dark grey storm clouds
  | 'dark'       // near black (inside the whale, a dark well, darkness of night)
  | 'golden'     // warm divine gold (revelation, miracles)
  | 'underwater' // deep sea blue-green
  | 'indoor';    // warm wall of a house / palace / prison

/** Ground strip along the bottom of a panel. */
export type ComicGround =
  | 'desert'     // flat sand
  | 'dunes'      // rolling sand dunes
  | 'grass'      // green fields
  | 'garden'     // lush green with flowers (Jannah, gardens of Saba)
  | 'sea'        // calm sea
  | 'flood'      // huge rough waves covering everything
  | 'river'      // river running across the ground (Nile)
  | 'mountains'  // rocky mountain range
  | 'city'       // ancient town houses on sand
  | 'floor'      // indoor floor tiles
  | 'seabed'     // sandy ocean floor with seaweed
  | 'none';

/**
 * Things that can be placed in a panel. All are drawn as flat, ink-outlined shapes.
 * Never people, prophets or angels.
 */
export type ComicPropKind =
  // sky & weather
  | 'sun' | 'moon' | 'star' | 'cloud' | 'rain' | 'lightning' | 'wind' | 'sparkles' | 'light' // light = beam of divine light from above
  // birds & animals
  | 'birds' | 'dove' | 'hoopoe' | 'crow' | 'whale' | 'fish' | 'camel' | 'sheep' | 'cow' | 'ram'
  | 'ant' | 'snake' | 'horse' | 'spider' | 'elephant' | 'wolf' | 'donkey'
  // nature
  | 'palm' | 'tree' | 'flower' | 'mountain' | 'cave' | 'web' | 'fire' | 'wave' | 'spring' | 'rock' | 'gourd' // gourd = yaqteen vine plant (Yunus)
  // buildings & places
  | 'ark' | 'boat' | 'kaaba' | 'house' | 'palace' | 'throne' | 'tent' | 'well' | 'pyramid' | 'prison' | 'gate' | 'wall' | 'idol' | 'mosque' | 'mihrab'
  // objects
  | 'staff' | 'tablet' | 'scroll' | 'lamp' | 'axe' | 'wheat' | 'basket' | 'shirt' | 'crown' | 'scales' | 'armor' | 'dates' | 'bread' | 'cup' | 'jar' | 'heart' | 'footprints' | 'stones' | 'cradle' | 'ring';

/** How a prop moves while the panel is on screen. */
export type ComicAnim =
  | 'bob'     // gentle up/down (floating boats, whale)
  | 'sway'    // rocking rotation (trees, ark in storm)
  | 'drift'   // slow horizontal glide back and forth (clouds)
  | 'fly'     // flies across the panel left → right, loops
  | 'pulse'   // breathes bigger/smaller (glowing light, heart)
  | 'flicker' // fire-like stretch
  | 'shake'   // trembling (earthquake, idols falling)
  | 'rise'    // slowly moves up
  | 'sink'    // slowly moves down
  | 'spin'    // full rotation (stars, sparkles)
  | 'twinkle' // fades in and out
  | 'none';

export interface ComicProp {
  kind: ComicPropKind;
  /** Horizontal centre, 0 (left) – 1 (right). */
  x: number;
  /** Vertical position of the prop's BOTTOM edge, 0 (top) – 1 (bottom). Ground line is ≈ 0.8. */
  y: number;
  /** Size multiplier; 1 ≈ 30% of the panel width. */
  scale?: number;
  /** Mirror horizontally. */
  flip?: boolean;
  anim?: ComicAnim;
  /** Optional fill override (hex). */
  color?: string;
}

export interface ComicScene {
  sky: ComicSky;
  ground: ComicGround;
  props: ComicProp[];
  /** Comic speed lines for dramatic action panels. */
  action?: boolean;
}

export interface ComicPanel {
  scene: ComicScene;
  /** Narration box (2–4 short sentences, simple words for kids aged 6–12). */
  caption: string;
  /** Speech bubble. Speaker is NEVER drawn – the bubble's tail points off-panel. */
  bubble?: { speaker: string; text: string };
  /** Quran box: a translated ayah meaning, shown in a gold frame. */
  quran?: { text: string; ref: string };
  /** Comic sound effect, e.g. "SPLASH!" or "CRACK!" */
  sfx?: string;
}

export interface ProphetStory {
  id: string;
  /** e.g. "Prophet Nuh" */
  prophet: string;
  /** Arabic name, e.g. "نوح" */
  arabic: string;
  /** Comic title, e.g. "The Great Ark" */
  title: string;
  /** One line teaser shown on the cover. */
  tagline: string;
  /** Pastel cover colour (hex). */
  tint: string;
  cover: ComicScene;
  panels: ComicPanel[];
  /** Lessons to remember (2–4 bullet points). */
  lessons: string[];
  /** Quran references for parents, e.g. "Surah Hud 11:25-49". */
  sources: string[];
}
