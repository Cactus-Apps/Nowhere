import { changeLanguage } from "@/lib/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

export type Mode = "joystick" | "system";
export type FeatureKey = "walk" | "drive";
export type JoystickSide = "left" | "right";
/** Display units for speeds */
export type Units = "metric" | "imperial";
/** Available map styles (own custom style + OpenFreeMap styles) */
export type MapStyleKey = "custom" | "dark" | "liberty" | "bright";
/** App language (translations to follow) */
export type LanguageKey = "de" | "en" | "es";
/** Default movement type from onboarding */
export type MovementKey = "walk" | "drive" | "free";

export type RoutePoint = {
  coordinate: [number, number];
  label: string;
};

export type Place = RoutePoint;

export type SystemConfig = {
  start: RoutePoint | null;
  end: RoutePoint | null;
  stops: RoutePoint[];
  /** m/s */
  speed: number;
};

export type SpeedMode = "custom" | "traffic";

export type DriveSystemConfig = SystemConfig & {
  /** "custom" = own slider, "traffic" = OSM maxspeed (traffic rules) */
  speedMode: SpeedMode;
  /** Number of obstacles (intersections/traffic lights) at which to wait */
  obstacleStops: number;
};

type State = {
  modes: Record<FeatureKey, Mode>;
  /** m/s – shared walking speed (free roam & walking) */
  walkSpeed: number;
  /** m/s – joystick speed for driving */
  driveSpeed: number;
  system: SystemConfig;
  /** own route/speed configuration for system drive mode */
  driveSystem: DriveSystemConfig;
  /** whether the MockLocation service is currently active */
  mockActive: boolean;
  /** which side the joystick should be on (left = default, right = left-handed) */
  joystickSide: JoystickSide;
  /** Display units: metric = km/h, imperial = mph */
  units: Units;
  /** active map style */
  mapStyle: MapStyleKey;
  /** selected app language */
  language: LanguageKey;
  /** whether the map hint (on first app open) has already been seen */
  mapHintSeen: boolean;
  /** whether onboarding has already been completed */
  onboardingDone: boolean;
  /** whether privacy policy, terms of use and disclaimer have been accepted */
  acceptedLegal: boolean;
  /** movement type default from onboarding */
  movement: MovementKey;
  /** internal: AsyncStorage hydration complete? (not persisted) */
  _hydrated: boolean;
  favorites: Place[];
  recent: Place[];
  setMode: (feature: FeatureKey, mode: Mode) => void;
  setWalkSpeed: (speed: number) => void;
  setDriveSpeed: (speed: number) => void;
  setMockActive: (active: boolean) => void;
  setJoystickSide: (side: JoystickSide) => void;
  setUnits: (units: Units) => void;
  setMapStyle: (mapStyle: MapStyleKey) => void;
  setLanguage: (language: LanguageKey) => void;
  /** permanently hides the map hint */
  dismissMapHint: () => void;
  setOnboardingDone: (done: boolean) => void;
  setAcceptedLegal: (accepted: boolean) => void;
  setMovement: (movement: MovementKey) => void;
  addFavorite: (place: Place) => void;
  removeFavorite: (coordinate: [number, number]) => void;
  addRecent: (place: Place) => void;
  clearRecent: () => void;
  updateSystem: (
    patch:
      | Partial<SystemConfig>
      | ((system: SystemConfig) => Partial<SystemConfig>),
  ) => void;
  updateDriveSystem: (
    patch:
      | Partial<DriveSystemConfig>
      | ((system: DriveSystemConfig) => Partial<DriveSystemConfig>),
  ) => void;
};

const STORAGE_KEY = "nowhere-state-v1";
const RECENT_MAX = 6;
const FAVORITES_MAX = 20;

let state: State = {
  modes: { walk: "joystick", drive: "system" },
  walkSpeed: 1.5,
  driveSpeed: 14,
  system: { start: null, end: null, stops: [], speed: 1.5 },
  driveSystem: {
    start: null,
    end: null,
    stops: [],
    speed: 14,
    speedMode: "custom",
    obstacleStops: 0,
  },
  mockActive: false,
  joystickSide: "left",
  units: "metric",
  mapStyle: "custom",
  language: "de",
  mapHintSeen: false,
  onboardingDone: false,
  acceptedLegal: false,
  movement: "walk",
  _hydrated: false,
  favorites: [],
  recent: [],
  setMode: (feature, mode) =>
    setState({ modes: { ...state.modes, [feature]: mode } }),
  setWalkSpeed: (walkSpeed) => setState({ walkSpeed }),
  setDriveSpeed: (driveSpeed) => setState({ driveSpeed }),
  setMockActive: (mockActive) => setState({ mockActive }),
  setJoystickSide: (joystickSide) => setState({ joystickSide }),
  setUnits: (units) => setState({ units }),
  setMapStyle: (mapStyle) => setState({ mapStyle }),
  setLanguage: (language) => {
    void changeLanguage(language);
    setState({ language });
  },
  dismissMapHint: () => {
    if (!state.mapHintSeen) setState({ mapHintSeen: true });
  },
  setOnboardingDone: (onboardingDone) => setState({ onboardingDone }),
  setAcceptedLegal: (acceptedLegal) => setState({ acceptedLegal }),
  setMovement: (movement) => setState({ movement }),
  addFavorite: (place) => {
    const key = placeKey(place.coordinate);
    const without = state.favorites.filter((f) => placeKey(f.coordinate) !== key);
    setState({ favorites: [place, ...without].slice(0, FAVORITES_MAX) });
  },
  removeFavorite: (coordinate) => {
    const key = placeKey(coordinate);
    setState({
      favorites: state.favorites.filter((f) => placeKey(f.coordinate) !== key),
    });
  },
  addRecent: (place) => {
    const key = placeKey(place.coordinate);
    const without = state.recent.filter((r) => placeKey(r.coordinate) !== key);
    setState({ recent: [place, ...without].slice(0, RECENT_MAX) });
  },
  clearRecent: () => setState({ recent: [] }),
  updateSystem: (patch) =>
    setState({
      system: {
        ...state.system,
        ...(typeof patch === "function" ? patch(state.system) : patch),
      },
    }),
  updateDriveSystem: (patch) =>
    setState({
      driveSystem: {
        ...state.driveSystem,
        ...(typeof patch === "function" ? patch(state.driveSystem) : patch),
      },
    }),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function placeKey(coordinate: [number, number]) {
  return `${coordinate[1].toFixed(4)},${coordinate[0].toFixed(4)}`;
}

let persistScheduled = false;

function schedulePersist() {
  if (persistScheduled) return;
  persistScheduled = true;
  setTimeout(() => {
    persistScheduled = false;
    const data = {
      modes: state.modes,
      walkSpeed: state.walkSpeed,
      driveSpeed: state.driveSpeed,
      joystickSide: state.joystickSide,
      units: state.units,
      mapStyle: state.mapStyle,
      language: state.language,
      mapHintSeen: state.mapHintSeen,
      onboardingDone: state.onboardingDone,
      acceptedLegal: state.acceptedLegal,
      movement: state.movement,
      favorites: state.favorites,
      recent: state.recent,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, 150);
}

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
  schedulePersist();
}

export function getState() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reads the entire store and re-renders on every change. */
export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

/** Load persisted settings from AsyncStorage. */
export async function hydrateStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await changeLanguage(state.language);
      setState({ _hydrated: true });
      return;
    }
    const data = JSON.parse(raw);
    const patch: Partial<State> = {};
    if (data.modes?.walk && data.modes?.drive) patch.modes = data.modes;
    if (typeof data.walkSpeed === "number") patch.walkSpeed = data.walkSpeed;
    if (typeof data.driveSpeed === "number") patch.driveSpeed = data.driveSpeed;
    if (data.joystickSide === "left" || data.joystickSide === "right")
      patch.joystickSide = data.joystickSide;
    if (data.units === "metric" || data.units === "imperial")
      patch.units = data.units;
    if (
      data.mapStyle === "custom" ||
      data.mapStyle === "dark" ||
      data.mapStyle === "liberty" ||
      data.mapStyle === "bright"
    )
      patch.mapStyle = data.mapStyle;
    if (
      data.language === "de" ||
      data.language === "en" ||
      data.language === "es"
    )
      patch.language = data.language;
    // First installation (no saved state) → show hint.
    // Existing users without the flag should no longer see the tip.
    if (typeof data.mapHintSeen === "boolean")
      patch.mapHintSeen = data.mapHintSeen;
    else patch.mapHintSeen = true;
    // First installation → show onboarding; existing users without the flag
    // have already completed setup.
    if (typeof data.onboardingDone === "boolean")
      patch.onboardingDone = data.onboardingDone;
    else patch.onboardingDone = true;
    // Only explicitly saved consent counts (no silent adoption).
    if (typeof data.acceptedLegal === "boolean")
      patch.acceptedLegal = data.acceptedLegal;
    if (data.movement === "walk" || data.movement === "drive" || data.movement === "free")
      patch.movement = data.movement;
    if (Array.isArray(data.favorites)) patch.favorites = data.favorites;
    if (Array.isArray(data.recent)) patch.recent = data.recent;
    if (Object.keys(patch).length) setState(patch);
    await changeLanguage(state.language);
    setState({ _hydrated: true });
  } catch {
    // Persistence is nice-to-have – silently ignore errors
    await changeLanguage(state.language);
    setState({ _hydrated: true });
  }
}
