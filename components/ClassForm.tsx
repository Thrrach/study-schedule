"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { ClassItem, WeekDay } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { buildTimeOptions, timeToMinutes } from "@/lib/time";
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
  section: "",
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
  overlaps,
  timeOptions,
  timetableStart,
  timetableEnd,
  onPreview,
  onSubmit,
  onCancel
}: ClassFormProps) {
  const [value, setValue] = useState<ClassPayload>(initialValue ?? emptyClass);
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

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!hasErrors) onSubmit({ ...value, days: selectedDays });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Course code" error={submitted && errors.courseCode ? "Required" : undefined}>
          <Input value={value.courseCode} onChange={(event) => update("courseCode", event.target.value)} placeholder="344-211" />
        </Field>
        <Field label="Course name" error={submitted && errors.courseName ? "Required" : undefined}>
          <Input value={value.courseName} onChange={(event) => update("courseName", event.target.value)} placeholder="Database Systems" />
        </Field>
        <Field label="Section" error={submitted && errors.section ? "Required" : undefined}>
          <Input value={value.section} onChange={(event) => update("section", event.target.value)} placeholder="01" />
        </Field>
        <Field label="Instructor">
          <Input value={value.instructor} onChange={(event) => update("instructor", event.target.value)} placeholder="Instructor name" />
        </Field>
        <Field label="Room / building">
          <Input value={value.room} onChange={(event) => update("room", event.target.value)} placeholder="LRC 205" />
        </Field>
        <Field label="Days" error={submitted && errors.days ? "Please select at least one day." : undefined}>
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-white p-3">
            {weekDays.map((day) => (
              <label key={day.key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-primary"
                  checked={selectedDays.includes(day.key)}
                  onChange={(event) => {
                    const days = event.target.checked
                      ? [...selectedDays, day.key]
                      : selectedDays.filter((selectedDay) => selectedDay !== day.key);
                    update("days", days as WeekDay[]);
                  }}
                />
                {day.label}
              </label>
            ))}
          </div>
        </Field>
        <Field
          label="Start time"
          error={submitted && (errors.startTime || errors.range) ? `Use ${timetableStart}-${timetableEnd}` : undefined}
        >
          <Select value={value.startTime} onValueChange={(next) => update("startTime", next)}>
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
          label="End time"
          error={submitted && (errors.endTime || errors.time || errors.range) ? "End must be after start and inside range" : undefined}
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
        </Field>
      </div>

      <ColorPicker value={value.color} onChange={(color) => update("color", color)} />

      <Field label="Optional note">
        <Textarea value={value.note ?? ""} onChange={(event) => update("note", event.target.value)} placeholder="Lab group, exam reminder, or registration note" />
      </Field>

      {overlaps.length > 0 ? (
        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This class overlaps with {(Array.isArray(overlaps) ? overlaps : []).map((item) => item.courseCode).join(", ")}. You can still save it; overlapping classes will stack in the timetable row.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialValue ? "Save changes" : "Add class"}</Button>
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
