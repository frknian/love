export const WEB_PUSH_AUTO_REQUEST_KEY =
  "love:web-push-auto-requested:first-entry:v1";
export const WEB_PUSH_CARD_SHOWN_KEY =
  "love:web-push-permission-card-shown:first-entry:v1";

const inMemoryFlags = new Set<string>();

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

export function browserPermissionFlagIsSet(key: string): boolean {
  if (typeof window === "undefined") return false;
  if (inMemoryFlags.has(key)) return true;
  try {
    return getBrowserStorage()?.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function setBrowserPermissionFlag(key: string): void {
  if (typeof window === "undefined") return;
  inMemoryFlags.add(key);
  try {
    getBrowserStorage()?.setItem(key, "true");
  } catch {
    // Storage may be disabled in private browsing; the UI can still close.
  }
}

/** Claims a browser prompt once per device/browser for this site. */
export function claimBrowserPermissionPrompt(key: string): boolean {
  if (typeof window === "undefined") return false;
  if (inMemoryFlags.has(key)) return false;

  try {
    const storage = getBrowserStorage();
    if (storage?.getItem(key) === "true") {
      inMemoryFlags.add(key);
      return false;
    }
    inMemoryFlags.add(key);
    storage?.setItem(key, "true");
    return true;
  } catch {
    // Private browsing or storage restrictions should not block the native
    // permission request; the current page can still make one attempt.
    inMemoryFlags.add(key);
    return true;
  }
}
