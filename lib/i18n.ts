import { useTimetableApi } from "@/api/timetable.api";

const th = {
  // App Header
  "app.title": "ระบบจัดตารางเรียน PSU",
  "app.subtitle": "ตารางเรียนของคุณ",
  "app.semester": "ภาคเรียน",
  "app.semesterPlaceholder": "ยังไม่ระบุ",
  "app.viewGrid": "ตาราง",
  "app.viewList": "รายการ",
  "app.tools": "เครื่องมือ",

  // Search & Filters
  "filter.searchLabel": "ค้นหารายวิชา",
  "filter.searchPlaceholder": "รหัสวิชา ชื่อวิชา อาจารย์ หรือห้อง",
  "filter.clearSearch": "ล้างการค้นหา",
  "filter.sortLabel": "เรียงลำดับ",
  "filter.sortDayTime": "วันและเวลา",
  "filter.sortTime": "เวลา",
  "filter.sortCode": "รหัสวิชา",
  "filter.sortName": "ชื่อวิชา",
  "filter.filterDay": "กรองตามวัน",
  "filter.clearDay": "ล้างวัน",
  "filter.noDayData": "ยังไม่มีรายวิชาให้กรองตามวัน",
  "filter.filterInstructor": "กรองตามอาจารย์",
  "filter.clearInstructor": "ล้างอาจารย์",
  "filter.noInstructorData": "ยังไม่มีรายวิชาให้กรองตามอาจารย์",
  
  // Results
  "results.coursesCount": "{count} รายวิชา",
  "results.filteredSubtext": "แสดงผลตามตัวกรองและการเรียงลำดับ",
  "results.clearAll": "ล้างทั้งหมด",
  "results.settings": "ตั้งค่า",

  // Metrics
  "metrics.courses": "รายวิชา",
  "metrics.overlaps": "ตารางชนกัน",
  "metrics.displayTime": "ช่วงเวลาที่แสดง",
  "metrics.autoSaved": "บันทึกอัตโนมัติแล้ว",
  "metrics.autoSavedDesc": "ข้อมูลจะเก็บไว้ในเครื่องนี้โดยอัตโนมัติ",

  // Tools Dialog
  "tools.title": "ตั้งค่าและจัดการตาราง",
  "tools.settingsSection": "การตั้งค่าตารางและข้อมูลส่วนตัว",
  "tools.exportSection": "จัดการรายวิชาและส่งออก",
  "tools.exportDesc": "เพิ่มรายวิชา ส่งออกรูปตาราง หรือสำรองข้อมูล JSON ไว้สำหรับย้ายไปใช้อีกเครื่อง",
  "tools.addClass": "เพิ่มรายวิชา",
  "tools.backupJson": "สำรองข้อมูล JSON",
  "tools.importJson": "นำเข้าข้อมูล",
  "tools.resetSample": "คืนค่าข้อมูลตัวอย่าง",

  // Settings Form
  "settings.studentName": "ชื่อผู้เรียน",
  "settings.studentNamePlaceholder": "เช่น นายสมชาย ใจดี",
  "settings.timeNote": "ตารางบนหน้าจอและไฟล์รูปจะยึดช่วงเวลา {start}-{end} เสมอ",
  "settings.start": "เริ่ม",
  "settings.end": "สิ้นสุด",
  "settings.interval": "ระยะห่าง (นาที)",
  "settings.regenerateSlots": "สร้างช่วงเวลาอีกครั้ง",
  "settings.customSlots": "กำหนดช่วงเวลาเอง",
  "settings.addSlot": "เพิ่มช่วงเวลา",
  "settings.invalidRange": "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม",

  // Class Form
  "form.addTitle": "เพิ่มรายวิชา",
  "form.editTitle": "แก้ไขรายวิชา",
  "form.code": "รหัสวิชา",
  "form.name": "ชื่อวิชา",
  "form.section": "กลุ่ม (Section)",
  "form.instructor": "อาจารย์",
  "form.room": "ห้องเรียน",
  "form.days": "วัน",
  "form.startTime": "เวลาเริ่ม",
  "form.endTime": "เวลาสิ้นสุด",
  "form.color": "สี",
  "form.note": "บันทึกช่วยจำ (ไม่บังคับ)",
  "form.save": "บันทึกรายวิชา",
  "form.cancel": "ยกเลิก",
  "form.preview": "ตัวอย่างการ์ด",
  "form.required": "กรุณากรอกข้อมูล",
  "form.timeError": "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด",
  "form.overlapWarning": "ชนกับรายวิชาอื่น {count} วิชา",

  // Export
  "export.button": "ดาวน์โหลด",
  "export.exporting": "กำลังส่งออก...",
  "export.university": "มหาวิทยาลัยสงขลานครินทร์",
  "export.timetable": "ตารางเรียน",
  "export.updatedAt": "อัปเดตข้อมูล ณ วันที่ {date}",

  // Dialogs
  "dialog.deleteConfirm": "ต้องการลบรายวิชานี้ใช่ไหม?",
  "dialog.deleteWarning": "{code} {name} จะถูกลบออกจากทุกวันที่เลือกไว้",
  "dialog.deleteBtn": "ลบรายวิชา",
  "dialog.resetConfirm": "ต้องการคืนค่าข้อมูลตัวอย่างใช่ไหม?",
  "dialog.resetWarning": "รายวิชาและการตั้งค่าปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่าง แนะนำให้สำรองข้อมูล JSON ก่อน หากยังต้องการเก็บไว้",
  "dialog.resetBtn": "คืนค่าข้อมูลตัวอย่าง",
  "dialog.detailTitle": "รายละเอียดรายวิชา",
  "dialog.detailNote": "คำอธิบายรายวิชา",
  "dialog.noNote": "ยังไม่มีคำอธิบายเพิ่มเติม",

  // Card & List
  "card.sec": "Sec",
  "card.room": "Room",
  "list.noClasses": "ไม่มีรายวิชาที่ตรงกับเงื่อนไข",
  "list.viewGrid": "ดูตาราง"
};

const en: typeof th = {
  "app.title": "PSU Timetable System",
  "app.subtitle": "Your Timetable",
  "app.semester": "Semester",
  "app.semesterPlaceholder": "Not specified",
  "app.viewGrid": "Grid",
  "app.viewList": "List",
  "app.tools": "Tools",

  "filter.searchLabel": "Search Courses",
  "filter.searchPlaceholder": "Code, Name, Instructor, or Room",
  "filter.clearSearch": "Clear Search",
  "filter.sortLabel": "Sort By",
  "filter.sortDayTime": "Day & Time",
  "filter.sortTime": "Time",
  "filter.sortCode": "Course Code",
  "filter.sortName": "Course Name",
  "filter.filterDay": "Filter by Day",
  "filter.clearDay": "Clear Day",
  "filter.noDayData": "No courses available to filter by day",
  "filter.filterInstructor": "Filter by Instructor",
  "filter.clearInstructor": "Clear Instructor",
  "filter.noInstructorData": "No courses available to filter by instructor",
  
  "results.coursesCount": "{count} Courses",
  "results.filteredSubtext": "Filtered and sorted results",
  "results.clearAll": "Clear All",
  "results.settings": "Settings",

  "metrics.courses": "Courses",
  "metrics.overlaps": "Overlaps",
  "metrics.displayTime": "Display Time",
  "metrics.autoSaved": "Auto Saved",
  "metrics.autoSavedDesc": "Data is automatically saved on this device",

  "tools.title": "Settings & Management",
  "tools.settingsSection": "Timetable Settings & Personal Info",
  "tools.exportSection": "Manage Courses & Export",
  "tools.exportDesc": "Add courses, export image, or backup JSON to move to another device",
  "tools.addClass": "Add Course",
  "tools.backupJson": "Backup JSON",
  "tools.importJson": "Import Data",
  "tools.resetSample": "Restore Sample Data",

  "settings.studentName": "Student Name",
  "settings.studentNamePlaceholder": "e.g., John Doe",
  "settings.timeNote": "Display and export time will always be {start}-{end}",
  "settings.start": "Start",
  "settings.end": "End",
  "settings.interval": "Interval (Mins)",
  "settings.regenerateSlots": "Regenerate Time Slots",
  "settings.customSlots": "Custom Time Slots",
  "settings.addSlot": "Add Slot",
  "settings.invalidRange": "End time must be after start time",

  "form.addTitle": "Add Course",
  "form.editTitle": "Edit Course",
  "form.code": "Course Code",
  "form.name": "Course Name",
  "form.section": "Section",
  "form.instructor": "Instructor",
  "form.room": "Room",
  "form.days": "Days",
  "form.startTime": "Start Time",
  "form.endTime": "End Time",
  "form.color": "Color",
  "form.note": "Note (Optional)",
  "form.save": "Save Course",
  "form.cancel": "Cancel",
  "form.preview": "Card Preview",
  "form.required": "Required",
  "form.timeError": "Start time must be before end time",
  "form.overlapWarning": "Overlaps with {count} other course(s)",

  "export.button": "Download",
  "export.exporting": "Exporting...",
  "export.university": "Prince of Songkla University",
  "export.timetable": "Timetable",
  "export.updatedAt": "Updated at {date}",

  "dialog.deleteConfirm": "Delete this course?",
  "dialog.deleteWarning": "{code} {name} will be removed from all selected days.",
  "dialog.deleteBtn": "Delete Course",
  "dialog.resetConfirm": "Restore sample data?",
  "dialog.resetWarning": "Current courses and settings will be replaced with sample data. Recommend backing up JSON first if you want to keep them.",
  "dialog.resetBtn": "Restore Sample Data",
  "dialog.detailTitle": "Course Details",
  "dialog.detailNote": "Course Description",
  "dialog.noNote": "No additional description",

  "card.sec": "Sec",
  "card.room": "Room",
  "list.noClasses": "No courses match the criteria",
  "list.viewGrid": "View Grid"
};

const dictionaries = { th, en };

export type TranslationKey = keyof typeof th;

export function useTranslation() {
  const language = useTimetableApi((state) => state.settings.language) || "th";
  const dict = dictionaries[language];

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    let str = dict[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return { t, language };
}
