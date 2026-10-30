import ModalSheet from "@/components/modals/modal";
import { fetchWithRateLimit } from "@/lib/fetchWithRateLimit";
import i18n from "@/lib/i18n";
import { colors, radius, spacing, typography } from "@/theme";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { MapPin } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NativeModules,
  StyleSheet,
  Text,
  TextInput,
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

const { MockLocation } = NativeModules;

type ModalType = "success" | "error";

export default function MapScreen() {
  const { t } = useTranslation();
  const [lat, setLat] = useState("48.8566");
  const [lng, setLng] = useState("2.3522");
  const [alt, setAlt] = useState("50");
  const [advanced, setAdvanced] = useState(false);
  const [active, setActive] = useState(false);
  const [markerCoord, setMarkerCoord] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<ModalType>("success");
  const mapRef = useRef<MapRef | null>(null);
  const markerRef = useRef<MarkerRef | null>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["16%", "44%", "78%", "55%", "100%"], []);

  const showModal = (
    title: string,
    message: string,
    type: ModalType = "success",
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const ensureGlobe = () => {
    mapRef.current?.setProjection({ type: "globe" });
  };

  const handleMapClick = useCallback(async (event: any) => {
    const lngLat = event?.lngLat;
    if (lngLat) {
      const newLng = Number(lngLat.lng.toFixed(6));
      const newLat = Number(lngLat.lat.toFixed(6));
      setLng(String(newLng));
      setLat(String(newLat));
      setMarkerCoord([newLng, newLat]);
      setAddress(null);
      try {
        const res = await fetchWithRateLimit(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&accept-language=${i18n.language}`,
          { headers: { "User-Agent": "Nowhere/1.0" } },
        );
        const data = await res.json();
        setAddress(data.display_name ?? null);
      } catch {}
    }
  }, []);

  const start = async () => {
    try {
      await MockLocation.startMocking(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(alt),
      );
      setActive(true);
      showModal(
        t("map_status_active"),
        t("map_mock_started_message", { lat, lng }),
      );
    } catch (e) {
      showModal(t("common_error"), String(e), "error");
    }
  };

  const update = async () => {
    try {
      await MockLocation.updateLocation(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(alt),
      );
      showModal(
        t("map_mock_updated_title"),
        t("map_mock_updated_message", { lat, lng }),
      );
    } catch (e) {
      showModal(t("common_error"), String(e), "error");
    }
  };

  const stop = async () => {
    try {
      await MockLocation.stopMocking();
      setActive(false);
      showModal(
        t("map_mock_stopped_title"),
        t("map_mock_stopped_message"),
      );
    } catch (e) {
      showModal(t("common_error"), String(e), "error");
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <MapProvider>
        <View style={[styles.statusCard, active && styles.statusCardActive]}>
          <View style={[styles.statusDot, active && styles.statusDotActive]} />
          <Text style={[styles.statusText, active && styles.statusTextActive]}>
            {active ? t("map_status_active") : t("common_inactive")}
          </Text>
        </View>
        <StatusBar style="light" />
        <Map
          ref={mapRef}
          options={{
            style: "https://tiles.openfreemap.org/styles/dark",
            center: [2.349014, 48.864716],
            zoom: 4,
          }}
          listeners={{
            mount: {
              rnListener: ensureGlobe,
            },
            click: {
              objectListener: handleMapClick,
            },
          }}
        />
        {markerCoord && (
          <Marker
            ref={markerRef}
            options={{
              coordinate: markerCoord,
              element: {
                innerHTML: `
              <style>
                .pin {
                  width: 28px;
                  height: 28px;
                  border-radius: 50% 50% 50% 0;
                  background: ${colors.accent};
                  transform: rotate(-45deg);
                  box-shadow: 0 3px 10px rgba(78,124,255,0.45);
                  position: relative;
                }
                .pin::after {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: #fff;
                }
              </style>
              <div class="pin"></div>
            `,
              },
            }}
          />
        )}

        <BottomSheet
          ref={sheetRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.indicator}
        >
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title}>Nowhere</Text>

            {address !== null && (
              <View style={styles.addressCard}>
                <View style={styles.addressIcon}>
                  <MapPin size={16} color={colors.accent} strokeWidth={2} />
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address}
                </Text>
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("map_latitude")}</Text>
                <TextInput
                  style={styles.input}
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                  placeholder={t("map_placeholder_lat")}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("map_longitude")}</Text>
                <TextInput
                  style={styles.input}
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                  placeholder={t("map_placeholder_lng")}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {!advanced && (
              <TouchableOpacity onPress={() => setAdvanced(true)}>
                <Text style={styles.link}>{t("map_advanced")}</Text>
              </TouchableOpacity>
            )}
            {advanced && (
              <View style={styles.inputGroupFull}>
                <Text style={styles.label}>{t("map_altitude")}</Text>
                <TextInput
                  style={styles.input}
                  value={alt}
                  onChangeText={setAlt}
                  keyboardType="numeric"
                  placeholder={t("map_placeholder_alt")}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}
            {advanced && (
              <TouchableOpacity onPress={() => setAdvanced(false)}>
                <Text style={styles.link}>{t("map_less")}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={start}
                style={[styles.btn, styles.btnStart]}
              >
                <Text style={styles.btnText}>{t("common_start")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={update}
                disabled={!active}
                style={[
                  styles.btn,
                  styles.btnUpdate,
                  !active && styles.btnDisabled,
                ]}
              >
                <Text style={styles.btnText}>{t("common_update")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={stop}
                disabled={!active}
                style={[
                  styles.btn,
                  styles.btnStop,
                  !active && styles.btnDisabled,
                ]}
              >
                <Text style={styles.btnText}>{t("common_stop")}</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>

        <ModalSheet
          title={modalTitle}
          text={modalMessage}
          open={modalVisible}
          onClose={() => setModalVisible(false)}
          onPress={() => setModalVisible(false)}
          variant={modalType === "error" ? "danger" : "default"}
        />
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    position: "absolute",
    top: spacing.xxxl + spacing.sm,
    left: spacing.lg,
    zIndex: 10,
  },
  statusCardActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textMuted,
  },
  statusTextActive: { color: colors.accent },
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  indicator: { backgroundColor: colors.borderStrong, width: 40 },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  row: { flexDirection: "row", gap: spacing.md },
  inputGroup: { flex: 1, gap: spacing.xs },
  inputGroupFull: { gap: spacing.xs, marginTop: spacing.xs },
  label: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    fontSize: 15,
  },
  link: {
    ...typography.label,
    color: colors.accent,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.lg - 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnStart: { backgroundColor: colors.accent },
  btnUpdate: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnStop: { backgroundColor: colors.danger },
  btnDisabled: { opacity: 0.45 },
  btnText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },
});
