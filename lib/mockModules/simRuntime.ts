import AsyncStorage from "@react-native-async-storage/async-storage";

/** Per JS process – runtime from an earlier process is not continued */
export const SIM_SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type RuntimeBase = {
  /** true = simulation should keep running (also in the background) */
  active: boolean;
  /** Set automatically on write */
  sessionId?: string;
  coord: [number, number];
  /** m/s – speed at the time of writing */
  speed: number;
  updatedAt: number;
};

export type SimRuntime =
  | (RuntimeBase & {
      kind: "joystick";
      /** m/s velocity vector (east, north) */
      vx: number;
      vy: number;
    })
  | (RuntimeBase & {
      kind: "system";
      routeKey: string;
      /** Meters along the route */
      traveled: number;
      /** Route fully traveled (vs. paused) */
      finished: boolean;
    });

export type SimRoute = { routeKey: string; route: [number, number][] };

const RUNTIME_KEY = "nowhere-sim-runtime";
const ROUTE_KEY = "nowhere-sim-route";

let lastWriteAt = 0;
let lastForegroundTickAt = 0;

/**
 * Foreground simulations advance the runtime on every JS tick. The background
 * task must not advance a second time while those ticks are still alive – a
 * simple in-memory heartbeat decides which side is currently in control.
 */
export function markForegroundTick() {
  lastForegroundTickAt = Date.now();
}

export function foregroundTickAgeMs() {
  return Date.now() - lastForegroundTickAt;
}

export async function readSimRuntime(): Promise<SimRuntime | null> {
  try {
    const raw = await AsyncStorage.getItem(RUNTIME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SimRuntime;
    return parsed && typeof parsed.updatedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeSimRuntime(runtime: SimRuntime): Promise<void> {
  lastWriteAt = Date.now();
  try {
    await AsyncStorage.setItem(
      RUNTIME_KEY,
      JSON.stringify({ ...runtime, sessionId: SIM_SESSION_ID }),
    );
  } catch {
    // Persistence is optional – do not escalate errors
  }
}

/** Throttled write access for 100-ms ticks – max. approx. once per second. */
export function writeSimRuntimeThrottled(
  runtime: SimRuntime,
  minIntervalMs = 900,
) {
  const now = Date.now();
  if (now - lastWriteAt < minIntervalMs) return;
  void writeSimRuntime(runtime);
}

export async function deactivateSimRuntime(
  kind: SimRuntime["kind"],
): Promise<void> {
  try {
    const runtime = await readSimRuntime();
    if (runtime && runtime.kind === kind && runtime.active) {
      await writeSimRuntime({
        ...runtime,
        active: false,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignore
  }
}

export async function writeSimRoute(
  routeKey: string,
  route: [number, number][],
): Promise<void> {
  try {
    await AsyncStorage.setItem(ROUTE_KEY, JSON.stringify({ routeKey, route }));
  } catch {
    // ignore
  }
}

export async function readSimRoute(): Promise<SimRoute | null> {
  try {
    const raw = await AsyncStorage.getItem(ROUTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SimRoute;
  } catch {
    return null;
  }
}

export async function clearSimRuntime(): Promise<void> {
  lastWriteAt = 0;
  try {
    await AsyncStorage.removeItem(RUNTIME_KEY);
    await AsyncStorage.removeItem(ROUTE_KEY);
  } catch {
    // ignore
  }
}
