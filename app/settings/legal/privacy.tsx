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

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("legal_privacy_title")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.block}>
          <Text style={styles.h1}>{t("legal_privacy_title")}</Text>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("privacy_meta_app")}</Text>
              <Text style={styles.metaValue}>Nowhere</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("privacy_meta_package")}</Text>
              <Text style={styles.metaValue}>com.cactusapps.nowhere</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                {t("privacy_meta_developer")}
              </Text>
              <Text style={styles.metaValue}>Cactus Apps</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                {t("privacy_meta_last_updated")}
              </Text>
              <Text style={styles.metaValue}>{t("date_october_19_2026")}</Text>
            </View>
          </View>

          <Text style={styles.h2}>{t("privacy_h1_overview")}</Text>
          <Text style={styles.p}>{t("privacy_p_overview")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_device_data")}</Text>
          <Text style={styles.p}>{t("privacy_p_device_data")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("privacy_li_device_1")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("privacy_li_device_2")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("privacy_li_device_3")}</Text>
            </View>
          </View>
          <Text style={styles.p}>{t("privacy_p_device_data_delete")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_third_party")}</Text>
          <Text style={styles.p}>{t("privacy_p_third_party")}</Text>

          <Text style={styles.h3}>{t("privacy_h3_routing")}</Text>
          <Text style={styles.p}>{t("privacy_p_routing")}</Text>

          <Text style={styles.h3}>{t("privacy_h3_reverse")}</Text>
          <Text style={styles.p}>{t("privacy_p_reverse")}</Text>

          <Text style={styles.h3}>{t("privacy_h3_announcements")}</Text>
          <Text style={styles.p}>{t("privacy_p_announcements")}</Text>

          <Text style={styles.h3}>{t("privacy_h3_updates")}</Text>
          <Text style={styles.p}>{t("privacy_p_updates")}</Text>

          <Text style={styles.h3}>{t("privacy_h3_traffic")}</Text>
          <Text style={styles.p}>
            {t("privacy_p_traffic_prefix")}{" "}
            <Text
              style={styles.linkInline}
              onPress={() =>
                openLink("https://overpass-api.de/api/interpreter")
              }
            >
              https://overpass-api.de/api/interpreter
            </Text>
            ,{" "}
            <Text
              style={styles.linkInline}
              onPress={() =>
                openLink("https://overpass.osm.ch/api/interpreter")
              }
            >
              https://overpass.osm.ch/api/interpreter
            </Text>
            ,{" "}
            <Text
              style={styles.linkInline}
              onPress={() =>
                openLink("https://overpass.kumi.systems/api/interpreter")
              }
            >
              https://overpass.kumi.systems/api/interpreter
            </Text>
            ,{" "}
            <Text
              style={styles.linkInline}
              onPress={() =>
                openLink("https://overpass.private.coffee/api/interpreter")
              }
            >
              https://overpass.private.coffee/api/interpreter
            </Text>
            .
          </Text>

          <Text style={styles.h3}>{t("privacy_h3_map_tiles")}</Text>
          <Text style={styles.p}>{t("privacy_p_map_tiles")}</Text>

          <Text style={styles.p}>{t("privacy_p_providers")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <TouchableOpacity
                onPress={() =>
                  openLink("https://osmfoundation.org/wiki/Privacy_Policy")
                }
              >
                <Text style={styles.listLink}>{t("privacy_link_osm")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <TouchableOpacity
                onPress={() => openLink("https://openfreemap.org")}
              >
                <Text style={styles.listLink}>OpenFreeMap</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {t("privacy_li_further_providers")}
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>{t("privacy_h3_location")}</Text>
          <Text style={styles.p}>{t("privacy_p_location")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_sharing")}</Text>
          <Text style={styles.p}>{t("privacy_p_sharing")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_children")}</Text>
          <Text style={styles.p}>{t("privacy_p_children")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_rights")}</Text>
          <Text style={styles.p}>{t("privacy_p_rights")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_open_source")}</Text>
          <Text style={styles.p}>
            {t("privacy_p_open_source_prefix")}{" "}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://github.com/Cactus-Apps/Nowhere")}
            >
              https://github.com/Cactus-Apps/Nowhere
            </Text>
            {t("privacy_p_open_source_suffix")}
          </Text>

          <Text style={styles.h2}>{t("privacy_h2_responsible")}</Text>
          <Text style={styles.p}>{t("privacy_p_responsible")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_changes")}</Text>
          <Text style={styles.p}>{t("privacy_p_changes")}</Text>

          <Text style={styles.h2}>{t("privacy_h2_contact")}</Text>
          <Text style={styles.p}>Cactus Apps</Text>
          <TouchableOpacity
            onPress={() => openLink("mailto:cactus_apps@proton.me")}
          >
            <Text style={styles.linkBlock}>cactus_apps@proton.me</Text>
          </TouchableOpacity>
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
  h2: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  h3: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  p: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaBlock: { marginBottom: spacing.sm, gap: spacing.xs },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  metaLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textMuted,
  },
  metaValue: { ...typography.caption, color: colors.textSecondary },
  list: { marginBottom: spacing.sm, gap: spacing.xs },
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
  listLink: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.accent,
    flex: 1,
    flexWrap: "wrap",
  },
  linkInline: { color: colors.accent },
  linkBlock: { color: colors.accent, marginTop: spacing.xs },
});
