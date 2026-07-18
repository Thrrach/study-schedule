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
  Saturday: "Saturday",
  saturday: "Saturday",
  sat: "Saturday",
  Sunday: "Sunday",
  sunday: "Sunday",
  sun: "Sunday",
  "จันทร์": "Monday",
  "อังคาร": "Tuesday",
  "พุธ": "Wednesday",
  "พฤหัสบดี": "Thursday",
  "ศุกร์": "Friday",
  "เสาร์": "Saturday",
  "อาทิตย์": "Sunday"
};

export type RawClassItem = Partial<ClassItem> & {
  day?: unknown;
  days?: unknown;
};

/** แปลงชื่อวันหรือคำย่อที่รองรับเป็นชนิด Day มาตรฐาน */
export function normalizeDay(value: unknown): Day | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return dayAliases[normalized] ?? dayAliases[normalized.toLowerCase()] ?? null;
}

/** คืนเฉพาะวันเรียนที่ถูกต้องและไม่ซ้ำจากข้อมูลนำเข้า */
export function safeDays(value: unknown): Day[] {
  if (!Array.isArray(value)) return [];
  const days = value.map(normalizeDay).filter((day): day is Day => Boolean(day));
  return Array.from(new Set(days));
}

/** แปลงข้อมูลรายวิชาที่อาจไม่สมบูรณ์ให้เป็น ClassItem ที่ปลอดภัยต่อการใช้งาน */
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
    credits: normalizeCredits(source.credits),
    classType: normalizeClassType(source.classType),
    status: normalizeStatus(source.status),
    onlineUrl: normalizeUrl(source.onlineUrl),
    midtermDate: normalizeDate(source.midtermDate),
    finalDate: normalizeDate(source.finalDate),
    createdAt: timestampValue(source.createdAt, timestamp),
    updatedAt: timestampValue(source.updatedAt, timestamp)
  };
}

/** แปลงและรวมรายการรายวิชา โดยตัดข้อมูลซ้ำที่มีรหัสเดียวกัน */
export function normalizeClasses(rawClasses: unknown): ClassItem[] {
  if (!Array.isArray(rawClasses)) return [];
  return dedupeClasses(rawClasses.map((item) => normalizeClass(item)));
}

/** ตรวจสอบว่ารายวิชาสองรายการมีวันเรียนร่วมกันอย่างน้อยหนึ่งวันหรือไม่ */
export function subjectsShareDay(first: Pick<ClassItem, "days">, second: Pick<ClassItem, "days">) {
  const firstDays = safeDays(first.days);
  const secondDays = safeDays(second.days);
  return firstDays.some((day) => secondDays.includes(day));
}

/** เพิ่มวันเรียนให้รายการเดิมเมื่อวันนั้นยังไม่มีอยู่ */
export function withAddedDay(days: unknown, day: WeekDay) {
  const currentDays = safeDays(days);
  return currentDays.includes(day) ? currentDays : [...currentDays, day];
}

/** รวมรายวิชาที่มี id เดียวกัน พร้อมรักษาวันเรียนและเวลาแก้ไขล่าสุด */
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

/** ตรวจสอบว่าค่าเป็น object ที่ใช้เข้าถึงฟิลด์ได้หรือไม่ */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** แปลงค่าใด ๆ เป็นข้อความ โดยใช้ค่าเริ่มต้นเมื่อไม่มีค่า */
function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/** แปลงค่าเป็น Unix timestamp ที่ใช้ได้ หรือคืนค่าเริ่มต้น */
function timestampValue(value: unknown, fallback: number) {
  const timestamp = typeof value === "number" ? value : Number(value);
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

/** คืนค่าเวลาเมื่ออยู่ในรูปแบบที่ถูกต้อง มิฉะนั้นคืนค่าเริ่มต้น */
function normalizeTime(value: unknown, fallback: string) {
  return typeof value === "string" && isValidTime(value) ? value : fallback;
}

/** รับประกันว่าเวลาสิ้นสุดอยู่หลังเวลาเริ่ม พร้อมกำหนดคาบเริ่มต้น 50 นาที */
function normalizeEndTime(value: unknown, startTime: string) {
  const fallbackEnd = minutesToTime(Math.min(23 * 60 + 59, timeToMinutes(startTime) + 50));
  const endTime = normalizeTime(value, fallbackEnd);
  return timeToMinutes(endTime) > timeToMinutes(startTime) ? endTime : fallbackEnd;
}

/** ตรวจสอบและคืนค่าสี hexadecimal 6 หลัก หรือใช้สีฟ้าเริ่มต้น */
function normalizeColor(value: unknown) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#38bdf8";
}

function normalizeCredits(value: unknown) {
  const credits = Number(value);
  return Number.isFinite(credits) && credits >= 0 && credits <= 30 ? credits : 0;
}

function normalizeClassType(value: unknown): ClassItem["classType"] {
  return value === "lab" || value === "tutorial" || value === "online" || value === "other" ? value : "lecture";
}

function normalizeStatus(value: unknown): ClassItem["status"] {
  return value === "enrolled" || value === "waitlisted" ? value : "planned";
}

function normalizeDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
