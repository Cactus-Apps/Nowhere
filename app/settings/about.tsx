import { PromoCard } from "@/components/promoCard";
import { colors, radius, spacing, typography } from "@/theme";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Copyright,
  Github,
  Globe,
  Instagram,
  List,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavRow, Overline } from ".";

const APP_VERSION = Constants.expoConfig?.version ?? "–";
const APP_BUILD =
  Constants.expoConfig?.android?.versionCode != null
    ? String(Constants.expoConfig.android.versionCode)
    : (Constants.expoConfig?.ios?.buildNumber ??
      Constants.nativeBuildVersion ??
      "–");

export default function Info() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Info_title_about_app")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandingSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/images/cactus_apps-logo.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>{t("Cactus_Apps")}</Text>
          <Text style={styles.tagline}>{t("Info_tagline")}</Text>

          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL("https://github.com/Cactus-Apps/Nowhere")
              }
            >
              <Github size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL("https://nowhereapp.vercel.app/")}
            >
              <Globe size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL("https://www.instagram.com/atlasys.app")
              }
            >
              <Instagram size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Development")}</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              {t("We_are_Cactus_Apps")} {t("develops_apps")}{" "}
              {t("Customer_satisfaction_suffix")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Overline>{t("about_more_apps")}</Overline>
          <PromoCard
            badge={t("about_promo_badge")}
            title="Atlasys"
            tagline={t("about_promo_tagline")}
            cta={t("about_promo_cta")}
            url="https://github.com/Cactus-Apps/Atlasys/releases/tag/v1.9.0"
            logo={require("@/assets/images/image-1.png")}
            preview={require("@/assets/images/atlasys-demo-3d.jpg")}
          />
        </View>

        <View style={styles.section}>
          <Overline>{t("about_legal")}</Overline>
          <View style={styles.group}>
            <NavRow
              Icon={Copyright}
              label={t("licenses_title")}
              onPress={() =>
                router.push({
                  pathname: "/settings/legal/licenses",
                })
              }
            />
            <NavRow
              Icon={List}
              label={t("update_log_title")}
              onPress={() =>
                router.push({
                  pathname: "/settings/update_log",
                })
              }
            />
          </View>
        </View>

        <View style={styles.versionBlock}>
          <Text style={styles.versionApp}>Nowhere</Text>
          <Text style={styles.versionText}>
            {t("settings_version_build", {
              version: APP_VERSION,
              build: APP_BUILD,
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  brandingSection: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
  },
  appName: {
    ...typography.title,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  socialLinks: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  descriptionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },

  group: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  versionBlock: {
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  versionApp: { ...typography.label, color: colors.textSecondary },
  versionText: { ...typography.caption, color: colors.textMuted },});