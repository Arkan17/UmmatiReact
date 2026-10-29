import { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';

export interface LivePosition {
  latitude: number;
  longitude: number;
  /** metres */
  accuracy?: number;
  /** degrees from north, when the device is moving */
  heading?: number | null;
}

/**
 * Follows the device position while `active`. Starts from `initial` (the one-off fix from
 * useLocation, which already asked for permission) so the map never waits on the GPS.
 */
export function useLiveLocation(initial: { latitude: number; longitude: number }, active: boolean) {
  const [pos, setPos] = useState<LivePosition>(initial);

  // Keep following the one-off fix until the watcher reports something better
  useEffect(() => {
    setPos((p) => (p.accuracy == null ? { ...initial } : p));
  }, [initial.latitude, initial.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    const id = Geolocation.watchPosition(
      ({ coords }) => setPos({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
      }),
      (err) => console.warn('watchPosition error', err),
      { enableHighAccuracy: true, distanceFilter: 8, interval: 4000, fastestInterval: 2000 },
    );
    return () => Geolocation.clearWatch(id);
  }, [active]);

  return pos;
}
