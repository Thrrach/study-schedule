import { describe, expect, it } from "vitest";
import { useTimetableApi } from "@/api/timetable.api";
import { defaultSettings } from "@/data/sample-data";

describe("schedule plans", () => {
  it("keeps courses independent when creating and switching plans", () => {
    const initial = useTimetableApi.getState();
    const originalPlanId = initial.activePlanId;
    const originalCount = initial.classes.length;

    initial.createPlan("Alternative");
    const alternative = useTimetableApi.getState();
    expect(alternative.classes).toEqual([]);
    expect(alternative.plans).toHaveLength(2);

    alternative.setClasses([{ ...initial.classes[0], id: "alternative-class", days: ["Sunday"] }]);
    useTimetableApi.getState().switchPlan(originalPlanId);
    expect(useTimetableApi.getState().classes).toHaveLength(originalCount);

    const alternativeId = useTimetableApi.getState().plans.find((plan) => plan.name === "Alternative")?.id;
    expect(alternativeId).toBeTruthy();
    useTimetableApi.getState().switchPlan(alternativeId!);
    expect(useTimetableApi.getState().classes[0].days).toEqual(["Sunday"]);

    useTimetableApi.getState().replacePlans([
      { id: "default", name: "ตารางหลัก", classes: initial.classes, settings: defaultSettings, createdAt: 1, updatedAt: 1 }
    ], "default");
  });
});
