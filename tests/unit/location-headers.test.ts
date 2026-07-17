import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

describe("location response headers", () => {
  it("allows geolocation for the same origin without opening other sensors", async () => {
    const groups = await nextConfig.headers?.();
    const permissionsPolicy = groups
      ?.flatMap((group) => group.headers)
      .find((header) => header.key === "Permissions-Policy")?.value;

    expect(permissionsPolicy).toContain("geolocation=(self)");
    expect(permissionsPolicy).not.toContain("geolocation=()");
    expect(permissionsPolicy).toContain("camera=()");
    expect(permissionsPolicy).toContain("microphone=()");
  });
});
