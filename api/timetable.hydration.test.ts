import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, sampleClasses } from "@/data/sample-data";

describe("timetable store hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("keeps the server defaults for the first client render and restores persisted state on demand", async () => {
    const persistedSettings = { ...defaultSettings, language: "en" as const };
    const persistedPlan = {
      id: "default",
      name: "Persisted plan",
      classes: sampleClasses,
      settings: persistedSettings,
      createdAt: 1,
      updatedAt: 1
    };
    const storedValue = JSON.stringify({
      state: {
        classes: sampleClasses,
        settings: persistedSettings,
        plans: [persistedPlan],
        activePlanId: "default"
      },
      version: 3
    });
    const storage = {
      getItem: vi.fn(() => storedValue),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
    vi.resetModules();

    const { useTimetableApi } = await import("@/api/timetable.api");

    expect(useTimetableApi.getState().settings.language).toBe("th");
    expect(useTimetableApi.getState().hydrated).toBe(false);

    await useTimetableApi.persist.rehydrate();

    expect(useTimetableApi.getState().settings.language).toBe("en");
    expect(useTimetableApi.getState().hydrated).toBe(true);
  });
});
