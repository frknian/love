export const WEB_PUSH_AUTO_REQUEST_KEY =
  "love:web-push-auto-requested:first-entry:v1";
export const WEB_PUSH_CARD_SHOWN_KEY =
  "love:web-push-permission-card-shown:first-entry:v1";

export function browserPermissionFlagIsSet(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function setBrowserPermissionFlag(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Storage may be disabled in private browsing; the UI can still close.
  }
}

/** Claims a browser prompt once per device/browser for this site. */
export function claimBrowserPermissionPrompt(key: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const storage = window.localStorage;
    if (storage.getItem(key) === "true") return false;
    storage.setItem(key, "true");
    return true;
  } catch {
    // Private browsing or storage restrictions should not block the native
    // permission request; the current page can still make one attempt.
    return true;
  }
}
