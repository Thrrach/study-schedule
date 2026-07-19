"use client";

import { Clock3, MapPin, UserRound } from "lucide-react";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import { timeToMinutes } from "@/lib/time";
import type { ClassItem, Day } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { useTranslation } from "@/lib/i18n";

interface TimetableListViewProps {
  classes: ClassItem[];
  onView: (item: ClassItem) => void;
  visibleDays?: Day[];
}

/** แสดงตารางเรียนแบบรายการ โดยจัดกลุ่มและเรียงรายวิชาตามวัน */
export function TimetableListView({ classes, onView, visibleDays }: TimetableListViewProps) {
  const { t, language } = useTranslation();
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <section className="space-y-3">
      {weekDays.filter((day) => !visibleDays?.length || visibleDays.includes(day.key)).map((day) => {
        const dayClasses = safeClasses
          .filter((item) => safeDays(item.days).includes(day.key))
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        return (
          <div key={day.key} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-4 py-3">
              <div className="text-sm font-bold text-foreground">{language === "en" ? day.labelEn : day.labelTh}</div>
              <div className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                {t("results.coursesCount", { count: dayClasses.length })}
              </div>
            </div>
            <div className="divide-y divide-border">
              {dayClasses.length ? (
                dayClasses.map((item) => {
                  const theme = getSubjectTheme(item, language);

                  return (
                    <button
                      key={`${day.key}-${item.id}`}
                      type="button"
                      className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:grid-cols-[138px_1fr]"
                      onClick={() => onView(item)}
                    >
                      <div className="flex items-start gap-2 text-sm font-semibold text-foreground">
                        <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{item.startTime} - {item.endTime}</div>
                          <div className="mt-1 text-xs font-medium text-muted-foreground">{t("card.sec")} {item.section || "-"}</div>
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
                          <span className="text-sm font-bold text-foreground">{item.courseCode}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-5 text-foreground">{item.courseName}</div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                        {item.note ? <div className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</div> : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-5 text-sm text-muted-foreground">{t("list.noClasses")}</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
