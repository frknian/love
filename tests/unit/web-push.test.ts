import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { notificationTypeIsEnabled } from "@/lib/notifications/notification-preferences";
import {
  detectPushAvailability,
  urlBase64ToUint8Array,
  type PushEnvironment,
} from "@/lib/notifications/push-support";

const supportedEnvironment: PushEnvironment = {
  isSecureContext: true,
  isIos: false,
  isStandalone: false,
  hasNotification: true,
  hasServiceWorker: true,
  hasPushManager: true,
  hasShowNotification: true,
};

describe("Web Push support", () => {
  it("requires installation when an iOS web app is still open in Safari", () => {
    expect(
      detectPushAvailability({
        ...supportedEnvironment,
        isIos: true,
        isStandalone: false,
      }),
    ).toBe("requires-install");
  });

  it("supports an installed iOS home screen app", () => {
    expect(
      detectPushAvailability({
        ...supportedEnvironment,
        isIos: true,
        isStandalone: true,
      }),
    ).toBe("supported");
  });

  it("rejects insecure or incomplete browser environments", () => {
    expect(
      detectPushAvailability({
        ...supportedEnvironment,
        isSecureContext: false,
      }),
    ).toBe("insecure");
    expect(
      detectPushAvailability({
        ...supportedEnvironment,
        hasPushManager: false,
      }),
    ).toBe("unsupported");
  });

  it("decodes a URL-safe VAPID public key", () => {
    expect(new TextDecoder().decode(urlBase64ToUint8Array("SGVsbG8"))).toBe(
      "Hello",
    );
  });

  it("respects granular notification preferences", () => {
    expect(notificationTypeIsEnabled("miss_you", { miss_you: false })).toBe(
      false,
    );
    expect(notificationTypeIsEnabled("unknown", {})).toBe(true);
  });

  it("always turns a service-worker push event into a visible notification", () => {
    const serviceWorker = readFileSync("public/sw.js", "utf8");
    expect(serviceWorker).toContain('addEventListener("push"');
    expect(serviceWorker).toContain("showNotification");
    expect(serviceWorker).toContain("event.waitUntil");
  });
});
