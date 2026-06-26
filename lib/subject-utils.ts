import { uid } from "@/lib/utils";
import { isValidTime, minutesToTime, timeToMinutes } from "@/lib/time";
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
  fri: "Friday",
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

export function normalizeClass(raw: unknown): ClassItem {
  const source = isRecord(raw) ? raw : {};
  const timestamp = Date.now();
  const normalizedDays = safeDays(source.days);
  const legacyDay = normalizeDay(source.day);
  const startTime = normalizeTime(source.startTime, "08:00");
  const endTime = normalizeEndTime(source.endTime, startTime);

  return {
    id: stringValue(source.id) || uid(),
    courseCode: stringValue(source.courseCode),
    courseName: stringValue(source.courseName),
    section: stringValue(source.section),
    instructor: stringValue(source.instructor),
    room: stringValue(source.room),
    days: normalizedDays.length ? normalizedDays : legacyDay ? [legacyDay] : [],
    startTime,
    endTime,
    color: normalizeColor(source.color),
    note: stringValue(source.note),
    createdAt: timestampValue(source.createdAt, timestamp),
    updatedAt: timestampValue(source.updatedAt, timestamp)
  };
}

export function normalizeClasses(rawClasses: unknown): ClassItem[] {
  if (!Array.isArray(rawClasses)) return [];
  return dedupeClasses(rawClasses.map((item) => normalizeClass(item)));
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

  return Array.from(byId.values())
    .filter((item) => safeDays(item.days).length)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function timestampValue(value: unknown, fallback: number) {
  const timestamp = typeof value === "number" ? value : Number(value);
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

function normalizeTime(value: unknown, fallback: string) {
  return typeof value === "string" && isValidTime(value) ? value : fallback;
}

function normalizeEndTime(value: unknown, startTime: string) {
  const fallbackEnd = minutesToTime(Math.min(23 * 60 + 59, timeToMinutes(startTime) + 50));
  const endTime = normalizeTime(value, fallbackEnd);
  return timeToMinutes(endTime) > timeToMinutes(startTime) ? endTime : fallbackEnd;
}

function normalizeColor(value: unknown) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#38bdf8";
}
