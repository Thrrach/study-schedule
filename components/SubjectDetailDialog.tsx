"use client";

import { CalendarDays, Clock3, MapPin, StickyNote, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import type { ClassItem } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { useTranslation } from "@/lib/i18n";

interface SubjectDetailDialogProps {
  item: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** แสดงรายละเอียดทั้งหมดของรายวิชาที่เลือกใน dialog */
export function SubjectDetailDialog({ item, open, onOpenChange }: SubjectDetailDialogProps) {
  const { t, language } = useTranslation();
  const theme = item ? getSubjectTheme(item) : null;
  const dayLabels = item
    ? safeDays(item.days)
        .map((day) => language === "en" ? weekDays.find((weekDay) => weekDay.key === day)?.labelEn : weekDays.find((weekDay) => weekDay.key === day)?.labelTh ?? day)
    : [];
  const shortDayLabels = item
    ? safeDays(item.days)
        .map((day) => language === "en" ? weekDays.find((weekDay) => weekDay.key === day)?.shortLabelEn : weekDays.find((weekDay) => weekDay.key === day)?.shortLabelTh ?? day)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("dialog.detailTitle")}</DialogTitle>
        </DialogHeader>
        {item && theme ? (
          <div className="space-y-5">
            <div
              className="overflow-hidden rounded-lg border"
              style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
            >
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="rounded-full bg-white/75 px-2.5 py-1 text-sm font-bold ring-1 ring-black/5">
                    {item.courseCode}
                  </div>
                  <div className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5">
                    {t("card.sec")} {item.section || "-"}
                  </div>
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-snug">{item.courseName}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className="rounded-full bg-white/65 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5">
                    {theme.label}
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail icon={<UserRound className="h-4 w-4" />} label={t("form.instructor")} value={item.instructor || "-"} />
              <Detail icon={<MapPin className="h-4 w-4" />} label={t("form.room")} value={item.room || "-"} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label={t("form.days")} value={dayLabels.join(", ") || "-"} />
              <Detail icon={<Clock3 className="h-4 w-4" />} label={t("filter.sortTime")} value={`${item.startTime} - ${item.endTime}`} />
              <Detail label={language === "en" ? "Credits" : "หน่วยกิต"} value={String(item.credits ?? 0)} />
              <Detail label={language === "en" ? "Class type" : "ประเภทคาบ"} value={item.classType ?? "lecture"} />
              <Detail label={language === "en" ? "Status" : "สถานะ"} value={item.status ?? "planned"} />
              <Detail label={language === "en" ? "Midterm / Final" : "กลางภาค / ปลายภาค"} value={`${item.midtermDate || "-"} / ${item.finalDate || "-"}`} />
            </dl>

            {item.onlineUrl ? <a className="block rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-800 hover:bg-sky-100" href={item.onlineUrl} target="_blank" rel="noreferrer">{language === "en" ? "Open online classroom" : "เปิดห้องเรียนออนไลน์"}</a> : null}

            <div className="flex flex-wrap gap-2">
              {shortDayLabels.map((label) => (
                <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {label}
                </span>
              ))}
            </div>

            <div className="rounded-lg border bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <StickyNote className="h-4 w-4" />
                {t("dialog.detailNote")}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{item.note || t("dialog.noNote")}</dd>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** แสดงข้อมูลรายละเอียดหนึ่งรายการพร้อมไอคอนและป้ายกำกับ */
function Detail({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
