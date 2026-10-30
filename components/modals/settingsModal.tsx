import Slider from "@/components/ui/slider";
import { msToDisplay, unitLabel } from "@/lib/geo/units";
import { useStore, type FeatureKey } from "@/lib/storage/store";
import { colors, radius, spacing, typography } from "@/theme";
import { Gauge, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRESETS: Record<FeatureKey, { labelKey: string; value: number }[]> = {
  walk: [
    { labelKey: "mode_walk", value: 1.4 },
    { labelKey: "settings_preset_jogging", value: 3 },
    { labelKey: "settings_preset_bike", value: 6 },
    { labelKey: "mode_drive", value: 14 },
    { labelKey: "speed_flight", value: 30 },
  ],
  drive: [
    { labelKey: "speed_city", value: 13.9 },
    { labelKey: "speed_country", value: 22.2 },
    { labelKey: "speed_highway", value: 33.3 },
  ],
};

export default function SettingsModal({
  open,
  onClose,
  feature = "walk",
}: {
  open: boolean;
  onClose: () => void;
  feature?: FeatureKey;
}) {
  const { t } = useTranslation();
  const {
    walkSpeed,
    setWalkSpeed,
    driveSpeed,
    setDriveSpeed,
    joystickSide,
    setJoystickSide,
    units,
  } = useStore();
  const isDrive = feature === "drive";
  const speed = isDrive ? driveSpeed : walkSpeed;
  const setSpeed = isDrive ? setDriveSpeed : setWalkSpeed;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.background} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Gauge size={20} color={colors.accent} />
              <Text style={styles.title}>{t("settings_title")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>
            {isDrive
              ? t("settings_drive_speed")
              : t("settings_walk_speed")}
          </Text>

          <View style={styles.valueRow}>
            <Text style={styles.value}>
              {msToDisplay(speed, units).toFixed(1)}
            </Text>
            <Text style={styles.unit}>{unitLabel(units)}</Text>
            <Text style={styles.kmh}>≈ {speed.toFixed(1)} m/s</Text>
          </View>

          <Slider
            value={speed}
            min={0.5}
            max={isDrive ? 50 : 30}
            step={0.1}
            onChange={setSpeed}
          />

          <View style={styles.presets}>
            {PRESETS[feature].map((preset) => {
              const active = Math.abs(preset.value - speed) < 0.05;
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

          <Text style={styles.section}>{t("settings_joystick_side")}</Text>
          <Text style={styles.joystickHint}>{t("settings_joystick_hint")}</Text>
          <View style={styles.presets}>
            {(
              [
                { label: t("common_left"), value: "left" },
                { label: t("common_right"), value: "right" },
              ] as const
            ).map((option) => {
              const active = option.value === joystickSide;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.8}
                  onPress={() => setJoystickSide(option.value)}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text
                    style={[
                      styles.presetLabel,
                      active && styles.presetLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.done}
          >
            <Text style={styles.doneText}>{t("common_done")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  box: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.text },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  value: { ...typography.title, fontSize: 32, color: colors.text },
  unit: { ...typography.body, color: colors.textMuted, marginBottom: 4 },
  kmh: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 5,
    marginLeft: "auto",
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  joystickHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  preset: {
    paddingHorizontal: spacing.lg - 2,
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
  done: {
    marginTop: spacing.xxl,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  doneText: { ...typography.body, fontWeight: "700", color: colors.white },
});
