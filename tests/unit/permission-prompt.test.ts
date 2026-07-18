import { afterEach, describe, expect, it, vi } from "vitest";

import {
  WEB_PUSH_AUTO_REQUEST_KEY,
  claimBrowserPermissionPrompt,
} from "@/lib/notifications/permission-prompt";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser permission prompt cadence", () => {
  it("claims the notification request only on the first entry", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });

    expect(claimBrowserPermissionPrompt(WEB_PUSH_AUTO_REQUEST_KEY)).toBe(true);
    expect(claimBrowserPermissionPrompt(WEB_PUSH_AUTO_REQUEST_KEY)).toBe(false);
  });
});
