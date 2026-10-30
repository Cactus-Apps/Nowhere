import {
  checkForAnnouncement,
  type Announcement,
  type AnnouncementType,
} from "../announcements";
import i18n from "../i18n";
import {
  checkForOtaUpdate,
  downloadOtaUpdate,
  type OtaUpdateCheckResult,
} from "./otaUpdates";

export type StartupPrompt =
  | {
      kind: "announcement";
      announcement: Announcement;
    }
  | {
      kind: "ota";
      update: OtaUpdateCheckResult;
    };

export type StartupPromptView = {
  title: string;
  message: string;
  type: AnnouncementType;
  mediaUrl: string | null;
  primaryLabel?: string;
};

export function getStartupPromptView(
  prompt: StartupPrompt | null,
): StartupPromptView | null {
  if (!prompt) return null;

  if (prompt.kind === "ota") {
    return {
      title: i18n.t("update_available_title"),
      message: i18n.t("update_available_message"),
      type: "update",
      mediaUrl: null,
    };
  }

  const { announcement } = prompt;
  return {
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    mediaUrl: announcement.media_url,
    primaryLabel: announcement.is_store_update
      ? i18n.t("update_github_releases")
      : undefined,
  };
}

export async function checkForStartupPrompt(): Promise<StartupPrompt | null> {
  const announcement = await checkForAnnouncement();

  if (announcement) {
    return { kind: "announcement", announcement };
  }

  const update = await checkForOtaUpdate();

  if (update.available) {
    downloadOtaUpdate().catch(() => {});
    return { kind: "ota", update };
  }

  return null;
}
