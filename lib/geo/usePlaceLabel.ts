import { reverseGeocode } from "@/lib/geo/geocoding";
import { useEffect, useRef, useState } from "react";

/**
 * Reverse geocoding with throttle: updates the place name only
 * when the position has moved by at least `minMeters` and
 * `minIntervalMs` have passed (protection against Nominatim rate limit).
 */
export function usePlaceLabel(
  coordinate: [number, number] | undefined,
  minMeters = 60,
  minIntervalMs = 4000,
) {
  const [label, setLabel] = useState("");
  const lastRef = useRef<[number, number] | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const lng = coordinate?.[0];
  const lat = coordinate?.[1];

  useEffect(() => {
    if (typeof lng !== "number" || typeof lat !== "number") return;
    const coord: [number, number] = [lng, lat];
    const now = Date.now();
    if (lastRef.current) {
      const dLat = Math.abs(lat - lastRef.current[1]) * 111320;
      const dLng =
        Math.abs(lng - lastRef.current[0]) *
        111320 *
        Math.cos((lat * Math.PI) / 180);
      const dist = Math.hypot(dLat, dLng);
      if (dist < minMeters || now - lastTimeRef.current < minIntervalMs) return;
    }
    lastRef.current = coord;
    lastTimeRef.current = now;
    let cancelled = false;
    reverseGeocode(lat, lng).then((l) => {
      if (!cancelled) setLabel(l);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat]);

  return label;
}
