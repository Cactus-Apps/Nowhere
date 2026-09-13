import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bot,
  Car,
  ChevronRight,
  Compass,
  Footprints,
  Joystick,
  Navigation,
  Power,
  PowerOff,
  Satellite,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { MockLocation } = NativeModules;

const TRACK_W = 240;
const TRACK_H = 76;
const THUMB = 58;
const PAD = 9;
const TRAVEL = TRACK_W - PAD * 2 - THUMB;

type Mode = "joystick" | "system";

const MODES: { value: Mode; label: string; Icon: typeof Joystick }[] = [
  { value: "joystick", label: "Joystick", Icon: Joystick },
  { value: "system", label: "System", Icon: Bot },
];

function PowerSwitch({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const x = useRef(new Animated.Value(active ? TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: active ? TRAVEL : 0,
      damping: 16,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [active]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      style={[styles.track, active && styles.trackOn]}
    >
      <View style={styles.trackSide}>
        <PowerOff size={18} color={active ? "#3d434e" : "#8a94a6"} />
        <Text style={[styles.trackLabel, active && styles.trackLabelDim]}>
          AUS
        </Text>
      </View>
      <View style={styles.trackSide}>
        <Text
          style={[
            styles.trackLabel,
            active ? styles.trackLabelOn : styles.trackLabelDim,
          ]}
        >
          AN
        </Text>
        <Satellite size={18} color={active ? "#4CAF50" : "#3d434e"} />
      </View>

      <Animated.View
        style={[
          styles.thumb,
          active && styles.thumbOn,
          { transform: [{ translateX: x }] },
        ]}
      >
        <Navigation size={24} color={active ? "#0b0f14" : "#3d434e"} />
      </Animated.View>
    </TouchableOpacity>
  );
}

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
            <Text
              style={[styles.modeChipLabel, active && { color: accent }]}
            >
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

  const toggle = async () => {
    try {
      if (!active) {
        await MockLocation.startMocking(48.8566, 2.3522, 50);
      } else {
        await MockLocation.stopMocking();
      }
      setActive((v) => !v);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
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
            <View style={[styles.cardIcon, { backgroundColor: "#8B5CF620" }]}>
              <Footprints size={24} color="#8B5CF6" strokeWidth={1.7} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Gehen simulieren</Text>
              <Text style={styles.cardSub}>Spaziergang in einer Richtung</Text>
            </View>
            <ChevronRight size={18} color="#404752" />
          </TouchableOpacity>
          <View style={styles.cardBody}>
            <ModeSelector accent="#8B5CF6" value={mode} onChange={setMode} />
          </View>
        </View>

        {/* Car */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/car")}
            style={styles.cardHeader}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#F59E0B20" }]}>
              <Car size={24} color="#F59E0B" strokeWidth={1.7} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Autofahrt simulieren</Text>
              <Text style={styles.cardSub}>Strecke auf Straßen fahren</Text>
            </View>
            <ChevronRight size={18} color="#404752" />
          </TouchableOpacity>
          <View style={styles.cardBody}>
            <ModeSelector accent="#F59E0B" value={mode} onChange={setMode} />
          </View>
        </View>

        {/* Free */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/free-roam")}
            style={styles.cardHeader}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#22D3EE20" }]}>
              <Compass size={24} color="#22D3EE" strokeWidth={1.7} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Frei bewegen</Text>
              <Text style={styles.cardSub}>Manuell auf der Karte steuern</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },

  /* header */
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 32 },
  logo: { width: 52, height: 52, borderRadius: 14 },
  appName: { fontSize: 22, fontWeight: "700", color: "#f2f4f8", letterSpacing: 0.3 },
  appTag: { fontSize: 13, color: "#737a86", marginTop: 2 },

  /* switch */
  switchWrap: { alignItems: "center", marginBottom: 36 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: 1,
    borderColor: "#25282f",
    backgroundColor: "#16181e",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 4,
  },
  trackOn: {
    borderColor: "rgba(76,175,80,0.45)",
    backgroundColor: "rgba(76,175,80,0.1)",
  },
  trackSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  trackLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#8a94a6",
  },
  trackLabelDim: { color: "#3d434e" },
  trackLabelOn: { color: "#4CAF50" },
  thumb: {
    position: "absolute",
    left: PAD,
    top: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#262a32",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  thumbOn: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
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
