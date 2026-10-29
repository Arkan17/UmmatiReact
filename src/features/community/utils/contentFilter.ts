// Client-side checks before anything is posted. The server enforces links, guests and rate limits too;
// this catches problems early with a friendly message.

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|ly|link|xyz)\b)/i;

// Kept short and generic on purpose: obvious slurs / profanity only.
const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'pussy', 'slut', 'whore', 'nigger', 'faggot', 'retard',
  'kafir dog', 'kill yourself', 'kys',
];

export interface FilterResult {
  ok: boolean;
  reason?: string;
}

export function checkContent(text: string, { min = 2, max = 2000 }: { min?: number; max?: number } = {}): FilterResult {
  const t = text.trim();
  if (t.length < min) return { ok: false, reason: 'Please write a little more.' };
  if (t.length > max) return { ok: false, reason: `Please keep it under ${max} characters.` };
  if (LINK.test(t)) return { ok: false, reason: 'Links are not allowed in the community, to keep it safe from spam.' };
  const lower = t.toLowerCase();
  if (BLOCKED_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { ok: false, reason: 'Please keep your words kind and respectful — the Prophet ﷺ said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent."' };
  }
  if (/(.)\1{9,}/.test(t)) return { ok: false, reason: 'That looks like spam.' };
  return { ok: true };
}
