import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useScreenTime = (screenName: string) => {
  const { user } = useAuth();
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Reset start time on mount
    startTime.current = Date.now();

    return () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      
      // Log screen time if it's longer than 5 seconds
      if (duration >= 5 && user) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Award 2 XP per minute spent (max 50 XP per session to prevent farming)
        const xpEarned = Math.min(Math.floor(duration / 60) * 2, 50);

        const logScreentime = async () => {
          try {
            // Save screentime activity locally
            const activityKey = `screentime_${todayStr}`;
            const existing = await AsyncStorage.getItem(activityKey);
            const list = existing ? JSON.parse(existing) : [];
            list.push({
              screen: screenName,
              duration_seconds: duration,
              xp_earned: xpEarned,
              timestamp: new Date().toISOString()
            });
            await AsyncStorage.setItem(activityKey, JSON.stringify(list));

            // Update user's total XP locally
            if (xpEarned > 0) {
              const storedXp = await AsyncStorage.getItem('user_xp');
              const currentXp = storedXp ? parseInt(storedXp, 10) : 0;
              const newXp = currentXp + xpEarned;
              await AsyncStorage.setItem('user_xp', newXp.toString());
            }
          } catch (err) {
            console.warn(`[useScreenTime] Failed to log screen time locally for ${screenName}:`, err);
          }
        };

        logScreentime();
      }
    };
  }, [screenName, user]);
};
