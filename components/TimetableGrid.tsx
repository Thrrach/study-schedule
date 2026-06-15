"use client";

import { useMemo } from "react";
import { ClassCard } from "@/components/ClassCard";
import {
  buildHourLabels,
  durationToWidth,
  minutesToTime,
  timeToMinutes,
  timeToTimelineOffset
} from "@/lib/time";
import { cn } from "@/lib/utils";
import type { ClassItem, TimetableSettings, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";

const TIMETABLE_START_HOUR = 8;
const TIMETABLE_END_HOUR = 18;
const HOUR_COLUMN_WIDTH = 132;
const DROP_STEP_MINUTES = 10;
const LANE_HEIGHT = 92;

interface TimetableGridProps {
  classes: ClassItem[];
  settings: TimetableSettings;
  onDropClass: (id: string, day: WeekDay, startTime: string) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TimetableGrid({
  classes,
  onDropClass,
  onEdit,
  onDuplicate,
  onDelete
}: TimetableGridProps) {
  const timelineStart = `${TIMETABLE_START_HOUR.toString().padStart(2, "0")}:00`;
  const timelineEnd = `${TIMETABLE_END_HOUR.toString().padStart(2, "0")}:00`;
  const hourLabels = useMemo(() => buildHourLabels(timelineStart, timelineEnd), [timelineEnd, timelineStart]);
  const timelineWidth = (TIMETABLE_END_HOUR - TIMETABLE_START_HOUR) * HOUR_COLUMN_WIDTH;

  return (
    <section className="print-full overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prince of Songkla University</p>
        <h2 className="text-xl font-semibold text-slate-950">Weekly Class Timetable</h2>
        <p className="text-sm text-slate-500">
          Subjects are positioned from real start and end times against fixed hour columns
        </p>
      </div>

      <div className="max-h-[72vh] overflow-auto bg-white">
        <div
          id="timetable-export"
          className="grid w-max min-w-full bg-white"
          style={{ gridTemplateColumns: `116px ${timelineWidth}px` }}
        >
          <div className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-3 py-3" />
          <TimelineHeader hourLabels={hourLabels} timelineStart={timelineStart} width={timelineWidth} />

          {weekDays.map((day) => (
            <DayRow
              key={day.key}
              day={day.key}
              dayLabel={day.label}
              classes={classes.filter((item) => item.days.includes(day.key))}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              timelineWidth={timelineWidth}
              onDropClass={onDropClass}
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
    <div className="sticky top-0 z-20 border-b border-slate-300 bg-slate-100" style={{ width }}>
      <div className="relative min-h-14" style={{ width }}>
        {hourLabels.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 h-full border-l border-slate-300 px-2 py-3 text-xs font-semibold text-slate-700"
            style={{
              left: timeToTimelineOffset(hour, timelineStart, HOUR_COLUMN_WIDTH),
              width: HOUR_COLUMN_WIDTH
            }}
          >
            {hour}
          </div>
        ))}
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
  onDropClass: (id: string, day: WeekDay, startTime: string) => void;
  onEdit: (item: ClassItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const lanes = assignLanes(classes);
  const laneCount = Math.max(1, lanes.length);
  const rowHeight = laneCount * LANE_HEIGHT;

  return (
    <>
      <div className="sticky left-0 z-10 flex items-center border-b border-r border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700" style={{ minHeight: rowHeight }}>
        {dayLabel}
      </div>
      <div className="relative border-b border-slate-200 bg-white" style={{ width: timelineWidth, height: rowHeight }}>
        <TimelineBackground
          day={day}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          onDropClass={onDropClass}
        />
        {lanes.flatMap((lane, laneIndex) =>
          lane.map((item) => {
            const left = clamp(timeToTimelineOffset(item.startTime, timelineStart, HOUR_COLUMN_WIDTH), 0, timelineWidth);
            const right = clamp(timeToTimelineOffset(item.endTime, timelineStart, HOUR_COLUMN_WIDTH), 0, timelineWidth);
            const width = Math.max(28, right - left || durationToWidth(item.startTime, item.endTime, HOUR_COLUMN_WIDTH));

            return (
              <div
                key={item.id}
                className="absolute z-[1] p-1.5"
                style={{
                  left,
                  top: laneIndex * LANE_HEIGHT,
                  width,
                  height: LANE_HEIGHT
                }}
              >
                <ClassCard
                  item={item}
                  compact
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
  onDropClass
}: {
  day: WeekDay;
  timelineStart: string;
  timelineEnd: string;
  onDropClass: (id: string, day: WeekDay, startTime: string) => void;
}) {
  const start = timeToMinutes(timelineStart);
  const end = timeToMinutes(timelineEnd);
  const units: string[] = [];

  for (let minute = start; minute < end; minute += DROP_STEP_MINUTES) {
    units.push(minutesToTime(minute));
  }

  return (
    <div className="absolute inset-0">
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
              const id = event.dataTransfer.getData("text/plain");
              if (id) onDropClass(id, day, time);
            }}
            className={cn(
              "absolute top-0 h-full border-r border-slate-100 transition-colors hover:bg-sky-50/60",
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
  const sorted = [...classes].sort((a, b) => a.createdAt - b.createdAt);

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
