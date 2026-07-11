import { describe, expect, it } from "vitest";

import { getRemaining, sortCountdowns } from "@/lib/countdowns/countdown-math";

describe("countdown helpers", () => {
  it("calculates remaining time without timezone drift", () => {
    const remaining = getRemaining(
      "2027-01-02T01:02:03.000Z",
      new Date("2027-01-01T00:00:00.000Z"),
    );
    expect(remaining).toMatchObject({
      days: 1,
      hours: 1,
      minutes: 2,
      seconds: 3,
      isPast: false,
    });
  });
  it("places elapsed countdowns last", () => {
    const items = [
      { id: "past", targetDate: "2026-01-01T00:00:00.000Z" },
      { id: "future", targetDate: "2027-01-01T00:00:00.000Z" },
    ] as never[];
    expect(
      sortCountdowns(items, new Date("2026-07-11T00:00:00.000Z")).map(
        (item) => item.id,
      ),
    ).toEqual(["future", "past"]);
  });
});
