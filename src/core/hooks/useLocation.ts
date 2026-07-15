import { useEffect, useState, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  error: string | null;
  loading: boolean;
  isUsingFallback: boolean;
}

// Fallback to Mumbai, India (matching user's preferred region)
const FALLBACK_LAT = 19.0760;
const FALLBACK_LNG = 72.8777;

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData>({
    latitude: FALLBACK_LAT,
    longitude: FALLBACK_LNG,
    error: null,
    loading: true,
    isUsingFallback: true,
  });

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        Geolocation.requestAuthorization();
        return true;
      } catch (e) {
        console.warn('iOS Authorization request error', e);
        return false;
      }
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Ummati needs access to your location to calculate accurate prayer times and Qibla direction.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Failed to request location permission', err);
        return false;
      }
    }
    return false;
  }, []);

  const fetchLocation = useCallback(async () => {
    setLocation((prev) => ({ ...prev, loading: true }));
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setLocation({
        latitude: FALLBACK_LAT,
        longitude: FALLBACK_LNG,
        error: 'Permission denied',
        loading: false,
        isUsingFallback: true,
      });
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          isUsingFallback: false,
        });
      },
      (error) => {
        console.warn('Geolocation error, using fallback:', error);
        setLocation({
          latitude: FALLBACK_LAT,
          longitude: FALLBACK_LNG,
          error: error.message,
          loading: false,
          isUsingFallback: true,
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  }, [requestLocationPermission]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    ...location,
    refreshLocation: fetchLocation,
  };
};
