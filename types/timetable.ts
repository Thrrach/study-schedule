export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export type WeekDay = Day;

export type ImageFormat = "png" | "jpeg";
export type Language = "th" | "en";

export interface ClassItem {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  instructor: string;
  room: string;
  days: WeekDay[];
  startTime: string;
  endTime: string;
  color: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TimetableSettings {
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  timeSlots: string[];
  semester?: string;
  studentName?: string;
  language?: Language;
}

export interface TimetableBackup {
  version: 1;
  exportedAt: string;
  settings: TimetableSettings;
  classes: ClassItem[];
}

export const weekDays: Array<{ key: Day; labelTh: string; labelEn: string; shortLabelTh: string; shortLabelEn: string }> = [
  { key: "Monday", labelTh: "วันจันทร์", labelEn: "Monday", shortLabelTh: "จ.", shortLabelEn: "Mon" },
  { key: "Tuesday", labelTh: "วันอังคาร", labelEn: "Tuesday", shortLabelTh: "อ.", shortLabelEn: "Tue" },
  { key: "Wednesday", labelTh: "วันพุธ", labelEn: "Wednesday", shortLabelTh: "พ.", shortLabelEn: "Wed" },
  { key: "Thursday", labelTh: "วันพฤหัสบดี", labelEn: "Thursday", shortLabelTh: "พฤ.", shortLabelEn: "Thu" },
  { key: "Friday", labelTh: "วันศุกร์", labelEn: "Friday", shortLabelTh: "ศ.", shortLabelEn: "Fri" }
];
