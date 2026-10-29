// The 25 Prophets named in the Quran, in chronological order.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProphetStory } from './types';
import { groupA } from './stories/groupA';
import { groupB } from './stories/groupB';
import { groupC } from './stories/groupC';

export const PROPHET_STORIES: ProphetStory[] = [...groupA, ...groupB, ...groupC];

export const findStory = (id: string) => PROPHET_STORIES.find((s) => s.id === id);

const READ_KEY = 'ummati_kids_stories_read';

export async function getReadStories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Marks a story as finished. Returns true the first time it is finished. */
export async function markStoryRead(id: string): Promise<boolean> {
  const read = await getReadStories();
  if (read.includes(id)) return false;
  await AsyncStorage.setItem(READ_KEY, JSON.stringify([...read, id]));
  return true;
}
