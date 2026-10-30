import { colors, radius, shadow } from "@/theme";
import { Power } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TRACK_W = 236;
const TRACK_H = 64;
const THUMB = 50;
const PAD = 7;
const TRAVEL = TRACK_W - PAD * 2 - THUMB;

export default function PowerSwitch({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const x = useRef(new Animated.Value(active ? TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: active ? TRAVEL : 0,
      damping: 18,
      stiffness: 190,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [active, x]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={[styles.track, active && styles.trackOn]}
    >
      <View style={styles.side}>
        <Text style={[styles.label, active && styles.labelDim]}>{t("common_off")}</Text>
      </View>
      <View style={styles.side}>
        <Text style={[styles.label, active ? styles.labelOn : styles.labelDim]}>
          {t("common_on")}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.thumb,
          active && styles.thumbOn,
          { transform: [{ translateX: x }] },
        ]}
      >
        <Power size={22} color={active ? colors.white : colors.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAD,
  },
  trackOn: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  side: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  labelDim: { color: colors.textMuted },
  labelOn: { color: colors.accent },
  thumb: {
    position: "absolute",
    left: PAD,
    top: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  thumbOn: {
    backgroundColor: colors.accent,
    ...shadow,
  },
});
