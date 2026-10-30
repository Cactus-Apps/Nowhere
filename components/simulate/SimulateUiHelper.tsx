import { DEFAULT_COORD } from "@/components/simulate/constants";
import { colors } from "@/theme";

const EARTH_R = 6371000;

export function pinHtml(color: string) {
  return `
    <div style="
      width: 18px;
      height: 18px;
      background: ${color};
      border: 3px solid ${colors.white};
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.5);
    "></div>
  `;
}

export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversine(a: [number, number], b: [number, number]) {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

export function buildCumulative(coords: [number, number][]) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  }
  return cum;
}

export function pointAt(
  coords: [number, number][],
  cum: number[],
  dist: number,
): [number, number] {
  if (dist <= 0 || coords.length < 2) return coords[0] ?? DEFAULT_COORD;
  const total = cum[cum.length - 1];
  if (dist >= total) return coords[coords.length - 1];
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= dist) lo = mid;
    else hi = mid;
  }
  const segLen = cum[hi] - cum[lo] || 1;
  const t = (dist - cum[lo]) / segLen;
  const [lng1, lat1] = coords[lo];
  const [lng2, lat2] = coords[hi];
  return [lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t];
}

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatDuration(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}
