import { hasTimeOverlap, isValidTime, normalizeInterval, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { normalizeClass, normalizeClasses, safeDays, subjectsShareDay } from "@/lib/subject-utils";
import { uid } from "@/lib/utils";
import type { ClassItem, TimetableSettings, WeekDay } from "@/types/timetable";

export function timeDiff(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function moveDay(days: unknown, targetDay: WeekDay, sourceDay?: WeekDay) {
  const currentDays = safeDays(days);
  if (!currentDays.length) return [targetDay];

  const movedDays =
    sourceDay && currentDays.includes(sourceDay)
      ? currentDays.map((day) => (day === sourceDay ? targetDay : day))
      : currentDays.includes(targetDay)
        ? currentDays
        : [...currentDays, targetDay];

  return Array.from(new Set(movedDays));
}

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeTime(value: unknown, fallback: string) {
  return typeof value === "string" && isValidTime(value) ? value : fallback;
}

export function normalizeSettings(rawSettings: unknown, fallback: TimetableSettings): TimetableSettings {
  const raw = isRecord(rawSettings) ? rawSettings : {};
  const startTime = normalizeTime(raw.startTime, fallback.startTime);
  const endTime = normalizeTime(raw.endTime, fallback.endTime);
  const hasCustomSlots = Object.prototype.hasOwnProperty.call(raw, "timeSlots");
  const timeSlots = hasCustomSlots ? normalizeTimeSlots(raw.timeSlots) : normalizeTimeSlots(fallback.timeSlots);
  const intervalMinutes = normalizeInterval(raw.intervalMinutes, fallback.intervalMinutes);
  const semester = stringValue(raw.semester, fallback.semester ?? "");
  const studentName = stringValue(raw.studentName, fallback.studentName ?? "");
  const language = raw.language === "en" || raw.language === "th" ? raw.language : (fallback.language ?? "th");

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return {
      ...fallback,
      intervalMinutes,
      timeSlots,
      semester,
      studentName,
      language
    };
  }

  return {
    startTime,
    endTime,
    intervalMinutes,
    timeSlots,
    semester,
    studentName,
    language
  };
}

export const timetableService = {
  createClass(item: Omit<ClassItem, "id" | "createdAt" | "updatedAt">): ClassItem {
    const timestamp = Date.now();
    return {
      ...normalizeClass(item),
      id: uid(), // Not actually setting ID here if it doesn't need to be unique? Wait, addClass in store creates uid implicitly inside normalizeClass? Actually, normalizeClass gives an ID if one isn't present. But let's generate it here just to be explicit.
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  updateClass(existingItem: ClassItem, updates: Omit<ClassItem, "id" | "createdAt" | "updatedAt">): ClassItem {
    return {
      ...normalizeClass({ ...existingItem, ...updates }),
      id: existingItem.id,
      updatedAt: Date.now()
    };
  },

  duplicateClass(source: ClassItem): ClassItem {
    const timestamp = Date.now();
    return {
      ...source,
      id: uid(),
      courseName: source.courseName ? `${source.courseName} (สำเนา)` : "รายวิชาไม่มีชื่อ (สำเนา)",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  moveClass(item: ClassItem, targetDay: WeekDay, targetStartTime: string, sourceDay?: WeekDay): ClassItem {
    const duration = Math.max(10, timeDiff(item.startTime, item.endTime));
    return {
      ...item,
      days: moveDay(item.days, targetDay, sourceDay),
      startTime: targetStartTime,
      endTime: addMinutes(targetStartTime, duration),
      updatedAt: Date.now()
    };
  },

  findOverlaps(
    classes: ClassItem[],
    candidate: Omit<ClassItem, "id" | "createdAt" | "updatedAt">,
    ignoreId?: string
  ): ClassItem[] {
    return classes.filter(
      (item) =>
        item.id !== ignoreId &&
        subjectsShareDay(item, candidate) &&
        hasTimeOverlap(item.startTime, item.endTime, candidate.startTime, candidate.endTime)
    );
  }
};
