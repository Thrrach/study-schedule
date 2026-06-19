"use client";

import { Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { ClassItem } from "@/types/timetable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  item: ClassItem;
  compact?: boolean;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ClassCard({ item, compact, onEdit, onDuplicate, onDelete }: ClassCardProps) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group rounded-md border-l-4 bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:shadow-md",
        compact ? "flex h-full min-h-[90px] flex-col overflow-hidden px-4 py-3.5" : "space-y-1.5 p-4"
      )}
      style={{ borderLeftColor: item.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-4 w-4 shrink-0 text-slate-400 no-print" />
            <p className={cn("truncate font-bold leading-none", compact ? "text-[28px]" : "text-xl")}>{item.courseCode}</p>
          </div>
          <p className={cn("mt-1 font-medium text-slate-700", compact ? "truncate text-base leading-5" : "line-clamp-2 text-sm")}>{item.courseName}</p>
        </div>
        <span
          className="shrink-0 rounded px-2 py-1 text-[13px] font-semibold leading-none text-white"
          style={{ backgroundColor: item.color }}
        >
          Sec {item.section}
        </span>
      </div>
      <div className="mt-1 min-h-0 space-y-0.5 text-sm leading-5 text-slate-600">
        <p>{item.startTime} - {item.endTime}</p>
        <p className="truncate">{item.instructor}</p>
        {!compact ? <p className="truncate">{item.room}</p> : null}
        {!compact && item.note ? <p className="line-clamp-2 text-slate-500">{item.note}</p> : null}
      </div>
      <div className={cn("flex justify-end gap-1 opacity-100 no-print md:opacity-0 md:group-hover:opacity-100", compact && "hidden")}>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)} aria-label="Edit class">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(item.id)} aria-label="Duplicate class">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)} aria-label="Delete class">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
