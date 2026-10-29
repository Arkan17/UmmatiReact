import AsyncStorage from '@react-native-async-storage/async-storage';

export const FAVORITE_DUAS_STORAGE_KEY = 'ummati_favorite_duas';

/**
 * Loads the list of favorite Dua IDs from persistent AsyncStorage.
 */
export async function loadFavoriteDuaIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_DUAS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    }
    return [];
  } catch (error) {
    console.warn('Failed to load favorite duas from storage:', error);
    return [];
  }
}

/**
 * Saves the given array of favorite Dua IDs to persistent AsyncStorage.
 */
export async function saveFavoriteDuaIds(ids: number[]): Promise<void> {
  try {
    const uniqueIds = Array.from(new Set(ids));
    await AsyncStorage.setItem(FAVORITE_DUAS_STORAGE_KEY, JSON.stringify(uniqueIds));
  } catch (error) {
    console.warn('Failed to save favorite duas to storage:', error);
  }
}

/**
 * Toggles a Dua ID in the list of favorites and persists the updated list.
 */
export async function toggleFavoriteDua(
  id: number,
  currentIds?: number[]
): Promise<{ isFavorite: boolean; newFavorites: number[] }> {
  const list = currentIds !== undefined ? [...currentIds] : await loadFavoriteDuaIds();
  const index = list.indexOf(id);
  let isFavorite = false;

  if (index >= 0) {
    list.splice(index, 1);
    isFavorite = false;
  } else {
    list.push(id);
    isFavorite = true;
  }

  await saveFavoriteDuaIds(list);
  return { isFavorite, newFavorites: list };
}

/**
 * Checks if a specific Dua ID is in the favorites list.
 */
export function isDuaFavorite(id: number, favoriteIds: number[]): boolean {
  return favoriteIds.includes(id);
}
