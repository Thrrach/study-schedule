"use client";

import { Clock3, Copy, GripVertical, MapPin, Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import { cn } from "@/lib/utils";
import type { ClassItem, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { useTranslation } from "@/lib/i18n";

interface ClassCardProps {
  item: ClassItem;
  compact?: boolean;
  dragDay?: WeekDay;
  onView: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** แสดงข้อมูลรายวิชาเป็นการ์ดที่เปิดรายละเอียด แก้ไข ทำสำเนา ลบ และลากย้ายได้ */
export function ClassCard({ item, compact, dragDay, onView, onEdit, onDuplicate, onDelete }: ClassCardProps) {
  const { t, language } = useTranslation();
  const theme = getSubjectTheme(item, language);
  const dayLabels = safeDays(item.days)
    .map((day) => language === "en" ? weekDays.find((weekDay) => weekDay.key === day)?.shortLabelEn : weekDays.find((weekDay) => weekDay.key === day)?.shortLabelTh ?? day)
    .join(", ");
  const metaItems = [
    item.room ? { icon: <MapPin className="h-3.5 w-3.5" />, value: item.room } : null,
    item.instructor ? { icon: <UserRound className="h-3.5 w-3.5" />, value: item.instructor } : null
  ].filter(Boolean) as Array<{ icon: React.ReactNode; value: string }>;

  /** เปิดหน้าต่างรายละเอียดของรายวิชานี้ */
  function openDetail() {
    onView(item);
  }

  /** หยุดการส่งต่อ event ของปุ่มการกระทำไปยังตัวการ์ด */
  function stopAction(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      draggable
      role="button"
      tabIndex={0}
      aria-label={t("card.view", { code: item.courseCode, name: item.courseName })}
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
        "group relative flex min-h-[90px] flex-col rounded-xl border px-3 py-3 text-left shadow-sm ring-1 ring-black/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:shadow-lg",
        compact ? "h-full gap-2 pr-10" : "gap-3 p-4"
      )}
      style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
    >
      <GripVertical className="absolute left-2 top-2 h-4 w-4 text-slate-500/70 no-print" aria-hidden="true" />

      <div className="flex min-w-0 items-start justify-between gap-2 pl-4">
        <div className="min-w-0">
          <p className={cn("break-words font-bold leading-tight", compact ? "text-base" : "text-lg")}>{item.courseCode}</p>
          <p className="mt-1 overflow-hidden text-sm font-semibold leading-5 [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
            {item.courseName}
          </p>
        </div>
        <span className="shrink-0 rounded border bg-white/75 px-1.5 py-0.5 text-[11px] font-semibold leading-none">
          {t("card.sec")} {item.section || "-"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-xs font-semibold leading-none text-slate-700 shadow-sm ring-1 ring-black/5">
          <Clock3 className="h-3.5 w-3.5" />
          {item.startTime} - {item.endTime}
        </span>
        {dayLabels ? (
          <span className="rounded-full bg-white/60 px-2 py-1 text-xs font-medium leading-none text-slate-600 ring-1 ring-black/5">
            {dayLabels}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 space-y-1 text-xs font-medium leading-4 text-slate-700">
        {metaItems.length ? (
          metaItems.map((meta) => (
            <p key={meta.value} className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-slate-500">{meta.icon}</span>
              <span className="truncate">{meta.value}</span>
            </p>
          ))
        ) : (
          <p className="text-slate-500">{t("card.noLocation")}</p>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 hidden w-64 -translate-x-1/2 rounded-xl border bg-popover p-3 text-left text-xs leading-5 text-popover-foreground shadow-xl group-hover:block group-focus-visible:block no-print">
        <p className="font-semibold text-foreground">
          {item.courseCode} {item.courseName}
        </p>
        <p>{t("form.instructor")}: {item.instructor || "-"}</p>
        <p>{t("form.room")}: {item.room || "-"}</p>
        <p>{t("form.days")}: {dayLabels || "-"}</p>
        <p>{t("filter.sortTime")}: {item.startTime} - {item.endTime}</p>
      </div>

      <div
        className={cn(
          "flex justify-end gap-1 opacity-100 no-print md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
          compact && "absolute bottom-1.5 right-1.5 rounded-lg bg-white/95 shadow-sm ring-1 ring-black/10"
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
          aria-label={t("card.edit")}
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
          aria-label={t("card.duplicate")}
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
          aria-label={t("card.delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
