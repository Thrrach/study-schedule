import { describe, expect, it } from "vitest";
import { parseClassImport } from "@/lib/import-classes";

describe("parseClassImport", () => {
  it("parses CSV headers, quoted values, weekends, and academic fields", () => {
    const result = parseClassImport(`courseCode,courseName,section,days,startTime,endTime,instructor,room,credits,type,status,url,midterm,final,note
344-211,"Database, Systems",01,Monday/Saturday,08:00,09:50,Teacher,LRC 205,3,lab,enrolled,https://example.com,2026-08-22,2026-10-17,Bring laptop`);
    expect(result.errors).toEqual([]);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0]).toMatchObject({
      courseName: "Database, Systems",
      days: ["Monday", "Saturday"],
      credits: 3,
      classType: "lab",
      status: "enrolled"
    });
  });

  it("accepts tab-separated Thai headers and Thai day names", () => {
    const result = parseClassImport("รหัสวิชา\tชื่อวิชา\tกลุ่ม\tวัน\tเวลาเริ่ม\tเวลาสิ้นสุด\n895-101\tภาษาอังกฤษ\t05\tพุธ/อาทิตย์\t10:00\t11:50");
    expect(result.errors).toEqual([]);
    expect(result.classes[0].days).toEqual(["Wednesday", "Sunday"]);
  });

  it("reports invalid required fields and time ranges by row", () => {
    const result = parseClassImport("code,name,section,day,start,end\n344-211,Database,01,Monday,10:00,09:00\n,Missing code,01,Friday,08:00,09:00");
    expect(result.classes).toEqual([]);
    expect(result.errors).toEqual(["แถว 2: ช่วงเวลาไม่ถูกต้อง", "แถว 3: ต้องมีรหัสวิชาและชื่อวิชา"]);
  });
});
