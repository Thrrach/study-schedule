import { hasTimeOverlap, isValidTime, normalizeInterval, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { normalizeClass, safeDays, subjectsShareDay } from "@/lib/subject-utils";
import { uid } from "@/lib/utils";
import type { ClassItem, TimetableSettings, WeekDay } from "@/types/timetable";

/** คำนวณระยะห่างระหว่างเวลาสองค่าเป็นนาที */
export function timeDiff(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

/** เพิ่มจำนวนนาทีให้เวลา HH:mm แล้วคืนผลลัพธ์ในรูปแบบเดิม */
export function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60)
    .toString()
    .padStart(2, "0")}`;
}

/** ย้ายวันเรียนเดิมไปยังวันเป้าหมาย หรือเพิ่มวันเป้าหมายให้รายวิชา */
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

/** แปลงค่าใด ๆ เป็นข้อความ โดยคืนค่าเริ่มต้นเมื่อไม่มีค่า */
function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/** ตรวจสอบว่าค่าเป็น object ที่เข้าถึงฟิลด์ได้ */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** คืนค่าเวลาเมื่อมีรูปแบบถูกต้อง มิฉะนั้นใช้ค่าเริ่มต้น */
function normalizeTime(value: unknown, fallback: string) {
  return typeof value === "string" && isValidTime(value) ? value : fallback;
}

/** ทำความสะอาดการตั้งค่าตารางและใช้ค่าตั้งต้นเมื่อข้อมูลไม่ถูกต้อง */
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
  /** สร้างรายวิชาใหม่พร้อมรหัสและเวลาสร้างที่ไม่ซ้ำกัน */
  createClass(item: Omit<ClassItem, "id" | "createdAt" | "updatedAt">): ClassItem {
    const timestamp = Date.now();
    return {
      ...normalizeClass(item),
      id: uid(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  /** อัปเดตรายวิชาโดยคงรหัสและเวลาเริ่มสร้างเดิมไว้ */
  updateClass(existingItem: ClassItem, updates: Omit<ClassItem, "id" | "createdAt" | "updatedAt">): ClassItem {
    return {
      ...normalizeClass({ ...existingItem, ...updates }),
      id: existingItem.id,
      updatedAt: Date.now()
    };
  },

  /** ทำสำเนารายวิชาและกำหนดรหัสกับเวลาบันทึกใหม่ */
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

  /** ย้ายรายวิชาไปยังวันและเวลาใหม่โดยคงระยะเวลาของคาบเดิม */
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

  /** ค้นหารายวิชาที่วันและเวลาทับซ้อนกับข้อมูลที่กำลังตรวจสอบ */
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
