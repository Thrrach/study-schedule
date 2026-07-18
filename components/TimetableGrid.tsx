"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { ClassCard } from "@/components/ClassCard";
import { buildHourLabels, durationToWidth, minutesToTime, timeToMinutes, timeToTimelineOffset } from "@/lib/time";
import { cn } from "@/lib/utils";
import { safeDays } from "@/lib/subject-utils";
import type { ClassItem, Day, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { useTranslation } from "@/lib/i18n";

const HOUR_COLUMN_WIDTH = 150;
const DAY_COLUMN_WIDTH = 118;
const DROP_STEP_MINUTES = 10;
const CARD_HEIGHT = 184;
const ROW_BASE_HEIGHT = 204;
const ROW_VERTICAL_PADDING = 10;

interface TimetableGridProps {
  classes: ClassItem[];
  startTime: string;
  endTime: string;
  visibleDays?: Day[];
  exportMeta: {
    semester: string;
    studentName: string;
    exportedAt: string;
  };
  onDropClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  onAddClassAt: (day: WeekDay, startTime: string) => void;
  onView: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** แสดงตารางเรียนแบบ timeline พร้อมการลากย้ายและคลิกเพิ่มรายวิชา */
export function TimetableGrid({
  classes,
  startTime,
  endTime,
  visibleDays,
  exportMeta,
  onDropClass,
  onAddClassAt,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: TimetableGridProps) {
  const { language } = useTranslation();
  const safeClasses = Array.isArray(classes) ? classes : [];
  const { timelineStart, timelineEnd, timelineWidth, hourLabels } = useMemo(
    () => buildTimeline(startTime, endTime),
    [startTime, endTime]
  );
  const gridWidth = DAY_COLUMN_WIDTH + timelineWidth;

  return (
    <section className="print-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[calc(100vh-220px)] overflow-auto scroll-smooth bg-white">
        <div id="timetable-export" className="w-max min-w-full bg-white p-4" style={{ minWidth: gridWidth }}>
          <ExportHeader meta={exportMeta} width={gridWidth} />
          <div className="grid overflow-visible bg-white" style={{ gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px` }}>
            <div
              data-export-sticky
              className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-3 py-3"
            />
            <TimelineHeader hourLabels={hourLabels} timelineStart={timelineStart} width={timelineWidth} />

            {weekDays.filter((day) => !visibleDays?.length || visibleDays.includes(day.key)).map((day) => (
              <DayRow
                key={day.key}
                day={day.key}
                dayLabel={language === "en" ? day.labelEn : day.labelTh}
                classes={safeClasses.filter((item) => safeDays(item.days).includes(day.key))}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                timelineWidth={timelineWidth}
                onDropClass={onDropClass}
                onAddClassAt={onAddClassAt}
                onView={onView}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** แสดงหัวกระดาษเฉพาะในภาพที่ส่งออก พร้อมข้อมูลภาคเรียนและผู้เรียน */
function ExportHeader({
  meta,
  width
}: {
  meta: TimetableGridProps["exportMeta"];
  width: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="export-only mb-6 hidden rounded-2xl bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm ring-1 ring-slate-200" style={{ width: width - 32, marginLeft: 16 }}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("export.timetable")}</h2>
            <p className="mt-1 text-sm font-semibold tracking-wide text-primary uppercase">{t("export.university")}</p>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 border-l-2 border-slate-100 pl-6 text-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{t("app.semester")}</span>
            <span className="font-medium text-slate-900">{meta.semester || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{t("settings.studentName")}</span>
            <span className="font-medium text-slate-900">{meta.studentName || "-"}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {t("export.updatedAt", { date: meta.exportedAt })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** แสดงป้ายกำกับเวลาเหนือแนว timeline */
function TimelineHeader({
  hourLabels,
  timelineStart,
  width
}: {
  hourLabels: string[];
  timelineStart: string;
  width: number;
}) {
  return (
    <div data-export-sticky className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100" style={{ width }}>
      <div className="relative min-h-14" style={{ width }}>
        {hourLabels.map((hour, index) => {
          const isEnd = index === hourLabels.length - 1;
          return (
            <div
              key={hour}
              className="absolute top-0 h-full border-l border-slate-300 text-sm font-semibold text-slate-700"
              style={{
                left: timeToTimelineOffset(hour, timelineStart, HOUR_COLUMN_WIDTH),
                width: 0
              }}
            >
              <span
                className="absolute top-3 whitespace-nowrap"
                style={{ transform: isEnd ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
              >
                {hour}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** แสดงแถวของวันหนึ่ง รวมรายการวิชาและพื้นที่วางรายวิชา */
function DayRow({
  day,
  dayLabel,
  classes,
  timelineStart,
  timelineEnd,
  timelineWidth,
  onDropClass,
  onAddClassAt,
  onView,
  onEdit,
  onDuplicate,
  onDelete
}: {
  day: WeekDay;
  dayLabel: string;
  classes: ClassItem[];
  timelineStart: string;
  timelineEnd: string;
  timelineWidth: number;
  onDropClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  onAddClassAt: (day: WeekDay, startTime: string) => void;
  onView: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const lanes = assignLanes(classes);
  const laneCount = Math.max(1, lanes.length);
  const rowHeight = Math.max(ROW_BASE_HEIGHT, ROW_VERTICAL_PADDING * 2 + laneCount * CARD_HEIGHT);

  return (
    <>
      <div
        data-export-sticky
        className="sticky left-0 z-10 flex flex-col items-center justify-center gap-2 border-b border-r border-slate-300 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700"
        style={{ minHeight: rowHeight }}
      >
        <span>{dayLabel}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {t("results.coursesCount", { count: classes.length })}
        </span>
      </div>
      <div className="relative overflow-visible border-b border-r border-slate-200 bg-white" style={{ width: timelineWidth, height: rowHeight }}>
        <TimelineBackground
          day={day}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          onDropClass={onDropClass}
          onAddClassAt={onAddClassAt}
        />
        {lanes.flatMap((lane, laneIndex) =>
          lane.map((item) => {
            const rawLeft = timeToTimelineOffset(item.startTime, timelineStart, HOUR_COLUMN_WIDTH);
            const rawRight = timeToTimelineOffset(item.endTime, timelineStart, HOUR_COLUMN_WIDTH);
            if (rawRight <= 0 || rawLeft >= timelineWidth) return null;

            const left = clamp(rawLeft, 0, timelineWidth);
            const right = clamp(rawRight, 0, timelineWidth);
            const width = Math.max(88, right - left || durationToWidth(item.startTime, item.endTime, HOUR_COLUMN_WIDTH));

            return (
              <div
                key={`${day}-${item.id}`}
                className="absolute z-[1] p-1.5"
                style={{
                  left,
                  top: ROW_VERTICAL_PADDING + laneIndex * CARD_HEIGHT,
                  width,
                  height: CARD_HEIGHT
                }}
              >
                <ClassCard
                  item={item}
                  compact
                  dragDay={day}
                  onView={onView}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/** สร้างพื้นหลัง timeline ที่แบ่งช่วงเวลาและแปลงตำแหน่ง pointer เป็นเวลา */
function TimelineBackground({
  day,
  timelineStart,
  timelineEnd,
  onDropClass,
  onAddClassAt
}: {
  day: WeekDay;
  timelineStart: string;
  timelineEnd: string;
  onDropClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  onAddClassAt: (day: WeekDay, startTime: string) => void;
}) {
  const start = timeToMinutes(timelineStart);
  const end = timeToMinutes(timelineEnd);
  const units: string[] = [];

  for (let minute = start; minute < end; minute += DROP_STEP_MINUTES) {
    units.push(minutesToTime(minute));
  }

  /** แปลงพิกัดแนวนอนของการคลิกหรือลากวางเป็นเวลาที่ snap ตามช่วงที่กำหนด */
  function eventToTime(event: React.MouseEvent<HTMLDivElement> | React.DragEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const rawMinutes = start + ((event.clientX - rect.left) / HOUR_COLUMN_WIDTH) * 60;
    const snappedMinutes = Math.round(rawMinutes / DROP_STEP_MINUTES) * DROP_STEP_MINUTES;
    return minutesToTime(clamp(snappedMinutes, start, end - DROP_STEP_MINUTES));
  }

  const { language } = useTranslation();
  
  return (
    <div
      className="group absolute inset-0 cursor-crosshair border-l border-slate-300"
      aria-label={`Add class to ${language === "en" ? weekDays.find((item) => item.key === day)?.labelEn : weekDays.find((item) => item.key === day)?.labelTh}`}
      onClick={(event) => onAddClassAt(day, eventToTime(event))}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = readDragPayload(event.dataTransfer);
        if (payload.id) onDropClass(payload.id, day, eventToTime(event), payload.sourceDay);
      }}
    >
      {units.map((time) => {
        const left = timeToTimelineOffset(time, timelineStart, HOUR_COLUMN_WIDTH);
        const isHour = time.endsWith(":00");

        return (
          <div
            key={`${day}-${time}`}
            className={cn(
              "pointer-events-none absolute top-0 h-full border-r border-slate-100 transition-colors group-hover:bg-sky-50/30",
              isHour && "border-l border-l-slate-300"
            )}
            style={{
              left,
              width: (DROP_STEP_MINUTES / 60) * HOUR_COLUMN_WIDTH
            }}
          />
        );
      })}
    </div>
  );
}

/** แยกรายวิชาที่ทับซ้อนกันลงคนละ lane เพื่อไม่ให้การ์ดซ้อนทับกัน */
function assignLanes(classes: ClassItem[]) {
  const lanes: ClassItem[][] = [];
  const sorted = [...(Array.isArray(classes) ? classes : [])].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  sorted.forEach((item) => {
    const targetLane = lanes.find((lane) =>
      lane.every(
        (existing) =>
          timeToMinutes(existing.endTime) <= timeToMinutes(item.startTime) ||
          timeToMinutes(item.endTime) <= timeToMinutes(existing.startTime)
      )
    );

    if (targetLane) {
      targetLane.push(item);
    } else {
      lanes.push([item]);
    }
  });

  return lanes;
}

/** จำกัดตัวเลขให้อยู่ระหว่างขอบเขตต่ำสุดและสูงสุด */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** สร้างข้อมูลมิติและป้ายกำกับสำหรับ timeline ของตาราง */
function buildTimeline(startTime: string, endTime: string) {
  const timelineStart = startTime;
  const timelineEnd = endTime;
  const timelineWidth = durationToWidth(timelineStart, timelineEnd, HOUR_COLUMN_WIDTH);

  return {
    timelineStart,
    timelineEnd,
    timelineWidth,
    hourLabels: buildHourLabels(timelineStart, timelineEnd)
  };
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
