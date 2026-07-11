import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/security/rate-limit";

describe("rate limiter", () => {
  it("blocks requests over the configured limit", () => {
    expect(checkRateLimit("test-key", 1).allowed).toBe(true);
    expect(checkRateLimit("test-key", 1).allowed).toBe(false);
  });
});
