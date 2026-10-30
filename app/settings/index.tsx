import SegmentedControl from "@/components/ui/segmentedControl";
import Slider from "@/components/ui/slider";
import { msToDisplay, unitLabel } from "@/lib/geo/units";
import {
  useStore,
  type LanguageKey,
  type MapStyleKey,
  type Units,
} from "@/lib/storage/store";
import {
  MAP_STYLE_OPTIONS,
  colors,
  radius,
  spacing,
  typography,
} from "@/theme";
import Constants from "expo-constants";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AccessibilityIcon,
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  Languages,
  PlayCircle,
  ScrollText,
  Shield,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WALK_PRESETS = [
  { labelKey: "mode_walk", value: 1.4 },
  { labelKey: "settings_preset_jogging", value: 3 },
  { labelKey: "settings_preset_bike", value: 6 },
];

const LANGUAGES: { key: LanguageKey; labelKey: string }[] = [
  { key: "en", labelKey: "language_en" },
  { key: "de", labelKey: "language_de" },
  { key: "es", labelKey: "language_es" },
];

const APP_VERSION = Constants.expoConfig?.version ?? "–";
const APP_BUILD =
  Constants.expoConfig?.android?.versionCode != null
    ? String(Constants.expoConfig.android.versionCode)
    : (Constants.expoConfig?.ios?.buildNumber ??
      Constants.nativeBuildVersion ??
      "–");

export function Overline({ children }: { children: string }) {
  return <Text style={styles.overline}>{children}</Text>;
}

export function NavRow({
  Icon,
  label,
  value,
  onPress,
}: {
  Icon: typeof Shield;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon size={17} color={colors.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const {
    walkSpeed,
    setWalkSpeed,
    joystickSide,
    setJoystickSide,
    units,
    setUnits,
    mapStyle,
    setMapStyle,
    language,
    setLanguage,
    setOnboardingDone,
    setAcceptedLegal,
  } = useStore();
  const { t } = useTranslation();
  const [languageOpen, setLanguageOpen] = useState(false);

  const activeLanguage = LANGUAGES.find((l) => l.key === language);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("settings_title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Overline>{t("settings_section_fake_location")}</Overline>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("settings_walk_speed")}</Text>
          <View style={styles.speedRow}>
            <Text style={styles.speedValue}>
              {msToDisplay(walkSpeed, units).toFixed(1)}
            </Text>
            <Text style={styles.speedUnit}>{unitLabel(units)}</Text>
            <Text style={styles.speedRaw}>≈ {walkSpeed.toFixed(1)} m/s</Text>
          </View>
          <Slider
            value={walkSpeed}
            min={0.5}
            max={30}
            step={0.1}
            onChange={setWalkSpeed}
          />
          <View style={styles.presetRow}>
            {WALK_PRESETS.map((preset) => {
              const active = Math.abs(preset.value - walkSpeed) < 0.05;
              return (
                <TouchableOpacity
                  key={preset.labelKey}
                  activeOpacity={0.8}
                  onPress={() => setWalkSpeed(preset.value)}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text
                    style={[
                      styles.presetLabel,
                      active && styles.presetLabelActive,
                    ]}
                  >
                    {t(preset.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("settings_joystick_side")}</Text>
          <Text style={styles.cardHint}>{t("settings_joystick_hint")}</Text>
          <SegmentedControl
            options={[
              { value: "left", label: t("common_left") },
              { value: "right", label: t("common_right") },
            ]}
            value={joystickSide}
            onChange={(v) => setJoystickSide(v)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("settings_map_style")}</Text>
          <View style={styles.styleChipRow}>
            {MAP_STYLE_OPTIONS.map((option) => {
              const active = option.key === mapStyle;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.8}
                  onPress={() => setMapStyle(option.key as MapStyleKey)}
                  style={[styles.styleChip, active && styles.styleChipActive]}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: option.swatch,
                        borderColor: active
                          ? colors.accentBorder
                          : colors.borderStrong,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.styleChipLabel,
                      active && styles.styleChipLabelActive,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("settings_units")}</Text>
          <SegmentedControl<Units>
            options={[
              { value: "metric", label: t("units_metric") },
              { value: "imperial", label: t("units_imperial") },
            ]}
            value={units}
            onChange={setUnits}
          />
          <Text style={styles.cardHint}>
            {t("settings_units_hint", { unit: unitLabel(units) })}
          </Text>
        </View>

        <Overline>{t("settings_section_language")}</Overline>
        <View style={styles.group}>
          <NavRow
            Icon={Languages}
            label={t("settings_language")}
            value={activeLanguage ? t(activeLanguage.labelKey) : undefined}
            onPress={() => setLanguageOpen(true)}
          />
        </View>

        <Overline>{t("settings_section_legal")}</Overline>
        <View style={styles.group}>
          <NavRow
            Icon={Shield}
            label={t("legal_privacy_title")}
            onPress={() =>
              router.push({
                pathname: "/settings/legal/privacy",
                params: { type: "privacy" },
              })
            }
          />
          <View style={styles.divider} />
          <NavRow
            Icon={ScrollText}
            label={t("legal_terms_title")}
            onPress={() =>
              router.push({
                pathname: "/settings/legal/terms_of_use",
                params: { type: "terms" },
              })
            }
          />
          <NavRow
            Icon={AccessibilityIcon}
            label={t("legal_accessibility_title")}
            onPress={() =>
              router.push({
                pathname: "/settings/legal/Accessibility_statement",
                params: { type: "terms" },
              })
            }
          />
        </View>

        <Overline>{t("settings_section_app")}</Overline>
        <View style={styles.group}>
          <NavRow
            Icon={PlayCircle}
            label={t("settings_replay_onboarding")}
            onPress={() => {
              setOnboardingDone(false);
            }}
          />
          <View style={styles.divider} />
          <NavRow
            Icon={Info}
            label={t("settings_about_app")}
            onPress={() =>
              router.push({
                pathname: "/settings/about",
                params: { type: "about" },
              })
            }
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/settings/network_test")}
          style={styles.versionBlock}
          accessibilityRole="button"
          accessibilityLabel={t("settings_open_network_test")}
          accessibilityHint={t("settings_open_network_test_hint")}
        >
          <Text style={styles.versionApp}>Nowhere</Text>
          <Text style={styles.versionText}>
            {t("settings_version_build", {
              version: APP_VERSION,
              build: APP_BUILD,
            })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setLanguageOpen(false)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Languages size={20} color={colors.accent} />
                <Text style={styles.modalTitle}>{t("settings_language")}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLanguageOpen(false)}
                style={styles.modalClose}
              >
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((option) => {
              const active = option.key === language;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    setLanguage(option.key);
                    setLanguageOpen(false);
                  }}
                  style={[styles.langRow, active && styles.langRowActive]}
                >
                  <Text
                    style={[styles.langLabel, active && styles.langLabelActive]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  {active ? <Check size={18} color={colors.accent} /> : null}
                </TouchableOpacity>
              );
            })}

            <Text style={styles.langHint}>{t("settings_more_languages")}</Text>
          </Pressable>
        </Pressable>
      </Modal>
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
  title: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },

  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },

  overline: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  speedRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  speedValue: { ...typography.title, fontSize: 28, color: colors.text },
  speedUnit: { ...typography.body, color: colors.textMuted, marginBottom: 4 },
  speedRaw: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 5,
    marginLeft: "auto",
  },

  presetRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  preset: {
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  presetLabel: { ...typography.label, color: colors.textMuted },
  presetLabelActive: { color: colors.accent },

  styleChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  styleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  styleChipActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  swatch: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
  },
  styleChipLabel: { ...typography.label, color: colors.textMuted },
  styleChipLabelActive: { color: colors.accent },

  group: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowLabel: { ...typography.body, color: colors.text },
  rowValue: { ...typography.label, color: colors.textMuted, fontWeight: "500" },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 17 + spacing.md,
  },

  versionBlock: {
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  versionApp: { ...typography.label, color: colors.textSecondary },
  versionText: { ...typography.caption, color: colors.textMuted },
  versionPackage: {
    ...typography.caption,
    color: colors.textMuted,
    opacity: 0.7,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  modalBox: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: { ...typography.heading, color: colors.text },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.sm,
  },
  langRowActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  langLabel: { ...typography.body, color: colors.textMuted },
  langLabelActive: { color: colors.accent, fontWeight: "700" },
  langHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
