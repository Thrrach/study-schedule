import type { TimetableSettings } from "@/types/timetable";

/** แปลงเวลา HH:mm เป็นจำนวนนาทีตั้งแต่เที่ยงคืน */
export function timeToMinutes(time: string): number {
  if (!isValidTime(time)) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** แปลงจำนวนนาทีตั้งแต่เที่ยงคืนเป็นเวลาในรูปแบบ HH:mm */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/** สร้างรายการช่วงเวลาแสดงบนตารางจากการตั้งค่า หรือใช้ช่วงเวลาที่ผู้ใช้กำหนดเอง */
export function generateTimeSlots(settings: TimetableSettings): string[] {
  if (settings.timeSlots?.length) {
    return normalizeTimeSlots(settings.timeSlots);
  }

  const start = timeToMinutes(settings.startTime);
  const end = timeToMinutes(settings.endTime);
  const interval = normalizeInterval(settings.intervalMinutes);

  if (end <= start) {
    return isValidTime(settings.startTime) ? [settings.startTime] : [];
  }

  if (interval === 50) {
    return generatePsuStyleSlots(start, end);
  }

  const slots: string[] = [];

  for (let minute = start; minute <= end; minute += interval) {
    slots.push(minutesToTime(minute));
  }

  if (slots[slots.length - 1] !== settings.endTime) {
    slots.push(settings.endTime);
  }

  return slots;
}

/** คัดเฉพาะเวลา HH:mm ที่ถูกต้องและไม่ซ้ำออกจากข้อมูลที่ไม่แน่นอน */
export function normalizeTimeSlots(timeSlots: unknown) {
  if (!Array.isArray(timeSlots)) return [];
  const seen = new Set<string>();
  return timeSlots.filter((time) => {
    if (!isValidTime(time) || seen.has(time)) return false;
    seen.add(time);
    return true;
  });
}

/** ตรวจสอบว่าค่าเวลาอยู่ในรูปแบบ 24 ชั่วโมง HH:mm ที่ใช้งานได้ */
export function isValidTime(time: string) {
  if (typeof time !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/** คืนเวลาสิ้นสุดของช่อง โดยใช้เวลาสิ้นสุดของตารางเมื่อเป็นช่องสุดท้าย */
export function getSlotEnd(slots: string[], index: number, fallbackEndTime: string) {
  return slots[index + 1] ?? fallbackEndTime;
}

/** สร้างสเกลเวลาย่อยภายในช่วงเวลาของตารางสำหรับวางองค์ประกอบบน grid */
export function buildInternalTimeScale(slots: string[], fallbackStart: string, fallbackEnd: string, stepMinutes = 10) {
  const normalized = normalizeTimeSlots(slots);
  const start = timeToMinutes(normalized[0] ?? fallbackStart);
  const end = timeToMinutes(normalized[normalized.length - 1] ?? fallbackEnd);
  const scale: string[] = [];

  for (let minute = start; minute <= end; minute += stepMinutes) {
    scale.push(minutesToTime(minute));
  }

  if (scale[scale.length - 1] !== minutesToTime(end)) {
    scale.push(minutesToTime(end));
  }

  return scale;
}

/** แปลงเวลาเป็นหมายเลขเส้นบน CSS grid ตามจุดเริ่มต้นและขนาดช่วงเวลา */
export function timeToGridLine(time: string, scaleStart: string, stepMinutes = 10) {
  return Math.max(1, Math.round((timeToMinutes(time) - timeToMinutes(scaleStart)) / stepMinutes) + 1);
}

/** สร้างป้ายกำกับเวลาเป็นรายชั่วโมง รวมเวลาเริ่มและสิ้นสุดของตาราง */
export function buildHourLabels(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const labels: string[] = [];

  if (end <= start) return labels;

  labels.push(startTime);
  for (let minute = Math.ceil(start / 60) * 60; minute < end; minute += 60) {
    const label = minutesToTime(minute);
    if (label !== labels[labels.length - 1]) labels.push(label);
  }
  if (endTime !== labels[labels.length - 1]) labels.push(endTime);

  return labels;
}

/** คำนวณระยะเยื้องแนวนอนของเวลาใน timeline หน่วยเป็นพิกเซล */
export function timeToTimelineOffset(time: string, timetableStartTime: string, hourColumnWidth: number) {
  return ((timeToMinutes(time) - timeToMinutes(timetableStartTime)) / 60) * hourColumnWidth;
}

/** คำนวณความกว้างของคาบเรียนใน timeline หน่วยเป็นพิกเซล */
export function durationToWidth(startTime: string, endTime: string, hourColumnWidth: number) {
  return Math.max(0, ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * hourColumnWidth);
}

/** สร้างช่วงเวลาแบบ PSU ที่เน้นจุดเริ่มคาบ :00 และ :50 */
function generatePsuStyleSlots(start: number, end: number) {
  const slots = new Set<number>();
  const startHour = Math.floor(start / 60);
  const endHour = Math.ceil(end / 60);

  // PSU-style classes often use :00 and :50 boundaries, leaving a short transition gap.
  for (let hour = startHour; hour <= endHour; hour += 1) {
    slots.add(hour * 60);
    slots.add(hour * 60 + 50);
  }

  slots.add(start);
  slots.add(end);

  return Array.from(slots)
    .filter((minute) => minute >= start && minute <= end)
    .sort((a, b) => a - b)
    .map(minutesToTime);
}

/** ตรวจสอบว่าช่วงเวลาสองช่วงทับซ้อนกันหรือไม่ */
export function hasTimeOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) {
  return timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(secondStart) < timeToMinutes(firstEnd);
}

/** ตรวจสอบว่าเวลาเริ่มของรายวิชาอยู่ในขอบเขตของช่องเวลาหรือไม่ */
export function isClassInSlot(classStart: string, slotStart: string, slotEnd: string) {
  const start = timeToMinutes(classStart);
  return start >= timeToMinutes(slotStart) && start < timeToMinutes(slotEnd);
}

/** สร้างตัวเลือกเวลาเริ่มตั้งแต่ 06:00 ถึง 22:00 ตามช่วงนาทีที่กำหนด */
export function buildTimeOptions(stepMinutes = 10) {
  const options: string[] = [];
  for (let minute = 6 * 60; minute <= 22 * 60; minute += stepMinutes) {
    options.push(minutesToTime(minute));
  }
  return options;
}

/** ปรับค่าช่วงเวลาให้เป็นจำนวนเต็มที่หารด้วย 5 และอยู่ในขอบเขตที่รองรับ */
export function normalizeInterval(value: unknown, fallback = 50) {
  const interval = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(interval)) return fallback;
  const rounded = Math.round(interval / 5) * 5;
  return Math.min(120, Math.max(5, rounded));
}
