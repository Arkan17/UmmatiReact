// Unread community notification count, kept live via Supabase Realtime.
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../core/hooks/useAuth';
import { subscribeNotifications, unreadCount } from '../api/notifications';

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) return;
    unreadCount().then(setCount).catch(() => {});
  }, [user]);

  useFocusEffect(refresh);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.id, () => setCount((c) => c + 1));
  }, [user]);

  return { count, refresh };
}
