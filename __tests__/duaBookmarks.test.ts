import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadFavoriteDuaIds,
  saveFavoriteDuaIds,
  toggleFavoriteDua,
  isDuaFavorite,
  FAVORITE_DUAS_STORAGE_KEY,
} from '../src/features/explore/utils/duaFavorites';

describe('Dua Favorites and Bookmarks', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads an empty list when no favorites are saved', async () => {
    const list = await loadFavoriteDuaIds();
    expect(list).toEqual([]);
  });

  it('saves and retrieves favorite Dua IDs correctly', async () => {
    await saveFavoriteDuaIds([1, 5, 12]);
    const list = await loadFavoriteDuaIds();
    expect(list).toEqual([1, 5, 12]);
  });

  it('deduplicates IDs upon saving', async () => {
    await saveFavoriteDuaIds([1, 1, 2, 3, 2]);
    const list = await loadFavoriteDuaIds();
    expect(list).toEqual([1, 2, 3]);
  });

  it('toggles a dua to favorite (adds it)', async () => {
    const res = await toggleFavoriteDua(7, [1, 2]);
    expect(res.isFavorite).toBe(true);
    expect(res.newFavorites).toEqual([1, 2, 7]);

    const stored = await loadFavoriteDuaIds();
    expect(stored).toEqual([1, 2, 7]);
  });

  it('toggles a favorite dua off (removes it)', async () => {
    await saveFavoriteDuaIds([1, 4, 9]);
    const res = await toggleFavoriteDua(4, [1, 4, 9]);
    expect(res.isFavorite).toBe(false);
    expect(res.newFavorites).toEqual([1, 9]);

    const stored = await loadFavoriteDuaIds();
    expect(stored).toEqual([1, 9]);
  });

  it('checks if a dua is favorite correctly', () => {
    const favorites = [10, 20, 30];
    expect(isDuaFavorite(20, favorites)).toBe(true);
    expect(isDuaFavorite(99, favorites)).toBe(false);
  });

  it('handles corrupted JSON in storage gracefully', async () => {
    await AsyncStorage.setItem(FAVORITE_DUAS_STORAGE_KEY, 'corrupted_json{{{');
    const list = await loadFavoriteDuaIds();
    expect(list).toEqual([]);
  });
});
