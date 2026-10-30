import { colors, shadow } from "@/theme";
import { Power } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function PowerFab({
  active,
  onToggle,
  size = 60,
  style,
}: {
  active: boolean;
  onToggle: () => void;
  size?: number;
  style?: object;
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={t("home_a11y_location_mask")}
      style={[
        styles.fab,
        { width: size, height: size, borderRadius: size / 2 },
        active ? styles.fabActive : styles.fabIdle,
        style,
      ]}
    >
      <Power
        size={size * 0.4}
        color={active ? colors.white : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...shadow,
  },
  fabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentBorder,
  },
  fabIdle: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
});
