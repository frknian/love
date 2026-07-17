import { beforeEach, describe, expect, it, vi } from "vitest";

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const upsert = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => ({ upsert }) }),
}));

import { requestAndSaveCurrentLocation } from "@/services/location/location-service";

describe("user-triggered location request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", {
      isSecureContext: true,
      location: { hostname: "love.example" },
    });
  });

  it("starts getCurrentPosition synchronously before saving to Supabase", async () => {
    let succeed: PositionCallback | undefined;
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      succeed = success;
    });
    vi.stubGlobal("navigator", {
      userAgent: "test-browser",
      geolocation: { getCurrentPosition },
    });
    single.mockResolvedValue({
      data: {
        user_id: "user-1",
        couple_id: "couple-1",
        latitude: 41,
        longitude: 29,
        accuracy_meters: 25,
        sharing_enabled: true,
        background_updates_enabled: false,
        share_last_seen: true,
        platform: "web",
        updated_at: "2026-07-17T10:00:00.000Z",
      },
      error: null,
    });

    const request = requestAndSaveCurrentLocation(
      "user-1",
      "couple-1",
      "prompt",
    );

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(upsert).not.toHaveBeenCalled();
    succeed?.({
      coords: {
        latitude: 41,
        longitude: 29,
        accuracy: 25,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.parse("2026-07-17T10:00:00.000Z"),
      toJSON: () => ({}),
    });

    await expect(request).resolves.toMatchObject({ sharing_enabled: true });
    expect(upsert).toHaveBeenCalledOnce();
  });
});
