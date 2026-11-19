import { describe, expect, it, vi, beforeEach } from "vitest";

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

import { trackSupportPathShown } from "../analytics";

describe("support_path_shown never reveals a crisis", () => {
  beforeEach(() => track.mockReset());

  it("sends path, alternative count and confidence only", () => {
    trackSupportPathShown("therapy-counseling", 2, "clear-path");
    expect(track).toHaveBeenCalledWith("support_path_shown", { pathId: "therapy-counseling", alternativeCount: 2, confidence: "clear" });
    expect(Object.keys(track.mock.calls[0][1])).not.toContain("hadCrisisSignal");
  });

  it("sends nothing when the path shown is crisis support", () => {
    trackSupportPathShown("crisis-support", 0, "clear-path");
    expect(track).not.toHaveBeenCalled();
  });
});

describe("no patient-support event reveals the urgency answer or a crisis", () => {
  beforeEach(() => track.mockReset());

  it("urgency completion carries no answer", async () => {
    const { trackUrgencyCompleted } = await import("../analytics");
    trackUrgencyCompleted();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][1] ?? {}).toEqual({});
  });

  it("crisis-shown is not sent, and crisis values are dropped from any event", async () => {
    const { trackCrisisShown, trackSupportJourneyCompleted } = await import("../analytics");
    trackCrisisShown("selection");
    trackSupportJourneyCompleted(3, "crisis-support");
    expect(track).not.toHaveBeenCalled();
    trackSupportJourneyCompleted(3, "therapy-counseling");
    expect(track).toHaveBeenCalledTimes(1);
  });
});
