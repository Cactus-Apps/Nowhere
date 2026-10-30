import AnnouncementModalProvider from "@/components/modals/announcementModalProvider";
import "@/lib/i18n";
import {
  reconcileBackgroundLocation,
} from "@/lib/mockModules/backgroundLocation";
import { hydrateStore, useStore } from "@/lib/storage/store";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack, router, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const NAVY = "#0A1630";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const navigationState = useRootNavigationState();
  const { _hydrated: hydrated, onboardingDone, acceptedLegal } = useStore();

  useEffect(() => {
    hydrateStore();
    void reconcileBackgroundLocation();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !hydrated || !navigationState?.key) return;
    if (!onboardingDone || !acceptedLegal) {
      router.replace("/onboarding");
    }
  }, [
    fontsLoaded,
    hydrated,
    onboardingDone,
    acceptedLegal,
    navigationState?.key,
  ]);

  if (!fontsLoaded || !hydrated) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AnnouncementModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AnnouncementModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: NAVY },
});
