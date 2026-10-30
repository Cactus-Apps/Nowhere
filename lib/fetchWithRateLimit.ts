const MIN_INTERVAL_MS = 1000;

const hostNextSlot = new Map<string, number>();

function hostOf(input: Parameters<typeof fetch>[0]): string | null {
  try {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    return new URL(url).host;
  } catch {
    return null;
  }
}

function delay(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function waitForSlot(host: string, signal?: AbortSignal | null) {
  const now = Date.now();
  const slot = Math.max(now, hostNextSlot.get(host) ?? 0);
  hostNextSlot.set(host, slot + MIN_INTERVAL_MS);

  const wait = slot - now;
  if (wait > 0) await delay(wait, signal);
}

export async function fetchWithRateLimit(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
) {
  const host = hostOf(input);
  if (!host) return fetch(input, init);

  await waitForSlot(host, init?.signal);
  return fetch(input, init);
}
