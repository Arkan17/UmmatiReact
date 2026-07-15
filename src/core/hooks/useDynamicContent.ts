import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../config/AppConfig';
import localFallbackData from '../../../ummati_app_data.json';

export interface DynamicContent {
  verses_of_the_day: Array<{
    arabic: string;
    translation: string;
    reference: string;
  }>;
  duas: Array<{
    id: number;
    category: string;
    title: string;
    arabic: string;
    transliteration: string;
    translation: string;
    audio: string;
  }>;
  kalimas: Array<{
    number: number;
    name: string;
    arabic: string;
    transliteration: string;
    translation: string;
    audio: string;
  }>;
  naats: Array<{
    id: number;
    title: string;
    artist: string;
    url: string;
  }>;
  live_streams: {
    makkah: string;
    madina: string;
  };
  kids: {
    stories: Array<{
      title: string;
      moral: string;
      text: string;
    }>;
    wudu_steps: string[];
    salah_steps: string[];
    words: Array<{
      word: string;
      meaning: string;
      when: string;
    }>;
    quiz_questions: Array<{
      q: string;
      options: string[];
      correct: number;
    }>;
  };
}

export function useDynamicContent() {
  const [content, setContent] = useState<DynamicContent>(localFallbackData as unknown as DynamicContent);
  const [loading, setLoading] = useState(true);

  const fetchRemoteContent = useCallback(async () => {
    try {
      // Fetch fresh data with a short timeout to prevent hanging UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(AppConfig.contentApiUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        // Basic validation to check it has expected sections
        if (json.verses_of_the_day && json.duas && json.kalimas && json.kids) {
          setContent(json);
          await AsyncStorage.setItem(
            AppConfig.storageKeys.DYNAMIC_CONTENT_CACHE,
            JSON.stringify(json)
          );
        }
      }
    } catch (error) {
      console.warn('Failed to fetch remote dynamic content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCachedContent = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(AppConfig.storageKeys.DYNAMIC_CONTENT_CACHE);
      if (cached) {
        const json = JSON.parse(cached);
        if (json.verses_of_the_day && json.duas && json.kalimas && json.kids) {
          setContent(json);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached content:', error);
    } finally {
      // Immediately try to fetch fresh content in the background
      fetchRemoteContent();
    }
  }, [fetchRemoteContent]);

  useEffect(() => {
    loadCachedContent();
  }, [loadCachedContent]);

  return {
    content,
    loading,
    refresh: fetchRemoteContent,
  };
}
