import type { ClassItem, Day, TimetableSettings } from "@/types/timetable";

const dayCodes: Record<Day, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
  Sunday: "SU"
};

const dayOffsets: Record<Day, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
};

export interface CalendarOptions {
  calendarName?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  excludedDates?: string[];
  makeupDays?: TimetableSettings["makeupDays"];
  now?: Date;
}

/** สร้างเนื้อหาไฟล์ iCalendar (.ics) สำหรับนำตารางเรียนเข้าแอปปฏิทิน */
export function buildIcs(classes: ClassItem[], options: string | CalendarOptions = "PSU Timetable") {
  const normalizedOptions: CalendarOptions = typeof options === "string" ? { calendarName: options } : options;
  const calendarName = normalizedOptions.calendarName ?? "PSU Timetable";
  const now = normalizedOptions.now ?? new Date();
  const semesterStart = parseLocalDate(normalizedOptions.semesterStartDate) ?? getMonday(now);
  const fallbackEnd = new Date(semesterStart);
  fallbackEnd.setDate(fallbackEnd.getDate() + (16 * 7) - 1);
  const requestedEnd = parseLocalDate(normalizedOptions.semesterEndDate);
  const semesterEnd = requestedEnd && requestedEnd >= semesterStart ? requestedEnd : fallbackEnd;
  const classEvents = classes
    .filter((item) => item.days.length > 0)
    .map((item) => buildEvent(item, semesterStart, semesterEnd, normalizedOptions, now))
    .join("\r\n");
  const examEvents = classes.flatMap((item) => [
    item.midtermDate ? buildAllDayEvent(item, item.midtermDate, "Midterm exam", now) : "",
    item.finalDate ? buildAllDayEvent(item, item.finalDate, "Final exam", now) : ""
  ]).filter(Boolean).join("\r\n");
  const events = [classEvents, examEvents].filter(Boolean).join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PSU Timetable Builder//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Bangkok",
    "X-LIC-LOCATION:Asia/Bangkok",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:ICT",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    events,
    "END:VCALENDAR",
    ""
  ].filter(Boolean).join("\r\n");
}

/** สร้าง VEVENT ที่เกิดซ้ำทุกสัปดาห์จากข้อมูลรายวิชาหนึ่งรายการ */
function buildEvent(item: ClassItem, semesterStart: Date, semesterEnd: Date, options: CalendarOptions, now: Date) {
  const firstDay = item.days[0];
  const occurrence = firstOccurrenceOnOrAfter(semesterStart, firstDay);

  const start = formatLocalDateTime(occurrence, item.startTime);
  const end = formatLocalDateTime(occurrence, item.endTime);
  const byDay = item.days.map((day) => dayCodes[day]).join(",");
  const description = [
    item.instructor ? `Instructor: ${item.instructor}` : "",
    item.section ? `Section: ${item.section}` : "",
    item.note ?? "",
    item.onlineUrl ? `Online: ${item.onlineUrl}` : ""
  ].filter(Boolean).join("\\n");

  const excluded = (options.excludedDates ?? [])
    .map(parseLocalDate)
    .filter((date): date is Date => Boolean(date))
    .filter((date) => date >= semesterStart && date <= semesterEnd && item.days.includes(dayFromDate(date)))
    .map((date) => formatLocalDateTime(date, item.startTime));
  const makeup = (options.makeupDays ?? [])
    .filter((entry) => item.days.includes(entry.followsDay))
    .map((entry) => parseLocalDate(entry.date))
    .filter((date): date is Date => Boolean(date))
    .filter((date) => date >= semesterStart && date <= semesterEnd)
    .map((date) => formatLocalDateTime(date, item.startTime));

  return [
    "BEGIN:VEVENT",
    `UID:${item.id}@psu-timetable.local`,
    `DTSTAMP:${formatUtcDateTime(now)}`,
    `DTSTART;TZID=Asia/Bangkok:${start}`,
    `DTEND;TZID=Asia/Bangkok:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${formatUntil(semesterEnd)}`,
    excluded.length ? `EXDATE;TZID=Asia/Bangkok:${excluded.join(",")}` : "",
    makeup.length ? `RDATE;TZID=Asia/Bangkok:${makeup.join(",")}` : "",
    `SUMMARY:${escapeText(`${item.courseCode} ${item.courseName}`.trim())}`,
    `LOCATION:${escapeText(item.room)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT"
  ].filter(Boolean).join("\r\n");
}

function buildAllDayEvent(item: ClassItem, dateValue: string, label: string, now: Date) {
  const date = parseLocalDate(dateValue);
  if (!date) return "";
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  return [
    "BEGIN:VEVENT",
    `UID:${item.id}-${label.toLowerCase().replace(/\s+/g, "-")}@psu-timetable.local`,
    `DTSTAMP:${formatUtcDateTime(now)}`,
    `DTSTART;VALUE=DATE:${formatDate(date)}`,
    `DTEND;VALUE=DATE:${formatDate(end)}`,
    `SUMMARY:${escapeText(`${label}: ${item.courseCode} ${item.courseName}`.trim())}`,
    "END:VEVENT"
  ].join("\r\n");
}

function firstOccurrenceOnOrAfter(start: Date, day: Day) {
  const monday = getMonday(start);
  const occurrence = new Date(monday);
  occurrence.setDate(monday.getDate() + dayOffsets[day]);
  if (occurrence < start) occurrence.setDate(occurrence.getDate() + 7);
  return occurrence;
}

function dayFromDate(date: Date): Day {
  return (["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as Day[])[date.getDay()];
}

function parseLocalDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function formatUntil(date: Date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 16, 59, 59));
  return formatUtcDateTime(utc);
}

function formatDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

/** หาวันจันทร์ของสัปดาห์เดียวกับวันที่ระบุ */
function getMonday(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return monday;
}

/** รวมวันที่และเวลาในเขตเวลา local ให้อยู่ในรูปแบบ iCalendar */
function formatLocalDateTime(date: Date, time: string) {
  const datePart = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value) => value.toString().padStart(2, "0"))
    .join("");
  return `${datePart}T${time.replace(":", "")}00`;
}

/** แปลงวันที่เป็น timestamp UTC ตามรูปแบบ iCalendar */
function formatUtcDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escape อักขระพิเศษเพื่อให้ข้อความปลอดภัยต่อรูปแบบ iCalendar */
function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
