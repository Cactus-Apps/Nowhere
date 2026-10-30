import { colors } from "@/theme";

export const DEFAULT_COORD: [number, number] = [2.3522, 48.8566];
export const TICK_MS = 100;
export const MIN_FORCE = 0.08;

export const PICK_COLORS = {
  start: "#37D67A",
  stop: "#FFB020",
  end: colors.danger,
};

export type PickMode = "start" | "end" | "stop" | "stop-new" | null;
