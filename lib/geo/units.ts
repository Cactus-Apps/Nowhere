import type { Units } from "@/lib/storage/store";

/** m/s → km/h (metric) or mph (imperial) */
export function msToDisplay(ms: number, units: Units): number {
  return units === "imperial" ? ms * 2.23693621 : ms * 3.6;
}

/** Unit label matching the setting */
export function unitLabel(units: Units): "km/h" | "mph" {
  return units === "imperial" ? "mph" : "km/h";
}

/** "5.4 km/h" / "3.4 mph" */
export function formatSpeed(
  ms: number,
  units: Units,
  fractionDigits = 1,
): string {
  return `${msToDisplay(ms, units).toFixed(fractionDigits)} ${unitLabel(units)}`;
}
