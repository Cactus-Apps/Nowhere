import { colors, radius, spacing, typography } from "@/theme";
import { router } from "expo-router";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LogEntry = { version: string; dateKey: string; changeKeys: string[] };

const UPDATE_LOG: LogEntry[] = [
  {
    version: "1.0.6",
    dateKey: "date_october_2026",
    changeKeys: [
      "update_log_1_0_6_change_1",
      "update_log_1_0_6_change_2",
    ],
  },
];

const APP_VERSION = Constants.expoConfig?.version ?? "–";

export default function UpdateLogScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("update_log_title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.block}>
          <Text style={styles.h1}>{t("update_log_title")}</Text>
          <Text style={styles.p}>
            {t("update_log_current_version", { version: APP_VERSION })}
          </Text>

          {UPDATE_LOG.map((entry) => (
            <View key={entry.version} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.version}>{t("update_log_version", { version: entry.version })}</Text>
                <Text style={styles.date}>{t(entry.dateKey)}</Text>
              </View>
              <View style={styles.list}>
                {entry.changeKeys.map((changeKey, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{t(changeKey)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
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
  p: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  entry: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  version: { ...typography.body, fontSize: 15, fontWeight: "700", color: colors.text },
  date: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.xs },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  bullet: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: -1,
  },
  listText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    flex: 1,
    flexWrap: "wrap",
  },
});
