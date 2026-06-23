import type { ClassItem } from "@/types/timetable";

export type SubjectCategory = "computer-science" | "general" | "sports" | "online" | "laboratory";

export interface SubjectTheme {
  category: SubjectCategory;
  label: string;
  background: string;
  border: string;
  accent: string;
  text: string;
}

const themes: Record<SubjectCategory, SubjectTheme> = {
  "computer-science": {
    category: "computer-science",
    label: "Computer Science",
    background: "#d9f2ff",
    border: "#6fd3ff",
    accent: "#0b6fae",
    text: "#0f3150"
  },
  general: {
    category: "general",
    label: "General Education",
    background: "#e8f7e8",
    border: "#8fd88f",
    accent: "#2f8f4e",
    text: "#173f2a"
  },
  sports: {
    category: "sports",
    label: "Sports",
    background: "#efe3ff",
    border: "#b79cff",
    accent: "#6d4bc4",
    text: "#35215f"
  },
  online: {
    category: "online",
    label: "Online",
    background: "#dff1ff",
    border: "#84c5ff",
    accent: "#16639c",
    text: "#15395b"
  },
  laboratory: {
    category: "laboratory",
    label: "Laboratory",
    background: "#e7fff3",
    border: "#89d7b2",
    accent: "#19845a",
    text: "#153f30"
  }
};

export function getSubjectTheme(item: Pick<ClassItem, "courseCode" | "courseName" | "room" | "note">): SubjectTheme {
  const text = `${item.courseCode} ${item.courseName} ${item.room} ${item.note ?? ""}`.toLowerCase();
  const code = item.courseCode.toLowerCase();

  if (/\b(online|remote|zoom|teams|webex)\b/.test(text) || text.includes("ออนไลน์")) {
    return themes.online;
  }

  if (/\b(lab|laboratory)\b/.test(text) || text.includes("ปฏิบัติการ")) {
    return themes.laboratory;
  }

  if (/\b(sport|sports|physical|pe)\b/.test(text) || text.includes("กีฬา")) {
    return themes.sports;
  }

  if (
    code.startsWith("344-") ||
    code.startsWith("cs") ||
    /\b(computer|computing|programming|database|software|internet|network|data structures)\b/.test(text)
  ) {
    return themes["computer-science"];
  }

  return themes.general;
}
