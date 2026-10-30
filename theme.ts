import cityStyle from "@/assets/maps/dark-map.json";
import type { MapStyleKey } from "@/lib/storage/store";
import type { StyleSpecification } from "maplibre-gl";
import { Platform } from "react-native";

export const colors = {
  bg: "#0B0C0E",
  surface: "#15171A",
  surfaceAlt: "#1B1E22",
  surfaceElevated: "#22262B",

  border: "#262A2F",
  borderStrong: "#343A41",

  text: "#F2F4F7",
  textSecondary: "#9BA1AA",
  textMuted: "#616770",

  accent: "#4E7CFF",
  accentSoft: "rgba(78, 124, 255, 0.14)",
  accentBorder: "rgba(78, 124, 255, 0.40)",

  danger: "#F26D68",
  dangerSoft: "rgba(242, 109, 104, 0.13)",
  dangerBorder: "rgba(242, 109, 104, 0.35)",

  overlay: "rgba(0, 0, 0, 0.65)",

  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: "700" },
  heading: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "500" },
  label: { fontSize: 13, fontWeight: "600" },
  caption: { fontSize: 12, fontWeight: "500" },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
} as const;

export const MAP_DARK = cityStyle as StyleSpecification;

export const MAP_STYLE_OPTIONS: {
  key: MapStyleKey;
  labelKey: "map_style_dark" | "map_style_geo" | "map_style_bright";
  swatch: string;
  value: string | StyleSpecification;
}[] = [
  {
    key: "custom",
    labelKey: "map_style_dark",
    swatch: "#262E42",
    value: cityStyle as StyleSpecification,
  },
  {
    key: "liberty",
    labelKey: "map_style_geo",
    swatch: "#E8E1D3",
    value: "https://tiles.openfreemap.org/styles/liberty",
  },
  {
    key: "bright",
    labelKey: "map_style_bright",
    swatch: "#F2F0EA",
    value: "https://tiles.openfreemap.org/styles/bright",
  },
];

export function resolveMapStyle(key: MapStyleKey): string | StyleSpecification {
  return (
    MAP_STYLE_OPTIONS.find((option) => option.key === key)?.value ?? MAP_DARK
  );
}

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  android: { elevation: 8 },
  default: {},
});

export const theme = { colors, spacing, radius, typography, shadow };
export type Theme = typeof theme;
export default theme;
