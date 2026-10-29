// Mounted once inside the signed-in NavigationContainer: turns new community notifications into
// local alerts and opens the right screen when one is tapped.
import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { subscribeNotifications } from '../api/notifications';
import { showCommunityAlert } from './communityAlerts';

export function CommunityAlertsListener() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!user || user.is_guest) return;
    return subscribeNotifications(user.id, showCommunityAlert);
  }, [user]);

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      const data = detail.notification?.data;
      if (type !== EventType.PRESS || data?.source !== 'community') return;
      if (typeof data.postId === 'string') navigation.navigate('PostDetail', { postId: data.postId });
      else navigation.navigate('MainApp', { screen: 'CommunityTab' } as never);
    });
  }, [navigation]);

  return null;
}
