"use client";

import type { ClassItem, WeekDay } from "@/types/timetable";
import { ClassCard } from "@/components/ClassCard";
import { safeDays } from "@/lib/subject-utils";
import { cn } from "@/lib/utils";

interface TimeSlotProps {
  day: WeekDay;
  time: string;
  classes: ClassItem[];
  onDropClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  onView?: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** แสดงช่องเวลาของวันหนึ่งในตารางแบบ grid และรองรับการวางรายวิชา */
export function TimeSlot({
  day,
  time,
  classes,
  onDropClass,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: TimeSlotProps) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = readDragPayload(event.dataTransfer);
        if (payload.id) onDropClass(payload.id, day, time, payload.sourceDay);
      }}
      className={cn(
        "min-h-32 border-b border-r border-slate-200 bg-white p-1.5 transition-colors",
        "hover:bg-sky-50/60",
        classes.length > 1 && "bg-amber-50/60"
      )}
    >
      <div className="space-y-1.5">
        {classes.map((item) => (
          <ClassCard
            key={item.id}
            item={item}
            compact
            dragDay={day}
            onView={onView ?? onEdit}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

/** อ่านข้อมูลรายวิชาจาก drag-and-drop โดยรองรับ JSON และข้อความธรรมดา */
function readDragPayload(dataTransfer: DataTransfer): { id: string; sourceDay?: WeekDay } {
  const json = dataTransfer.getData("application/json");
  if (json) {
    try {
      const payload = JSON.parse(json) as { id?: unknown; sourceDay?: unknown };
      return {
        id: typeof payload.id === "string" ? payload.id : "",
        sourceDay: safeDays([payload.sourceDay])[0]
      };
    } catch {
      return { id: dataTransfer.getData("text/plain") };
    }
  }

  return { id: dataTransfer.getData("text/plain") };
}
