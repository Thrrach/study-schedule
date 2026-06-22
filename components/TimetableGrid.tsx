"use client";

import { useMemo } from "react";
import { ClassCard } from "@/components/ClassCard";
import {
  buildHourLabels,
  durationToWidth,
  isValidTime,
  minutesToTime,
  timeToMinutes,
  timeToTimelineOffset
} from "@/lib/time";
import { cn } from "@/lib/utils";
import { safeDays } from "@/lib/subject-utils";
import type { ClassItem, TimetableSettings, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";

const TIMETABLE_START_HOUR = 8;
const TIMETABLE_END_HOUR = 16;
const HOUR_COLUMN_WIDTH = 180;
const DROP_STEP_MINUTES = 10;
const CARD_HEIGHT = 100;
const ROW_BASE_HEIGHT = 120;
const ROW_VERTICAL_PADDING = 10;

interface TimetableGridProps {
  classes: ClassItem[];
  settings: TimetableSettings;
  onDropClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  onAddClassAt: (day: WeekDay, startTime: string) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TimetableGrid({
  classes,
  settings,
  onDropClass,
  onAddClassAt,
  onEdit,
  onDuplicate,
  onDelete
}: TimetableGridProps) {
  const safeClasses = Array.isArray(classes) ? classes : [];
  const { timelineStart, timelineEnd, timelineWidth, hourLabels } = useMemo(
    () => buildTimeline(settings),
    [settings]
  );

  return (
    <section className="print-full overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-2 border-b bg-white px-4 py-3 sm:flex-row sm:items-end sm:px-5 sm:py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prince of Songkla University</p>
          <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">ตารางเรียนประจำสัปดาห์</h2>
        </div>
        <p className="text-xs text-slate-500 no-print">คลิกพื้นที่ว่างเพื่อเพิ่มวิชา • ลากการ์ดเพื่อย้ายเวลา</p>
      </div>

      <div className="max-h-[calc(100vh-180px)] overflow-auto scroll-smooth bg-white">
        <div
          id="timetable-export"
          className="grid w-max min-w-full bg-white"
          style={{ gridTemplateColumns: `116px ${timelineWidth}px` }}
        >
          <div
            data-export-sticky
            className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-3 py-3"
          />
          <TimelineHeader hourLabels={hourLabels} timelineStart={timelineStart} width={timelineWidth} />

          {weekDays.map((day) => (
            <DayRow
              key={day.key}
              day={day.key}
              dayLabel={day.label}
              classes={safeClasses.filter((item) => safeDays(item.days).includes(day.key))}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              timelineWidth={timelineWidth}
              onDropClass={onDropClass}
              onAddClassAt={onAddClassAt}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <div
      data-export-sticky
      className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100"
      style={{ width }}
    >
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

function DayRow({
  day,
  dayLabel,
  classes,
  timelineStart,
  timelineEnd,
  timelineWidth,
  onDropClass,
  onAddClassAt,
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
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const lanes = assignLanes(classes);
  const laneCount = Math.max(1, lanes.length);
  const rowHeight = Math.max(ROW_BASE_HEIGHT, ROW_VERTICAL_PADDING * 2 + laneCount * CARD_HEIGHT);

  return (
    <>
      <div
        data-export-sticky
        className="sticky left-0 z-10 flex items-center border-b border-r border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
        style={{ minHeight: rowHeight }}
      >
        {dayLabel}
      </div>
      <div
        className="relative overflow-hidden border-b border-r border-slate-200 bg-white"
        style={{ width: timelineWidth, height: rowHeight }}
      >
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
            const width = Math.max(28, right - left || durationToWidth(item.startTime, item.endTime, HOUR_COLUMN_WIDTH));

            return (
              <div
                key={item.id}
                className="absolute z-[1] p-1"
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

  return (
    <div
      className="group absolute inset-0 cursor-crosshair border-l border-slate-300"
      title={`เพิ่มรายวิชาใน${weekDays.find((item) => item.key === day)?.label ?? day}`}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const rawMinutes = start + ((event.clientX - rect.left) / HOUR_COLUMN_WIDTH) * 60;
        const snappedMinutes = Math.round(rawMinutes / DROP_STEP_MINUTES) * DROP_STEP_MINUTES;
        onAddClassAt(day, minutesToTime(clamp(snappedMinutes, start, end - DROP_STEP_MINUTES)));
      }}
    >
      {units.map((time) => {
        const left = timeToTimelineOffset(time, timelineStart, HOUR_COLUMN_WIDTH);
        const isHour = time.endsWith(":00");

        return (
          <div
            key={`${day}-${time}`}
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

function assignLanes(classes: ClassItem[]) {
  const lanes: ClassItem[][] = [];
  const sorted = [...(Array.isArray(classes) ? classes : [])].sort((a, b) => a.createdAt - b.createdAt);

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildTimeline(settings: TimetableSettings) {
  const fallbackStart = `${TIMETABLE_START_HOUR.toString().padStart(2, "0")}:00`;
  const fallbackEnd = `${TIMETABLE_END_HOUR.toString().padStart(2, "0")}:00`;
  const settingsStart = isValidTime(settings.startTime) ? settings.startTime : fallbackStart;
  const settingsEnd = isValidTime(settings.endTime) ? settings.endTime : fallbackEnd;
  const hasValidRange = timeToMinutes(settingsEnd) > timeToMinutes(settingsStart);
  const start = hasValidRange ? settingsStart : fallbackStart;
  const end = hasValidRange ? settingsEnd : fallbackEnd;
  const timelineStart = start;
  const timelineEnd = end;
  const timelineWidth = Math.max(HOUR_COLUMN_WIDTH, durationToWidth(timelineStart, timelineEnd, HOUR_COLUMN_WIDTH));

  return {
    timelineStart,
    timelineEnd,
    timelineWidth,
    hourLabels: buildHourLabels(timelineStart, timelineEnd)
  };
}

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
