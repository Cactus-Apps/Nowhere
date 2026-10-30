import {
  buildCumulative,
  pointAt,
} from "@/components/simulate/SimulateUiHelper";
import i18n from "@/lib/i18n";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import {
  callMockUpdate,
  setBackgroundController,
} from "./mockLocationController";
import {
  readSimRoute,
  readSimRuntime,
  SIM_SESSION_ID,
  writeSimRuntime,
} from "./simRuntime";

const BACKGROUND_LOCATION_TASK_NAME = "nowhere-background-location";

/** Minimum age so the foreground tick is not advanced twice */
const MIN_ADVANCE_DT = 3;
/** Maximum step size per event (after a long pause) */
const MAX_ADVANCE_DT = 15;
/** Older than this → simulation is considered finished */
const STALE_MS = 60_000;

let backgroundStarted = false;
let starting = false;
/** User intent – prevents a late-finishing start from continuing after stop */
let backgroundWanted = false;
/** Background permission denied → do not request again on every tick */
let permissionDenied = false;

async function stopUpdates() {
  backgroundWanted = false;
  try {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
  } catch {
    // ignore
  } finally {
    backgroundStarted = false;
  }
}

/** Cache so the task does not read the route from AsyncStorage on every event */
let routeCache: { routeKey: string; route: [number, number][] } | null = null;

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) return;
    const locations = (
      data as
        | { locations?: { coords: Location.LocationObjectCoords }[] }
        | undefined
    )?.locations;
    if (!locations || locations.length === 0) return;

    try {
      const runtime = await readSimRuntime();
      // No active simulation → stop background location access immediately.
      if (!runtime || !runtime.active) {
        await stopUpdates();
        return;
      }
      // Do not continue the runtime of an earlier app process
      if (runtime.sessionId !== SIM_SESSION_ID) {
        await stopUpdates();
        return;
      }

      const now = Date.now();
      const age = now - runtime.updatedAt;
      if (age > STALE_MS) {
        await writeSimRuntime({ ...runtime, active: false, updatedAt: now });
        await stopUpdates();
        return;
      }
      // Foreground tick writes continuously → do not advance twice
      if (age < MIN_ADVANCE_DT * 1000) return;

      const step = Math.min(age / 1000, MAX_ADVANCE_DT);

      if (runtime.kind === "joystick") {
        const [lng, lat] = runtime.coord;
        const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
        const next: [number, number] = [
          lng + (runtime.vx * step) / (111320 * cos),
          lat + (runtime.vy * step) / 111320,
        ];
        await callMockUpdate(next[1], next[0]);
        await writeSimRuntime({ ...runtime, coord: next, updatedAt: now });
        return;
      }

      if (!routeCache || routeCache.routeKey !== runtime.routeKey) {
        const stored = await readSimRoute();
        if (
          !stored ||
          stored.routeKey !== runtime.routeKey ||
          stored.route.length < 2
        ) {
          return;
        }
        routeCache = stored;
      }

      const route = routeCache.route;
      const cum = buildCumulative(route);
      const total = cum[cum.length - 1] ?? 0;
      const traveled = runtime.traveled + runtime.speed * step;

      if (traveled >= total) {
        const end = route[route.length - 1];
        await callMockUpdate(end[1], end[0]);
        await writeSimRuntime({
          ...runtime,
          coord: end,
          traveled: total,
          finished: true,
          active: false,
          updatedAt: now,
        });
        await stopUpdates();
        return;
      }

      const coord = pointAt(route, cum, traveled);
      await callMockUpdate(coord[1], coord[0]);
      await writeSimRuntime({ ...runtime, coord, traveled, updatedAt: now });
    } catch {
      // Never escalate task errors
    }
  },
);

export async function startBackgroundLocationUpdates() {
  backgroundWanted = true;
  if (backgroundStarted || starting || permissionDenied) return;
  starting = true;
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      permissionDenied = true;
      return;
    }
    if (!backgroundWanted) return;
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Nowhere",
        notificationBody: i18n.t("background_notification_body"),
      },
    });
    backgroundStarted = true;
    if (!backgroundWanted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
      backgroundStarted = false;
    }
  } catch {
    // ignore
  } finally {
    starting = false;
  }
}

export async function stopBackgroundLocationUpdates() {
  permissionDenied = false;
  await stopUpdates();
}

/**
 * Clean up on app start: If a background task from an earlier session
 * is still registered but no simulation is running, location access
 * is stopped.
 */
export async function reconcileBackgroundLocation() {
  let started = false;
  try {
    started = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );
  } catch {
    started = false;
  }
  if (!started) {
    backgroundStarted = false;
    backgroundWanted = false;
    return;
  }
  const runtime = await readSimRuntime();
  const active =
    !!runtime &&
    runtime.active &&
    runtime.sessionId === SIM_SESSION_ID &&
    Date.now() - runtime.updatedAt <= STALE_MS;
  if (active) {
    backgroundStarted = true;
    return;
  }
  await stopUpdates();
}

export function isBackgroundLocationActive() {
  return backgroundStarted;
}

setBackgroundController({
  start: () => {
    void startBackgroundLocationUpdates();
  },
  stop: () => {
    void stopBackgroundLocationUpdates();
  },
});
