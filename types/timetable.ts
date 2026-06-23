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
  semester?: string;
  studentName?: string;
}

export interface TimetableBackup {
  version: 1;
  exportedAt: string;
  settings: TimetableSettings;
  classes: ClassItem[];
}

export const weekDays: Array<{ key: Day; label: string; shortLabel: string }> = [
  { key: "Monday", label: "Monday", shortLabel: "Mon" },
  { key: "Tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "Wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "Thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "Friday", label: "Friday", shortLabel: "Fri" }
];
