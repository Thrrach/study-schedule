"use client";

import { CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSubjectTheme } from "@/lib/subject-theme";
import { safeDays } from "@/lib/subject-utils";
import type { ClassItem } from "@/types/timetable";
import { weekDays } from "@/types/timetable";

interface SubjectDetailDialogProps {
  item: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubjectDetailDialog({ item, open, onOpenChange }: SubjectDetailDialogProps) {
  const theme = item ? getSubjectTheme(item) : null;
  const dayLabels = item
    ? safeDays(item.days)
        .map((day) => weekDays.find((weekDay) => weekDay.key === day)?.label ?? day)
        .join(", ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดรายวิชา</DialogTitle>
        </DialogHeader>
        {item && theme ? (
          <div className="space-y-5">
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text }}
            >
              <div className="text-sm font-semibold">{item.courseCode}</div>
              <h2 className="mt-1 text-xl font-semibold leading-snug">{item.courseName}</h2>
              <div className="mt-2 inline-flex rounded border bg-white/70 px-2 py-1 text-xs font-semibold">
                {theme.label}
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Section" value={item.section || "-"} />
              <Detail label="จำนวนหน่วยกิต" value="-" />
              <Detail icon={<UserRound className="h-4 w-4" />} label="อาจารย์" value={item.instructor || "-"} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="ห้องเรียน" value={item.room || "-"} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="วันเรียน" value={dayLabels || "-"} />
              <Detail icon={<Clock3 className="h-4 w-4" />} label="เวลาเรียน" value={`${item.startTime} - ${item.endTime}`} />
            </dl>

            <div className="rounded-lg border bg-slate-50 p-4">
              <dt className="text-sm font-semibold text-slate-700">คำอธิบายรายวิชา</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">{item.note || "ไม่มีคำอธิบายเพิ่มเติม"}</dd>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

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
