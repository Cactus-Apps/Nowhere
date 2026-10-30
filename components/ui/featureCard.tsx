import { colors, radius, spacing, typography } from "@/theme";
import { ChevronRight, Joystick } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FeatureCard({
  Icon,
  title,
  sub,
  onPress,
  children,
}: {
  Icon: typeof Joystick;
  title: string;
  sub: string;
  mode: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.cardHeader}
      >
        <View style={styles.cardIcon}>
          <Icon size={22} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{sub}</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {children ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "600", color: colors.text },
  cardSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
