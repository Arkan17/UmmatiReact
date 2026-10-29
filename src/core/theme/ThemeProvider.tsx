import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, PrayerPeriod, ThemeMode, fixedPalette, palettes } from './palettes';
import { currentPeriod, getPrayerTimes, loadLastLocation } from '../prayer/prayerTimes';

const THEME_MODE_KEY = 'ummati_theme_mode';

interface ThemeContextType {
  colors: Palette;
  period: PrayerPeriod;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Temporarily show another period's sky (not persisted). null = follow the clock. */
  previewPeriod: PrayerPeriod | null;
  setPreviewPeriod: (p: PrayerPeriod | null) => void;
  /** Re-evaluate the period, e.g. after the user's location changes. */
  refreshPeriod: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('adaptive');
  const [period, setPeriod] = useState<PrayerPeriod>('day');
  const [previewPeriod, setPreviewPeriod] = useState<PrayerPeriod | null>(null);

  const refreshPeriod = useCallback(async () => {
    const { latitude, longitude } = await loadLastLocation();
    setPeriod(currentPeriod(getPrayerTimes(latitude, longitude)));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((m) => { if (m === 'light' || m === 'dark' || m === 'adaptive') setModeState(m); })
      .catch(() => {});
    refreshPeriod();

    const interval = setInterval(refreshPeriod, 60_000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refreshPeriod(); });
    return () => { clearInterval(interval); sub.remove(); };
  }, [refreshPeriod]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_MODE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    colors: mode === 'adaptive' ? palettes[previewPeriod ?? period] : fixedPalette(mode),
    period: previewPeriod ?? period,
    mode,
    setMode,
    previewPeriod,
    setPreviewPeriod,
    refreshPeriod,
  }), [mode, period, previewPeriod, setMode, refreshPeriod]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider.');
  return ctx;
};
