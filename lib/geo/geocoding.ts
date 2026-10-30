import i18n from "@/lib/i18n";
import { fetchWithRateLimit } from "@/lib/fetchWithRateLimit";

const CACHE_MS = 10 * 60 * 1000;
const ERROR_CACHE_MS = 20 * 1000;

const reverseCache = new Map<string, { at: number; label: string }>();
const reverseInFlight = new Map<string, Promise<string>>();

export async function reverseGeocode(
  lat: number,
  lng: number,
  fallback?: string,
  language = i18n.language,
): Promise<string> {
  const defaultFallback = fallback ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)},${language || "en"}`;

  const cached = reverseCache.get(key);
  if (cached) {
    const ttl = cached.label === defaultFallback ? ERROR_CACHE_MS : CACHE_MS;
    if (Date.now() - cached.at < ttl) return cached.label;
  }

  const pending = reverseInFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetchWithRateLimit(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "Accept-Language": language || "en",
            "User-Agent": `LocationApp/1.0 (cactus_apps@proton.me)`,
          },
        },
      );
      const data = await res.json();
      return (
        data.display_name?.split(",").slice(0, 2).join(", ") ?? defaultFallback
      );
    } catch {
      return defaultFallback;
    }
  })()
    .then((label) => {
      reverseCache.set(key, { at: Date.now(), label });
      return label;
    })
    .finally(() => {
      reverseInFlight.delete(key);
    });

  reverseInFlight.set(key, request);
  return request;
}

export type PlaceResult = {
  label: string;
  coordinate: [number, number];
};

const searchCache = new Map<
  string,
  { at: number; results: PlaceResult[] }
>();
const searchInFlight = new Map<string, Promise<PlaceResult[]>>();

/**
 * Forward search via Nominatim (OpenStreetMap).
 * Nominatim policy: max. 1 request/second, centralized in the fetch helper.
 */
export async function searchPlaces(
  query: string,
  language = i18n.language,
  limit = 5,
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const key = `${trimmed.toLowerCase()}|${language}|${limit}`;

  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.results;

  const pending = searchInFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetchWithRateLimit(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(trimmed)}&format=jsonv2&limit=${limit}`,
        {
          headers: {
            "Accept-Language": language,
            "User-Agent": `LocationApp/1.0 (cactus_apps@proton.me)`,
          },
        },
      );
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .filter(
          (item: any) =>
            typeof item?.lat === "string" && typeof item?.lon === "string",
        )
        .map((item: any) => ({
          label: String(item.display_name ?? trimmed),
          coordinate: [Number(item.lon), Number(item.lat)] as [number, number],
        }));
    } catch {
      return [];
    }
  })()
    .then((results) => {
      searchCache.set(key, { at: Date.now(), results });
      return results;
    })
    .finally(() => {
      searchInFlight.delete(key);
    });

  searchInFlight.set(key, request);
  return request;
}

type AddressParts = { country?: string; region?: string };

const addressCache = new Map<string, { at: number; value: AddressParts }>();
const addressInFlight = new Map<string, Promise<AddressParts>>();

export async function reverseGeocodeAddress(
  lat: number,
  lng: number,
  language = i18n.language,
): Promise<AddressParts> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)},${language || "en"}`;

  const cached = addressCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const pending = addressInFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetchWithRateLimit(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "Accept-Language": language || "en",
            "User-Agent": `GPS/1.0 (${process.env.EXPO_PUBLIC_WIKIPEDIA_EMAIL!})`,
          },
        },
      );
      const data = await res.json();
      return {
        country: data.address?.country,
        region: data.address?.state,
      };
    } catch {
      return {};
    }
  })()
    .then((value) => {
      addressCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      addressInFlight.delete(key);
    });

  addressInFlight.set(key, request);
  return request;
}
