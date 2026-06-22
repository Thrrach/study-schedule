export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export type WeekDay = Day;

export type ImageFormat = "png" | "jpeg";

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
}

export interface TimetableBackup {
  version: 1;
  exportedAt: string;
  settings: TimetableSettings;
  classes: ClassItem[];
}

export const weekDays: Array<{ key: Day; label: string; shortLabel: string }> = [
  { key: "Monday", label: "วันจันทร์", shortLabel: "จ." },
  { key: "Tuesday", label: "วันอังคาร", shortLabel: "อ." },
  { key: "Wednesday", label: "วันพุธ", shortLabel: "พ." },
  { key: "Thursday", label: "วันพฤหัสบดี", shortLabel: "พฤ." },
  { key: "Friday", label: "วันศุกร์", shortLabel: "ศ." }
];
