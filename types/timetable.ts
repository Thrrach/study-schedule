export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type WeekDay = Day;

export type ImageFormat = "png" | "jpeg";
export type Language = "th" | "en";
export type ClassType = "lecture" | "lab" | "tutorial" | "online" | "other";
export type EnrollmentStatus = "planned" | "enrolled" | "waitlisted";

export interface MakeupDay {
  date: string;
  followsDay: Day;
}

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
  credits?: number;
  classType?: ClassType;
  status?: EnrollmentStatus;
  onlineUrl?: string;
  midtermDate?: string;
  finalDate?: string;
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
  semesterStartDate?: string;
  semesterEndDate?: string;
  excludedDates?: string[];
  makeupDays?: MakeupDay[];
  visibleDays?: Day[];
  lastBackupAt?: string;
}

export interface TimetableBackup {
  version: 1 | 2;
  exportedAt: string;
  settings: TimetableSettings;
  classes: ClassItem[];
  plans?: TimetablePlan[];
  activePlanId?: string;
}

export interface TimetablePlan {
  id: string;
  name: string;
  classes: ClassItem[];
  settings: TimetableSettings;
  createdAt: number;
  updatedAt: number;
}

export const weekDays: Array<{ key: Day; labelTh: string; labelEn: string; shortLabelTh: string; shortLabelEn: string }> = [
  { key: "Monday", labelTh: "วันจันทร์", labelEn: "Monday", shortLabelTh: "จ.", shortLabelEn: "Mon" },
  { key: "Tuesday", labelTh: "วันอังคาร", labelEn: "Tuesday", shortLabelTh: "อ.", shortLabelEn: "Tue" },
  { key: "Wednesday", labelTh: "วันพุธ", labelEn: "Wednesday", shortLabelTh: "พ.", shortLabelEn: "Wed" },
  { key: "Thursday", labelTh: "วันพฤหัสบดี", labelEn: "Thursday", shortLabelTh: "พฤ.", shortLabelEn: "Thu" },
  { key: "Friday", labelTh: "วันศุกร์", labelEn: "Friday", shortLabelTh: "ศ.", shortLabelEn: "Fri" },
  { key: "Saturday", labelTh: "วันเสาร์", labelEn: "Saturday", shortLabelTh: "ส.", shortLabelEn: "Sat" },
  { key: "Sunday", labelTh: "วันอาทิตย์", labelEn: "Sunday", shortLabelTh: "อา.", shortLabelEn: "Sun" }
];
