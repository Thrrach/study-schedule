"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import type { ClassItem, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { buildTimeOptions, minutesToTime, timeToMinutes } from "@/lib/time";
import { safeDays } from "@/lib/subject-utils";
import { ColorPicker } from "@/components/ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ClassPayload = Omit<ClassItem, "id" | "createdAt" | "updatedAt">;

const emptyClass: ClassPayload = {
  courseCode: "",
  courseName: "",
  section: "01",
  instructor: "",
  room: "",
  days: [],
  startTime: "08:00",
  endTime: "08:50",
  color: "#0f766e",
  note: ""
};

interface ClassFormProps {
  initialValue?: ClassItem | null;
  defaultValue?: Partial<ClassPayload>;
  overlaps: ClassItem[];
  timeOptions: string[];
  timetableStart: string;
  timetableEnd: string;
  onPreview: (value: ClassPayload, editingId?: string) => void;
  onSubmit: (value: ClassPayload) => void;
  onCancel: () => void;
}

export function ClassForm({
  initialValue,
  defaultValue,
  overlaps,
  timeOptions,
  timetableStart,
  timetableEnd,
  onPreview,
  onSubmit,
  onCancel
}: ClassFormProps) {
  const [value, setValue] = useState<ClassPayload>(() => ({
    ...emptyClass,
    ...(defaultValue ?? {}),
    ...(initialValue ?? {}),
    days: safeDays(initialValue?.days ?? defaultValue?.days ?? emptyClass.days)
  }));
  const [submitted, setSubmitted] = useState(false);
  const selectedDays = safeDays(value.days);
  const selectableTimes = useMemo(
    () => Array.from(new Set([...(Array.isArray(timeOptions) ? timeOptions : []), ...buildTimeOptions(10)])).sort((a, b) => timeToMinutes(a) - timeToMinutes(b)),
    [timeOptions]
  );

  const errors = {
    courseCode: !value.courseCode.trim(),
    courseName: !value.courseName.trim(),
    section: !value.section.trim(),
    days: selectedDays.length === 0,
    startTime: !value.startTime,
    endTime: !value.endTime,
    time: timeToMinutes(value.endTime) <= timeToMinutes(value.startTime),
    range:
      timeToMinutes(value.startTime) < timeToMinutes(timetableStart) ||
      timeToMinutes(value.endTime) > timeToMinutes(timetableEnd)
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function update<K extends keyof ClassPayload>(key: K, nextValue: ClassPayload[K]) {
    const next = { ...value, [key]: nextValue };
    setValue(next);
    onPreview(next, initialValue?.id);
  }

  function updateStartTime(startTime: string) {
    const currentEnd = timeToMinutes(value.endTime);
    const start = timeToMinutes(startTime);
    const timetableEndMinutes = timeToMinutes(timetableEnd);
    const endTime = currentEnd > start
      ? value.endTime
      : minutesToTime(Math.min(start + 50, timetableEndMinutes));
    const next = { ...value, startTime, endTime };
    setValue(next);
    onPreview(next, initialValue?.id);
  }

  function setDuration(minutes: number) {
    const end = Math.min(timeToMinutes(value.startTime) + minutes, timeToMinutes(timetableEnd));
    update("endTime", minutesToTime(end));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!hasErrors) onSubmit({ ...value, days: selectedDays });
      }}
    >
      <p className="-mt-1 text-sm text-slate-500">กรอกข้อมูลหลักก่อน ส่วนผู้สอน ห้อง และหมายเหตุสามารถเพิ่มภายหลังได้</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="รหัสวิชา" error={submitted && errors.courseCode ? "จำเป็น" : undefined}>
          <Input autoFocus value={value.courseCode} onChange={(event) => update("courseCode", event.target.value)} placeholder="เช่น 344-211" />
        </Field>
        <Field label="ชื่อวิชา" error={submitted && errors.courseName ? "จำเป็น" : undefined}>
          <Input value={value.courseName} onChange={(event) => update("courseName", event.target.value)} placeholder="เช่น Database Systems" />
        </Field>
        <Field label="กลุ่ม (Sec)" error={submitted && errors.section ? "จำเป็น" : undefined}>
          <Input value={value.section} onChange={(event) => update("section", event.target.value)} placeholder="01" />
        </Field>
        <Field label="วันที่เรียน" error={submitted && errors.days ? "เลือกอย่างน้อย 1 วัน" : undefined}>
          <div className="flex flex-wrap gap-2 rounded-md border bg-slate-50 p-2">
            {weekDays.map((day) => (
              <button
                key={day.key}
                type="button"
                aria-pressed={selectedDays.includes(day.key)}
                onClick={() => {
                  const days = selectedDays.includes(day.key)
                    ? selectedDays.filter((selectedDay) => selectedDay !== day.key)
                    : [...selectedDays, day.key];
                  update("days", days as WeekDay[]);
                }}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${selectedDays.includes(day.key) ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-sky-50"}`}
              >
                {day.shortLabel}
              </button>
            ))}
          </div>
        </Field>
        <Field
          label="เวลาเริ่ม"
          error={submitted && (errors.startTime || errors.range) ? `เลือกภายใน ${timetableStart}–${timetableEnd}` : undefined}
        >
          <Select value={value.startTime} onValueChange={updateStartTime}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectableTimes.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="เวลาสิ้นสุด"
          error={submitted && (errors.endTime || errors.time || errors.range) ? "ต้องอยู่หลังเวลาเริ่มและไม่เกินช่วงตาราง" : undefined}
        >
          <Select value={value.endTime} onValueChange={(next) => update("endTime", next)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectableTimes.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            {[50, 60, 120, 180].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDuration(minutes)}
                className="rounded border bg-white px-2 py-1 text-xs text-slate-600 hover:border-primary/40 hover:text-primary"
              >
                {minutes < 60 ? `${minutes} นาที` : `${minutes / 60} ชม.`}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <ColorPicker value={value.color} onChange={(color) => update("color", color)} />

      <details className="rounded-lg border bg-slate-50/70 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">ข้อมูลเพิ่มเติม (ไม่บังคับ)</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="ผู้สอน">
            <Input value={value.instructor} onChange={(event) => update("instructor", event.target.value)} placeholder="ชื่อผู้สอน" />
          </Field>
          <Field label="ห้อง / อาคาร">
            <Input value={value.room} onChange={(event) => update("room", event.target.value)} placeholder="เช่น LRC 205" />
          </Field>
          <div className="md:col-span-2">
            <Field label="หมายเหตุ">
              <Textarea value={value.note ?? ""} onChange={(event) => update("note", event.target.value)} placeholder="เช่น กลุ่มแล็บ หรือสิ่งที่ต้องเตรียม" />
            </Field>
          </div>
        </div>
      </details>

      {overlaps.length > 0 ? (
        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            เวลาชนกับวิชา {(Array.isArray(overlaps) ? overlaps : []).map((item) => item.courseCode).join(", ")} แต่ยังสามารถบันทึกได้ โดยตารางจะแยกเป็นอีกแถวให้
          </p>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit">{initialValue ? "บันทึกการแก้ไข" : "เพิ่มลงตาราง"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
      </div>
      {children}
    </div>
  );
}
