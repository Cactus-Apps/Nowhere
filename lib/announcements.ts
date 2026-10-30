import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { fetchWithRateLimit } from "./fetchWithRateLimit";

export type AnnouncementType = "info" | "update" | "important";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  min_app_version: string | null;
  active: boolean | null;
  created_at: string;
  is_store_update: boolean;
  media_url: string | null;
};

const SEEN_STORAGE_KEY = "nowhere-seen-announcements-v1";
const SEEN_MAX = 200;
const TYPE_PRIORITY: Record<AnnouncementType, number> = {
  important: 3,
  update: 2,
  info: 1,
};

const extra = Constants.expoConfig?.extra as
  | {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      githubReleasesUrl?: string;
    }
  | undefined;

function readConfig(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("YOUR_")) return "";
  return trimmed;
}

const SUPABASE_URL = readConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl,
).replace(/\/+$/, "");
const SUPABASE_ANON_KEY = readConfig(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey,
);

export const GITHUB_RELEASES_URL =
  readConfig(process.env.EXPO_PUBLIC_GITHUB_RELEASES_URL) ||
  readConfig(extra?.githubReleasesUrl) ||
  "https://github.com/Cactus-Apps/Nowhere/releases";

export function getAppVersion() {
  return Constants.expoConfig?.version ?? "0.0.0";
}

function versionParts(version: string) {
  return version
    .trim()
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });
}

export function compareVersions(a: string, b: string) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const aPart = left[index] ?? 0;
    const bPart = right[index] ?? 0;
    if (aPart !== bPart) return aPart < bPart ? -1 : 1;
  }

  return 0;
}

export function isAnnouncementEligible(
  announcement: Announcement,
  appVersion = getAppVersion(),
) {
  if (announcement.active === false) return false;
  if (!announcement.min_app_version) return true;
  return compareVersions(appVersion, announcement.min_app_version) >= 0;
}

function normalizeType(value: unknown): AnnouncementType {
  if (value === "update" || value === "important") return value;
  return "info";
}

function normalizeAnnouncement(value: unknown): Announcement | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.message !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: normalizeType(row.type),
    min_app_version:
      typeof row.min_app_version === "string" && row.min_app_version
        ? row.min_app_version
        : null,
    active: typeof row.active === "boolean" ? row.active : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(0).toISOString(),
    is_store_update: row.is_store_update === true,
    media_url:
      typeof row.media_url === "string" && row.media_url ? row.media_url : null,
  };
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const response = await fetchWithRateLimit(
      `${SUPABASE_URL}/rest/v1/announcements?select=*&order=created_at.desc&limit=50`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) return [];

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload
      .map((row) => normalizeAnnouncement(row))
      .filter((row): row is Announcement => row !== null);
  } catch {
    return [];
  }
}

async function readSeenIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function getSeenAnnouncementIds() {
  return readSeenIds();
}

export async function isAnnouncementSeen(id: string) {
  const seen = await readSeenIds();
  return seen.includes(id);
}

export async function markAnnouncementSeen(id: string) {
  try {
    const seen = await readSeenIds();
    if (seen.includes(id)) return;
    const next = [...seen, id].slice(-SEEN_MAX);
    await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export async function clearSeenAnnouncements() {
  try {
    await AsyncStorage.removeItem(SEEN_STORAGE_KEY);
  } catch {}
}

function createdAtTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export async function checkForAnnouncement(
  appVersion = getAppVersion(),
): Promise<Announcement | null> {
  const [announcements, seenIds] = await Promise.all([
    fetchAnnouncements(),
    readSeenIds(),
  ]);
  const seen = new Set(seenIds);

  return (
    announcements
      .filter(
        (announcement) =>
          !seen.has(announcement.id) &&
          isAnnouncementEligible(announcement, appVersion),
      )
      .sort((a, b) => {
        const byDate = createdAtTime(b.created_at) - createdAtTime(a.created_at);
        if (byDate !== 0) return byDate;
        return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
      })[0] ?? null
  );
}
