import type { ClassItem, TimetableSettings } from "@/types/timetable";

const now = 1718427600000;

export const defaultSettings: TimetableSettings = {
  startTime: "08:00",
  endTime: "16:00",
  intervalMinutes: 50,
  semester: "",
  studentName: "",
  timeSlots: [
    "08:00",
    "08:50",
    "09:00",
    "09:50",
    "10:00",
    "10:50",
    "11:00",
    "11:50",
    "13:00",
    "13:50",
    "14:00",
    "14:50",
    "15:00",
    "15:50",
    "16:00"
  ]
};

export const sampleClasses: ClassItem[] = [
  {
    id: "sample-1",
    courseCode: "344-211",
    courseName: "ระบบฐานข้อมูล",
    section: "01",
    instructor: "อ. อนงค์",
    room: "LRC 205",
    days: ["Monday", "Tuesday"],
    startTime: "08:00",
    endTime: "09:50",
    color: "#0f766e",
    note: "บรรยาย",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "sample-2",
    courseCode: "344-321",
    courseName: "การพัฒนาเว็บแอปพลิเคชัน",
    section: "02",
    instructor: "ผศ. นรินทร์",
    room: "COM 304",
    days: ["Monday"],
    startTime: "08:00",
    endTime: "09:50",
    color: "#2563eb",
    note: "กลุ่มแล็บ A",
    createdAt: now + 1,
    updatedAt: now + 1
  },
  {
    id: "sample-3",
    courseCode: "895-101",
    courseName: "English for Communication",
    section: "05",
    instructor: "อ. มาลี",
    room: "BSc 1102",
    days: ["Wednesday"],
    startTime: "10:00",
    endTime: "11:50",
    color: "#d97706",
    createdAt: now + 2,
    updatedAt: now + 2
  },
  {
    id: "sample-4",
    courseCode: "935-222",
    courseName: "โครงสร้างข้อมูล",
    section: "01",
    instructor: "ดร. วิชัย",
    room: "ENG 420",
    days: ["Friday"],
    startTime: "13:00",
    endTime: "15:50",
    color: "#7c3aed",
    note: "นำโน้ตบุ๊กมาด้วย",
    createdAt: now + 3,
    updatedAt: now + 3
  }
];
