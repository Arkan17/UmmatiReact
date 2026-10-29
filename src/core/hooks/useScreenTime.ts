import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { awardXp } from '../services/progress';

/** Rewards time spent in the app: 2 XP per full minute on a screen, max 20 XP per visit. */
export const useScreenTime = (screenName: string) => {
  const { user } = useAuth();
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      if (!user) return;
      const minutes = Math.floor((Date.now() - startTime.current) / 60_000);
      const xp = Math.min(minutes * 2, 20);
      if (xp > 0) awardXp(xp, `screen_${screenName}`.slice(0, 40));
    };
  }, [screenName, user]);
};
