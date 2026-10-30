import i18n from "../i18n";
import * as Location from "expo-location";

export type LocationFailure = "permission" | "services-disabled" | "error";

export type LocationResult =
  | { ok: true; coord: [number, number] }
  | { ok: false; reason: LocationFailure };

export async function getCurrentCoord(): Promise<LocationResult> {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) return { ok: false, reason: "services-disabled" };

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { ok: false, reason: "permission" };

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { ok: true, coord: [loc.coords.longitude, loc.coords.latitude] };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function locationFailureMessage(reason: LocationFailure): string {
  switch (reason) {
    case "permission":
      return i18n.t("location_permission_denied");
    case "services-disabled":
      return i18n.t("location_services_disabled");
    default:
      return i18n.t("common_location_unavailable");
  }
}
