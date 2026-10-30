import { fetchWithRateLimit } from "@/lib/fetchWithRateLimit";
import i18n from "@/lib/i18n";
import { colors, radius, spacing, typography } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, PlayCircle, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FetchInit = Parameters<typeof fetch>[1];
type TestState = "running" | "ok" | "error" | "aborted";
type TestGroup =
  | "network_group_general"
  | "network_group_nominatim"
  | "network_group_osrm"
  | "network_group_overpass"
  | "network_group_maps";

type EndpointTest = {
  id: string;
  group: TestGroup;
  nameKey: string;
  url: string;
  init?: FetchInit;
  check?: (body: string) => string | null;
};

type TestResult = {
  state: TestState;
  startedAt?: number;
  durationMs?: number;
  status?: number;
  message?: string;
  preview?: string;
};

const GROUPS: TestGroup[] = [
  "network_group_general",
  "network_group_nominatim",
  "network_group_osrm",
  "network_group_overpass",
  "network_group_maps",
];

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "de",
  "User-Agent": "Nowhere/1.0 (network-test)",
};

const OSRM_INIT: FetchInit = {
  headers: { Accept: "application/json" },
};

const OSRM_ROUTE = "2.3522,48.8641;2.3546,48.8630";

const OVERPASS_QUERY =
  '[out:json][timeout:25];node["highway"="traffic_signals"](48.85,2.34,48.88,2.37);out 1;';

const OVERPASS_INIT: FetchInit = {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Nowhere/1.0 (network-test)",
  },
  body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
};

const JSON_INIT: FetchInit = {
  headers: { Accept: "application/json" },
};

function osrmUrl(base: string, profile: string) {
  return `${base}/route/v1/${profile}/${OSRM_ROUTE}?overview=false&steps=false`;
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function checkNominatimSearch(body: string) {
  const data = parseJson(body);
  if (!Array.isArray(data)) return i18n.t("network_err_not_array");
  return data.length > 0 ? null : i18n.t("network_err_no_results");
}

function checkNominatimReverse(body: string) {
  const data = asRecord(parseJson(body));
  if (!data) return i18n.t("network_err_not_object");
  if (data.error) return `Nominatim: ${String(data.error)}`;
  return typeof data.display_name === "string"
    ? null
    : i18n.t("network_err_no_display_name");
}

function checkOsrm(body: string) {
  const data = asRecord(parseJson(body));
  if (!data) return i18n.t("network_err_not_object");
  if (typeof data.code === "string" && data.code !== "Ok") {
    const message = data.message ? ` – ${String(data.message)}` : "";
    return i18n.t("network_err_osrm", { code: data.code, message });
  }
  return Array.isArray(data.routes) && data.routes.length > 0
    ? null
    : i18n.t("network_err_no_route");
}

function checkOverpass(body: string) {
  const data = asRecord(parseJson(body));
  if (!data) return i18n.t("network_err_not_object");
  if (typeof data.remark === "string" && data.remark) {
    return i18n.t("network_err_overpass", { remark: data.remark });
  }
  return Array.isArray(data.elements)
    ? null
    : i18n.t("network_err_no_elements");
}

function checkStyle(body: string) {
  const data = asRecord(parseJson(body));
  if (!data) return i18n.t("network_err_not_object");
  return Array.isArray(data.layers) ? null : i18n.t("network_err_no_layers");
}

const ENDPOINTS: EndpointTest[] = [
  {
    id: "google",
    group: "network_group_general",
    nameKey: "network_endpoint_google",
    url: "https://www.google.com/generate_204",
    init: { headers: { Accept: "*/*" } },
  },
  {
    id: "example",
    group: "network_group_general",
    nameKey: "network_endpoint_example",
    url: "https://example.com/",
    init: { headers: { Accept: "text/html" } },
  },
  {
    id: "cloudflare-v4",
    group: "network_group_general",
    nameKey: "network_endpoint_cloudflare_v4",
    url: "https://1.1.1.1/cdn-cgi/trace",
    init: { headers: { Accept: "text/plain" } },
  },
  {
    id: "cloudflare-v6",
    group: "network_group_general",
    nameKey: "network_endpoint_cloudflare_v6",
    url: "https://[2606:4700:4700::1111]/cdn-cgi/trace",
    init: { headers: { Accept: "text/plain" } },
  },
  {
    id: "nominatim-search",
    group: "network_group_nominatim",
    nameKey: "network_endpoint_nominatim_search",
    url: "https://nominatim.openstreetmap.org/search?q=Paris&format=jsonv2&limit=1",
    init: { headers: NOMINATIM_HEADERS },
    check: checkNominatimSearch,
  },
  {
    id: "nominatim-reverse",
    group: "network_group_nominatim",
    nameKey: "network_endpoint_nominatim_reverse",
    url: "https://nominatim.openstreetmap.org/reverse?lat=48.8641&lon=2.3522&format=json",
    init: { headers: NOMINATIM_HEADERS },
    check: checkNominatimReverse,
  },
  {
    id: "osrm-car-primary",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_car_primary",
    url: osrmUrl("https://routing.openstreetmap.de/routed-car", "driving"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "osrm-bike-primary",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_bike_primary",
    url: osrmUrl("https://routing.openstreetmap.de/routed-bike", "cycling"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "osrm-foot-primary",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_foot_primary",
    url: osrmUrl("https://routing.openstreetmap.de/routed-foot", "walking"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "osrm-car-fallback",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_car_fallback",
    url: osrmUrl("https://router.project-osrm.org", "driving"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "osrm-bike-fallback",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_bike_fallback",
    url: osrmUrl("https://router.project-osrm.org", "cycling"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "osrm-foot-fallback",
    group: "network_group_osrm",
    nameKey: "network_endpoint_osrm_foot_fallback",
    url: osrmUrl("https://router.project-osrm.org", "walking"),
    init: OSRM_INIT,
    check: checkOsrm,
  },
  {
    id: "overpass-api",
    group: "network_group_overpass",
    nameKey: "network_endpoint_overpass_api",
    url: "https://overpass-api.de/api/interpreter",
    init: OVERPASS_INIT,
    check: checkOverpass,
  },
  {
    id: "overpass-osm-ch",
    group: "network_group_overpass",
    nameKey: "network_endpoint_overpass_osm_ch",
    url: "https://overpass.osm.ch/api/interpreter",
    init: OVERPASS_INIT,
    check: checkOverpass,
  },
  {
    id: "overpass-kumi",
    group: "network_group_overpass",
    nameKey: "network_endpoint_overpass_kumi",
    url: "https://overpass.kumi.systems/api/interpreter",
    init: OVERPASS_INIT,
    check: checkOverpass,
  },
  {
    id: "overpass-coffee",
    group: "network_group_overpass",
    nameKey: "network_endpoint_overpass_coffee",
    url: "https://overpass.private.coffee/api/interpreter",
    init: OVERPASS_INIT,
    check: checkOverpass,
  },
  {
    id: "style-liberty",
    group: "network_group_maps",
    nameKey: "network_endpoint_style_liberty",
    url: "https://tiles.openfreemap.org/styles/liberty",
    init: JSON_INIT,
    check: checkStyle,
  },
  {
    id: "style-bright",
    group: "network_group_maps",
    nameKey: "network_endpoint_style_bright",
    url: "https://tiles.openfreemap.org/styles/bright",
    init: JSON_INIT,
    check: checkStyle,
  },
];

function cacheBustUrl(url: string, init?: FetchInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_ts=${Date.now()}`;
}

function previewOf(body: string) {
  const compact = body.replace(/\s+/g, " ").trim();
  if (!compact) return i18n.t("network_err_empty_response");
  return compact.length > 220 ? `${compact.slice(0, 220)}…` : compact;
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

function formatDuration(ms?: number) {
  if (ms == null) return "–";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
}

function formatClock(ms: number) {
  return ms < 1000 ? `${(ms / 1000).toFixed(1)} s` : formatDuration(ms);
}

function LiveDuration({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [startedAt]);

  return <Text style={styles.meta}>{formatClock(elapsed)}</Text>;
}

function ResultBadge({ result }: { result?: TestResult }) {
  const { t } = useTranslation();

  if (!result) {
    return (
      <View style={styles.badge}>
        <View style={[styles.badgeDot, { backgroundColor: colors.textMuted }]} />
        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
          {t("network_status_open")}
        </Text>
      </View>
    );
  }

  if (result.state === "running") {
    return (
      <View style={styles.badge}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={[styles.badgeText, { color: colors.accent }]}>
          {t("network_status_running")}
        </Text>
      </View>
    );
  }

  const visual =
    result.state === "ok"
      ? { label: t("common_ok"), color: "#3FB950", background: "rgba(63,185,80,0.12)" }
      : result.state === "aborted"
        ? {
            label: t("network_status_aborted"),
            color: colors.textMuted,
            background: colors.surface,
          }
        : {
            label: t("network_status_error"),
            color: colors.danger,
            background: colors.dangerSoft,
          };

  return (
    <View style={[styles.badge, { backgroundColor: visual.background }]}>
      <View style={[styles.badgeDot, { backgroundColor: visual.color }]} />
      <Text style={[styles.badgeText, { color: visual.color }]}>
        {visual.label}
      </Text>
    </View>
  );
}

export default function NetworkTestScreen() {
  const { t } = useTranslation();
  const [useRateLimit, setUseRateLimit] = useState(true);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    return () => {
      for (const controller of controllers.current.values()) {
        controller.abort();
      }
    };
  }, []);

  const runTest = useCallback(
    async (test: EndpointTest) => {
      controllers.current.get(test.id)?.abort();
      const controller = new AbortController();
      controllers.current.set(test.id, controller);

      const startedAt = Date.now();
      setResults((previous) => ({
        ...previous,
        [test.id]: { state: "running", startedAt },
      }));

      const init = { ...(test.init ?? {}), signal: controller.signal };
      const isCurrent = () => controllers.current.get(test.id) === controller;

      try {
        const response = useRateLimit
          ? await fetchWithRateLimit(cacheBustUrl(test.url, test.init), init)
          : await fetch(cacheBustUrl(test.url, test.init), init);
        const durationMs = Date.now() - startedAt;

        let body = "";
        try {
          body = await response.text();
        } catch {}

        const checkError = response.ok ? (test.check?.(body) ?? null) : null;
        const statusText = response.statusText
          ? ` ${response.statusText}`
          : "";

        if (!isCurrent()) return;

        setResults((previous) => ({
          ...previous,
          [test.id]: {
            state: response.ok && !checkError ? "ok" : "error",
            startedAt,
            durationMs,
            status: response.status,
            message:
              checkError ??
              (response.ok
                ? undefined
                : `HTTP ${response.status}${statusText}`),
            preview: previewOf(body),
          },
        }));
      } catch (error) {
        if (!isCurrent()) return;

        const durationMs = Date.now() - startedAt;
        const aborted = controller.signal.aborted;

        setResults((previous) => ({
          ...previous,
          [test.id]: {
            state: aborted ? "aborted" : "error",
            startedAt,
            durationMs,
            message: aborted
              ? t("network_manual_abort")
              : describeError(error),
          },
        }));
      } finally {
        if (isCurrent()) controllers.current.delete(test.id);
      }
    },
    [t, useRateLimit],
  );

  const runAll = useCallback(async () => {
    setRunningAll(true);
    try {
      await Promise.all(ENDPOINTS.map((test) => runTest(test)));
    } finally {
      setRunningAll(false);
    }
  }, [runTest]);

  const cancelAll = useCallback(() => {
    for (const controller of controllers.current.values()) {
      controller.abort();
    }
  }, []);

  const toggleMode = useCallback((value: boolean) => {
    setUseRateLimit(value);
    setResults({});
  }, []);

  const hasRunning = Object.values(results).some(
    (result) => result.state === "running",
  );
  const tested = ENDPOINTS.filter(
    (test) => results[test.id] && results[test.id].state !== "running",
  ).length;
  const ok = ENDPOINTS.filter(
    (test) => results[test.id]?.state === "ok",
  ).length;
  const failed = ENDPOINTS.filter(
    (test) => results[test.id]?.state === "error",
  ).length;
  const aborted = ENDPOINTS.filter(
    (test) => results[test.id]?.state === "aborted",
  ).length;
  const running = ENDPOINTS.filter(
    (test) => results[test.id]?.state === "running",
  ).length;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={t("common_back")}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("network_test_title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <View style={styles.controlText}>
              <Text style={styles.controlTitle}>{t("network_host_ratelimit_title")}</Text>
              <Text style={styles.controlHint}>
                {useRateLimit
                  ? t("network_host_ratelimit_on")
                  : t("network_host_ratelimit_off")}
              </Text>
            </View>
            <Switch
              value={useRateLimit}
              onValueChange={toggleMode}
              disabled={hasRunning || runningAll}
              trackColor={{
                false: colors.borderStrong,
                true: colors.accentBorder,
              }}
              thumbColor={useRateLimit ? colors.accent : colors.textMuted}
              ios_backgroundColor={colors.borderStrong}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryButton, runningAll && styles.buttonDisabled]}
              onPress={runAll}
              disabled={runningAll}
              accessibilityRole="button"
              accessibilityLabel={t("network_run_all_a11y")}
            >
              {runningAll ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <PlayCircle size={18} color={colors.white} />
              )}
              <Text style={styles.primaryButtonText}>{t("network_run_all")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                !hasRunning && styles.buttonDisabled,
              ]}
              onPress={cancelAll}
              disabled={!hasRunning}
              accessibilityRole="button"
              accessibilityLabel={t("network_cancel_running")}
            >
              <X size={17} color={hasRunning ? colors.text : colors.textMuted} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  !hasRunning && styles.buttonTextDisabled,
                ]}
              >
                {t("common_cancel")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.summary}>
            {tested === 0
              ? t("network_summary_ready")
              : `${t("network_summary_line", {
                  tested,
                  total: ENDPOINTS.length,
                  ok,
                  failed,
                })}${
                  aborted
                    ? t("network_summary_aborted", { count: aborted })
                    : ""
                }${
                  running
                    ? t("network_summary_running", { count: running })
                    : ""
                }`}
          </Text>
        </View>

        {GROUPS.map((group) => {
          const tests = ENDPOINTS.filter((test) => test.group === group);
          return (
            <View key={group} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{t(group)}</Text>
              <View style={styles.groupCard}>
                {tests.map((test, index) => {
                  const result = results[test.id];
                  const isRunning = result?.state === "running";
                  const isError = result?.state === "error";
                  return (
                    <View
                      key={test.id}
                      style={[styles.testRow, index > 0 && styles.testBorder]}
                    >
                      <View style={styles.testMain}>
                        <View style={styles.testHeader}>
                          <Text style={styles.testName}>{t(test.nameKey)}</Text>
                          <ResultBadge result={result} />
                        </View>
                        <Text style={styles.testUrl} numberOfLines={1}>
                          {test.url}
                        </Text>
                        {result?.state === "running" && result.startedAt ? (
                          <LiveDuration startedAt={result.startedAt} />
                        ) : result?.durationMs != null ||
                          result?.status != null ? (
                          <Text style={styles.meta}>
                            {result.status != null
                              ? `HTTP ${result.status}`
                              : t("network_no_response")}
                            {" · "}
                            {formatDuration(result.durationMs)}
                          </Text>
                        ) : null}
                        {result?.message ? (
                          <Text
                            style={[
                              styles.message,
                              isError && styles.messageError,
                            ]}
                          >
                            {result.message}
                          </Text>
                        ) : null}
                        {result?.preview ? (
                          <Text style={styles.preview} numberOfLines={2}>
                            {result.preview}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={styles.runButton}
                        onPress={() => runTest(test)}
                        disabled={isRunning}
                        accessibilityRole="button"
                        accessibilityLabel={t("network_test_a11y", {
                          name: t(test.nameKey),
                        })}
                      >
                        {isRunning ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.accent}
                          />
                        ) : (
                          <PlayCircle size={20} color={colors.accent} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Text style={styles.footer}>
          {t("network_footer")}
        </Text>
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
  controlCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  controlText: { flex: 1 },
  controlTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: 3,
  },
  controlHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { ...typography.label, color: colors.text },
  buttonDisabled: { opacity: 0.45 },
  buttonTextDisabled: { color: colors.textMuted },
  summary: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 17,
  },
  groupBlock: { marginTop: spacing.xl },
  groupTitle: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  testRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  testBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  testMain: { flex: 1 },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  testName: {
    ...typography.label,
    color: colors.text,
    flex: 1,
  },
  testUrl: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 3,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  messageError: { color: colors.danger },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...typography.caption, fontWeight: "700" },
  runButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xl,
  },
});
