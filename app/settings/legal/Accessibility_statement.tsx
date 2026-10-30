import { colors, radius, spacing, typography } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const openLink = (url: string) => {
  Linking.openURL(url).catch(() => {});
};

export default function AccessibilityStatementScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("legal_accessibility_title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.block}>
          <Text style={styles.h1}>{t("legal_accessibility_title")}</Text>

          <Text style={styles.p}>{t("access_intro")}</Text>

          <Text style={styles.h2}>{t("access_statement_title")}</Text>
          <Text style={styles.p}>{t("access_statement_p")}</Text>

          <Text style={styles.h2}>{t("access_standards_title")}</Text>
          <Text style={styles.p}>{t("access_standards_p")}</Text>

          <Text style={styles.h2}>{t("access_doing_title")}</Text>
          <Text style={styles.p}>{t("access_doing_p")}</Text>

          <Text style={styles.h2}>{t("access_status_title")}</Text>
          <Text style={styles.p}>{t("access_status_p")}</Text>

          <Text style={styles.h2}>{t("access_report_title")}</Text>
          <Text style={styles.p}>{t("access_report_p")}</Text>

          <Text style={styles.h2}>{t("access_feedback_title")}</Text>
          <Text style={styles.p}>
            {t("access_feedback_p1")}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://github.com/Cactus-Apps/Nowhere")}
            >
              Cactus-Apps/Nowhere
            </Text>
            {t("access_feedback_p2")}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://nowhereapp.vercel.app")}
            >
              nowhereapp.vercel.app
            </Text>
            {t("access_feedback_p3")}
          </Text>
        </View>
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  block: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  h1: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    marginBottom: spacing.md,
  },
  h2: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  p: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  linkInline: { color: colors.accent },
});
