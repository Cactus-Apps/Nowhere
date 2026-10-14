import ModalSheet from "@/components/modal";
import PowerSwitch from "@/components/switch";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bot,
  Car,
  ChevronRight,
  Compass,
  Footprints,
  Joystick,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Image,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Map,
  MapProvider,
  MapRef,
  Marker,
  MarkerRef,
} from "react-native-maplibre-gl-js";
import { SafeAreaView } from "react-native-safe-area-context";

const { MockLocation } = NativeModules;

type Mode = "joystick" | "system";

const MODES: { value: Mode; label: string; Icon: typeof Joystick }[] = [
  { value: "joystick", label: "Joystick", Icon: Joystick },
  { value: "system", label: "System", Icon: Bot },
];

function ModeSelector({
  accent,
  value,
  onChange,
}: {
  accent: string;
  value: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <View style={styles.modeRow}>
      {MODES.map((m) => {
        const active = m.value === value;
        return (
          <TouchableOpacity
            key={m.value}
            activeOpacity={0.8}
            onPress={() => onChange(m.value)}
            style={[
              styles.modeChip,
              active && {
                borderColor: accent,
                backgroundColor: `${accent}1a`,
              },
            ]}
          >
            <m.Icon size={15} color={active ? accent : "#737a86"} />
            <Text style={[styles.modeChipLabel, active && { color: accent }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<Mode>("system");
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const [error, setError] = useState<any>("");
  const [fullScreen, setFullScreen] = useState(true);
  const [bottonSheetIndex, setBottonSheetIndex] = useState(2);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const hasCenteredOnce = useRef(false);
  const [markerPos, setMarkerPos] = useState<[number, number]>();

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

  const toggle = async () => {
    try {
      if (!active) {
        await MockLocation.startMocking(48, 2, 50);
      } else {
        await MockLocation.stopMocking();
      }
      setActive((v) => !v);
    } catch (err: any) {
      setError(err);
    }
  };

  const startLocationWatcher = useCallback(async () => {
    if (subRef.current) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Standortberechtigung verweigert");
      return;
    }

    subRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        setMarkerPos([longitude, latitude]);
        if (!hasCenteredOnce.current && mapRef.current) {
          hasCenteredOnce.current = true;
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            speed: 0.8,
            duration: 600,
          });
          ensureGlobe();
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startLocationWatcher();

    return () => {
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [startLocationWatcher]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startLocationWatcher();
      }
    });
    return () => sub.remove();
  }, [startLocationWatcher]);

  useEffect(() => {
    setFullScreen(bottonSheetIndex === 2);
  }, [bottonSheetIndex]);

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <MapProvider>
          <Map
            ref={mapRef}
            options={{
              style: "https://tiles.openfreemap.org/styles/bright",
              center: [0, 0],
              zoom: 4,
            }}
            listeners={{
              mount: {
                rnListener: ensureGlobe,
              },
            }}
          />
          <Marker
            ref={markerRef}
            options={{
              coordinate: markerPos,
              draggable: false,
              element: {
                innerHTML: `
              <style>
                .pin {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                   background: radial-gradient(circle at 50% 50%, ${"#fff"}, ${"#666"});
                   border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                  box-shadow:
                    0 4px 8px rgba(0, 0, 0, 0.3),
                    inset 0 2px 4px rgba(255, 255, 255, 0.6);
                  position: relative;
                  cursor: pointer;
                  transition: transform 0.2s ease;
                }
                .pin:hover {
                  transform: scale(1.1);
                }
                .pin-icon {
                  font-size: 20px;
                  color: white;
                  text-shadow: 0 0 3px rgba(0,0,0,0.3);
                  user-select: none;
                  pointer-events: none;
                  line-height: 1;
                }
              </style>
              <div class="pin" title="Location">
              </div>
            `,
              },
            }}
            listeners={{
              click: {
                elementListener: async (_: MouseEvent) => {
                  mapRef.current?.flyTo({
                    center: markerPos,
                    zoom: 14,
                    speed: 0.3,
                    curve: 1,
                    duration: 1000,
                    pitch: 0,
                  });
                },
              },
            }}
          />
          <BottomSheet
            ref={bottomSheetRef}
            index={bottonSheetIndex}
            snapPoints={["45%", "70%", "100%"]}
            enablePanDownToClose={false}
            onChange={setBottonSheetIndex}
            backgroundStyle={{
              borderTopLeftRadius: fullScreen ? 0 : 32,
              borderTopRightRadius: fullScreen ? 0 : 32,
              backgroundColor: "#0F1B2A",
            }}
          >
            <BottomSheetScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logo}
                />
                <View>
                  <Text style={styles.appName}>Phantom GPS</Text>
                  <Text style={styles.appTag}>Fake Location & Bewegung</Text>
                </View>
              </View>

              <View style={styles.switchWrap}>
                <PowerSwitch active={active} onToggle={toggle} />
                <Text style={styles.switchStatus}>
                  {active
                    ? "Standort wird aktuell verdeckt"
                    : "Standort wird normal übermittelt"}
                </Text>
              </View>

              <Text style={styles.section}>Simulationen</Text>

              {/* Walk */}
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/walk")}
                  style={styles.cardHeader}
                >
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#8B5CF620" }]}
                  >
                    <Footprints size={24} color="#8B5CF6" strokeWidth={1.7} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Gehen simulieren</Text>
                    <Text style={styles.cardSub}>
                      Spaziergang in einer Richtung
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#404752" />
                </TouchableOpacity>
                <View style={styles.cardBody}>
                  <ModeSelector
                    accent="#8B5CF6"
                    value={mode}
                    onChange={setMode}
                  />
                </View>
              </View>

              {/* Car */}
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/car")}
                  style={styles.cardHeader}
                >
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#F59E0B20" }]}
                  >
                    <Car size={24} color="#F59E0B" strokeWidth={1.7} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Autofahrt simulieren</Text>
                    <Text style={styles.cardSub}>
                      Strecke auf Straßen fahren
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#404752" />
                </TouchableOpacity>
                <View style={styles.cardBody}>
                  <ModeSelector
                    accent="#F59E0B"
                    value={mode}
                    onChange={setMode}
                  />
                </View>
              </View>

              {/* Free */}
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/free-roam")}
                  style={styles.cardHeader}
                >
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#22D3EE20" }]}
                  >
                    <Compass size={24} color="#22D3EE" strokeWidth={1.7} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Frei bewegen</Text>
                    <Text style={styles.cardSub}>
                      Manuell auf der Karte steuern
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#404752" />
                </TouchableOpacity>
                <View style={styles.cardBody}>
                  <View style={styles.modeChip}>
                    <Joystick size={15} color="#22D3EE" />
                    <Text style={[styles.modeChipLabel, { color: "#22D3EE" }]}>
                      Nur Joystick
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 48 }} />
            </BottomSheetScrollView>
          </BottomSheet>
          <ModalSheet
            title="An error occured"
            open={error}
            text={error}
            onClose={() => setError("")}
            onPress={() => setError("")}
          />
        </MapProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  logo: { width: 52, height: 52, borderRadius: 14 },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f2f4f8",
    letterSpacing: 0.3,
  },
  appTag: { fontSize: 13, color: "#737a86", marginTop: 2 },

  /* switch */
  switchWrap: { alignItems: "center", marginBottom: 36 },
  switchStatus: {
    fontSize: 12,
    color: "#525862",
    marginTop: 14,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* section */
  section: {
    fontSize: 12,
    fontWeight: "600",
    color: "#525862",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },

  /* card */
  card: {
    backgroundColor: "#111318",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f242c",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#f2f4f8" },
  cardSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
  },

  /* mode */
  modeRow: { flexDirection: "row", gap: 10 },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f242c",
    backgroundColor: "#16181e",
  },
  modeChipLabel: { fontSize: 13, fontWeight: "500", color: "#737a86" },
});
