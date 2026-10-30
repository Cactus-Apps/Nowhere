import * as Updates from "expo-updates";

export type OtaUpdateCheckResult = {
  supported: boolean;
  available: boolean;
  updateId?: string | null;
  reason?: string;
  error?: string;
};

export type OtaUpdateApplyResult =
  | "restarted"
  | "not-available"
  | "unsupported"
  | "failed";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isOtaUpdateSupported() {
  return Updates.isEnabled;
}

export async function checkForOtaUpdate(): Promise<OtaUpdateCheckResult> {
  if (!Updates.isEnabled) {
    return { supported: false, available: false };
  }

  try {
    const result = await Updates.checkForUpdateAsync();

    if (result.isAvailable) {
      return {
        supported: true,
        available: true,
        updateId: result.manifest.id,
      };
    }

    if (result.isRollBackToEmbedded) {
      return { supported: true, available: true, reason: "rollback" };
    }

    return { supported: true, available: false, reason: result.reason };
  } catch (error) {
    return { supported: true, available: false, error: errorMessage(error) };
  }
}

export async function downloadOtaUpdate() {
  if (!Updates.isEnabled) return false;

  try {
    const fetched = await Updates.fetchUpdateAsync();
    return fetched.isNew || fetched.isRollBackToEmbedded;
  } catch {
    return false;
  }
}

export async function downloadAndReloadOtaUpdate(): Promise<OtaUpdateApplyResult> {
  if (!Updates.isEnabled) return "unsupported";

  try {
    const check = await Updates.checkForUpdateAsync();

    if (!check.isAvailable && !check.isRollBackToEmbedded) {
      return "not-available";
    }

    const fetched = await Updates.fetchUpdateAsync();

    if (fetched.isNew || fetched.isRollBackToEmbedded) {
      await Updates.reloadAsync();
      return "restarted";
    }

    return "not-available";
  } catch {
    return "failed";
  }
}
