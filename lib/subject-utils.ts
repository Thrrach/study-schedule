import { uid } from "@/lib/utils";
import type { ClassItem, Day, WeekDay } from "@/types/timetable";

const dayAliases: Record<string, Day> = {
  Monday: "Monday",
  monday: "Monday",
  mon: "Monday",
  Tuesday: "Tuesday",
  tuesday: "Tuesday",
  tue: "Tuesday",
  Wednesday: "Wednesday",
  wednesday: "Wednesday",
  wed: "Wednesday",
  Thursday: "Thursday",
  thursday: "Thursday",
  thu: "Thursday",
  Friday: "Friday",
  friday: "Friday",
  fri: "Friday"
};

export type RawClassItem = Partial<ClassItem> & {
  day?: unknown;
  days?: unknown;
};

export function normalizeDay(value: unknown): Day | null {
  if (typeof value !== "string") return null;
  return dayAliases[value] ?? null;
}

export function safeDays(value: unknown): Day[] {
  if (!Array.isArray(value)) return [];
  const days = value.map(normalizeDay).filter((day): day is Day => Boolean(day));
  return Array.from(new Set(days));
}

export function normalizeClass(raw: RawClassItem): ClassItem {
  const timestamp = Date.now();
  const normalizedDays = safeDays(raw.days);
  const legacyDay = normalizeDay(raw.day);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    courseCode: raw.courseCode ?? "",
    courseName: raw.courseName ?? "",
    section: raw.section ?? "",
    instructor: raw.instructor ?? "",
    room: raw.room ?? "",
    days: normalizedDays.length ? normalizedDays : legacyDay ? [legacyDay] : [],
    startTime: raw.startTime ?? "08:00",
    endTime: raw.endTime ?? "09:00",
    color: raw.color ?? "#38bdf8",
    note: raw.note ?? "",
    createdAt: raw.createdAt ?? timestamp,
    updatedAt: raw.updatedAt ?? timestamp
  };
}

export function normalizeClasses(rawClasses: unknown): ClassItem[] {
  if (!Array.isArray(rawClasses)) return [];
  return dedupeClasses(rawClasses.map((item) => normalizeClass(item as RawClassItem)));
}

export function subjectsShareDay(first: Pick<ClassItem, "days">, second: Pick<ClassItem, "days">) {
  const firstDays = safeDays(first.days);
  const secondDays = safeDays(second.days);
  return firstDays.some((day) => secondDays.includes(day));
}

export function withAddedDay(days: unknown, day: WeekDay) {
  const currentDays = safeDays(days);
  return currentDays.includes(day) ? currentDays : [...currentDays, day];
}

function dedupeClasses(classes: ClassItem[]) {
  const byId = new Map<string, ClassItem>();

  classes.forEach((item) => {
    const normalized = { ...item, days: safeDays(item.days) };
    const existing = byId.get(normalized.id);

    if (existing) {
      byId.set(normalized.id, {
        ...existing,
        ...normalized,
        days: Array.from(new Set([...safeDays(existing.days), ...normalized.days])),
        createdAt: Math.min(existing.createdAt, normalized.createdAt),
        updatedAt: Math.max(existing.updatedAt, normalized.updatedAt)
      });
      return;
    }

    byId.set(normalized.id, normalized);
  });

  const seenDaySlots = new Set<string>();
  const deduped: ClassItem[] = [];

  Array.from(byId.values())
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((item) => {
      const uniqueDays = safeDays(item.days).filter((day) => {
        const key = [
          item.courseCode.trim().toLowerCase(),
          item.section.trim().toLowerCase(),
          day,
          item.startTime,
          item.endTime
        ].join("|");

        if (seenDaySlots.has(key)) return false;
        seenDaySlots.add(key);
        return true;
      });

      if (uniqueDays.length) {
        deduped.push({ ...item, days: uniqueDays });
      }
    });

  return deduped;
}
