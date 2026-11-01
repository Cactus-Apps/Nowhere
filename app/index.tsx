import CustomMap from "@/components/customMap";
import ModalSheet from "@/components/modals/modal";
import { pinHtml } from "@/components/simulate/SimulateUiHelper";
import PlaceSearch from "@/components/ui/placeSearch";
import PowerFab from "@/components/ui/powerFab";
import SegmentedControl from "@/components/ui/segmentedControl";
import { reverseGeocode } from "@/lib/geo/geocoding";
import {
  getMockPosition,
  isMockEnabled,
  startMock,
  stopMock,
  updateMock,
} from "@/lib/mockModules/mockLocation";
import { openAppSettings, openLocationSettings } from "@/lib/onboarding";
import { FeatureKey, getState, placeKey, useStore } from "@/lib/storage/store";
import {
  colors,
  radius,
  resolveMapStyle,
  shadow,
  spacing,
  typography,
} from "@/theme";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Car,
  ChevronRight,
  Compass,
  Footprints,
  MapPin,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppState,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MapProvider,
  MapRef,
  Marker,
  MarkerRef,
} from "react-native-maplibre-gl-js";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";

type HomeMode = FeatureKey | "free";

type ScreenError = {
  message: string;
  /** Label for an extra button (e.g. "Open settings") */
  actionLabel?: string;
  /** Action performed by the extra button */
  onAction?: () => void;
};

const SNAP_POINTS = ["18%", "47%", "69%", "100%"];
const PEEK_RATIO = 0.18;
const HOME_MODES: {
  value: HomeMode;
  labelKey: string;
  Icon: typeof Footprints;
  startKey: string;
  route: string;
}[] = [
  {
    value: "walk",
    labelKey: "mode_walk",
    Icon: Footprints,
    startKey: "home_start_walk",
    route: "/walk",
  },
  {
    value: "drive",
    labelKey: "mode_drive",
    Icon: Car,
    startKey: "home_start_drive",
    route: "/car",
  },
  {
    value: "free",
    labelKey: "mode_free",
    Icon: Compass,
    startKey: "home_start_free",
    route: "/free-roam",
  },
];

function movedEnough(
  prev: [number, number] | undefined,
  next: [number, number],
  minMeters = 80,
) {
  if (!prev) return true;
  const dLat = Math.abs(next[1] - prev[1]) * 111320;
  const dLng =
    Math.abs(next[0] - prev[0]) * 111320 * Math.cos((next[1] * Math.PI) / 180);
  return Math.hypot(dLat, dLng) > minMeters;
}

export default function HomeScreen() {
  const { onboard } = useLocalSearchParams<{ onboard?: string }>();
  const {
    mockActive,
    modes,
    favorites,
    recent,
    addRecent,
    addFavorite,
    removeFavorite,
    clearRecent,
    setMode,
    mapStyle: mapStyleKey,
    mapHintSeen,
    dismissMapHint,
  } = useStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const hasCenteredOnce = useRef(false);
  const isDragging = useRef(false);
  const manualRef = useRef(false);
  const [pitch, setPitch] = useState(false);
  const [bearing, setBearing] = useState(0);
  const lastBearingRef = useRef(0);
  const realPosRef = useRef<[number, number] | undefined>(undefined);
  const lastFakeGeoRef = useRef<[number, number] | undefined>(undefined);
  const lastRealGeoRef = useRef<[number, number] | undefined>(undefined);

  const [markerPos, setMarkerPos] = useState<[number, number]>();
  const [realPos, setRealPos] = useState<[number, number]>();
  const [fakePlace, setFakePlace] = useState("");
  const [realPlace, setRealPlace] = useState("");
  const [error, setError] = useState<ScreenError | "">("");
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [homeMode, setHomeMode] = useState<HomeMode>("walk");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapHintOverride, setMapHintOverride] = useState(false);
  const resolvedStyle = useMemo(
    () => resolveMapStyle(mapStyleKey),
    [mapStyleKey],
  );

  const fullScreen = sheetIndex === 4;
  const peekHeight = Math.round(Dimensions.get("window").height * PEEK_RATIO);

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

  const markerPosRef = useRef(markerPos);
  markerPosRef.current = markerPos;

  const handleMapLoad = () => {
    setMapReady(true);
    if (hasCenteredOnce.current) {
      const target = markerPosRef.current ?? realPosRef.current;
      if (target) {
        mapRef.current?.flyTo({
          center: target,
          zoom: 14,
          speed: 0.8,
          duration: 600,
        });
      }
      ensureGlobe();
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setMapReady(true), 8000);
    return () => clearTimeout(timeout);
  }, []);

  // After onboarding: show the map and drag the bottom sheet to half height
  const onboardHandled = useRef(false);
  useEffect(() => {
    if (!onboard || onboardHandled.current || !mapReady) return;
    onboardHandled.current = true;
    const timeout = setTimeout(
      () => bottomSheetRef.current?.snapToIndex(1),
      900,
    );
    return () => clearTimeout(timeout);
  }, [onboard, mapReady]);

  const flyToReal = (coord: [number, number]) => {
    mapRef.current?.flyTo({
      center: coord,
      zoom: 14,
      speed: 0.8,
      duration: 700,
      pitch: 0,
    });
  };

  const returnToRealLocation = () => {
    manualRef.current = false;
    // Reset geocode caches → Nominatim will be fetched again,
    // regardless of the effects' movedEnough gate
    lastFakeGeoRef.current = undefined;
    lastRealGeoRef.current = undefined;

    const lastReal = realPosRef.current;
    if (lastReal) {
      setMarkerPos(lastReal);
      flyToReal(lastReal);
      // Fetch the label fresh immediately (instead of via the effect),
      // so the status does not remain on the faked place name
      reverseGeocode(lastReal[1], lastReal[0]).then((label) => {
        if (!getState().mockActive) setRealPlace(label);
      });
      // fakePlace follows automatically via the markerPos effect (cache reset)
    } else {
      // No last known real fix – request a fresh one
      (async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (getState().mockActive) return;
          const coord: [number, number] = [
            loc.coords.longitude,
            loc.coords.latitude,
          ];
          realPosRef.current = coord;
          setRealPos(coord);
          setMarkerPos(coord);
          flyToReal(coord);
        } catch {}
      })();
    }
  };

  const toggle = async () => {
    try {
      if (!mockActive) {
        const target = markerPos ?? realPosRef.current;
        if (!target) {
          setError({
            message: t("home_location_not_available"),
          });
          return;
        }
        await startMock(target[1], target[0]);
      } else {
        await stopMock();
        returnToRealLocation();
      }
    } catch (err: any) {
      setError(err);
    }
  };

  const applyManualPos = useCallback(
    async (coordinate: [number, number], addToRecent = true) => {
      manualRef.current = true;
      dismissMapHint();
      setMapHintOverride(false);
      setMarkerPos(coordinate);
      mapRef.current?.flyTo({
        center: coordinate,
        zoom: 15,
        speed: 0.8,
        duration: 600,
        pitch: 0,
      });
      if (mockActive) updateMock(coordinate[1], coordinate[0]);
      if (addToRecent) {
        const label = await reverseGeocode(coordinate[1], coordinate[0]);
        addRecent({ label, coordinate });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mockActive],
  );

  const handleMapClick = (e: { lngLat: { lng: number; lat: number } }) => {
    const lng = e?.lngLat?.lng;
    const lat = e?.lngLat?.lat;
    if (typeof lng !== "number" || typeof lat !== "number") return;
    if (!mockActive) {
      setMapHintOverride(true);
      return;
    }
    applyManualPos([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  };

  const clickRef = useRef(handleMapClick);
  clickRef.current = handleMapClick;

  const handleMarkerDragEnd = async () => {
    try {
      const lngLat = await markerRef.current?.getLngLat();
      if (lngLat) {
        const lng = Number(lngLat.lng.toFixed(6));
        const lat = Number(lngLat.lat.toFixed(6));
        manualRef.current = true;
        dismissMapHint();
        setMarkerPos([lng, lat]);
        if (mockActive) {
          await updateMock(lat, lng);
        }
      }
    } catch (err: any) {
      setError(err);
    } finally {
      isDragging.current = false;
    }
  };

  const currentIsFavorite = useMemo(() => {
    if (!markerPos) return false;
    const key = placeKey(markerPos);
    return favorites.some((f) => placeKey(f.coordinate) === key);
  }, [favorites, markerPos]);

  const toggleFavorite = () => {
    if (!markerPos) return;
    if (currentIsFavorite) {
      removeFavorite(markerPos);
      return;
    }
    addFavorite({
      coordinate: markerPos,
      label:
        fakePlace || `${markerPos[1].toFixed(4)}, ${markerPos[0].toFixed(4)}`,
    });
  };

  const resetToNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
    setPitch(false);
  };

  const updateBearing = async () => {
    try {
      const b = await mapRef.current?.getBearing?.();
      if (b == null || typeof b !== "number") return;
      if (Math.abs(b - lastBearingRef.current) < 0.5) return;
      lastBearingRef.current = b;
      setBearing(b);
    } catch {}
  };

  const startLocationWatcher = useCallback(async () => {
    if (subRef.current) return;

    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationBlocked(true);
        setError({
          message: t("home_location_services_disabled"),
          actionLabel: t("common_open_settings"),
          onAction: () => {
            openLocationSettings();
          },
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationBlocked(true);
        setError({
          message: t("home_location_permission_required"),
          actionLabel: t("common_open_settings"),
          onAction: () => {
            openAppSettings();
          },
        });
        return;
      }

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          if (isDragging.current) return;
          const { latitude, longitude } = loc.coords;
          const coord: [number, number] = [longitude, latitude];
          if (getState().mockActive) {
            // A real fix can still slip through the fused provider – never let
            // it pull the marker away from the simulated position. Only check
            // on Android 12+, where the mock flag is reliable.
            if (
              Platform.OS === "android" &&
              Number(Platform.Version) >= 31 &&
              loc.mocked === false
            ) {
              return;
            }
            if (!manualRef.current) setMarkerPos(coord);
            return;
          }
          realPosRef.current = coord;
          setRealPos(coord);
          if (!manualRef.current) {
            setMarkerPos(coord);
          }
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo({
              center: coord,
              zoom: 14,
              speed: 0.8,
              duration: 600,
            });
            ensureGlobe();
          }
        },
      );
      // Watcher is running → clear previous location errors
      setLocationBlocked(false);
      setError("");
    } catch (err: any) {
      setError({
        message: err?.message ?? t("common_location_unavailable"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    startLocationWatcher();

    return () => {
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [startLocationWatcher]);

  // On return (e.g. after a simulation) adopt the simulated position
  // while mock is active – never show the real location.
  useFocusEffect(
    useCallback(() => {
      if (!isMockEnabled()) return;
      const pos = getMockPosition();
      if (!pos) return;
      manualRef.current = false;
      setMarkerPos(pos);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: pos,
          zoom: 15,
          speed: 0.8,
          duration: 600,
          pitch: 0,
        });
      }
      startLocationWatcher();
    }, [startLocationWatcher]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startLocationWatcher();
      }
    });
    return () => sub.remove();
  }, [startLocationWatcher]);

  // If location services were blocked: poll in the app whether they
  // have become active in the meantime (quick-settings toggle does not trigger an AppState change).
  useEffect(() => {
    if (!locationBlocked) return;
    const id = setInterval(() => {
      startLocationWatcher();
    }, 2000);
    return () => clearInterval(id);
  }, [locationBlocked, startLocationWatcher]);

  useEffect(() => {
    if (!markerPos) return;
    if (!movedEnough(lastFakeGeoRef.current, markerPos)) return;
    lastFakeGeoRef.current = markerPos;
    let cancelled = false;
    reverseGeocode(markerPos[1], markerPos[0]).then((label) => {
      if (!cancelled) setFakePlace(label);
    });
    return () => {
      cancelled = true;
    };
  }, [markerPos]);

  useEffect(() => {
    if (!realPos) return;
    if (!movedEnough(lastRealGeoRef.current, realPos)) return;
    lastRealGeoRef.current = realPos;
    let cancelled = false;
    reverseGeocode(realPos[1], realPos[0]).then((label) => {
      if (!cancelled) setRealPlace(label);
    });
    return () => {
      cancelled = true;
    };
  }, [realPos]);

  const statusText = !markerPos
    ? t("home_status_locating")
    : mockActive
      ? t("home_status_active", { place: fakePlace || "…" })
      : t("home_status_inactive", { place: realPlace || fakePlace || "…" });

  const selectedMode = HOME_MODES.find((m) => m.value === homeMode)!;
  const controlMode =
    homeMode === "free" ? "joystick" : modes[homeMode as FeatureKey];

  const handleStart = () => {
    router.push(selectedMode.route as any);
  };

  const handleControlChange = (m: "joystick" | "system") => {
    setMode("walk", m);
    setMode("drive", m);
  };

  const openPlace = (coordinate: [number, number]) => {
    applyManualPos(coordinate, false);
  };

  const placeChip = (
    place: { label: string; coordinate: [number, number] },
    isFavorite: boolean,
  ) => (
    <View key={placeKey(place.coordinate)} style={styles.chipWrap}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openPlace(place.coordinate)}
        style={styles.chip}
      >
        {isFavorite ? (
          <Star size={13} color={colors.accent} fill={colors.accent} />
        ) : (
          <MapPin size={13} color={colors.textMuted} />
        )}
        <Text style={styles.chipLabel} numberOfLines={1}>
          {place.label}
        </Text>
      </TouchableOpacity>
      {isFavorite ? (
        <TouchableOpacity
          onPress={() => removeFavorite(place.coordinate)}
          hitSlop={6}
          style={styles.chipRemove}
        >
          <X size={12} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="light" />
        <MapProvider>
          <CustomMap
            ref={mapRef}
            onLoad={handleMapLoad}
            ensureGlobe={ensureGlobe}
            onMapClick={(e) => clickRef.current(e)}
            style={resolvedStyle}
            updateBearing={updateBearing}
          />
          {markerPos ? (
            <Marker
              ref={markerRef}
              options={{
                coordinate: markerPos,
                draggable: mockActive,
                element: {
                  innerHTML: pinHtml(
                    mockActive ? colors.accent : colors.textMuted,
                  ),
                },
              }}
              listeners={{
                dragstart: {
                  objectListener: () => {
                    isDragging.current = true;
                  },
                },
                dragend: {
                  objectListener: () => {
                    handleMarkerDragEnd();
                  },
                },
              }}
            />
          ) : null}

          {sheetIndex === 4 ? null : (
            <>
              <TouchableOpacity
                onPress={resetToNorth}
                style={{
                  position: "absolute",
                  top: 81,
                  right: spacing.lg,
                  width: 44,
                  height: 44,
                  zIndex: 100,
                }}
                activeOpacity={0.8}
              >
                <Svg width={44} height={44} viewBox="0 0 44 44">
                  <Circle
                    cx="22"
                    cy="22"
                    r="22"
                    fill={colors.surface}
                    opacity={0.98}
                  />
                  <Circle
                    cx="22"
                    cy="22"
                    r="21"
                    fill="none"
                    stroke={colors.border}
                    strokeWidth="1"
                  />
                  {Array.from({ length: 8 }, (_, i) => {
                    const angle = (i * 45 * Math.PI) / 180;
                    const isCardinal = i % 2 === 0;
                    const inner = isCardinal ? 14 : 16;
                    const outer = 19;
                    const x1 = 22 + inner * Math.sin(angle);
                    const y1 = 22 - inner * Math.cos(angle);
                    const x2 = 22 + outer * Math.sin(angle);
                    const y2 = 22 - outer * Math.cos(angle);
                    return (
                      <Line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isCardinal ? colors.text : colors.textMuted}
                        strokeWidth={isCardinal ? 1.6 : 1}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  <G rotation={-bearing} origin="22, 22">
                    <Polygon
                      points="22,7 24.2,18.5 22,17 19.8,18.5"
                      fill={colors.danger}
                    />
                    <Polygon
                      points="22,37 24.2,25.5 22,27 19.8,25.5"
                      fill={colors.textMuted}
                    />
                    <Circle cx="22" cy="22" r="2" fill={colors.surface} />
                    <Circle cx="22" cy="22" r="1" fill={colors.text} />

                    <G rotation={bearing} origin="22, 22">
                      <SvgText
                        x="22"
                        y="26"
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="9"
                        fontWeight="600"
                      >
                        N
                      </SvgText>
                    </G>
                  </G>
                </Svg>
              </TouchableOpacity>
            </>
          )}

          {sheetIndex === 4 ? null : (
            <View style={[styles.searchWrap, { top: spacing.xxl }]}>
              <View style={{ flexDirection: "row" }}>
                <PlaceSearch
                  onPick={(place) => applyManualPos(place.coordinate)}
                />
                <TouchableOpacity
                  onPress={() => router.navigate("settings/about")}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    marginLeft: spacing.md,
                    backgroundColor: colors.surface,
                    opacity: 0.98,
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: colors.border,
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require("@/assets/icons/Nowhere_logo_half.png")}
                    style={{ width: 35, height: 35 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {mapHintSeen && !mapHintOverride ? null : (
                <View style={styles.mapHint}>
                  <MapPin size={13} color={colors.accent} />
                  <Text style={styles.mapHintText}>{t("home_map_hint")}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setMapHintOverride(false);
                      dismissMapHint();
                    }}
                    hitSlop={8}
                  >
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {sheetIndex === 0 ? (
            <PowerFab
              active={mockActive}
              onToggle={toggle}
              style={{
                position: "absolute",
                right: spacing.xl,
                bottom: peekHeight + insets.bottom + spacing.md,
              }}
            />
          ) : null}

          <BottomSheet
            ref={bottomSheetRef}
            index={sheetIndex}
            snapPoints={SNAP_POINTS}
            enablePanDownToClose={false}
            onChange={setSheetIndex}
            onAnimate={(fromIndex, toIndex) => {
              if (toIndex !== sheetIndex) {
                setSheetIndex(toIndex);
              }
            }}
            handleIndicatorStyle={styles.indicator}
            backgroundStyle={{
              borderTopLeftRadius: fullScreen ? 0 : radius.xl,
              borderTopRightRadius: fullScreen ? 0 : radius.xl,
              backgroundColor: colors.surface,
            }}
          >
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.statusDot,
                  mockActive ? styles.statusDotActive : styles.statusDotIdle,
                ]}
              />
              <Text style={styles.statusText} numberOfLines={1}>
                {statusText}
              </Text>
              <TouchableOpacity
                onPress={toggleFavorite}
                hitSlop={8}
                style={styles.headerIconBtn}
                disabled={!markerPos}
              >
                <Star
                  size={18}
                  color={currentIsFavorite ? colors.accent : colors.textMuted}
                  fill={currentIsFavorite ? colors.accent : "transparent"}
                />
              </TouchableOpacity>
              <PowerFab
                active={mockActive}
                onToggle={toggle}
                size={38}
                style={styles.headerPower}
              />
            </View>

            <BottomSheetScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Image
                  source={require("../assets/icons/Nowhere_logo_full.png")}
                  style={styles.logo}
                />
                <View>
                  <Text style={styles.appName}>Nowhere</Text>
                  <Text style={styles.appTag}>{t("app_tagline")}</Text>
                </View>
              </View>

              <SegmentedControl
                options={HOME_MODES.map(({ value, labelKey, Icon }) => ({
                  value,
                  label: t(labelKey),
                  Icon,
                }))}
                value={homeMode}
                onChange={(v) => setHomeMode(v)}
              />

              <Text style={styles.section}>{t("home_control")}</Text>
              <SegmentedControl
                options={[
                  { value: "joystick", label: t("control_joystick") },
                  { value: "system", label: t("control_automatic") },
                ]}
                value={controlMode}
                onChange={handleControlChange}
                disabled={homeMode === "free"}
              />
              {homeMode === "free" ? (
                <Text style={styles.hint}>{t("home_free_joystick_hint")}</Text>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleStart}
                style={styles.startBtn}
              >
                <selectedMode.Icon size={18} color={colors.white} />
                <Text style={styles.startBtnText}>
                  {t(selectedMode.startKey)}
                </Text>
              </TouchableOpacity>

              {favorites?.length > 0 ? (
                <>
                  <Text style={styles.section}>{t("home_favorites")}</Text>
                  <View style={styles.chipRow}>
                    {favorites.map((p) => placeChip(p, true))}
                  </View>
                </>
              ) : null}

              {recent?.length > 0 ? (
                <>
                  <View style={styles.sectionRow}>
                    <Text style={styles.section}>{t("home_recent")}</Text>
                    <TouchableOpacity
                      onPress={clearRecent}
                      hitSlop={8}
                      style={styles.clearRecentBtn}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipRow}>
                    {recent.map((p) => placeChip(p, false))}
                  </View>
                </>
              ) : null}

              <Text style={styles.section}>{t("settings_title")}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/settings")}
                style={styles.settingsBtn}
              >
                <View style={styles.settingsBtnLeft}>
                  <Settings2 size={18} color={colors.textMuted} />
                  <Text style={styles.settingsBtnText}>
                    {t("settings_title")}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={{ height: spacing.xxxl }} />
            </BottomSheetScrollView>
          </BottomSheet>
          <ModalSheet
            title={t("common_error_title")}
            open={!!error}
            text={typeof error === "string" ? error : error.message}
            actionLabel={
              typeof error === "string" ? undefined : error.actionLabel
            }
            onAction={typeof error === "string" ? undefined : error.onAction}
            onClose={() => setError("")}
            onPress={() => setError("")}
            variant="danger"
          />
        </MapProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  searchWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginRight: 50,
    marginTop: spacing.sm,
    backgroundColor: "rgba(21, 23, 26, 0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapHintText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  indicator: { backgroundColor: colors.borderStrong, width: 40 },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  statusDotActive: { backgroundColor: colors.accent },
  statusDotIdle: { backgroundColor: colors.textMuted },
  statusText: {
    ...typography.label,
    color: colors.text,
    flex: 1,
    fontWeight: "600",
  },
  headerIconBtn: { padding: 2 },
  headerPower: { marginLeft: spacing.xs },

  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: { width: 24, height: 35, borderRadius: radius.md },
  appName: { ...typography.title, fontSize: 18, color: colors.text },
  appTag: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 2,
  },

  section: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  clearRecentBtn: {
    padding: 4,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  startBtn: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    ...shadow,
  },
  startBtnText: { ...typography.body, fontWeight: "700", color: colors.white },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chipWrap: { position: "relative" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm,
    maxWidth: 200,
  },
  chipRemove: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { ...typography.label, color: colors.text, fontWeight: "500" },

  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  settingsBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsBtnText: { ...typography.body, color: colors.text },
});
