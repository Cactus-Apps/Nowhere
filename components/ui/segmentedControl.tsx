import { colors, radius, spacing, typography } from "@/theme";
import { Joystick } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  Icon?: typeof Joystick;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.track, disabled && styles.trackDisabled]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {option.Icon ? (
              <option.Icon
                size={16}
                color={active ? colors.accent : colors.textMuted}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
                disabled && styles.labelDisabled,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  trackDisabled: { opacity: 0.55 },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  label: { ...typography.label, color: colors.textMuted },
  labelActive: { color: colors.accent },
  labelDisabled: { color: colors.textMuted },
});
