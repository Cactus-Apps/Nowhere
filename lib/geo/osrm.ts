import { fetchWithRateLimit } from "@/lib/fetchWithRateLimit";

export type OsrmProfile = "driving" | "cycling" | "walking";

/**
 * OSRM servers are public community instances and occasionally return
 * 400/500/Timeout. Therefore, there are two endpoints for each profile (primary +
 * fallback); each is retried once in case of failure before the
 * next server is attempted. Only if all fail is the result
 * `null` (Error #5).
 */
export const OSRM_ENDPOINTS: Record<
  OsrmProfile,
  { primary: string; fallback: string }
> = {
  driving: {
    primary: "https://routing.openstreetmap.de/routed-car",
    fallback: "https://router.project-osrm.org",
  },
  cycling: {
    primary: "https://routing.openstreetmap.de/routed-bike",
    fallback: "https://router.project-osrm.org",
  },
  walking: {
    primary: "https://routing.openstreetmap.de/routed-foot",
    fallback: "https://router.project-osrm.org",
  },
};

const ROUTE_CACHE_MS = 5 * 60 * 1000;
const ROUTE_ERROR_CACHE_MS = 20 * 1000;

const routeCache = new Map<
  string,
  { at: number; routes: any[] | null }
>();
const routeInFlight = new Map<string, Promise<any[] | null>>();

async function loadRoutes(
  coordinates: string,
  profile: OsrmProfile,
): Promise<any[] | null> {
  const servers = [
    OSRM_ENDPOINTS[profile].primary,
    OSRM_ENDPOINTS[profile].fallback,
  ];

  for (const server of servers) {
    const url =
      `${server}/route/v1/${profile}/` +
      `${coordinates}` +
      `?overview=full&alternatives=true&geometries=geojson&steps=true`;
    try {
      const res = await fetchWithRateLimit(url);
      if (!res.ok) {
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 2000));
        }
        continue;
      }
      const json = await res.json();
      if (json?.routes?.length) return json.routes;
    } catch {
      // Try the next server
    }
  }
  return null;
}

export async function fetchOsrmRoutes(
  from: [number, number],
  to: [number, number],
  profile: OsrmProfile,
  waypoints: [number, number][] = [],
): Promise<any[] | null> {
  const coordinates = [from, ...waypoints, to]
    .map((c) => `${c[0]},${c[1]}`)
    .join(";");
  const key = `${profile}|${coordinates}`;

  const cached = routeCache.get(key);
  if (cached) {
    const ttl = cached.routes ? ROUTE_CACHE_MS : ROUTE_ERROR_CACHE_MS;
    if (Date.now() - cached.at < ttl) return cached.routes;
  }

  const pending = routeInFlight.get(key);
  if (pending) return pending;

  const request = loadRoutes(coordinates, profile)
    .then((routes) => {
      routeCache.set(key, { at: Date.now(), routes });
      return routes;
    })
    .finally(() => {
      routeInFlight.delete(key);
    });

  routeInFlight.set(key, request);
  return request;
}
