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

export default function TermsOfUseScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("legal_terms_title")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.block}>
          <Text style={styles.h1}>{t("terms_heading")}</Text>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLine}>{t("terms_effective")}</Text>
            <Text style={styles.metaLine}>{t("terms_provider")}</Text>
            <Text style={styles.metaLine}>{t("terms_package")}</Text>
            <View style={styles.metaRowInline}>
              <Text style={styles.metaLine}>
                {t("terms_open_source_label")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  openLink("https://github.com/Cactus-Apps/Nowhere")
                }
              >
                <Text style={styles.linkInline}>
                  github.com/Cactus-Apps/Nowhere
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.h2}>{t("terms_acceptance_h")}</Text>
          <Text style={styles.p}>{t("terms_acceptance_p")}</Text>

          <Text style={styles.h2}>{t("terms_desc_h")}</Text>
          <Text style={styles.p}>
            {t("terms_desc_p1")}{" "}
            <Text style={styles.strong}>{t("terms_desc_strong")}</Text>
            {t("terms_desc_p2")}
          </Text>
          <Text style={styles.p}>{t("terms_desc_license")}</Text>

          <Text style={styles.h2}>{t("terms_open_h")}</Text>
          <Text style={styles.p}>
            {t("terms_open_p1")}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://github.com/Cactus-Apps/Nowhere")}
            >
              github.com/Cactus-Apps/Nowhere
            </Text>
            {t("terms_open_p2")}
          </Text>
          <Text style={styles.p}>{t("terms_open_p3")}</Text>

          <Text style={styles.h2}>{t("terms_permitted_h")}</Text>
          <Text style={styles.p}>{t("terms_permitted_p")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_permitted_li1")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_permitted_li2")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_permitted_li3")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_permitted_li4")}</Text>
            </View>
          </View>

          <Text style={styles.h2}>{t("terms_prohibited_h")}</Text>
          <Text style={styles.p}>{t("terms_prohibited_p")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li1")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li2")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li3")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li4")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li5")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li6")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li7")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_prohibited_li8")}</Text>
            </View>
          </View>
          <Text style={styles.p}>{t("terms_responsibility_p")}</Text>

          <Text style={styles.h2}>{t("terms_account_h")}</Text>
          <Text style={styles.p}>{t("terms_account_p")}</Text>

          <Text style={styles.h2}>{t("terms_third_h")}</Text>
          <Text style={styles.p}>{t("terms_third_p")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li1")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li2")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li3")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li4")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li5")}</Text>
            </View>

            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_third_li6")}</Text>
            </View>
          </View>
          <Text style={styles.p}>{t("terms_third_disclaimer_p")}</Text>

          <Text style={styles.h2}>{t("terms_disclaimer_h")}</Text>

          <Text style={styles.h3}>{t("terms_sim_h")}</Text>
          <Text style={styles.p}>{t("terms_sim_p")}</Text>

          <Text style={styles.h3}>{t("terms_map_h")}</Text>
          <Text style={styles.p}>{t("terms_map_p")}</Text>

          <Text style={styles.h3}>{t("terms_general_h")}</Text>
          <Text style={styles.p}>{t("terms_general_p1")}</Text>
          <Text style={styles.p}>{t("terms_general_p2")}</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_general_li1")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_general_li2")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_general_li3")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_general_li4")}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t("terms_general_li5")}</Text>
            </View>
          </View>

          <Text style={styles.h3}>{t("terms_avail_h")}</Text>
          <Text style={styles.p}>{t("terms_avail_p")}</Text>

          <Text style={styles.h2}>{t("terms_mandatory_h")}</Text>
          <Text style={styles.p}>{t("terms_mandatory_p1")}</Text>
          <Text style={styles.p}>{t("terms_mandatory_p2")}</Text>

          <Text style={styles.h2}>{t("terms_termination_h")}</Text>
          <Text style={styles.p}>{t("terms_termination_p")}</Text>

          <Text style={styles.h2}>{t("terms_law_h")}</Text>
          <Text style={styles.p}>{t("terms_law_p1")}</Text>
          <Text style={styles.p}>
            {t("terms_law_p2")}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("mailto:cactus_apps@proton.me")}
            >
              cactus_apps@proton.me
            </Text>
            {t("terms_law_p2b")}
          </Text>
          <Text style={styles.p}>{t("terms_law_p3")}</Text>
          <Text style={styles.p}>
            {t("terms_law_p4")}{" "}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://ec.europa.eu/consumers/odr")}
            >
              ec.europa.eu/consumers/odr
            </Text>
          </Text>

          <Text style={styles.h2}>{t("terms_changes_h")}</Text>
          <Text style={styles.p}>{t("terms_changes_p1")}</Text>
          <Text style={styles.p}>
            {t("terms_changes_p2")}{" "}
            <Text
              style={styles.linkInline}
              onPress={() => openLink("https://github.com/Cactus-Apps/Nowhere")}
            >
              github.com/Cactus-Apps/Nowhere
            </Text>
            {t("terms_changes_p2b")}
          </Text>

          <Text style={styles.h2}>{t("terms_contact_h")}</Text>
          <Text style={styles.p}>Cactus Apps</Text>
          <TouchableOpacity
            onPress={() => openLink("mailto:cactus_apps@proton.me")}
          >
            <Text style={styles.linkBlock}>{t("terms_contact_email")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openLink("https://github.com/Cactus-Apps/Nowhere")}
          >
            <Text style={styles.linkBlock}>{t("terms_contact_github")}</Text>
          </TouchableOpacity>
          <Text style={styles.metaNote}>{t("terms_meta_note")}</Text>
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
  strong: { fontWeight: "700", color: colors.text },
  metaBlock: { marginBottom: spacing.sm, gap: spacing.xs },
  metaLine: { ...typography.caption, color: colors.textSecondary },
  metaRowInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
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
  linkInline: { color: colors.accent },
  linkBlock: { color: colors.accent, marginTop: spacing.xs },
  metaNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
