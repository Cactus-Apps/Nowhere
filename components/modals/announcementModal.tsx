import type { AnnouncementType } from "@/lib/announcements";
import { colors, radius, shadow, spacing, typography } from "@/theme";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Info, Rocket, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const UPDATE_COLOR = "#5BD6A0";
const UPDATE_SOFT = "rgba(91, 214, 160, 0.14)";
const UPDATE_BORDER = "rgba(91, 214, 160, 0.40)";
const UPDATE_SURFACE = "#111B17";
const IMPORTANT_SURFACE = "#1B1315";

const TYPE_META = {
  info: {
    color: colors.accent,
    soft: colors.accentSoft,
    border: colors.accentBorder,
    surface: colors.surface,
    Icon: Info,
  },
  update: {
    color: UPDATE_COLOR,
    soft: UPDATE_SOFT,
    border: UPDATE_BORDER,
    surface: UPDATE_SURFACE,
    Icon: Rocket,
  },
  important: {
    color: colors.danger,
    soft: colors.dangerSoft,
    border: colors.dangerBorder,
    surface: IMPORTANT_SURFACE,
    Icon: AlertTriangle,
  },
} as const;

type Props = {
  visible: boolean;
  title: string;
  message: string;
  type?: AnnouncementType;
  mediaUrl?: string | null;
  primaryLabel?: string;
  onPrimary?: () => void;
  onClose: () => void;
  busy?: boolean;
};

export default function AnnouncementModal({
  visible,
  title,
  message,
  type = "info",
  mediaUrl,
  primaryLabel,
  onPrimary,
  onClose,
  busy = false,
}: Props) {
  const { t } = useTranslation();
  const meta = TYPE_META[type];
  const Icon = meta.Icon;
  const closeLabel = primaryLabel
    ? t("common_later")
    : type === "important"
      ? t("common_understood")
      : t("common_ok");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.background}>
        <View
          style={[
            styles.box,
            { backgroundColor: meta.surface, borderColor: meta.border },
          ]}
        >
          <View style={styles.titleRow}>
            <View
              style={[
                styles.titleIcon,
                { backgroundColor: meta.soft, borderColor: meta.border },
              ]}
            >
              <Icon size={20} color={meta.color} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={t("common_close")}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {mediaUrl ? (
              <Image source={{ uri: mediaUrl }} style={styles.media} />
            ) : null}
            <Text style={styles.message}>{message}</Text>
          </ScrollView>

          {primaryLabel && onPrimary ? (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={busy}
              onPress={onPrimary}
              style={[
                styles.primary,
                { backgroundColor: meta.color },
                busy && styles.disabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{primaryLabel}</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.75}
            disabled={busy}
            onPress={onClose}
            style={[
              styles.secondary,
              primaryLabel && onPrimary ? styles.secondarySpaced : null,
            ]}
          >
            <Text style={styles.secondaryText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    maxHeight: "86%",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...shadow,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  media: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  title: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    flex: 1,
  },
  message: {
    ...typography.body,
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: 21,
  },
  primary: {
    marginHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.65,
  },
  primaryText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  secondary: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondarySpaced: {
    marginTop: spacing.sm,
  },
  secondaryText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
