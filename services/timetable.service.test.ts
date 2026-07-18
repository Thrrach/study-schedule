import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/data/sample-data";
import { normalizeSettings, timetableService } from "@/services/timetable.service";
import type { ClassItem } from "@/types/timetable";

const item: ClassItem = {
  id: "one", courseCode: "A", courseName: "A", section: "01", instructor: "", room: "", days: ["Saturday"],
  startTime: "08:00", endTime: "09:00", color: "#000000", createdAt: 1, updatedAt: 1
};

describe("timetable service", () => {
  it("normalizes semester calendar and visible weekend settings", () => {
    const settings = normalizeSettings({
      ...defaultSettings,
      semesterStartDate: "2026-08-03",
      semesterEndDate: "2026-11-15",
      excludedDates: ["bad", "2026-08-12", "2026-08-12"],
      makeupDays: [{ date: "2026-08-16", followsDay: "Monday" }, { date: "bad", followsDay: "Friday" }],
      visibleDays: ["Monday", "Saturday", "Sunday"]
    }, defaultSettings);
    expect(settings.excludedDates).toEqual(["2026-08-12"]);
    expect(settings.makeupDays).toEqual([{ date: "2026-08-16", followsDay: "Monday" }]);
    expect(settings.visibleDays).toEqual(["Monday", "Saturday", "Sunday"]);
  });

  it("detects overlaps on weekends", () => {
    const overlaps = timetableService.findOverlaps([item], { ...item, days: ["Saturday"], startTime: "08:30", endTime: "09:30" });
    expect(overlaps.map((entry) => entry.id)).toEqual(["one"]);
  });

  it("moves a class while preserving its duration", () => {
    const moved = timetableService.moveClass(item, "Sunday", "10:00", "Saturday");
    expect(moved.days).toEqual(["Sunday"]);
    expect(moved.endTime).toBe("11:00");
  });
});
