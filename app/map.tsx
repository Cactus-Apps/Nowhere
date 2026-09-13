import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { AlertTriangle, CheckCircle, MapPin, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Modal,
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

const MODAL_COLORS: Record<
  ModalType,
  { bg: string; border: string; icon: string }
> = {
  success: { bg: "#0d2818", border: "#1a5c2e", icon: "#4CAF50" },
  error: { bg: "#2d1215", border: "#5c1a1e", icon: "#f44336" },
};

export default function MapScreen() {
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
  const snapPoints = useMemo(() => ["15%", "40%", "75%", "50%", "100%"], []);

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

  const handleSheetChange = useCallback((_index: number) => {}, []);

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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&accept-language=de`,
          { headers: { "User-Agent": "FakeLocation/1.0" } },
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
      showModal("Mock GPS aktiv", `Standort gesetzt auf ${lat}, ${lng}`);
    } catch (e) {
      showModal("Fehler", String(e), "error");
    }
  };

  const update = async () => {
    try {
      await MockLocation.updateLocation(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(alt),
      );
      showModal("Standort aktualisiert", `Neue Position: ${lat}, ${lng}`);
    } catch (e) {
      showModal("Fehler", String(e), "error");
    }
  };

  const stop = async () => {
    try {
      await MockLocation.stopMocking();
      setActive(false);
      showModal("Mock GPS gestoppt", "GPS-Mocking wurde beendet");
    } catch (e) {
      showModal("Fehler", String(e), "error");
    }
  };

  const colors = MODAL_COLORS[modalType];

  return (
    <GestureHandlerRootView style={styles.root}>
      <MapProvider>
        <View style={[styles.statusCard, active && styles.statusCardActive]}>
          <View style={[styles.statusDot, active && styles.statusDotActive]} />
          <Text style={[styles.statusText, active && styles.statusTextActive]}>
            {active ? "Mock GPS aktiv" : "Inaktiv"}
          </Text>
        </View>
        <StatusBar style="light" />
        <View>
          <Map
            ref={mapRef}
            options={{
              style: "https://tiles.openfreemap.org/styles/bright",
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
                  position: relative;
                  width: 36px;
                  height: 36px;
                  border-radius: 50% 50% 50% 0;
                  background: #2563EB;
                  transform: rotate(-45deg);
                  box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                  animation: pin-drop 0.3s ease-out;
                  cursor: pointer;
                }
                .pin::after {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: #fff;
                  box-shadow: 0 0 6px rgba(37,99,235,0.5);
                }
                @keyframes pin-drop {
                  0% { transform: rotate(-45deg) translateY(-20px); opacity: 0; }
                  100% { transform: rotate(-45deg) translateY(0); opacity: 1; }
                }
              </style>
              <div class="pin"></div>
            `,
                },
              }}
            />
          )}
        </View>
        <BottomSheet
          ref={sheetRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          onChange={handleSheetChange}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.indicator}
        >
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title}>GPS Mock Location</Text>

            {address !== null && (
              <View style={styles.addressCard}>
                <View style={styles.addressIcon}>
                  <MapPin size={16} color="#7aabf0" strokeWidth={2.5} />
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address}
                </Text>
              </View>
            )}

            <View style={styles.TextInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                  placeholder="z.B. 48.8566"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                  placeholder="z.B. 2.3522"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {!advanced && (
              <TouchableOpacity onPress={() => setAdvanced(true)}>
                <Text style={styles.advancedButton}>Advanced Settings</Text>
              </TouchableOpacity>
            )}
            {advanced && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Altitude (m)</Text>
                <TextInput
                  style={styles.input}
                  value={alt}
                  onChangeText={setAlt}
                  keyboardType="numeric"
                  placeholder="z.B. 50"
                  placeholderTextColor="#666"
                />
              </View>
            )}
            {advanced && (
              <TouchableOpacity onPress={() => setAdvanced(false)}>
                <Text style={styles.advancedButton}>Show less</Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttons}>
              <Button title="Start" onPress={start} color="#4CAF50" />
              <Button
                title="Update"
                onPress={update}
                disabled={!active}
                color="#2196F3"
              />
              <Button
                title="Stop"
                onPress={stop}
                disabled={!active}
                color="#f44336"
              />
            </View>
          </BottomSheetScrollView>
        </BottomSheet>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={18} color="#666" />
                </TouchableOpacity>

                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: `${colors.icon}20` },
                  ]}
                >
                  {modalType === "success" ? (
                    <CheckCircle
                      size={32}
                      color={colors.icon}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <AlertTriangle
                      size={32}
                      color={colors.icon}
                      strokeWidth={1.8}
                    />
                  )}
                </View>

                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <Text style={styles.modalMessage}>{modalMessage}</Text>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.icon }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </MapProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  sheetBackground: {
    backgroundColor: "#111318",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  indicator: {
    backgroundColor: "#3a3a3e",
    width: 40,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 48,
    gap: 4,
  },
  TextInputs: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  advancedButton: {
    textDecorationLine: "underline",
    color: "#5b8def",
    marginTop: 8,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1b2a",
    borderColor: "#1e3a5f",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(122, 171, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#aab8d0",
    lineHeight: 18,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
    marginBottom: 4,
  },
  label: {
    color: "#777",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1e3a5f",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    backgroundColor: "#0d1b2a",
    fontSize: 15,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
    gap: 10,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#1a1a1f",
    borderColor: "#2a2a2e",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    position: "absolute",
    top: 34,
    left: 16,
    zIndex: 10,
  },
  statusCardActive: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    borderColor: "rgba(76, 175, 80, 0.35)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555",
  },
  statusDotActive: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 4,
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
