import { Mode } from "@/lib/storage/store";
import { colors, radius, spacing, typography } from "@/theme";
import { Bot, Joystick } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MODES: { value: Mode; labelKey: string; Icon: typeof Joystick }[] = [
  { value: "joystick", labelKey: "control_joystick", Icon: Joystick },
  { value: "system", labelKey: "control_system", Icon: Bot },
];

export default function ModeSelector({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.modeRow}>
      {MODES.map((m) => {
        const isActive = m.value === value;
        return (
          <TouchableOpacity
            key={m.value}
            activeOpacity={0.8}
            onPress={() => onChange(m.value)}
            style={[styles.modeChip, isActive && styles.modeChipActive]}
          >
            <m.Icon
              size={15}
              color={isActive ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.modeChipLabel,
                isActive && styles.modeChipLabelActive,
              ]}
            >
              {t(m.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", gap: spacing.sm },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeChipActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  modeChipLabel: { ...typography.label, color: colors.textMuted },
  modeChipLabelActive: { color: colors.accent },
});
