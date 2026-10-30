import type { PlaceResult } from "@/lib/geo/geocoding";
import { searchPlaces } from "@/lib/geo/geocoding";
import { colors, radius, spacing, typography } from "@/theme";
import { MapPin, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEBOUNCE_MS = 450;

export default function PlaceSearch({
  onPick,
  style,
}: {
  onPick: (place: PlaceResult) => void;
  style?: object;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const requestId = ++requestRef.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const places = await searchPlaces(trimmed);
      if (requestId !== requestRef.current) return;
      setResults(places);
      setOpen(true);
      setLoading(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePick = (place: PlaceResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    onPick(place);
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.bar}>
        <Search size={17} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("common_search_place")}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setOpen(false);
              setResults([]);
            }}
            hitSlop={8}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {open && results.length > 0 ? (
        <View style={styles.results}>
          <FlatList
            data={results}
            keyExtractor={(item, index) =>
              `${item.coordinate[0]}-${item.coordinate[1]}-${index}`
            }
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePick(item)}
                style={styles.row}
              >
                <MapPin size={15} color={colors.accent} />
                <Text style={styles.rowLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 20, flex: 1 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  results: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    maxHeight: 240,
  },
  list: { flexGrow: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.label,
    color: colors.text,
    flex: 1,
    fontWeight: "500",
  },
});
