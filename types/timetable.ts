export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

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

export const weekDays: Array<{ key: WeekDay; label: string; shortLabel: string }> = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
  { key: "saturday", label: "Saturday", shortLabel: "Sat" },
  { key: "sunday", label: "Sunday", shortLabel: "Sun" }
];
