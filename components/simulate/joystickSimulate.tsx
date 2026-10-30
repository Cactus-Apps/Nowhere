import Joystick, { JoystickValue } from "@/components/joystick";
import SettingsModal from "@/components/modals/settingsModal";
import {
  DEFAULT_COORD,
  MIN_FORCE,
  TICK_MS,
} from "@/components/simulate/constants";
import { pinHtml } from "@/components/simulate/SimulateUiHelper";
import { getCurrentCoord, locationFailureMessage } from "@/lib/geo/location";
import { formatSpeed } from "@/lib/geo/units";
import { usePlaceLabel } from "@/lib/geo/usePlaceLabel";
import {
  feedMockIfActive,
  getMockPosition,
  holdMock,
  mockErrorMessage,
  setMockPosition,
} from "@/lib/mockModules/mockLocation";
import {
  readSimRuntime,
  writeSimRuntime,
  writeSimRuntimeThrottled,
} from "@/lib/mockModules/simRuntime";
import { FeatureKey, useStore } from "@/lib/storage/store";
import { colors, radius, resolveMapStyle, spacing, typography } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Settings } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Map,
  MapProvider,
  MapRef,
  Marker,
  MarkerRef,
} from "react-native-maplibre-gl-js";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JoystickWalk({
  feature = "walk",
}: {
  feature?: FeatureKey;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDrive = feature === "drive";
  const { walkSpeed, driveSpeed, joystickSide, units, mapStyle } = useStore();
  const speed = isDrive ? driveSpeed : walkSpeed;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const mapRef = useRef<MapRef | null>(null);
  const walkerRef = useRef<MarkerRef | null>(null);
  const posRef = useRef<[number, number]>(DEFAULT_COORD);
  const vectorRef = useRef<JoystickValue>({ x: 0, y: 0, force: 0 });
  const mockStartedRef = useRef(false);
  const backgroundedAtRef = useRef(0);
  const adoptingRef = useRef(false);
  const mockAlertShownRef = useRef(false);
  const [coord, setCoord] = useState<[number, number]>(DEFAULT_COORD);
  const [moving, setMoving] = useState(false);
  const initialCenter = useRef<[number, number]>(DEFAULT_COORD).current;

  const placeLabel = usePlaceLabel(coord);

  const options = useMemo(
    () => ({
      style: resolveMapStyle(mapStyle),
      center: initialCenter,
      zoom: isDrive ? 14 : 16,
    }),
    [initialCenter, isDrive, mapStyle],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mockPos = getMockPosition();
      if (mockPos) {
        posRef.current = mockPos;
        setCoord(mockPos);
        walkerRef.current?.setLngLat(mockPos);
        mapRef.current?.flyTo({
          center: mockPos,
          zoom: isDrive ? 14 : 16,
          duration: 800,
        });
        return;
      }
      const result = await getCurrentCoord();
      if (cancelled) return;
      if (!result.ok) {
        Alert.alert(t("location_title"), locationFailureMessage(result.reason));
        return;
      }
      const start = result.coord;
      posRef.current = start;
      setCoord(start);
      walkerRef.current?.setLngLat(start);
      mapRef.current?.flyTo({
        center: start,
        zoom: isDrive ? 14 : 16,
        duration: 800,
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (adoptingRef.current) return;
      const { x, y, force } = vectorRef.current;
      if (force < MIN_FORCE) return;
      const [lng, lat] = posRef.current;
      const meters = speedRef.current * force * (TICK_MS / 1000);
      const dLat = (-y * meters) / 111320;
      const dLng =
        (x * meters) /
        (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
      const next: [number, number] = [lng + dLng, lat + dLat];
      posRef.current = next;
      setCoord(next);
      walkerRef.current?.setLngLat(next);
      mapRef.current?.setCenter(next);
      feedMockIfActive(next);
      writeSimRuntimeThrottled({
        kind: "joystick",
        active: true,
        coord: next,
        vx: x * force * speedRef.current,
        vy: -y * force * speedRef.current,
        speed: speedRef.current,
        updatedAt: Date.now(),
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      holdMock();
      void writeSimRuntime({
        kind: "joystick",
        active: false,
        coord: posRef.current,
        vx: 0,
        vy: 0,
        speed: speedRef.current,
        updatedAt: Date.now(),
      });
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        if (state === "background") backgroundedAtRef.current = Date.now();
        return;
      }
      vectorRef.current = { x: 0, y: 0, force: 0 };
      setMoving(false);
      mockStartedRef.current = false;
      void (async () => {
        const runtime = await readSimRuntime();
        if (
          runtime?.kind !== "joystick" ||
          runtime.updatedAt <= backgroundedAtRef.current
        ) {
          return;
        }
        adoptingRef.current = true;
        posRef.current = runtime.coord;
        setCoord(runtime.coord);
        walkerRef.current?.setLngLat(runtime.coord);
        mapRef.current?.setCenter(runtime.coord);
        holdMock();
        void setMockPosition(runtime.coord[1], runtime.coord[0]);
        await writeSimRuntime({
          ...runtime,
          active: false,
          vx: 0,
          vy: 0,
          updatedAt: Date.now(),
        });
        adoptingRef.current = false;
      })();
    });
    return () => sub.remove();
  }, []);

  const handleMove = (value: JoystickValue) => {
    vectorRef.current = value;
    if (value.force >= MIN_FORCE) {
      if (!moving) setMoving(true);
      if (!mockStartedRef.current) {
        mockStartedRef.current = true;
        void setMockPosition(posRef.current[1], posRef.current[0]).catch(() => {
          if (!mockAlertShownRef.current) {
            mockAlertShownRef.current = true;
            Alert.alert(t("mock_not_active_title"), mockErrorMessage());
          }
        });
      }
    }
  };
  const handleEnd = () => {
    vectorRef.current = { x: 0, y: 0, force: 0 };
    setMoving(false);
    mockStartedRef.current = false;
    holdMock();
    void writeSimRuntime({
      kind: "joystick",
      active: false,
      coord: posRef.current,
      vx: 0,
      vy: 0,
      speed: speedRef.current,
      updatedAt: Date.now(),
    });
  };

  const mapElement = useMemo(
    () => (
      <Map
        ref={mapRef}
        options={options}
        listeners={{
          mount: {
            rnListener: () => mapRef.current?.setProjection({ type: "globe" }),
          },
        }}
      />
    ),
    [options],
  );

  const markerElement = useMemo(
    () => (
      <Marker
        ref={walkerRef}
        options={{
          coordinate: initialCenter,
          element: { innerHTML: pinHtml(colors.accent) },
        }}
      />
    ),
    [initialCenter],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <MapProvider>
        {mapElement}
        {markerElement}

        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isDrive ? t("sim_simulate_drive") : t("sim_simulate_walk")}
          </Text>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            style={styles.back}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.hud, { top: insets.top + spacing.sm + 56 }]}>
          <Text style={styles.hudPlace} numberOfLines={1}>
            {placeLabel || t("common_place_loading")}
          </Text>
          <Text style={styles.hudCoord}>
            {coord[1].toFixed(5)}, {coord[0].toFixed(5)}
          </Text>
          <Text style={[styles.hudState, moving && styles.hudStateActive]}>
            {moving ? t("common_moving") : t("common_ready")} ·{" "}
            {isDrive ? formatSpeed(speed, units, 0) : formatSpeed(speed, units)}
          </Text>
        </View>

        <View
          style={[
            styles.joystickWrap,
            { bottom: insets.bottom + spacing.xxl },
            joystickSide === "right"
              ? { right: spacing.lg, left: undefined }
              : { left: spacing.lg, right: undefined },
          ]}
        >
          <Joystick size={120} onChange={handleMove} onEnd={handleEnd} />
        </View>
      </MapProvider>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        feature={isDrive ? "drive" : "walk"}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.body, fontWeight: "700", color: colors.text, flex: 1 },
  hud: {
    position: "absolute",
    left: spacing.lg,
    backgroundColor: "rgba(21, 23, 26, 0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
    maxWidth: "70%",
  },
  hudPlace: { ...typography.label, fontWeight: "600", color: colors.text },
  hudCoord: { ...typography.caption, color: colors.textMuted },
  hudState: { ...typography.caption, color: colors.textMuted },
  hudStateActive: { color: colors.accent },
  joystickWrap: {
    position: "absolute",
  },
});
