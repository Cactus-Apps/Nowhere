import { PICK_COLORS, type PickMode } from "@/components/simulate/constants";
import { SpeedLimitSign } from "@/components/speedLimitSign";
import Slider from "@/components/ui/slider";
import { formatSpeed, msToDisplay, unitLabel } from "@/lib/geo/units";
import { FeatureKey, useStore, type SpeedMode } from "@/lib/storage/store";
import { colors, radius, shadow, spacing, typography } from "@/theme";
import {
  Flag,
  MapPin,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDistance, formatDuration } from "./SimulateUiHelper";

const SPEED_PRESETS: Record<
  FeatureKey,
  { labelKey: string; value: number }[]
> = {
  walk: [
    { labelKey: "mode_walk", value: 1.4 },
    { labelKey: "settings_preset_jogging", value: 3 },
    { labelKey: "settings_preset_bike", value: 6 },
  ],
  drive: [
    { labelKey: "speed_city", value: 13.9 },
    { labelKey: "speed_country", value: 22.2 },
    { labelKey: "speed_highway", value: 33.3 },
  ],
};

const SPEED_MODES: { value: SpeedMode; labelKey: string }[] = [
  { value: "custom", labelKey: "sim_speed_custom" },
  { value: "traffic", labelKey: "sim_speed_traffic" },
];

export function PlannerPanel({
  insets,
  loading,
  routeError,
  info,
  hasRoute,
  pickMode,
  pickStopIndex,
  onPickStart,
  onPickEnd,
  onPickStop,
  onAddStop,
  onRemoveStop,
  onStart,
  feature = "walk",
  obstacleCounts = null,
  limitWays = 0,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  loading: boolean;
  routeError: string;
  info: { distance: number; duration: number } | null;
  hasRoute: boolean;
  pickMode: PickMode;
  pickStopIndex: number | null;
  onPickStart: () => void;
  onPickEnd: () => void;
  onPickStop: (index: number) => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onStart: () => void;
  feature?: FeatureKey;
  obstacleCounts?: {
    intersections: number;
    signals: number;
    ready: boolean;
  } | null;
  limitWays?: number;
}) {
  const { t } = useTranslation();
  const { system, driveSystem, updateSystem, updateDriveSystem, units } =
    useStore();
  const isDrive = feature === "drive";
  const cfg = isDrive ? driveSystem : system;
  const setSpeed = (speed: number) =>
    isDrive ? updateDriveSystem({ speed }) : updateSystem({ speed });
  const totalObstacles = obstacleCounts
    ? obstacleCounts.intersections + obstacleCounts.signals
    : 0;
  const stopCount = Math.min(driveSystem.obstacleStops, totalObstacles);

  return (
    <View
      style={[
        styles.panel,
        { paddingBottom: insets.bottom + spacing.lg, maxHeight: "60%" },
      ]}
    >
      <View style={styles.handle} />
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {isDrive ? t("sim_panel_title_drive") : t("sim_panel_title_walk")}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : info ? (
          <Text style={styles.panelMeta}>
            {formatDistance(info.distance)} · {formatDuration(info.duration)}
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.panelScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPickStart}
          style={[styles.field, pickMode === "start" && styles.fieldActive]}
        >
          <View style={[styles.dot, { backgroundColor: PICK_COLORS.start }]} />
          <Text style={styles.fieldLabel} numberOfLines={1}>
            {cfg.start?.label ?? t("sim_pick_start")}
          </Text>
          <MapPin size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {cfg.stops.map((stop, i) => (
          <View key={i} style={styles.stopRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPickStop(i)}
              style={[
                styles.field,
                styles.stopField,
                pickMode === "stop" &&
                  pickStopIndex === i &&
                  styles.fieldActive,
              ]}
            >
              <View
                style={[styles.dot, { backgroundColor: PICK_COLORS.stop }]}
              />
              <Text style={styles.fieldLabel} numberOfLines={1}>
                {stop.label || t("sim_stop_index", { index: i + 1 })}
              </Text>
              <MapPin size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRemoveStop(i)}
              style={styles.removeStop}
            >
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAddStop}
          style={[
            styles.addStop,
            pickMode === "stop-new" && styles.fieldActive,
          ]}
        >
          <Plus size={16} color={colors.accent} />
          <Text style={styles.addStopText}>{t("sim_add_stop")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPickEnd}
          style={[styles.field, pickMode === "end" && styles.fieldActive]}
        >
          <Flag size={16} color={PICK_COLORS.end} />
          <Text style={styles.fieldLabel} numberOfLines={1}>
            {cfg.end?.label ?? t("sim_pick_end")}
          </Text>
          <MapPin size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.section}>{t("sim_speed")}</Text>
        {isDrive ? (
          <>
            <View style={styles.speedModeRow}>
              {SPEED_MODES.map((mode) => {
                const active = driveSystem.speedMode === mode.value;
                return (
                  <TouchableOpacity
                    key={mode.value}
                    activeOpacity={0.8}
                    onPress={() => updateDriveSystem({ speedMode: mode.value })}
                    style={[
                      styles.preset,
                      styles.speedModeChip,
                      active && styles.presetActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        active && styles.presetLabelActive,
                      ]}
                    >
                      {t(mode.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
        {isDrive && driveSystem.speedMode === "traffic" ? (
          <Text style={styles.hint}>
            {limitWays > 0
              ? t("sim_traffic_hint_with_limits", {
                  count: limitWays,
                  speed: formatSpeed(cfg.speed, units, 0),
                })
              : t("sim_traffic_hint")}
          </Text>
        ) : (
          <>
            <View style={styles.speedRow}>
              <Text style={styles.speedValue}>
                {msToDisplay(cfg.speed, units).toFixed(isDrive ? 0 : 1)}
              </Text>
              <Text style={styles.speedUnit}>
                {unitLabel(units)} · {cfg.speed.toFixed(1)} m/s
              </Text>
            </View>
            <View style={styles.presetRow}>
              {SPEED_PRESETS[feature].map((preset) => {
                const active = Math.abs(preset.value - cfg.speed) < 0.05;
                return (
                  <TouchableOpacity
                    key={preset.labelKey}
                    activeOpacity={0.8}
                    onPress={() => setSpeed(preset.value)}
                    style={[styles.preset, active && styles.presetActive]}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        active && styles.presetLabelActive,
                      ]}
                    >
                      {t(preset.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Slider
              value={cfg.speed}
              min={0.5}
              max={isDrive ? 50 : 8}
              step={0.1}
              onChange={setSpeed}
            />
          </>
        )}

        {isDrive ? (
          <>
            <Text style={styles.section}>{t("sim_obstacles")}</Text>
            <Text style={styles.obstacleMeta}>
              {obstacleCounts
                ? obstacleCounts.ready
                  ? t("sim_obstacles_count", {
                      intersections: obstacleCounts.intersections,
                      signals: obstacleCounts.signals,
                    })
                  : t("sim_obstacles_loading")
                : t("sim_obstacles_analyzing")}
            </Text>
            <View style={styles.speedRow}>
              <Text style={styles.speedValue}>{stopCount}</Text>
              <Text style={styles.speedUnit}>
                {stopCount === 1 ? t("sim_stop") : t("sim_stops")} ·{" "}
                {totalObstacles > 0
                  ? t("sim_obstacles_on_route", { count: totalObstacles })
                  : t("sim_no_obstacles")}
              </Text>
            </View>
            <Slider
              value={stopCount}
              min={0}
              max={Math.max(totalObstacles, 1)}
              step={1}
              onChange={(v) => updateDriveSystem({ obstacleStops: v })}
            />
          </>
        ) : null}

        {routeError ? <Text style={styles.error}>{routeError}</Text> : null}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onStart}
        disabled={!hasRoute}
        style={[styles.start, !hasRoute && styles.startDisabled]}
      >
        <Play size={18} color={hasRoute ? colors.white : colors.textMuted} />
        <Text style={[styles.startText, !hasRoute && styles.startTextDisabled]}>
          {t("sim_start")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function RunnerOverlay({
  insets,
  paused,
  finished,
  progress,
  distance,
  speed,
  speedLimit = null,
  waitingLabel = null,
  onTogglePause,
  onStop,
  feature = "walk",
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  paused: boolean;
  finished: boolean;
  progress: number;
  distance: number;
  speed: number;
  /** current speed limit (m/s) from OSM – traffic rule mode only */
  speedLimit?: number | null;
  waitingLabel?: string | null;
  onTogglePause: () => void;
  onStop: () => void;
  feature?: FeatureKey;
}) {
  const { t } = useTranslation();
  const { units } = useStore();
  const remaining = Math.max(0, distance * (1 - progress));
  const stateLabel = finished
    ? t("sim_target_reached")
    : paused
      ? t("sim_paused")
      : (waitingLabel ?? t("common_moving"));
  return (
    <>
      <View style={[styles.hud, { top: insets.top + spacing.sm + 56 }]}>
        <Text
          style={[
            styles.hudState,
            !finished && !paused && waitingLabel
              ? styles.hudStateWaiting
              : null,
          ]}
        >
          {stateLabel}
        </Text>
        <Text style={styles.hudCoord}>
          {Math.round(progress * 100)}% · {formatDistance(remaining)}
        </Text>
        <View style={styles.hudSpeedRow}>
          <Text style={styles.hudState}>
            {feature === "drive"
              ? formatSpeed(speed, units, 0)
              : formatSpeed(speed, units)}
          </Text>
        </View>
      </View>

      {speedLimit != null ? (
        <View
          style={[styles.limitBadge, { top: insets.top + spacing.sm + 56 }]}
        >
          <SpeedLimitSign value={speedLimit} size={44} />
        </View>
      ) : null}

      <View
        style={[
          styles.progressTrack,
          { bottom: insets.bottom + spacing.xxl + 64 },
        ]}
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={[styles.controls, { bottom: insets.bottom + spacing.xxl }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onTogglePause}
          disabled={finished}
          style={[styles.controlPrimary, finished && styles.startDisabled]}
        >
          {paused ? (
            <Play size={20} color={colors.white} />
          ) : (
            <Pause size={20} color={colors.white} />
          )}
          <Text style={styles.controlPrimaryText}>
            {paused ? t("sim_resume") : t("sim_pause")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onStop}
          style={styles.controlGhost}
        >
          <RotateCcw size={18} color={colors.text} />
          <Text style={styles.controlGhostText}>{t("sim_stop_label")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    left: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  hudCoord: { ...typography.caption, fontWeight: "700", color: colors.text },
  hudState: { ...typography.caption, color: colors.textMuted },
  hudStateWaiting: { color: colors.accent, fontWeight: "700" },
  hudSpeedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  limitBadge: {
    position: "absolute",
    right: spacing.lg,
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  panelTitle: { ...typography.body, fontWeight: "700", color: colors.text },
  panelMeta: { ...typography.caption, color: colors.textMuted },
  panelScroll: { paddingBottom: spacing.md },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  fieldActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text,
    flex: 1,
    fontWeight: "500",
  },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  stopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stopField: { flex: 1 },
  removeStop: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  addStop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  addStopText: { ...typography.label, color: colors.accent },
  section: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  speedRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  speedValue: { ...typography.title, fontSize: 24, color: colors.text },
  speedUnit: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  presetRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  presetActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  presetLabel: { ...typography.label, color: colors.textMuted },
  presetLabelActive: { color: colors.accent },
  speedModeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  speedModeChip: { flex: 1, alignItems: "center" },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  obstacleMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  start: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    ...shadow,
  },
  startDisabled: {
    backgroundColor: colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  startText: { ...typography.body, fontWeight: "700", color: colors.white },
  startTextDisabled: { color: colors.textMuted },
  controls: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  controlPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  controlPrimaryText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  controlGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
  },
  controlGhostText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  progressTrack: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
