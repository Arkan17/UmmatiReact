import { useEffect, useState } from 'react';
import { EMPTY_PROGRESS, fetchProgress, Progress, subscribeProgress } from '../services/progress';
import { useAuth } from './useAuth';

/** Live XP / streak / Quran progress for the signed-in user. */
export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

  useEffect(() => subscribeProgress(setProgress), []);
  useEffect(() => { if (user) fetchProgress(); }, [user]);

  return { progress, refresh: fetchProgress };
}
