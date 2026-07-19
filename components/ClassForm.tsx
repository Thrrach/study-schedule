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
import { useTranslation } from "@/lib/i18n";

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
  note: "",
  credits: 3,
  classType: "lecture",
  status: "planned",
  onlineUrl: "",
  midtermDate: "",
  finalDate: ""
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

/** ฟอร์มเพิ่มหรือแก้ไขรายวิชา พร้อมตรวจสอบข้อมูลและแสดงตัวอย่างแบบทันที */
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
    const { t, language } = useTranslation();
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

  /** อัปเดตฟิลด์ในฟอร์มและแจ้งข้อมูลล่าสุดเพื่อแสดงตัวอย่าง */
  function update<K extends keyof ClassPayload>(key: K, nextValue: ClassPayload[K]) {
    const next = { ...value, [key]: nextValue };
    setValue(next);
    onPreview(next, initialValue?.id);
  }

  /** เปลี่ยนเวลาเริ่มและเลื่อนเวลาสิ้นสุดเมื่อจำเป็นเพื่อให้คาบยังถูกต้อง */
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

  /** ตั้งเวลาสิ้นสุดตามระยะเวลาคาบที่ผู้ใช้เลือก */
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
      <p className="-mt-1 text-sm text-muted-foreground">{t("form.description")}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("form.code")} error={submitted && errors.courseCode ? t("form.required") : undefined}>
          <Input autoFocus value={value.courseCode} onChange={(event) => update("courseCode", event.target.value)} placeholder={t("form.codePlaceholder")} />
        </Field>
        <Field label={t("form.name")} error={submitted && errors.courseName ? t("form.required") : undefined}>
          <Input value={value.courseName} onChange={(event) => update("courseName", event.target.value)} placeholder={t("form.namePlaceholder")} />
        </Field>
        <Field label={t("form.section")} error={submitted && errors.section ? t("form.required") : undefined}>
          <Input value={value.section} onChange={(event) => update("section", event.target.value)} placeholder="01" />
        </Field>
        <Field label={t("form.days")} error={submitted && errors.days ? t("form.selectDay") : undefined}>
          <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/50 p-2">
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
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedDays.includes(day.key) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
              >
                {language === "en" ? day.shortLabelEn : day.shortLabelTh}
              </button>
            ))}
          </div>
        </Field>
        <Field
          label={t("form.startTime")}
          error={submitted && (errors.startTime || errors.range) ? t("form.timeRange", { start: timetableStart, end: timetableEnd }) : undefined}
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
          label={t("form.endTime")}
          error={submitted && (errors.endTime || errors.time || errors.range) ? t("form.endTimeError") : undefined}
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
            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
            {[50, 60, 120, 180].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDuration(minutes)}
                className="rounded-lg border bg-card px-2 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {minutes < 60 ? t("form.minutes", { count: minutes }) : t("form.hours", { count: minutes / 60 })}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <ColorPicker value={value.color} onChange={(color) => update("color", color)} />

      <details className="rounded-xl border bg-muted/35 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">{t("form.additional")}</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label={t("form.credits")}>
            <Input type="number" min={0} max={30} step={0.5} value={value.credits ?? 0} onChange={(event) => update("credits", Number(event.target.value))} />
          </Field>
          <Field label={t("form.classType")}>
            <Select value={value.classType ?? "lecture"} onValueChange={(classType) => update("classType", classType as ClassPayload["classType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">{t("form.typeLecture")}</SelectItem>
                <SelectItem value="lab">{t("form.typeLab")}</SelectItem>
                <SelectItem value="tutorial">{t("form.typeTutorial")}</SelectItem>
                <SelectItem value="online">{t("form.typeOnline")}</SelectItem>
                <SelectItem value="other">{t("form.typeOther")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("form.enrollmentStatus")}>
            <Select value={value.status ?? "planned"} onValueChange={(status) => update("status", status as ClassPayload["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">{t("form.statusPlanned")}</SelectItem>
                <SelectItem value="enrolled">{t("form.statusEnrolled")}</SelectItem>
                <SelectItem value="waitlisted">{t("form.statusWaitlisted")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("form.onlineUrl")}>
            <Input type="url" value={value.onlineUrl ?? ""} onChange={(event) => update("onlineUrl", event.target.value)} placeholder="https://..." />
          </Field>
          <Field label={t("form.midtermDate")}>
            <Input type="date" value={value.midtermDate ?? ""} onChange={(event) => update("midtermDate", event.target.value)} />
          </Field>
          <Field label={t("form.finalDate")}>
            <Input type="date" value={value.finalDate ?? ""} onChange={(event) => update("finalDate", event.target.value)} />
          </Field>
          <Field label={t("form.instructor")}>
            <Input value={value.instructor} onChange={(event) => update("instructor", event.target.value)} placeholder={t("form.instructorPlaceholder")} />
          </Field>
          <Field label={t("form.room")}>
            <Input value={value.room} onChange={(event) => update("room", event.target.value)} placeholder={t("form.roomPlaceholder")} />
          </Field>
          <div className="md:col-span-2">
            <Field label={t("form.note")}>
              <Textarea value={value.note ?? ""} onChange={(event) => update("note", event.target.value)} placeholder={t("form.notePlaceholder")} />
            </Field>
          </div>
        </div>
      </details>

      {overlaps.length > 0 ? (
        <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t("form.overlapDetail", { courses: (Array.isArray(overlaps) ? overlaps : []).map((item) => item.courseCode).join(", ") })}
          </p>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit">{t("form.save")}</Button>
      </div>
    </form>
  );
}

/** จัดโครงป้ายกำกับ ช่องกรอก และข้อความแจ้งข้อผิดพลาดของฟอร์ม */
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
