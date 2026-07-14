const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

/**
 * Converts degrees to radians.
 */
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Converts radians to degrees.
 */
const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Calculates the Qibla bearing (direction angle in degrees from True North, 0-360)
 * given a user's latitude and longitude.
 * 
 * @param latitude User's current latitude in degrees
 * @param longitude User's current longitude in degrees
 * @returns Heading angle to Kaaba in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export const calculateQiblaDirection = (latitude: number, longitude: number): number => {
  const phiUser = toRadians(latitude);
  const phiKaaba = toRadians(KAABA_LAT);
  
  const lambdaUser = toRadians(longitude);
  const lambdaKaaba = toRadians(KAABA_LNG);
  
  const deltaLng = lambdaKaaba - lambdaUser;
  
  const y = Math.sin(deltaLng);
  const x =
    Math.cos(phiUser) * Math.tan(phiKaaba) -
    Math.sin(phiUser) * Math.cos(deltaLng);
    
  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = toDegrees(qiblaRad);
  
  // Normalize to 0-360 degrees range
  return (qiblaDeg + 360) % 360;
};
