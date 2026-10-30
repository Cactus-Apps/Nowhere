import * as IntentLauncher from "expo-intent-launcher";
import * as Location from "expo-location";
import { NativeModules, PermissionsAndroid } from "react-native";

export type SetupStatus = {
  developer: boolean;
  mockApp: boolean;
  location: boolean;
  /** Are location services globally enabled (GPS/network)? */
  locationServices: boolean;
};

const MockLocationNative = NativeModules.MockLocation as
  | {
      getSetupStatus?: () => Promise<{ developer: boolean; mockApp: boolean }>;
    }
  | undefined;

/** Checks which setup steps have already been completed. */
export async function fetchSetupStatus(): Promise<SetupStatus> {
  let location = false;
  try {
    location = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
  } catch {}

  let locationServices = false;
  try {
    locationServices = await Location.hasServicesEnabledAsync();
  } catch {}

  let developer = false;
  let mockApp = false;
  try {
    const res = await MockLocationNative?.getSetupStatus?.();
    if (res) {
      developer = !!res.developer;
      mockApp = !!res.mockApp;
    }
  } catch {}

  return { developer, mockApp, location, locationServices };
}

/** Opens the Android developer options. */
export async function openDeveloperOptions() {
  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.APPLICATION_DEVELOPMENT_SETTINGS",
    );
  } catch {}
}

/** Opens the mock location app picker directly (fallback: developer options). */
export async function openMockAppSettings() {
  try {
    await IntentLauncher.startActivityAsync(
      "android.service.settings.MOCK_LOCATION_APP",
    );
  } catch {
    openDeveloperOptions();
  }
}

/** Opens the location settings (global on/off). */
export async function openLocationSettings() {
  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.LOCATION_SOURCE_SETTINGS",
    );
  } catch {}
}

/** Opens the app details (for permissions). */
export async function openAppSettings() {
  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.APPLICATION_DETAILS_SETTINGS",
      { data: "package:com.cactus_apps.nowhere" },
    );
  } catch {}
}

/** Requests location permission directly via a system dialog. */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}
