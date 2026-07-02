"use client";

import { Clock3, MapPin, UserRound } from "lucide-react";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import { timeToMinutes } from "@/lib/time";
import type { ClassItem } from "@/types/timetable";
import { weekDays } from "@/types/timetable";

interface TimetableListViewProps {
  classes: ClassItem[];
  onView: (item: ClassItem) => void;
}

export function TimetableListView({ classes, onView }: TimetableListViewProps) {
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <section className="space-y-3">
      {weekDays.map((day) => {
        const dayClasses = safeClasses
          .filter((item) => safeDays(item.days).includes(day.key))
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        return (
          <div key={day.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">{day.label}</div>
              <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {dayClasses.length} รายวิชา
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {dayClasses.length ? (
                dayClasses.map((item) => {
                  const theme = getSubjectTheme(item);

                  return (
                    <button
                      key={`${day.key}-${item.id}`}
                      type="button"
                      className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:grid-cols-[138px_1fr]"
                      onClick={() => onView(item)}
                    >
                      <div className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                        <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <div>{item.startTime} - {item.endTime}</div>
                          <div className="mt-1 text-xs font-medium text-slate-500">กลุ่ม {item.section || "-"}</div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
                          >
                            {theme.label}
                          </span>
                          <span className="text-sm font-bold text-slate-950">{item.courseCode}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-5 text-slate-800">{item.courseName}</div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          {item.room ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {item.room}
                            </span>
                          ) : null}
                          {item.instructor ? (
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {item.instructor}
                            </span>
                          ) : null}
                        </div>
                        {item.note ? <div className="mt-2 text-xs leading-5 text-slate-500">{item.note}</div> : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-5 text-sm text-slate-500">วันนี้ไม่มีรายวิชา</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
