import { PlannerPanel, RunnerOverlay } from "@/components/simulate/SimulateUi";
import {
  buildCumulative,
  pinHtml,
  pointAt,
} from "@/components/simulate/SimulateUiHelper";
import {
  DEFAULT_COORD,
  PICK_COLORS,
  TICK_MS,
  type PickMode,
} from "@/components/simulate/constants";
import { reverseGeocode } from "@/lib/geo/geocoding";
import { getCurrentCoord, locationFailureMessage } from "@/lib/geo/location";
import {
  bboxOf,
  buildSpeedProfile,
  cornersFromRoute,
  fetchOsmRouteData,
  intersectionsFromSteps,
  projectOnRoute,
  segmentIndexAt,
  type Obstacle,
} from "@/lib/geo/osm";
import { fetchOsrmRoutes } from "@/lib/geo/osrm";
import {
  feedMockIfActive,
  getMockPosition,
  holdMock,
  isMockEnabled,
  mockErrorMessage,
  setMockPosition,
} from "@/lib/mockModules/mockLocation";
import {
  readSimRuntime,
  writeSimRoute,
  writeSimRuntime,
  writeSimRuntimeThrottled,
} from "@/lib/mockModules/simRuntime";
import type {
  DriveSystemConfig,
  RoutePoint,
  SystemConfig,
} from "@/lib/storage/store";
import { FeatureKey, getState, useStore } from "@/lib/storage/store";
import { colors, radius, resolveMapStyle, spacing, typography } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Crosshair, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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
  GeoJSONSource,
  Map,
  MapProvider,
  MapRef,
  Marker,
  MarkerRef,
} from "react-native-maplibre-gl-js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function SystemWalk({
  feature = "walk",
}: {
  feature?: FeatureKey;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDrive = feature === "drive";
  const { system, driveSystem, updateSystem, updateDriveSystem, mapStyle } =
    useStore();
  const cfg = isDrive ? driveSystem : system;
  const patchSystem = (
    patch: Partial<SystemConfig> | ((s: SystemConfig) => Partial<SystemConfig>),
  ) => {
    if (isDrive)
      updateDriveSystem(
        patch as
          | Partial<DriveSystemConfig>
          | ((s: DriveSystemConfig) => Partial<DriveSystemConfig>),
      );
    else updateSystem(patch);
  };
  const speedRef = useRef(cfg.speed);
  speedRef.current = cfg.speed;

  const mapRef = useRef<MapRef | null>(null);
  const walkerRef = useRef<MarkerRef | null>(null);
  const posRef = useRef<[number, number]>(DEFAULT_COORD);
  const routeCoordsRef = useRef<[number, number][]>([]);
  const cumRef = useRef<number[]>([]);
  const traveledRef = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const routeKeyRef = useRef("");
  const backgroundedAtRef = useRef(0);
  const adoptingRef = useRef(false);
  const mockAlertShownRef = useRef(false);
  const pickModeRef = useRef<PickMode>(null);
  const pickStopIndexRef = useRef<number | null>(null);
  const clickRef = useRef<(e: any) => void>(() => {});
  const initialCenter = useRef<[number, number]>(DEFAULT_COORD).current;
  /** OSM speed limit (m/s) per route segment – drive mode only */
  const limitsRef = useRef<(number | null)[]>([]);
  /** Intersections + traffic lights with position along the route */
  const obstaclesRef = useRef<Obstacle[]>([]);
  /** randomly selected obstacles for the current run */
  const stopsQueueRef = useRef<Obstacle[]>([]);
  const lastStopDistRef = useRef(-Infinity);
  const waitingRef = useRef<{ remaining: number; distance: number } | null>(
    null,
  );
  const trafficModeRef = useRef(false);

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [info, setInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [pickMode, setPickMode] = useState<PickMode>(null);
  const [pickStopIndex, setPickStopIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waiting, setWaiting] = useState<"intersection" | "signal" | null>(
    null,
  );
  const [obstacleCounts, setObstacleCounts] = useState<{
    intersections: number;
    signals: number;
    ready: boolean;
  } | null>(null);
  const [limitWays, setLimitWays] = useState(0);

  runningRef.current = running;
  pausedRef.current = paused;
  routeCoordsRef.current = routeCoords;
  trafficModeRef.current = isDrive && driveSystem.speedMode === "traffic";

  const options = useMemo(
    () => ({
      style: resolveMapStyle(mapStyle),
      center: initialCenter,
      zoom: isDrive ? 13 : 15,
    }),
    [initialCenter, isDrive, mapStyle],
  );

  const applyPoint = (
    mode: Exclude<PickMode, null>,
    idx: number | null,
    point: RoutePoint,
  ) => {
    if (mode === "start") patchSystem({ start: point });
    else if (mode === "end") patchSystem({ end: point });
    else if (mode === "stop" && idx !== null)
      patchSystem((s) => {
        const stops = [...s.stops];
        stops[idx] = point;
        return { stops };
      });
    else if (mode === "stop-new")
      patchSystem((s) => ({ stops: [...s.stops, point] }));

    reverseGeocode(point.coordinate[1], point.coordinate[0]).then((label) => {
      const labeled: RoutePoint = { ...point, label };
      if (mode === "start")
        patchSystem((s) => (s.start === point ? { start: labeled } : {}));
      else if (mode === "end")
        patchSystem((s) => (s.end === point ? { end: labeled } : {}));
      else if (mode === "stop" && idx !== null)
        patchSystem((s) =>
          s.stops[idx] === point
            ? { stops: s.stops.map((st, i) => (i === idx ? labeled : st)) }
            : {},
        );
      else if (mode === "stop-new")
        patchSystem((s) =>
          s.stops.includes(point)
            ? { stops: s.stops.map((st) => (st === point ? labeled : st)) }
            : {},
        );
    });
  };

  clickRef.current = (e: any) => {
    const mode = pickModeRef.current;
    if (!mode) return;
    const lng = e?.lngLat?.lng;
    const lat = e?.lngLat?.lat;
    if (typeof lng !== "number" || typeof lat !== "number") return;
    const coordinate: [number, number] = [lng, lat];
    const point: RoutePoint = {
      coordinate,
      label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
    applyPoint(mode, pickStopIndexRef.current, point);
    setPickMode(null);
    pickModeRef.current = null;
    setPickStopIndex(null);
    pickStopIndexRef.current = null;
  };

  const beginPick = (
    mode: Exclude<PickMode, null>,
    idx: number | null = null,
  ) => {
    setPickMode(mode);
    pickModeRef.current = mode;
    setPickStopIndex(idx);
    pickStopIndexRef.current = idx;
  };

  const cancelPick = () => {
    setPickMode(null);
    pickModeRef.current = null;
    setPickStopIndex(null);
    pickStopIndexRef.current = null;
  };

  const removeStop = (index: number) =>
    patchSystem((s) => ({ stops: s.stops.filter((_, i) => i !== index) }));

  useEffect(() => {
    if (isDrive ? getState().driveSystem.start : getState().system.start)
      return;
    let cancelled = false;
    (async () => {
      const mockPos = getMockPosition();
      if (mockPos) {
        const coordinate = mockPos;
        const point: RoutePoint = {
          coordinate,
          label: `${coordinate[1].toFixed(5)}, ${coordinate[0].toFixed(5)}`,
        };
        patchSystem({ start: point });
        mapRef.current?.flyTo({
          center: coordinate,
          zoom: isDrive ? 14 : 16,
          duration: 800,
        });
        const label = await reverseGeocode(coordinate[1], coordinate[0]);
        if (!cancelled) {
          patchSystem((s) =>
            s.start === point ? { start: { ...point, label } } : {},
          );
        }
        return;
      }
      const result = await getCurrentCoord();
      if (cancelled) return;
      if (!result.ok) {
        Alert.alert(t("location_title"), locationFailureMessage(result.reason));
        return;
      }
      const coordinate = result.coord;
      const point: RoutePoint = {
        coordinate,
        label: `${coordinate[1].toFixed(5)}, ${coordinate[0].toFixed(5)}`,
      };
      patchSystem({ start: point });
      mapRef.current?.flyTo({
        center: coordinate,
        zoom: isDrive ? 14 : 16,
        duration: 800,
      });
      const label = await reverseGeocode(coordinate[1], coordinate[0]);
      patchSystem((s) =>
        s.start === point ? { start: { ...point, label } } : {},
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeKey = useMemo(
    () =>
      JSON.stringify({
        s: cfg.start?.coordinate ?? null,
        e: cfg.end?.coordinate ?? null,
        w: cfg.stops.map((s) => s.coordinate),
      }),
    [cfg.start, cfg.end, cfg.stops],
  );
  routeKeyRef.current = routeKey;

  useEffect(() => {
    let cancelled = false;
    if (isDrive) {
      obstaclesRef.current = [];
      limitsRef.current = [];
      stopsQueueRef.current = [];
      waitingRef.current = null;
      setWaiting(null);
      setObstacleCounts(null);
      setLimitWays(0);
    }
    if (!cfg.start || !cfg.end) {
      setRouteCoords([]);
      setInfo(null);
      setRouteError("");
      return;
    }
    setLoading(true);
    setRouteError("");
    (async () => {
      const routes = await fetchOsrmRoutes(
        cfg.start!.coordinate,
        cfg.end!.coordinate,
        isDrive ? "driving" : "walking",
        cfg.stops.map((s) => s.coordinate),
      );
      if (cancelled) return;
      if (!routes?.length) {
        setRouteError(t("sim_no_route"));
        setRouteCoords([]);
        setInfo(null);
        setLoading(false);
        return;
      }
      const coords = routes[0].geometry.coordinates as [number, number][];
      setRouteCoords(coords);
      setInfo({ distance: routes[0].distance, duration: routes[0].duration });
      setLoading(false);
      if (coords.length > 1) {
        const lons = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        mapRef.current?.fitBounds(
          [
            Math.min(...lons),
            Math.min(...lats),
            Math.max(...lons),
            Math.max(...lats),
          ],
          { padding: 70, duration: 700 },
        );
      }
      if (isDrive && coords.length > 1) {
        const cum = buildCumulative(coords);
        const intersections: Obstacle[] = cornersFromRoute(coords, cum);
        for (const loc of intersectionsFromSteps(routes[0].steps ?? [])) {
          const p = projectOnRoute(coords, cum, loc);
          if (
            p.distance <= 30 &&
            intersections.every((o) => Math.abs(o.distance - p.along) > 20)
          ) {
            intersections.push({
              kind: "intersection",
              coordinate: p.coordinate,
              distance: p.along,
            });
          }
        }
        intersections.sort((a, b) => a.distance - b.distance);
        obstaclesRef.current = intersections;
        const applyAutoHalf = (total: number) =>
          updateDriveSystem({
            obstacleStops: Math.max(0, Math.round(total / 2)),
          });
        applyAutoHalf(intersections.length);
        setObstacleCounts({
          intersections: intersections.length,
          signals: 0,
          ready: false,
        });
        setLimitWays(0);

        fetchOsmRouteData(bboxOf(coords))
          .then((data) => {
            if (cancelled) return;
            const signals: Obstacle[] = [];
            for (const c of data.signals) {
              const p = projectOnRoute(coords, cum, c);
              if (
                p.distance <= 30 &&
                obstaclesRef.current.every(
                  (o) => Math.abs(o.distance - p.along) > 20,
                )
              ) {
                signals.push({
                  kind: "signal",
                  coordinate: p.coordinate,
                  distance: p.along,
                });
              }
            }
            obstaclesRef.current = [...obstaclesRef.current, ...signals].sort(
              (a, b) => a.distance - b.distance,
            );
            setObstacleCounts({
              intersections: intersections.length,
              signals: signals.length,
              ready: true,
            });
            limitsRef.current = buildSpeedProfile(coords, data.ways);
            setLimitWays(data.ways.filter((w) => w.limit != null).length);
            applyAutoHalf(obstaclesRef.current.length);
          })
          .catch(() => {
            if (cancelled) return;
            setObstacleCounts((c) => (c ? { ...c, ready: true } : c));
            applyAutoHalf(obstaclesRef.current.length);
          });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current || pausedRef.current) return;
      if (adoptingRef.current) return;
      const dt = TICK_MS / 1000;
      writeSimRuntimeThrottled({
        kind: "system",
        active: true,
        coord: posRef.current,
        routeKey: routeKeyRef.current,
        traveled: traveledRef.current,
        speed: speedRef.current,
        finished: false,
        updatedAt: Date.now(),
      });

      if (waitingRef.current) {
        waitingRef.current.remaining -= dt;
        feedMockIfActive(posRef.current);
        if (waitingRef.current.remaining > 0) return;
        lastStopDistRef.current = waitingRef.current.distance;
        waitingRef.current = null;
        setWaiting(null);
        return;
      }

      const coords = routeCoordsRef.current;
      const cum = cumRef.current;
      if (coords.length < 2 || cum.length !== coords.length) return;
      const total = cum[cum.length - 1];

      let speed = speedRef.current;
      if (trafficModeRef.current) {
        const idx = segmentIndexAt(cum, traveledRef.current);
        speed = limitsRef.current[idx] ?? speedRef.current;
      }

      let traveled = traveledRef.current + speed * dt;

      if (stopsQueueRef.current.length > 0) {
        const next = stopsQueueRef.current[0];
        if (traveled >= next.distance) {
          stopsQueueRef.current.shift();
          const farEnough =
            next.distance > 1 && next.distance - lastStopDistRef.current >= 30;
          if (farEnough) {
            traveledRef.current = next.distance;
            waitingRef.current = {
              remaining: 4 + Math.random() * 6,
              distance: next.distance,
            };
            setWaiting(next.kind);
            const stopPoint = pointAt(coords, cum, next.distance);
            posRef.current = stopPoint;
            walkerRef.current?.setLngLat(stopPoint);
            mapRef.current?.setCenter(stopPoint);
            feedMockIfActive(stopPoint);
            setProgress(total > 0 ? next.distance / total : 0);
            return;
          }
        }
      }

      if (traveled >= total) {
        traveled = total;
        traveledRef.current = total;
        const end = coords[coords.length - 1];
        posRef.current = end;
        walkerRef.current?.setLngLat(end);
        mapRef.current?.setCenter(end);
        setProgress(1);
        runningRef.current = false;
        setRunning(false);
        setFinished(true);
        holdMock();
        void writeSimRuntime({
          kind: "system",
          active: false,
          coord: end,
          routeKey: routeKeyRef.current,
          traveled: total,
          speed: speedRef.current,
          finished: true,
          updatedAt: Date.now(),
        });
        return;
      }
      traveledRef.current = traveled;
      const point = pointAt(coords, cum, traveled);
      posRef.current = point;
      walkerRef.current?.setLngLat(point);
      mapRef.current?.setCenter(point);
      feedMockIfActive(point);
      setProgress(total > 0 ? traveled / total : 0);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (running) walkerRef.current?.setLngLat(posRef.current);
  }, [running]);

  useEffect(() => {
    return () => {
      if (runningRef.current) {
        holdMock();
        void writeSimRuntime({
          kind: "system",
          active: false,
          coord: posRef.current,
          routeKey: routeKeyRef.current,
          traveled: traveledRef.current,
          speed: speedRef.current,
          finished: false,
          updatedAt: Date.now(),
        });
      }
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        if (state === "background") backgroundedAtRef.current = Date.now();
        return;
      }
      void (async () => {
        const runtime = await readSimRuntime();
        if (
          runtime?.kind !== "system" ||
          runtime.routeKey !== routeKeyRef.current ||
          runtime.updatedAt <= backgroundedAtRef.current
        ) {
          return;
        }
        adoptingRef.current = true;
        posRef.current = runtime.coord;
        walkerRef.current?.setLngLat(runtime.coord);
        mapRef.current?.setCenter(runtime.coord);
        void setMockPosition(runtime.coord[1], runtime.coord[0]);
        const cum = cumRef.current;
        const total = cum.length ? cum[cum.length - 1] : 0;
        if (total > 0) {
          traveledRef.current = runtime.traveled;
          setProgress(Math.min(runtime.traveled / total, 1));
        }
        if (runtime.finished) {
          runningRef.current = false;
          setRunning(false);
          setFinished(true);
          setPaused(false);
          pausedRef.current = false;
          setProgress(1);
          holdMock();
        }
        await writeSimRuntime({ ...runtime, updatedAt: Date.now() });
        adoptingRef.current = false;
      })();
    });
    return () => sub.remove();
  }, []);

  const startRun = () => {
    if (routeCoords.length < 2) return;
    cumRef.current = buildCumulative(routeCoords);
    traveledRef.current = 0;
    lastStopDistRef.current = -Infinity;
    waitingRef.current = null;
    setWaiting(null);
    if (isDrive) {
      const all = obstaclesRef.current;
      const n = Math.min(Math.max(0, driveSystem.obstacleStops), all.length);
      const picked = [...all].sort(() => Math.random() - 0.5).slice(0, n);
      picked.sort((a, b) => a.distance - b.distance);
      stopsQueueRef.current = picked;
    } else {
      stopsQueueRef.current = [];
    }
    const point = routeCoords[0];
    posRef.current = point;
    walkerRef.current?.setLngLat(point);
    void setMockPosition(point[1], point[0]).then(() => {
      if (!isMockEnabled() && !mockAlertShownRef.current) {
        mockAlertShownRef.current = true;
        Alert.alert(t("mock_not_active_title"), mockErrorMessage());
      }
    });
    void writeSimRoute(routeKeyRef.current, routeCoords);
    void writeSimRuntime({
      kind: "system",
      active: true,
      coord: point,
      routeKey: routeKeyRef.current,
      traveled: 0,
      speed: speedRef.current,
      finished: false,
      updatedAt: Date.now(),
    });
    setProgress(0);
    setFinished(false);
    setPaused(false);
    pausedRef.current = false;
    setRunning(true);
    runningRef.current = true;
    mapRef.current?.flyTo({
      center: point,
      zoom: isDrive ? 15 : 17,
      duration: 700,
    });
  };

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (runningRef.current) {
      void writeSimRuntime({
        kind: "system",
        active: !next,
        coord: posRef.current,
        routeKey: routeKeyRef.current,
        traveled: traveledRef.current,
        speed: speedRef.current,
        finished: false,
        updatedAt: Date.now(),
      });
    }
  };

  const stopRun = () => {
    runningRef.current = false;
    setRunning(false);
    setPaused(false);
    pausedRef.current = false;
    setFinished(false);
    traveledRef.current = 0;
    setProgress(0);
    stopsQueueRef.current = [];
    waitingRef.current = null;
    setWaiting(null);
    const point = routeCoords.length ? routeCoords[0] : posRef.current;
    posRef.current = point;
    walkerRef.current?.setLngLat(point);
    void writeSimRuntime({
      kind: "system",
      active: false,
      coord: point,
      routeKey: routeKeyRef.current,
      traveled: 0,
      speed: speedRef.current,
      finished: false,
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
          click: {
            objectListener: (e: any) => clickRef.current(e),
          },
        }}
      />
    ),
    [options],
  );

  const routeSource = useMemo(() => {
    if (routeCoords.length < 2) return null;
    return (
      <GeoJSONSource
        id={`${feature}-route`}
        source={{
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: routeCoords },
          } as any,
        }}
        layers={[
          {
            layer: {
              id: `${feature}-route-line`,
              type: "line",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": colors.accent,
                "line-width": 5,
                "line-opacity": 0.85,
              },
            },
          },
        ]}
      />
    );
  }, [routeCoords]);

  const pointMarkers = useMemo(
    () => (
      <>
        {cfg.start ? (
          <Marker
            options={{
              coordinate: cfg.start.coordinate,
              element: { innerHTML: pinHtml(PICK_COLORS.start) },
            }}
          />
        ) : null}
        {cfg.stops.map((stop, i) => (
          <Marker
            key={`stop-${i}`}
            options={{
              coordinate: stop.coordinate,
              element: { innerHTML: pinHtml(PICK_COLORS.stop) },
            }}
          />
        ))}
        {cfg.end ? (
          <Marker
            options={{
              coordinate: cfg.end.coordinate,
              element: { innerHTML: pinHtml(PICK_COLORS.end) },
            }}
          />
        ) : null}
      </>
    ),
    [cfg.start, cfg.end, cfg.stops],
  );

  const walkerMarker = useMemo(
    () => (
      <Marker
        ref={walkerRef}
        options={{
          coordinate: routeCoords[0] ?? DEFAULT_COORD,
          element: { innerHTML: pinHtml(colors.accent) },
        }}
      />
    ),
    [routeCoords],
  );

  let currentLimit: number | null = null;
  if (trafficModeRef.current && cumRef.current.length > 1) {
    const total = cumRef.current[cumRef.current.length - 1];
    currentLimit =
      limitsRef.current[segmentIndexAt(cumRef.current, progress * total)] ??
      null;
  }

  let hudSpeed = cfg.speed;
  if (waiting) hudSpeed = 0;
  else if (currentLimit != null) hudSpeed = currentLimit;

  const waitingLabel = waiting
    ? waiting === "signal"
      ? t("sim_waiting_signal")
      : t("sim_waiting_intersection")
    : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <MapProvider>
        {mapElement}
        {routeSource}
        {pointMarkers}
        {running || finished ? walkerMarker : null}

        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <View style={styles.topBarInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {running || finished
                ? isDrive
                  ? t("sim_drive_running")
                  : t("sim_system_running")
                : isDrive
                  ? t("sim_plan_drive")
                  : t("sim_plan_route")}
            </Text>
          </View>
        </View>

        {pickMode ? (
          <View
            style={[styles.pickHint, { top: insets.top + spacing.sm + 56 }]}
          >
            <Crosshair size={15} color={colors.accent} />
            <Text style={styles.pickHintText}>
              {pickMode === "start"
                ? t("sim_tap_start")
                : pickMode === "end"
                  ? t("sim_tap_end")
                  : t("sim_tap_stop")}
            </Text>
            <TouchableOpacity onPress={cancelPick}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {running || finished ? (
          <RunnerOverlay
            insets={insets}
            paused={paused}
            finished={finished}
            progress={progress}
            distance={info?.distance ?? 0}
            speed={hudSpeed}
            speedLimit={currentLimit}
            waitingLabel={waitingLabel}
            onTogglePause={togglePause}
            onStop={stopRun}
            feature={feature}
          />
        ) : (
          <PlannerPanel
            insets={insets}
            loading={loading}
            routeError={routeError}
            info={info}
            hasRoute={routeCoords.length > 1}
            pickMode={pickMode}
            pickStopIndex={pickStopIndex}
            onPickStart={() => beginPick("start")}
            onPickEnd={() => beginPick("end")}
            onPickStop={(i) => beginPick("stop", i)}
            onAddStop={() => beginPick("stop-new")}
            onRemoveStop={removeStop}
            onStart={startRun}
            feature={feature}
            obstacleCounts={obstacleCounts}
            limitWays={limitWays}
          />
        )}
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(11, 12, 14, 0.82)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs + 2,
    paddingRight: spacing.lg,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  pickHint: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickHintText: {
    ...typography.label,
    color: colors.accent,
    flex: 1,
  },
});
