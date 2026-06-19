import type { TimetableSettings } from "@/types/timetable";

export function timeToMinutes(time: string): number {
  if (!isValidTime(time)) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function generateTimeSlots(settings: TimetableSettings): string[] {
  if (settings.timeSlots?.length) {
    return normalizeTimeSlots(settings.timeSlots);
  }

  const start = timeToMinutes(settings.startTime);
  const end = timeToMinutes(settings.endTime);
  const interval = Math.max(5, settings.intervalMinutes);

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

export function normalizeTimeSlots(timeSlots: string[]) {
  const seen = new Set<string>();
  return timeSlots.filter((time) => {
    if (!isValidTime(time) || seen.has(time)) return false;
    seen.add(time);
    return true;
  });
}

export function isValidTime(time: string) {
  if (typeof time !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function getSlotEnd(slots: string[], index: number, fallbackEndTime: string) {
  return slots[index + 1] ?? fallbackEndTime;
}

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

export function timeToGridLine(time: string, scaleStart: string, stepMinutes = 10) {
  return Math.max(1, Math.round((timeToMinutes(time) - timeToMinutes(scaleStart)) / stepMinutes) + 1);
}

export function buildHourLabels(startTime: string, endTime: string) {
  const startHour = Math.floor(timeToMinutes(startTime) / 60);
  const endHour = Math.ceil(timeToMinutes(endTime) / 60);
  const labels: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    labels.push(`${hour.toString().padStart(2, "0")}:00`);
  }

  return labels;
}

export function timeToTimelineOffset(time: string, timetableStartTime: string, hourColumnWidth: number) {
  return ((timeToMinutes(time) - timeToMinutes(timetableStartTime)) / 60) * hourColumnWidth;
}

export function durationToWidth(startTime: string, endTime: string, hourColumnWidth: number) {
  return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * hourColumnWidth;
}

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

export function hasTimeOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) {
  return timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(secondStart) < timeToMinutes(firstEnd);
}

export function isClassInSlot(classStart: string, slotStart: string, slotEnd: string) {
  const start = timeToMinutes(classStart);
  return start >= timeToMinutes(slotStart) && start < timeToMinutes(slotEnd);
}

export function buildTimeOptions(stepMinutes = 10) {
  const options: string[] = [];
  for (let minute = 6 * 60; minute <= 22 * 60; minute += stepMinutes) {
    options.push(minutesToTime(minute));
  }
  return options;
}
