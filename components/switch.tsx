import { Navigation, PowerOff, Satellite } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TRACK_W = 240;
const TRACK_H = 76;
const THUMB = 58;
const PAD = 9;
const TRAVEL = TRACK_W - PAD * 2 - THUMB;

export default function PowerSwitch({
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

const styles = StyleSheet.create({
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
});
