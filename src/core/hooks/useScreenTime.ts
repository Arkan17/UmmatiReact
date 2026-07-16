import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../config/SupabaseClient';

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
            // Log to user_activities
            await supabase.from('user_activities').insert({
              user_id: user.id,
              activity_type: 'screentime',
              activity_date: todayStr,
              details: {
                screen: screenName,
                duration_seconds: duration,
                xp_earned: xpEarned
              }
            });

            // Update user's total XP in user_progress
            if (xpEarned > 0) {
              const { data: progress, error: progressErr } = await supabase
                .from('user_progress')
                .select('total_xp')
                .eq('user_id', user.id)
                .maybeSingle();

              if (!progressErr) {
                const newXp = (progress?.total_xp || 0) + xpEarned;
                await supabase
                  .from('user_progress')
                  .update({
                    total_xp: newXp,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);
              }
            }
          } catch (err) {
            console.warn(`[useScreenTime] Failed to log screen time for ${screenName}:`, err);
          }
        };

        logScreentime();
      }
    };
  }, [screenName, user]);
};
