import { changeLanguage } from "@/lib/i18n";
import {
  fetchSetupStatus,
  openDeveloperOptions,
  openLocationSettings,
  openMockAppSettings,
  requestLocationPermission,
  type SetupStatus,
} from "@/lib/onboarding";
import { useStore, type MovementKey } from "@/lib/storage/store";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  Car,
  Check,
  ChevronRight,
  Footprints,
  Move,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Line, Path, Rect, Svg } from "react-native-svg";

const NAVY = "#0A1630";
const NAVY_SOFT = "#14264C";
const NAVY_BLOCK = "#0F1E3F";
const NAVY_CARD = "#0E1D3E";
const ACCENT = "#4E7CFF";
const TEXT = "#F2F4F7";
const TEXT_DIM = "rgba(242, 244, 247, 0.55)";
const BORDER = "rgba(242, 244, 247, 0.14)";

const FONT = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  bold: "SpaceGrotesk_700Bold",
} as const;

const SETUP_STEPS = [
  {
    key: "developer" as const,
    labelKey: "onboarding_step_developer",
    action: openDeveloperOptions,
    actionKey: "common_open",
  },
  {
    key: "mockApp" as const,
    labelKey: "onboarding_step_mock_app",
    action: openMockAppSettings,
    actionKey: "common_open",
  },
  {
    key: "location" as const,
    labelKey: "onboarding_step_location",
    action: requestLocationPermission,
    actionKey: "common_allow",
  },
  {
    key: "locationServices" as const,
    labelKey: "onboarding_step_location_services",
    action: openLocationSettings,
    actionKey: "common_open",
  },
];

const MOVEMENTS: {
  key: MovementKey;
  labelKey: string;
}[] = [
  { key: "walk", labelKey: "mode_walk" },
  { key: "drive", labelKey: "mode_drive" },
  { key: "free", labelKey: "mode_free" },
];

function lightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function PulseDot({ size = 12, ring = 44 }: { size?: number; ring?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [p]);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.35 + p.value }],
    opacity: 0.55 * (1 - p.value),
  }));
  return (
    <View
      style={{
        width: ring,
        height: ring,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            backgroundColor: ACCENT,
          },
          ringStyle,
        ]}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ACCENT,
        }}
      />
    </View>
  );
}

function Footprint({ index }: { index: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      index * 300,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.2 + p.value * 0.8,
    transform: [{ translateY: -p.value * 3 }],
  }));
  return (
    <Animated.View style={[styles.footprint, style]}>
      <View style={styles.footprintDot} />
    </Animated.View>
  );
}

function WalkArt() {
  return (
    <View style={styles.artBox}>
      <View style={styles.footprintTrail}>
        <Footprint index={0} />
        <Footprint index={1} />
        <Footprint index={2} />
        <Footprint index={3} />
        <Footprint index={4} />
        <Footprint index={5} />
      </View>
    </View>
  );
}

function CarArt() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -38 + t.value * 76 },
      { rotate: `${Math.sin(t.value * Math.PI * 2) * 8}deg` },
    ],
  }));
  return (
    <View style={styles.artBox}>
      <View style={styles.carTrack}>
        <Animated.View style={[styles.car, style]}>
          <Car size={26} color={ACCENT} />
        </Animated.View>
      </View>
    </View>
  );
}

function FreeArt() {
  return (
    <View style={styles.artBox}>
      <PulseDot size={14} ring={64} />
    </View>
  );
}

function IntroMapArt() {
  const ghost = useSharedValue(0);
  useEffect(() => {
    ghost.value = withDelay(
      1200,
      withRepeat(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [ghost]);
  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ghost.value * -110 },
      { translateY: ghost.value * -130 },
    ],
    opacity: Math.sin(Math.PI * ghost.value) * 0.55,
  }));
  return (
    <View style={styles.introArt}>
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 400 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="36" y="110" width="96" height="74" rx="8" fill={NAVY_BLOCK} />
        <Rect
          x="244"
          y="250"
          width="118"
          height="96"
          rx="8"
          fill={NAVY_BLOCK}
        />
        <Rect x="88" y="418" width="84" height="124" rx="8" fill={NAVY_BLOCK} />
        <Rect x="270" y="500" width="94" height="70" rx="8" fill={NAVY_BLOCK} />
        <Line
          x1="0"
          y1="196"
          x2="400"
          y2="228"
          stroke={NAVY_SOFT}
          strokeWidth="14"
        />
        <Line
          x1="178"
          y1="0"
          x2="148"
          y2="700"
          stroke={NAVY_SOFT}
          strokeWidth="12"
        />
        <Line
          x1="0"
          y1="472"
          x2="400"
          y2="436"
          stroke={NAVY_SOFT}
          strokeWidth="10"
        />
        <Line
          x1="322"
          y1="0"
          x2="358"
          y2="700"
          stroke={NAVY_SOFT}
          strokeWidth="8"
        />
        <Line
          x1="0"
          y1="64"
          x2="400"
          y2="92"
          stroke={NAVY_SOFT}
          strokeWidth="6"
        />
        <Line
          x1="0"
          y1="618"
          x2="400"
          y2="638"
          stroke={NAVY_SOFT}
          strokeWidth="6"
        />
      </Svg>
      <View style={styles.introMarker}>
        <Animated.View style={[styles.ghostDot, ghostStyle]} />
        <PulseDot size={13} ring={52} />
      </View>
    </View>
  );
}

function BuildHelpVisual() {
  const { t } = useTranslation();

  return (
    <View style={styles.helpPhone}>
      <View style={styles.helpPhoneHeader} />
      <View style={styles.helpRow}>
        <Text style={styles.helpRowText}>{t("onboarding_about_phone")}</Text>
        <ChevronRight size={14} color={TEXT_DIM} />
      </View>
      <View style={[styles.helpRow, styles.helpRowHighlight]}>
        <Text style={[styles.helpRowText, { color: ACCENT }]}>
          {t("onboarding_build_number")}
        </Text>
        <View style={styles.helpTaps}>
          <Text style={styles.helpTapsText}>7×</Text>
        </View>
      </View>
      <View style={styles.helpPhoneFooter} />
      <View style={styles.helpArrow}>
        <ArrowRight size={16} color={ACCENT} />
      </View>
    </View>
  );
}

function LegalCheckRow({
  checked,
  onToggle,
  prefix,
  linkLabel,
  onLink,
  suffix,
}: {
  checked: boolean;
  onToggle: () => void;
  prefix: string;
  linkLabel: string;
  onLink: () => void;
  suffix: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={styles.checkRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Check size={13} color="#FFFFFF" /> : null}
      </View>
      <Text style={styles.checkText}>
        {prefix}{" "}
        <Text
          style={styles.checkLink}
          onPress={(e) => {
            e.stopPropagation();
            onLink();
          }}
        >
          {linkLabel}
        </Text>{" "}
        {suffix}
      </Text>
    </TouchableOpacity>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

function FlagArt({ code }: { code: LangCode }) {
  switch (code) {
    case "de":
      return (
        <>
          <Rect width="60" height="14" fill="#000000" />
          <Rect y="13.34" width="60" height="13.34" fill="#DD0000" />
          <Rect y="26.67" width="60" height="13.33" fill="#FFCE00" />
        </>
      );
    case "es":
      return (
        <>
          <Rect width="60" height="40" fill="#AA151B" />
          <Rect y="10" width="60" height="20" fill="#F1BF00" />
        </>
      );
    case "en":
    default:
      return (
        <>
          <Rect width="60" height="40" fill="#012169" />
          <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
          <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
          <Path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
          <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
        </>
      );
  }
}

function Flag({
  code,
  width,
  radius = 8,
}: {
  code: LangCode;
  width: number;
  radius?: number;
}) {
  const height = (width * 2) / 3;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: BORDER,
      }}
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 60 40"
        preserveAspectRatio="none"
      >
        <FlagArt code={code} />
      </Svg>
    </View>
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    movement,
    setMovement,
    setOnboardingDone,
    setAcceptedLegal,
    acceptedLegal,
    onboardingDone,
  } = useStore();
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [pages, setPages] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { t, i18n } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const prevSetupRef = useRef<SetupStatus | null>(null);
  const acceptedLegalRef = useRef(acceptedLegal);
  const onboardingDoneRef = useRef(onboardingDone);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const status = await fetchSetupStatus();
      if (!alive) return;
      const prev = prevSetupRef.current;
      if (prev) {
        const newlyDone = SETUP_STEPS.some(
          (s) => status[s.key] && !prev[s.key],
        );
        if (newlyDone) lightHaptic();
      }
      prevSetupRef.current = status;
      setSetup(status);
    };
    check().then(() => {
      if (!alive || !prevSetupRef.current) return;
      const s = prevSetupRef.current;
      const allDone =
        s.developer && s.mockApp && s.location && s.locationServices;
      const next = allDone ? [0, 2, 3, 4] : [0, 1, 2, 3, 4];
      setPages(next);
      // Those who have already completed onboarding but not yet agreed
      // land directly on the consent page.
      if (!acceptedLegalRef.current && onboardingDoneRef.current) {
        const last = next.length - 1;
        setIndex(last);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ x: last * width, animated: false });
        });
      }
    });
    const id = setInterval(check, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const finish = () => {
    setAcceptedLegal(true);
    setOnboardingDone(true);
    router.replace("/?onboard=1");
  };

  // Skip jumps only to the legal terms, but does not end
  // onboarding – consent is still required.
  const skip = () => {
    if (pages && pages.length) goTo(pages.length - 1);
  };

  const acceptedAll = acceptedPrivacy && acceptedTerms;

  const isLast = index === (pages?.length ?? 1) - 1;
  const setupReady =
    !!setup &&
    setup.developer &&
    setup.mockApp &&
    setup.location &&
    setup.locationServices;

  const renderPage = (p: number, i: number) => {
    const next = () => goTo(i + 1);
    switch (p) {
      case 0:
        return (
          <View style={styles.page}>
            <IntroMapArt />
            <View style={styles.pageBody}>
              <Text style={styles.title}>{t("onboarding_intro_title")}</Text>
            </View>
            <View style={styles.pageFooter}>
              <View />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={next}
                style={styles.roundNext}
              >
                <ArrowRight size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.page}>
            <View style={styles.pageBody}>
              <Text style={styles.title}>{t("onboarding_setup_title")}</Text>
              <Text style={styles.subtitle}>
                {t("onboarding_setup_subtitle")}
              </Text>
              <View style={styles.steps}>
                {SETUP_STEPS.map((step, i) => {
                  const done = !!setup?.[step.key];
                  return (
                    <View
                      key={step.key}
                      style={[styles.stepRow, done && styles.stepRowDone]}
                    >
                      <View
                        style={[styles.stepIndex, done && styles.stepIndexDone]}
                      >
                        {done ? (
                          <Check size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.stepIndexText}>{i + 1}</Text>
                        )}
                      </View>
                      <Text style={styles.stepLabel}>{t(step.labelKey)}</Text>
                      {!done ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            lightHaptic();
                            step.action().then(() => {
                              if (step.key === "location")
                                fetchSetupStatus().then((s) => {
                                  prevSetupRef.current = s;
                                  setSetup(s);
                                });
                            });
                          }}
                          style={styles.stepButton}
                        >
                          <Text style={styles.stepButtonText}>
                            {t(step.actionKey)}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setHelpOpen(true)}
                style={styles.helpLink}
              >
                <Text style={styles.helpLinkText}>
                  {t("onboarding_build_number_help")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pageFooter}>
              {!setupReady ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={next}
                  style={styles.textLink}
                >
                  <Text style={styles.textLinkLabel}>
                    {t("onboarding_continue_anyway")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                activeOpacity={setupReady ? 0.85 : 1}
                disabled={!setupReady}
                onPress={next}
                style={[styles.squareNext, !setupReady && styles.nextDisabled]}
              >
                <Text
                  style={[
                    styles.nextText,
                    !setupReady && styles.nextTextDisabled,
                  ]}
                >
                  {t("common_next")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.page}>
            <View style={styles.pageBody}>
              <Text style={styles.title}>{t("onboarding_movement_title")}</Text>
              <View style={styles.tiles}>
                {MOVEMENTS.map((m, i) => {
                  const active = movement === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      activeOpacity={0.85}
                      onPress={() => {
                        setMovement(m.key);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                      style={[
                        styles.tile,
                        i === 0 && styles.tileSquare,
                        i === 1 && styles.tileRound,
                        i === 2 && styles.tilePill,
                        active && styles.tileActive,
                      ]}
                    >
                      <View style={styles.tileArt}>
                        {m.key === "walk" ? (
                          <WalkArt />
                        ) : m.key === "drive" ? (
                          <CarArt />
                        ) : (
                          <FreeArt />
                        )}
                      </View>
                      <View style={styles.tileFooter}>
                        {m.key === "walk" ? (
                          <Footprints
                            size={18}
                            color={active ? ACCENT : TEXT_DIM}
                          />
                        ) : m.key === "drive" ? (
                          <Car size={18} color={active ? ACCENT : TEXT_DIM} />
                        ) : (
                          <Move size={18} color={active ? ACCENT : TEXT_DIM} />
                        )}
                        <Text
                          style={[styles.tileLabel, active && { color: TEXT }]}
                        >
                          {t(m.labelKey)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.subtitle}>
                {t("onboarding_movement_subtitle")}
              </Text>
            </View>
            <View style={styles.pageFooter}>
              <View />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={next}
                style={styles.textLink}
              >
                <Text style={styles.textLinkLabel}>{t("common_next")}</Text>
                <ArrowRight size={16} color={ACCENT} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: {
        const current = (i18n.language ?? "en").split("-")[0] as LangCode;
        return (
          <View style={styles.page}>
            <View style={styles.pageBody}>
              <View style={styles.langHero}>
                <Animated.View key={current} entering={FadeIn.duration(250)}>
                  <Flag code={current} width={180} radius={14} />
                </Animated.View>
              </View>
              <Text style={[styles.title, { textAlign: "center" }]}>
                {t("onboarding_language_title")}
              </Text>
              <Text style={[styles.subtitle, { textAlign: "center" }]}>
                {t("onboarding_language_subtitle")}
              </Text>
            </View>

            <View style={styles.langList}>
              {LANGUAGES.map((l) => {
                const active = current === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    activeOpacity={0.85}
                    onPress={() => {
                      changeLanguage(l.code);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    style={[styles.langRow, active && styles.langRowActive]}
                  >
                    <Flag code={l.code} width={36} radius={5} />
                    <Text style={[styles.langLabel, active && { color: TEXT }]}>
                      {l.label}
                    </Text>
                    {active ? <Check size={18} color={ACCENT} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.pageFooter}>
              <View />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={next}
                style={styles.textLink}
              >
                <Text style={styles.textLinkLabel}>{t("common_next")}</Text>
                <ArrowRight size={16} color={ACCENT} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      default:
        return (
          <View style={styles.page}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.legalScroll}
            >
              <Text style={styles.title}>{t("onboarding_legal_title")}</Text>

              <Text style={styles.legalLead}>{t("onboarding_legal_lead")}</Text>

              <Text style={styles.legalHeading}>
                {t("onboarding_legal_allowed_title")}
              </Text>
              <View style={styles.legalList}>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_allowed_1")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_allowed_2")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_allowed_3")}
                </Text>
              </View>

              <Text style={styles.legalHeading}>
                {t("onboarding_legal_forbidden_title")}
              </Text>
              <View style={styles.legalList}>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_1")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_2")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_3")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_4")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_5")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_6")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_7")}
                </Text>
                <Text style={styles.legalItem}>
                  • {t("onboarding_legal_forbidden_8")}
                </Text>
              </View>

              <Text style={styles.legalLead}>
                {t("onboarding_legal_responsibility")}
              </Text>

              <Text style={styles.legalLead}>
                {t("onboarding_legal_third_party")}
              </Text>
            </ScrollView>
            <View style={styles.legalFooter}>
              <LegalCheckRow
                checked={acceptedPrivacy}
                onToggle={() => {
                  setAcceptedPrivacy((v) => !v);
                  lightHaptic();
                }}
                prefix={t("onboarding_legal_check_prefix")}
                linkLabel={t("legal_privacy_title")}
                onLink={() => router.push("/settings/legal/privacy")}
                suffix={t("onboarding_legal_privacy_suffix")}
              />
              <LegalCheckRow
                checked={acceptedTerms}
                onToggle={() => {
                  setAcceptedTerms((v) => !v);
                  lightHaptic();
                }}
                prefix={t("onboarding_legal_check_prefix")}
                linkLabel={t("legal_terms_title")}
                onLink={() => router.push("/settings/legal/terms_of_use")}
                suffix={t("onboarding_legal_terms_suffix")}
              />
            </View>
            <View style={styles.pageFooter}>
              <View />
              <TouchableOpacity
                activeOpacity={acceptedAll ? 0.85 : 1}
                disabled={!acceptedAll}
                onPress={finish}
                style={[styles.pillNext, !acceptedAll && styles.nextDisabled]}
              >
                <Text
                  style={[
                    styles.nextText,
                    !acceptedAll && styles.nextTextDisabled,
                  ]}
                >
                  {t("onboarding_accept_start")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.root}>
      {!isLast ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={skip}
          style={[styles.skip, { top: insets.top + spacingSafe }]}
        >
          <Text style={styles.skipText}>{t("common_skip")}</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        contentOffset={{ x: 0, y: 0 }}
        style={styles.pager}
      >
        {(pages ?? []).map((p, i) => (
          <View key={`${p}-${i}`} style={{ width, flex: 1 }}>
            {renderPage(p, i)}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={helpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.helpBackdrop}
          onPress={() => setHelpOpen(false)}
        >
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>{t("onboarding_build_number")}</Text>
            <BuildHelpVisual />
            <Text style={styles.helpText}>
              {t("onboarding_build_number_help_text")}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setHelpOpen(false)}
              style={styles.helpClose}
            >
              <Text style={styles.helpCloseText}>{t("common_got_it")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const spacingSafe = 8;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  pager: { flex: 1 },
  skip: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: FONT.medium,
    fontSize: 14,
    color: TEXT_DIM,
  },
  page: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 88,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  pageBody: { flex: 1, justifyContent: "center", gap: 14 },
  pageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 28,
    lineHeight: 34,
    color: TEXT,
  },
  subtitle: {
    fontFamily: FONT.regular,
    fontSize: 15,
    color: TEXT_DIM,
  },

  introArt: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  introMarker: {
    position: "absolute",
    top: "38%",
    left: "46%",
  },
  ghostDot: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: ACCENT,
  },

  roundNext: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  squareNext: {
    backgroundColor: ACCENT,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 6,
    alignItems: "center",
  },
  pillNext: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 52,
    borderRadius: 999,
    alignItems: "center",
  },
  nextDisabled: {
    backgroundColor: NAVY_CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  nextText: {
    fontFamily: FONT.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  nextTextDisabled: { color: TEXT_DIM },
  textLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  textLinkLabel: {
    fontFamily: FONT.medium,
    fontSize: 16,
    color: ACCENT,
  },

  steps: { gap: 12, marginTop: 10 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: NAVY_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepRowDone: { opacity: 0.45 },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexDone: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepIndexText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: TEXT_DIM,
  },
  stepLabel: {
    flex: 1,
    fontFamily: FONT.medium,
    fontSize: 15,
    color: TEXT,
  },
  stepButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  stepButtonText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: ACCENT,
  },
  helpLink: { alignSelf: "flex-start", paddingVertical: 6, marginTop: 6 },
  helpLinkText: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: TEXT_DIM,
    textDecorationLine: "underline",
  },

  tiles: { gap: 14, marginVertical: 8 },
  tile: {
    backgroundColor: NAVY_CARD,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: "hidden",
  },
  tileSquare: { borderRadius: 10, marginRight: 44 },
  tileRound: { borderRadius: 28, marginLeft: 32 },
  tilePill: { borderRadius: 999, marginRight: 20, marginLeft: 8 },
  tileActive: {
    borderColor: ACCENT,
    backgroundColor: "#11264F",
  },
  tileArt: { height: 74, justifyContent: "center" },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  tileLabel: {
    fontFamily: FONT.medium,
    fontSize: 15,
    color: TEXT_DIM,
  },

  artBox: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  footprintTrail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footprint: { alignItems: "center" },
  footprintDot: {
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: ACCENT,
    opacity: 0.9,
  },
  carTrack: {
    width: 140,
    height: 40,
    justifyContent: "center",
  },
  car: {
    position: "absolute",
    left: "50%",
    marginLeft: -13,
  },

  legalScroll: { paddingBottom: 12 },
  legalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 8,
  },
  legalLead: {
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_DIM,
    marginTop: 8,
  },
  legalHeading: {
    fontFamily: FONT.bold,
    fontSize: 16,
    color: TEXT,
    marginTop: 18,
    marginBottom: 2,
  },
  legalList: { gap: 8, marginTop: 6 },
  legalItem: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_DIM,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 16,
  },
  checkText: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  checkLink: {
    fontFamily: FONT.medium,
    color: ACCENT,
    textDecorationLine: "underline",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  helpBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 10, 24, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  helpBox: {
    width: "100%",
    backgroundColor: NAVY_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 14,
  },
  helpTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: TEXT,
  },
  helpText: {
    fontFamily: FONT.regular,
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_DIM,
  },
  helpClose: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },
  helpCloseText: {
    fontFamily: FONT.medium,
    fontSize: 14,
    color: "#FFFFFF",
  },
  helpPhone: {
    alignSelf: "center",
    width: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: NAVY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  helpPhoneHeader: {
    height: 6,
    width: 64,
    borderRadius: 3,
    backgroundColor: BORDER,
    alignSelf: "center",
    marginBottom: 6,
  },
  helpPhoneFooter: {
    height: 4,
    width: 90,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: "center",
    marginTop: 4,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  helpRowHighlight: {
    backgroundColor: "rgba(78, 124, 255, 0.14)",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  helpRowText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: TEXT,
  },
  helpTaps: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  helpTapsText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  helpArrow: {
    position: "absolute",
    right: -22,
    top: "48%",
  },
  langHero: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  langList: { gap: 10, marginTop: 16 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: NAVY_CARD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  langRowActive: {
    borderColor: ACCENT,
    backgroundColor: "#11264F",
  },
  langLabel: {
    flex: 1,
    fontFamily: FONT.medium,
    fontSize: 16,
    color: TEXT_DIM,
  },
});
