import AnnouncementModal from "@/components/modals/announcementModal";
import { GITHUB_RELEASES_URL, markAnnouncementSeen } from "@/lib/announcements";
import { useStore } from "@/lib/storage/store";
import {
  checkForStartupPrompt,
  getStartupPromptView,
  type StartupPrompt,
} from "@/lib/updates/startupPrompts";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Linking } from "react-native";

const PROMPT_CHECK_INTERVAL_MS = 60_000;

function promptKey(prompt: StartupPrompt) {
  if (prompt.kind === "announcement") {
    return `announcement:${prompt.announcement.id}`;
  }
  return `ota:${prompt.update.updateId ?? prompt.update.reason ?? "available"}`;
}

export default function AnnouncementModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { _hydrated: hydrated, onboardingDone, acceptedLegal } = useStore();
  const [prompt, setPrompt] = useState<StartupPrompt | null>(null);
  const promptRef = useRef<StartupPrompt | null>(null);
  const handledPromptKeys = useRef(new Set<string>());
  promptRef.current = prompt;

  useEffect(() => {
    if (!hydrated || !onboardingDone || !acceptedLegal) return;

    let active = true;

    const check = async () => {
      if (!active || promptRef.current) return;
      if (AppState.currentState !== "active") return;

      try {
        const next = await checkForStartupPrompt();
        if (!active || !next || promptRef.current) return;
        if (handledPromptKeys.current.has(promptKey(next))) return;
        setPrompt(next);
      } catch {}
    };

    check();
    const interval = setInterval(check, PROMPT_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [hydrated, onboardingDone, acceptedLegal]);

  const dismissPrompt = useCallback(async () => {
    if (!prompt) return;
    handledPromptKeys.current.add(promptKey(prompt));
    if (prompt.kind === "announcement") {
      await markAnnouncementSeen(prompt.announcement.id);
    }
    setPrompt(null);
  }, [prompt]);

  const handlePromptPrimary = useCallback(async () => {
    if (
      !prompt ||
      prompt.kind !== "announcement" ||
      !prompt.announcement.is_store_update
    ) {
      return;
    }
    handledPromptKeys.current.add(promptKey(prompt));
    await markAnnouncementSeen(prompt.announcement.id);
    setPrompt(null);
    Linking.openURL(GITHUB_RELEASES_URL).catch(() => {});
  }, [prompt]);

  const promptView = getStartupPromptView(prompt);

  return (
    <>
      {children}
      <AnnouncementModal
        visible={!!promptView}
        title={promptView?.title ?? ""}
        message={promptView?.message ?? ""}
        type={promptView?.type}
        mediaUrl={promptView?.mediaUrl}
        primaryLabel={promptView?.primaryLabel}
        onPrimary={promptView?.primaryLabel ? handlePromptPrimary : undefined}
        onClose={dismissPrompt}
      />
    </>
  );
}
