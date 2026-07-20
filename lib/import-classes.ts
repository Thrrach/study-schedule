import { normalizeDay } from "@/lib/subject-utils";
import { isValidTime, timeToMinutes } from "@/lib/time";
import type { ClassItem, ClassType, EnrollmentStatus, Language, WeekDay } from "@/types/timetable";

export type ImportedClass = Omit<ClassItem, "id" | "createdAt" | "updatedAt">;

export interface ImportResult {
  classes: ImportedClass[];
  errors: string[];
}

const headerAliases: Record<string, string> = {
  code: "courseCode", coursecode: "courseCode", "รหัสวิชา": "courseCode",
  name: "courseName", coursename: "courseName", "ชื่อวิชา": "courseName",
  section: "section", sec: "section", "กลุ่ม": "section",
  day: "days", days: "days", "วัน": "days",
  start: "startTime", starttime: "startTime", "เวลาเริ่ม": "startTime",
  end: "endTime", endtime: "endTime", "เวลาสิ้นสุด": "endTime",
  instructor: "instructor", teacher: "instructor", "ผู้สอน": "instructor", "อาจารย์": "instructor",
  room: "room", "ห้อง": "room",
  credits: "credits", credit: "credits", "หน่วยกิต": "credits",
  type: "classType", classtype: "classType", "ประเภท": "classType",
  status: "status", "สถานะ": "status",
  url: "onlineUrl", onlineurl: "onlineUrl", "ลิงก์": "onlineUrl",
  midterm: "midtermDate", "กลางภาค": "midtermDate",
  final: "finalDate", "ปลายภาค": "finalDate",
  note: "note", "หมายเหตุ": "note"
};

const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#be123c", "#0891b2"];

export function parseClassImport(text: string, language: Language = "th"): ImportResult {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { classes: [], errors: [language === "en" ? "No import data found" : "ไม่พบข้อมูลสำหรับนำเข้า"] };
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const rows = lines.map((line) => parseDelimitedLine(line, delimiter));
  const normalizedHeaders = rows[0].map((header) => headerAliases[normalizeHeader(header)] ?? "");
  const hasHeader = normalizedHeaders.includes("courseCode") && normalizedHeaders.includes("courseName");
  const headers = hasHeader
    ? normalizedHeaders
    : ["courseCode", "courseName", "section", "days", "startTime", "endTime", "instructor", "room", "credits", "classType", "status", "onlineUrl", "midtermDate", "finalDate", "note"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const classes: ImportedClass[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const record = Object.fromEntries(headers.map((header, column) => [header, row[column]?.trim() ?? ""]));
    const days = parseDays(record.days);
    const startTime = normalizeImportedTime(record.startTime);
    const endTime = normalizeImportedTime(record.endTime);
    if (!record.courseCode || !record.courseName) {
      errors.push(language === "en" ? `Row ${rowNumber}: course code and name are required` : `แถว ${rowNumber}: ต้องมีรหัสวิชาและชื่อวิชา`);
      return;
    }
    if (!days.length) {
      errors.push(language === "en" ? `Row ${rowNumber}: invalid class day` : `แถว ${rowNumber}: วันเรียนไม่ถูกต้อง`);
      return;
    }
    if (!startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      errors.push(language === "en" ? `Row ${rowNumber}: invalid time range` : `แถว ${rowNumber}: ช่วงเวลาไม่ถูกต้อง`);
      return;
    }

    classes.push({
      courseCode: record.courseCode,
      courseName: record.courseName,
      section: record.section || "01",
      days,
      startTime,
      endTime,
      instructor: record.instructor ?? "",
      room: record.room ?? "",
      credits: normalizeCredits(record.credits),
      classType: normalizeType(record.classType),
      status: normalizeStatus(record.status),
      onlineUrl: record.onlineUrl ?? "",
      midtermDate: normalizeDate(record.midtermDate),
      finalDate: normalizeDate(record.finalDate),
      note: record.note ?? "",
      color: colors[classes.length % colors.length]
    });
  });

  return { classes, errors };
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current);
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]/g, "");
}

function parseDays(value: string) {
  return Array.from(new Set(value.split(/[\/,|+;&]+/).map((day) => normalizeDay(day.trim())).filter((day): day is WeekDay => Boolean(day))));
}

function normalizeImportedTime(value: string) {
  const trimmed = value.trim().replace(".", ":");
  const padded = /^\d:\d{2}$/.test(trimmed) ? `0${trimmed}` : trimmed;
  return isValidTime(padded) ? padded : "";
}

function normalizeCredits(value: string) {
  const credits = Number(value);
  return Number.isFinite(credits) && credits >= 0 && credits <= 30 ? credits : 0;
}

function normalizeType(value: string | undefined): ClassType {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (["lab", "ปฏิบัติการ"].includes(normalized)) return "lab";
  if (["tutorial", "ติว"].includes(normalized)) return "tutorial";
  if (["online", "ออนไลน์"].includes(normalized)) return "online";
  if (["other", "อื่นๆ", "อื่น ๆ"].includes(normalized)) return "other";
  return "lecture";
}

function normalizeStatus(value: string | undefined): EnrollmentStatus {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (["enrolled", "ลงทะเบียนแล้ว"].includes(normalized)) return "enrolled";
  if (["waitlisted", "สำรอง"].includes(normalized)) return "waitlisted";
  return "planned";
}

function normalizeDate(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}
