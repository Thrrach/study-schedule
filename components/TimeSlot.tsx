"use client";

import type { ClassItem, WeekDay } from "@/types/timetable";
import { ClassCard } from "@/components/ClassCard";
import { cn } from "@/lib/utils";

interface TimeSlotProps {
  day: WeekDay;
  time: string;
  classes: ClassItem[];
  onDropClass: (id: string, day: WeekDay, startTime: string) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TimeSlot({
  day,
  time,
  classes,
  onDropClass,
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
        const id = event.dataTransfer.getData("text/plain");
        if (id) onDropClass(id, day, time);
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
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
