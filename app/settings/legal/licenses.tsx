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

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  kind: "dep" | "dev";
  repository?: string;
  homepage?: string;
};

const LICENSES_DATA: LicenseEntry[] = [
  { name: "@expo-google-fonts/space-grotesk", version: "0.4.1", license: "MIT AND OFL-1.1", kind: "dep", repository: "git+https://github.com/expo/google-fonts.git", homepage: "https://github.com/expo/google-fonts/tree/master/font-packages/space-grotesk#readme" },
  { name: "@gorhom/bottom-sheet", version: "5.2.14", license: "MIT", kind: "dep", repository: "https://github.com/gorhom/react-native-bottom-sheet", homepage: "https://gorhom.dev/react-native-bottom-sheet/" },
  { name: "@korsolutions/react-native-joystick", version: "2.0.1", license: "MIT", kind: "dep", repository: "https://github.com/korsoftwaresolutions/react-native-joystick.git", homepage: "https://github.com/korsoftwaresolutions/react-native-joystick" },
  { name: "@react-native-async-storage/async-storage", version: "2.2.0", license: "MIT", kind: "dep", repository: "https://github.com/react-native-async-storage/async-storage.git", homepage: "https://github.com/react-native-async-storage/async-storage#readme" },
  { name: "@react-native-community/slider", version: "5.2.0", license: "MIT", kind: "dep", repository: "https://github.com/callstack/react-native-slider.git", homepage: "https://github.com/callstack/react-native-slider#readme" },
  { name: "@types/react", version: "19.2.18", license: "MIT", kind: "dev", repository: "https://github.com/DefinitelyTyped/DefinitelyTyped.git", homepage: "https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react" },
  { name: "babel-preset-expo", version: "57.0.15", license: "MIT", kind: "dev", repository: "git+https://github.com/expo/expo.git", homepage: "https://github.com/expo/expo/tree/main/packages/babel-preset-expo#readme" },
  { name: "expo", version: "57.0.29", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://github.com/expo/expo/tree/main/packages/expo" },
  { name: "expo-constants", version: "57.0.22", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/constants/" },
  { name: "expo-haptics", version: "57.0.3", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/haptics/" },
  { name: "expo-intent-launcher", version: "57.0.1", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/intent-launcher/" },
  { name: "expo-linking", version: "57.0.13", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/linking" },
  { name: "expo-location", version: "57.0.21", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/location/" },
  { name: "expo-router", version: "57.0.27", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/routing/introduction/" },
  { name: "expo-status-bar", version: "57.0.1", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/status-bar/" },
  { name: "expo-task-manager", version: "57.0.21", license: "MIT", kind: "dep", repository: "https://github.com/expo/expo.git", homepage: "https://docs.expo.dev/versions/latest/sdk/task-manager/" },
  { name: "i18next", version: "26.5.2", license: "MIT", kind: "dep", repository: "https://github.com/i18next/i18next.git", homepage: "https://www.i18next.com" },
  { name: "lucide-react-native", version: "0.546.0", license: "ISC", kind: "dep", repository: "https://github.com/lucide-icons/lucide.git", homepage: "https://lucide.dev" },
  { name: "react", version: "19.2.3", license: "MIT", kind: "dep", repository: "https://github.com/facebook/react.git", homepage: "https://react.dev/" },
  { name: "react-i18next", version: "17.1.0", license: "MIT", kind: "dep", repository: "https://github.com/i18next/react-i18next.git", homepage: "https://github.com/i18next/react-i18next" },
  { name: "react-native", version: "0.86.3", license: "MIT", kind: "dep", repository: "git+https://github.com/react/react-native.git", homepage: "https://reactnative.dev/" },
  { name: "react-native-gesture-handler", version: "2.32.0", license: "MIT", kind: "dep", repository: "git+https://github.com/software-mansion/react-native-gesture-handler.git", homepage: "https://docs.swmansion.com/react-native-gesture-handler/" },
  { name: "react-native-maplibre-gl-js", version: "1.24.6", license: "MIT", kind: "dep", repository: "git+https://github.com/emilienaufauvre/react-native-maplibre-gl-js.git", homepage: "https://github.com/emilienaufauvre/react-native-maplibre-gl-js#readme" },
  { name: "react-native-reanimated", version: "4.5.1", license: "MIT", kind: "dep", repository: "git+https://github.com/software-mansion/react-native-reanimated.git", homepage: "https://docs.swmansion.com/react-native-reanimated" },
  { name: "react-native-safe-area-context", version: "5.7.0", license: "MIT", kind: "dep", repository: "https://github.com/AppAndFlow/react-native-safe-area-context.git", homepage: "https://github.com/AppAndFlow/react-native-safe-area-context#readme" },
  { name: "react-native-screens", version: "4.26.2", license: "MIT", kind: "dep", repository: "git+https://github.com/software-mansion/react-native-screens.git", homepage: "https://github.com/software-mansion/react-native-screens#readme" },
  { name: "react-native-svg", version: "15.15.4", license: "MIT", kind: "dep", repository: "https://github.com/react-native-community/react-native-svg", homepage: "https://github.com/react-native-community/react-native-svg" },
  { name: "react-native-webview", version: "13.16.1", license: "MIT", kind: "dep", repository: "https://github.com/react-native-webview/react-native-webview.git", homepage: "https://github.com/react-native-webview/react-native-webview#readme" },
  { name: "react-native-worklets", version: "0.10.1", license: "MIT", kind: "dep", repository: "git+https://github.com/software-mansion/react-native-reanimated.git", homepage: "https://docs.swmansion.com/react-native-worklets" },
  { name: "react-refresh", version: "0.14.2", license: "MIT", kind: "dev", repository: "https://github.com/facebook/react.git", homepage: "https://reactjs.org/" },
  { name: "typescript", version: "6.0.3", license: "Apache-2.0", kind: "dev", repository: "https://github.com/microsoft/TypeScript.git", homepage: "https://www.typescriptlang.org/" },
];

export default function LicensesScreen() {
  const { t } = useTranslation();
  const dependencies = LICENSES_DATA.filter((item) => item.kind === "dep");
  const devDependencies = LICENSES_DATA.filter((item) => item.kind === "dev");

  const renderItem = (item: LicenseEntry, index: number) => (
    <View key={`${item.name}-${index}`} style={styles.item}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.version}>{item.version}</Text>
      </View>
      <Text style={styles.license}>{item.license}</Text>
      {item.repository ? (
        <TouchableOpacity onPress={() => openLink(item.repository ?? "")}>
          <Text style={styles.link} numberOfLines={1}>
            {item.repository}
          </Text>
        </TouchableOpacity>
      ) : null}
      {item.homepage ? (
        <TouchableOpacity onPress={() => openLink(item.homepage ?? "")}>
          <Text style={styles.link} numberOfLines={1}>
            {item.homepage}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("licenses_title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.block}>
          <Text style={styles.h1}>{t("licenses_title")}</Text>
          <Text style={styles.p}>{t("licenses_intro")}</Text>

          <Text style={styles.h2}>{t("licenses_deps")}</Text>
          {dependencies.map(renderItem)}

          <Text style={styles.h2}>{t("licenses_dev_deps")}</Text>
          {devDependencies.map(renderItem)}
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
  h1: { ...typography.title, fontSize: 22, lineHeight: 28, color: colors.text, marginBottom: spacing.md },
  h2: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  p: { ...typography.body, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: spacing.sm },
  item: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  name: { ...typography.body, fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 },
  version: { ...typography.caption, color: colors.textMuted },
  license: { ...typography.label, color: colors.textSecondary },
  link: { ...typography.caption, color: colors.accent },
});
