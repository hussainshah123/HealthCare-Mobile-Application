import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';

let configured = false;
function configure() {
  if (!configured) {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
      locationProvider: 'auto',
    });
    configured = true;
  }
}

/** Asks for foreground location permission. Resolves true when granted. */
export async function requestLocationPermission(): Promise<boolean> {
  configure();
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED ||
      result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

function position(options: {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}): Promise<GeolocationResponse> {
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      resolve,
      err => reject(new Error(err.message)),
      options,
    ),
  );
}

/**
 * Current position for forms (sign-up, addresses).
 *
 * Tries GPS first, but indoors GPS often never gets a fix (Android then
 * reports nothing and the request times out). So after a short wait it falls
 * back to the network (Wi-Fi / mobile) location or a recent cached one, which
 * is accurate to about 100 m — good enough to fill an address, and the user
 * can still drag the map pin to their door.
 */
export async function getCurrentPosition(): Promise<GeolocationResponse> {
  configure();
  try {
    return await position({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10000,
    });
  } catch {
    return position({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    });
  }
}
