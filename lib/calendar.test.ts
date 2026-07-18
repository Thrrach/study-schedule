import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/calendar";
import type { ClassItem } from "@/types/timetable";

const subject: ClassItem = {
  id: "subject-1",
  courseCode: "344-211",
  courseName: "Database Systems",
  section: "01",
  instructor: "Teacher",
  room: "LRC 205",
  days: ["Monday", "Saturday"],
  startTime: "08:00",
  endTime: "09:50",
  color: "#0f766e",
  credits: 3,
  classType: "lecture",
  status: "enrolled",
  onlineUrl: "https://example.com/class",
  midtermDate: "2026-08-22",
  finalDate: "2026-10-17",
  createdAt: 1,
  updatedAt: 1
};

describe("buildIcs", () => {
  it("limits recurrence to the semester and includes excluded and make-up dates", () => {
    const ics = buildIcs([subject], {
      semesterStartDate: "2026-08-03",
      semesterEndDate: "2026-11-15",
      excludedDates: ["2026-08-10"],
      makeupDays: [{ date: "2026-08-16", followsDay: "Monday" }],
      now: new Date("2026-07-18T00:00:00.000Z")
    });

    expect(ics).toContain("DTSTART;TZID=Asia/Bangkok:20260803T080000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,SA;UNTIL=20261115T165959Z");
    expect(ics).toContain("EXDATE;TZID=Asia/Bangkok:20260810T080000");
    expect(ics).toContain("RDATE;TZID=Asia/Bangkok:20260816T080000");
    expect(ics).toContain("Online: https://example.com/class");
  });

  it("exports midterm and final exams as all-day events", () => {
    const ics = buildIcs([subject], { semesterStartDate: "2026-08-03", semesterEndDate: "2026-11-15" });
    expect(ics).toContain("DTSTART;VALUE=DATE:20260822");
    expect(ics).toContain("SUMMARY:Midterm exam: 344-211 Database Systems");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261017");
    expect(ics).toContain("SUMMARY:Final exam: 344-211 Database Systems");
  });

  it("uses a finite 16-week fallback when semester dates are missing", () => {
    const ics = buildIcs([subject], { now: new Date(2026, 6, 18) });
    expect(ics).toMatch(/RRULE:FREQ=WEEKLY;BYDAY=MO,SA;UNTIL=\d{8}T165959Z/);
  });
});
