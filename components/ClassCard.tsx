"use client";

import { Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import { cn } from "@/lib/utils";
import type { ClassItem, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";

interface ClassCardProps {
  item: ClassItem;
  compact?: boolean;
  dragDay?: WeekDay;
  onView: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ClassCard({ item, compact, dragDay, onView, onEdit, onDuplicate, onDelete }: ClassCardProps) {
  const theme = getSubjectTheme(item);
  const dayLabels = safeDays(item.days)
    .map((day) => weekDays.find((weekDay) => weekDay.key === day)?.shortLabel ?? day)
    .join(", ");

  function openDetail() {
    onView(item);
  }

  function stopAction(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      draggable
      role="button"
      tabIndex={0}
      aria-label={`ดูรายละเอียด ${item.courseCode} ${item.courseName}`}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit(item);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.setData("application/json", JSON.stringify({ id: item.id, sourceDay: dragDay }));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative flex min-h-[90px] flex-col items-center justify-center rounded border px-3 py-3 text-center shadow-sm ring-1 ring-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,.12)]",
        compact ? "h-full pr-10" : "space-y-2 p-4"
      )}
      style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
    >
      <GripVertical className="absolute left-2 top-2 h-4 w-4 text-slate-500/70 no-print" aria-hidden="true" />
      <span className="absolute right-2 top-2 rounded border bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold leading-none">
        Sec {item.section || "-"}
      </span>

      <div className="space-y-1 overflow-visible">
        <p className="break-words text-lg font-bold leading-tight">{item.courseCode}</p>
        <p className="whitespace-normal break-words text-sm font-semibold leading-5">{item.courseName}</p>
        <p className="whitespace-normal break-words text-xs font-medium leading-5">
          {[item.room, item.instructor].filter(Boolean).join(" | ") || "ยังไม่ระบุห้อง/อาจารย์"}
        </p>
        <p className="text-xs font-semibold leading-4 text-slate-600">
          {item.startTime} - {item.endTime}
        </p>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 hidden w-64 -translate-x-1/2 rounded-md border bg-white p-3 text-left text-xs leading-5 text-slate-700 shadow-lg group-hover:block group-focus-visible:block no-print">
        <p className="font-semibold text-slate-950">
          {item.courseCode} {item.courseName}
        </p>
        <p>อาจารย์: {item.instructor || "-"}</p>
        <p>ห้องเรียน: {item.room || "-"}</p>
        <p>วันเรียน: {dayLabels || "-"}</p>
        <p>เวลาเรียน: {item.startTime} - {item.endTime}</p>
        <p>หน่วยกิต: -</p>
      </div>

      <div
        className={cn(
          "flex justify-end gap-1 opacity-100 no-print md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
          compact && "absolute bottom-1.5 right-1.5 rounded-md bg-white/95 shadow-sm ring-1 ring-slate-200"
        )}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={(event) => {
            stopAction(event);
            onEdit(item);
          }}
          aria-label="แก้ไขรายวิชา"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={(event) => {
            stopAction(event);
            onDuplicate(item.id);
          }}
          aria-label="ทำสำเนารายวิชา"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive"
          onClick={(event) => {
            stopAction(event);
            onDelete(item.id);
          }}
          aria-label="ลบรายวิชา"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
