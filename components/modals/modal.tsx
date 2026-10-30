import { colors, radius, shadow, spacing, typography } from "@/theme";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  open: boolean;
  text: string;
  title: string;
  onPress: () => void;
  onClose: () => void;
  variant?: "default" | "danger";
  /** Optional extra button below the text (e.g. "Open settings") */
  actionLabel?: string;
  onAction?: () => void;
}

export default function ModalSheet({
  open,
  onClose,
  text,
  title,
  variant = "default",
  actionLabel,
  onAction,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.background}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{text}</Text>
          {actionLabel && onAction ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onAction();
                onClose();
              }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={[
              styles.button,
              variant === "danger" && styles.buttonDanger,
              actionLabel && onAction ? styles.buttonSpaced : null,
            ]}
          >
            <Text style={styles.buttonText}>{t("common_ok")}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...shadow,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    fontWeight: "400",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonSpaced: {
    marginTop: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },
});
