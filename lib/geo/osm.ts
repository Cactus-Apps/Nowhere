import { fetchWithRateLimit } from "@/lib/fetchWithRateLimit";

export type LonLat = [number, number];

export type Obstacle = {
  kind: "intersection" | "signal";
  /** Meters along the route */
  distance: number;
  coordinate: LonLat;
};

export type Bbox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

export type OsmRouteData = {
  /** highway=traffic_signals nodes near the route */
  signals: LonLat[];
  /** OSM ways with maxspeed tag + geometry */
  ways: { geometry: LonLat[]; limit: number | null }[];
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const OVERPASS_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14; Nowhere) AppleWebKit/537.36",
};

const OVERPASS_CACHE_MS = 10 * 60 * 1000;
const overpassCache = new Map<string, { at: number; value: OsmRouteData }>();
const overpassInFlight = new Map<string, Promise<OsmRouteData>>();

/** Minimum heading change (degrees) for a bend to count as an intersection. */
export const CORNER_ANGLE_DEG = 60;
/** Minimum distance (m) between two detected intersections. */
export const CORNER_MIN_SPACING_M = 20;

/**
 * Detects intersections/corners geometrically in the route: all places where
 * the heading changes by at least CORNER_ANGLE_DEG (approx. 90° corners
 * with rounding), with a minimum spacing of CORNER_MIN_SPACING_M between hits.
 * Returns ready-to-use obstacles (distance = along the route, no projection needed).
 */
export function cornersFromRoute(
  route: LonLat[],
  cum: number[],
  angleDeg = CORNER_ANGLE_DEG,
  minSpacingM = CORNER_MIN_SPACING_M,
): Obstacle[] {
  const out: Obstacle[] = [];
  if (route.length < 3) return out;
  const rad = (angleDeg * Math.PI) / 180;
  let lastAlong = -Infinity;
  for (let i = 1; i < route.length - 1; i++) {
    const v1x = route[i][0] - route[i - 1][0];
    const v1y = route[i][1] - route[i - 1][1];
    const v2x = route[i + 1][0] - route[i][0];
    const v2y = route[i + 1][1] - route[i][1];
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    if (l1 === 0 || l2 === 0) continue;
    const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
    const turn = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (turn < rad) continue;
    const along = cum[i] ?? 0;
    if (along - lastAlong < minSpacingM) continue;
    lastAlong = along;
    out.push({ kind: "intersection", distance: along, coordinate: route[i] });
  }
  return out;
}

/** Extract intersection points from OSRM steps. */
export function intersectionsFromSteps(steps: any[]): LonLat[] {
  const out: LonLat[] = [];
  for (const step of steps) {
    const list = step?.intersections;
    if (!Array.isArray(list)) continue;
    for (const inter of list) {
      const loc = inter?.location;
      if (
        Array.isArray(loc) &&
        typeof loc[0] === "number" &&
        typeof loc[1] === "number"
      ) {
        out.push([loc[0], loc[1]]);
      }
    }
  }
  return out;
}

export function bboxOf(route: LonLat[], padDeg = 0.004): Bbox {
  let minLat = Infinity;
  let minLon = Infinity;
  let maxLat = -Infinity;
  let maxLon = -Infinity;
  for (const [lon, lat] of route) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return {
    minLat: minLat - padDeg,
    minLon: minLon - padDeg,
    maxLat: maxLat + padDeg,
    maxLon: maxLon + padDeg,
  };
}

/**
 * Projects a point onto the route (planar approximation with cos-latitude scaling).
 * Returns the nearest distance in meters and the distance along the route.
 */
export function projectOnRoute(
  route: LonLat[],
  cum: number[],
  point: LonLat,
): { distance: number; along: number; coordinate: LonLat } {
  const [px, py] = point;
  let best = {
    distance: Infinity,
    along: 0,
    coordinate: route[0] ?? point,
  };
  for (let i = 0; i < route.length - 1; i++) {
    const [x1, y1] = route[i];
    const [x2, y2] = route[i + 1];
    const cos = Math.max(Math.cos((y1 * Math.PI) / 180), 0.01);
    const ax = (x1 - px) * cos;
    const ay = y1 - py;
    const bx = (x2 - px) * cos;
    const by = y2 - py;
    const dx = (x2 - x1) * cos;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const mx = x1 + (x2 - x1) * t;
    const my = y1 + (y2 - y1) * t;
    const d = Math.hypot((mx - px) * cos, my - py) * 111320;
    if (d < best.distance) {
      const segLen = (cum[i + 1] ?? 0) - (cum[i] ?? 0);
      best = {
        distance: d,
        along: (cum[i] ?? 0) + t * segLen,
        coordinate: [mx, my],
      };
    }
  }
  return best;
}

/** Index of the route segment on which `dist` lies along the route. */
export function segmentIndexAt(cum: number[], dist: number): number {
  const last = cum.length - 1;
  if (last < 1) return 0;
  if (dist <= 0) return 0;
  if (dist >= cum[last]) return last - 1;
  let lo = 0;
  let hi = last;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= dist) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Parse maxspeed tag → m/s (null = no usable limit). */
export function parseMaxspeed(raw?: string): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === "walk") return 5 / 3.6;
  if (s === "none" || s === "signals" || s === "variable" || s === "")
    return null;
  const mph = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*mph$/);
  if (mph) return (parseFloat(mph[1]) * 1609.344) / 3600;
  const kn = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*kn$/);
  if (kn) return (parseFloat(kn[1]) * 1852) / 3600;
  const kmh = s.match(/^([0-9]+(?:\.[0-9]+)?)$/);
  if (kmh) return parseFloat(kmh[1]) / 3.6;
  if (s.includes("urban")) return 50 / 3.6;
  if (s.includes("rural")) return 100 / 3.6;
  return null;
}

/**
 * Fetches traffic lights (highway=traffic_signals) and roads with maxspeed from the
 * Overpass API for the route's bbox.
 */
export async function fetchOsmRouteData(bbox: Bbox): Promise<OsmRouteData> {
  const bboxStr = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
  const key = bboxStr;

  const cached = overpassCache.get(key);
  if (cached && Date.now() - cached.at < OVERPASS_CACHE_MS) {
    return cached.value;
  }

  const pending = overpassInFlight.get(key);
  if (pending) return pending;

  const query =
    `[out:json][timeout:30];` +
    `(` +
    `node["highway"="traffic_signals"](${bboxStr});` +
    `way["maxspeed"](${bboxStr});` +
    `);` +
    `out geom;`;

  const request = (async () => {
    let lastError: unknown = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetchWithRateLimit(endpoint, {
          method: "POST",
          headers: OVERPASS_HEADERS,
          body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const json = await res.json();
        return parseOverpass(json);
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError ?? new Error("Overpass failed");
  })()
    .then((value) => {
      overpassCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      overpassInFlight.delete(key);
    });

  overpassInFlight.set(key, request);
  return request;
}

function parseOverpass(json: any): OsmRouteData {
  const signals: LonLat[] = [];
  const ways: OsmRouteData["ways"] = [];
  for (const el of json?.elements ?? []) {
    if (el.type === "node" && typeof el.lat === "number") {
      signals.push([el.lon, el.lat]);
    } else if (el.type === "way" && Array.isArray(el.geometry)) {
      const geometry: LonLat[] = [];
      for (const g of el.geometry) {
        if (typeof g?.lon === "number" && typeof g?.lat === "number") {
          geometry.push([g.lon, g.lat]);
        }
      }
      if (geometry.length >= 2)
        ways.push({ geometry, limit: parseMaxspeed(el.tags?.maxspeed) });
    }
  }
  return { signals, ways };
}

/**
 * Builds a speed profile along the route: limits[i] = limit (m/s) of
 * segment route[i] → route[i+1], or null if none was found nearby (< 25 m).
 * Uses a 100 m grid for the neighborhood search.
 */
export function buildSpeedProfile(
  route: LonLat[],
  ways: OsmRouteData["ways"],
): (number | null)[] {
  const result: (number | null)[] = new Array(Math.max(0, route.length - 1));
  if (route.length < 2) return result;

  let sumLat = 0;
  for (const [, lat] of route) sumLat += lat;
  const cos0 = Math.max(
    Math.cos(((sumLat / route.length) * Math.PI) / 180),
    0.01,
  );
  const toMeters = ([lon, lat]: LonLat): [number, number] => [
    lon * cos0 * 111320,
    lat * 111320,
  ];

  const cell = 100;
  const grid = new Map<
    string,
    { x1: number; y1: number; x2: number; y2: number; limit: number }[]
  >();
  const key = (x: number, y: number) =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)}`;

  for (const way of ways) {
    if (way.limit == null) continue;
    for (let i = 0; i < way.geometry.length - 1; i++) {
      const [x1, y1] = toMeters(way.geometry[i]);
      const [x2, y2] = toMeters(way.geometry[i + 1]);
      const seg = { x1, y1, x2, y2, limit: way.limit };
      const cX = (x1 + x2) / 2;
      const cY = (y1 + y2) / 2;
      for (const dx of [-cell, 0, cell]) {
        for (const dy of [-cell, 0, cell]) {
          const k = key(cX + dx, cY + dy);
          const bucket = grid.get(k);
          if (bucket) bucket.push(seg);
          else grid.set(k, [seg]);
        }
      }
    }
  }
  if (grid.size === 0) {
    result.fill(null);
    return result;
  }

  const maxDist = 25;
  for (let i = 0; i < route.length - 1; i++) {
    const [ax, ay] = toMeters(route[i]);
    const [bx, by] = toMeters(route[i + 1]);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;

    let bestDist = Infinity;
    let bestLimit: number | null = null;
    const seen = new Set<string>();
    for (const dx of [-cell, 0, cell]) {
      for (const dy of [-cell, 0, cell]) {
        const bucket = grid.get(key(mx + dx, my + dy));
        if (!bucket) continue;
        for (const seg of bucket) {
          const id = `${seg.x1},${seg.y1},${seg.x2},${seg.y2},${seg.limit}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const d = pointSegDist(mx, my, seg.x1, seg.y1, seg.x2, seg.y2);
          if (d < bestDist) {
            bestDist = d;
            bestLimit = seg.limit;
          }
        }
      }
    }
    result[i] = bestDist <= maxDist ? bestLimit : null;
  }
  return result;
}

function pointSegDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0)
    t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
