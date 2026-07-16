import type { ClassItem, Day } from "@/types/timetable";

const dayCodes: Record<Day, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR"
};

const dayOffsets: Record<Day, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4
};

/** สร้างเนื้อหาไฟล์ iCalendar (.ics) สำหรับนำตารางเรียนเข้าแอปปฏิทิน */
export function buildIcs(classes: ClassItem[], calendarName = "PSU Timetable") {
  const monday = getMonday(new Date());
  const events = classes
    .filter((item) => item.days.length > 0)
    .map((item) => buildEvent(item, monday))
    .join("\r\n");

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
function buildEvent(item: ClassItem, monday: Date) {
  const firstDay = item.days[0];
  const occurrence = new Date(monday);
  occurrence.setDate(monday.getDate() + dayOffsets[firstDay]);

  const start = formatLocalDateTime(occurrence, item.startTime);
  const end = formatLocalDateTime(occurrence, item.endTime);
  const byDay = item.days.map((day) => dayCodes[day]).join(",");
  const description = [
    item.instructor ? `Instructor: ${item.instructor}` : "",
    item.section ? `Section: ${item.section}` : "",
    item.note ?? ""
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VEVENT",
    `UID:${item.id}@psu-timetable.local`,
    `DTSTAMP:${formatUtcDateTime(new Date())}`,
    `DTSTART;TZID=Asia/Bangkok:${start}`,
    `DTEND;TZID=Asia/Bangkok:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
    `SUMMARY:${escapeText(`${item.courseCode} ${item.courseName}`.trim())}`,
    `LOCATION:${escapeText(item.room)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT"
  ].join("\r\n");
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
