"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  FileDown,
  FileUp,
  Grid3X3,
  HardDrive,
  List,
  Plus,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Trash2,
  TriangleAlert
} from "lucide-react";
import { ClassForm } from "@/components/ClassForm";
import { ExportButton } from "@/components/ExportButton";
import { SubjectDetailDialog } from "@/components/SubjectDetailDialog";
import { TimetableGrid } from "@/components/TimetableGrid";
import { TimetableListView } from "@/components/TimetableListView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSettings } from "@/data/sample-data";
import { useTimetableStore } from "@/lib/timetable-store";
import { buildTimeOptions, generateTimeSlots, isValidTime, minutesToTime, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";
import { safeDays, subjectsShareDay } from "@/lib/subject-utils";
import type { ClassItem, ImageFormat, TimetableBackup, TimetableSettings } from "@/types/timetable";

type ClassPayload = Omit<ClassItem, "id" | "createdAt" | "updatedAt">;
type ViewMode = "grid" | "list";

const DISPLAY_START = "08:00";
const DISPLAY_END = "16:00";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    classes,
    settings,
    addClass,
    updateClass,
    duplicateClass,
    deleteClass,
    moveClass,
    updateSettings,
    resetSample,
    replaceAll,
    findOverlaps
  } = useTimetableStore();
  const [formOpen, setFormOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [draft, setDraft] = useState<ClassPayload | null>(null);
  const [newClassDefaults, setNewClassDefaults] = useState<Partial<ClassPayload>>({});
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("png");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [importError, setImportError] = useState("");
  const displayedSettings = useMemo(
    () => ({ ...settings, startTime: DISPLAY_START, endTime: DISPLAY_END, timeSlots: defaultSettings.timeSlots }),
    [settings]
  );
  const timeOptions = useMemo(() => generateTimeSlots(displayedSettings), [displayedSettings]);
  const safeClasses = useMemo(() => (Array.isArray(classes) ? classes : []), [classes]);
  const semesterOptions = useMemo(() => buildSemesterOptions(settings.semester), [settings.semester]);
  const exportDate = useMemo(() => new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }), []);

  const overlaps = draft ? findOverlaps(draft, editingClass?.id) : [];
  const totalOverlaps = useMemo(
    () =>
      safeClasses.reduce((count, item, index) => {
        const hasEarlierOverlap = safeClasses
          .slice(0, index)
          .some(
            (other) =>
              subjectsShareDay(other, item) &&
              timeToMinutes(other.startTime) < timeToMinutes(item.endTime) &&
              timeToMinutes(item.startTime) < timeToMinutes(other.endTime)
          );
        return count + (hasEarlierOverlap ? 1 : 0);
      }, 0),
    [safeClasses]
  );

  function openNewForm(defaults: Partial<ClassPayload> = {}) {
    setEditingClass(null);
    setDraft(null);
    setNewClassDefaults(defaults);
    setFormOpen(true);
  }

  function openNewFormAt(day: ClassItem["days"][number], startTime: string) {
    const start = timeToMinutes(startTime);
    const latestEnd = timeToMinutes(DISPLAY_END);
    const end = Math.min(start + 50, latestEnd);
    openNewForm({
      days: [day],
      startTime,
      endTime: minutesToTime(Math.max(start + 10, end))
    });
  }

  function openEditForm(item: ClassItem) {
    setSelectedClass(null);
    setEditingClass(item);
    setNewClassDefaults({});
    setDraft(toPayload(item));
    setFormOpen(true);
  }

  function exportJson() {
    const backup: TimetableBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      classes: safeClasses.map((item) => ({ ...item, days: safeDays(item.days) }))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "psu-timetable-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as RawTimetableImport;
      const backup = normalizeImport(parsed);
      replaceAll(backup);
      setImportError("");
    } catch {
      setImportError("นำเข้าไฟล์ไม่ได้ กรุณาใช้ไฟล์สำรอง JSON ที่ส่งออกจากหน้านี้");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-3 py-4 text-slate-950 sm:px-5 md:px-8 md:py-6">
      <div className="relative mx-auto flex max-w-[1680px] flex-col gap-4">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm no-print">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarDays className="h-4 w-4" />
                PSU Timetable
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">ตารางเรียน</h1>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
              <Select
                value={settings.semester || "none"}
                onValueChange={(semester) => updateSettings({ ...settings, semester: semester === "none" ? "" : semester })}
              >
                <SelectTrigger className="w-full sm:w-[190px]" aria-label="ภาคการศึกษา">
                  <SelectValue placeholder="ภาคการศึกษา">{settings.semester || "ภาคการศึกษา"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ภาคการศึกษา</SelectItem>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="inline-flex w-full rounded-md border bg-slate-50 p-1 sm:w-auto" aria-label="มุมมองตารางเรียน">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 flex-1 sm:flex-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                  ตาราง
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 flex-1 sm:flex-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                  รายการ
                </Button>
              </div>

              <ExportButton targetId="timetable-export" format={imageFormat} />
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setToolsOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                เครื่องมือ
              </Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 no-print">
          <Metric label="รายวิชา" value={safeClasses.length.toString()} />
          <Metric label="เวลาชนกัน" value={totalOverlaps.toString()} tone={totalOverlaps > 0 ? "warning" : "success"} />
          <Metric label="ช่วงเวลาแสดงผล" value={`${DISPLAY_START}-${DISPLAY_END}`} />
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">บันทึกแล้ว</p>
              <p className="text-xs text-slate-500">เก็บอัตโนมัติในเครื่องนี้</p>
            </div>
          </div>
        </section>

        <div className="relative">
          <div className={cn(viewMode === "grid" ? "absolute left-[-10000px] top-0 md:static" : "absolute left-[-10000px] top-0 w-max")}>
            <TimetableGrid
              classes={safeClasses}
              exportMeta={{
                semester: settings.semester ?? "",
                studentName: settings.studentName ?? "",
                exportedAt: exportDate
              }}
              onDropClass={moveClass}
              onAddClassAt={openNewFormAt}
              onView={setSelectedClass}
              onEdit={openEditForm}
              onDuplicate={duplicateClass}
              onDelete={(id) => setClassToDelete(safeClasses.find((item) => item.id === id) ?? null)}
            />
          </div>

          <div className={cn("block", viewMode === "grid" ? "md:hidden" : "md:block")}>
            <TimetableListView classes={safeClasses} onView={setSelectedClass} />
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}</DialogTitle>
          </DialogHeader>
          <ClassForm
            initialValue={editingClass}
            defaultValue={newClassDefaults}
            overlaps={overlaps}
            timeOptions={timeOptions}
            timetableStart={DISPLAY_START}
            timetableEnd={DISPLAY_END}
            onPreview={setDraft}
            onCancel={() => setFormOpen(false)}
            onSubmit={(payload) => {
              if (editingClass) updateClass(editingClass.id, payload);
              else addClass(payload);
              setFormOpen(false);
              setEditingClass(null);
              setDraft(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={toolsOpen} onOpenChange={setToolsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>ตั้งค่าและจัดการข้อมูล</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                ข้อมูลตารางและช่วงเวลา
              </div>
              <SettingsForm settings={settings} onChange={updateSettings} semesterOptions={semesterOptions} />
            </section>
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <HardDrive className="h-4 w-4" />
                เครื่องมือรายวิชาและส่งออก
              </div>
              <p className="mb-4 text-sm text-slate-500">เพิ่มรายวิชา ดาวน์โหลดรูปตาราง หรือเก็บไฟล์สำรอง JSON ไว้ใช้กับเครื่องอื่น</p>
              <div className="space-y-3">
                <Button onClick={() => openNewForm()} className="w-full justify-start">
                  <Plus className="h-4 w-4" />
                  เพิ่มรายวิชา
                </Button>
                <Select value={imageFormat} onValueChange={(value) => setImageFormat(value as ImageFormat)}>
                  <SelectTrigger aria-label="ชนิดไฟล์รูปภาพ">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">รูปภาพ PNG</SelectItem>
                    <SelectItem value="jpeg">รูปภาพ JPEG</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton targetId="timetable-export" format={imageFormat} />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={exportJson}>
                    <FileDown className="h-4 w-4" />
                    สำรอง JSON
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4" />
                    นำเข้า
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
                {importError ? <p className="text-sm text-destructive">{importError}</p> : null}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setToolsOpen(false);
                    setResetConfirmOpen(true);
                  }}
                  className="w-full justify-start"
                >
                  <RotateCcw className="h-4 w-4" />
                  คืนค่าข้อมูลตัวอย่าง
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <SubjectDetailDialog item={selectedClass} open={Boolean(selectedClass)} onOpenChange={(open) => !open && setSelectedClass(null)} />

      <Dialog open={Boolean(classToDelete)} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ลบรายวิชานี้หรือไม่?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {classToDelete?.courseCode} {classToDelete?.courseName} จะถูกนำออกจากทุกวันที่เลือกไว้
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClassToDelete(null)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (classToDelete) deleteClass(classToDelete.id);
                setClassToDelete(null);
              }}
            >
              ลบรายวิชา
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>คืนค่าข้อมูลตัวอย่างหรือไม่?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">รายวิชาและการตั้งค่าปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่าง แนะนำให้สำรอง JSON ก่อนหากยังต้องการเก็บไว้</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetSample();
                setResetConfirmOpen(false);
              }}
            >
              คืนค่าข้อมูลตัวอย่าง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SettingsForm({
  settings,
  onChange,
  semesterOptions
}: {
  settings: TimetableSettings;
  onChange: (settings: TimetableSettings) => void;
  semesterOptions: string[];
}) {
  const baseTimeOptions = useMemo(() => buildTimeOptions(10), []);
  const slots = generateTimeSlots(settings);
  const invalidRange = timeToMinutes(settings.endTime) <= timeToMinutes(settings.startTime);
  const [newSlot, setNewSlot] = useState(slots[0] ?? "08:00");

  function setSlots(timeSlots: string[]) {
    const normalized = normalizeTimeSlots(timeSlots);
    const chronologicalSlots = [...normalized].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    onChange({
      ...settings,
      timeSlots: normalized,
      startTime: chronologicalSlots[0] ?? settings.startTime,
      endTime: chronologicalSlots[chronologicalSlots.length - 1] ?? settings.endTime
    });
  }

  function updateGeneratedRange(updates: Partial<Pick<TimetableSettings, "startTime" | "endTime" | "intervalMinutes">>) {
    onChange({
      ...settings,
      ...updates,
      timeSlots: []
    });
  }

  function updateSlot(index: number, value: string) {
    if (!isValidTime(value)) return;
    const next = [...slots];
    next[index] = value;
    setSlots(next);
  }

  function moveSlot(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slots.length) return;
    const next = [...slots];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setSlots(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <Field label="ชื่อผู้เรียน">
          <Input value={settings.studentName ?? ""} onChange={(event) => onChange({ ...settings, studentName: event.target.value })} placeholder="เช่น นายสมชาย ใจดี" />
        </Field>
        <Field label="ภาคการศึกษา">
          <Select
            value={settings.semester || "none"}
            onValueChange={(semester) => onChange({ ...settings, semester: semester === "none" ? "" : semester })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ยังไม่ระบุ</SelectItem>
              {semesterOptions.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={settings.semester ?? ""}
            onChange={(event) => onChange({ ...settings, semester: event.target.value })}
            placeholder="หรือพิมพ์เอง เช่น 1/2569"
          />
        </Field>
      </div>

      <div className="rounded-md border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">
        ตารางบนหน้าเว็บและไฟล์รูปจะแสดงช่วงเวลา {DISPLAY_START}-{DISPLAY_END} เสมอ
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="เริ่ม">
          <Select value={settings.startTime} onValueChange={(startTime) => updateGeneratedRange({ startTime })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {baseTimeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="สิ้นสุด">
          <Select value={settings.endTime} onValueChange={(endTime) => updateGeneratedRange({ endTime })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {baseTimeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="ระยะห่าง (นาที)">
        <Input
          type="number"
          min={5}
          max={120}
          step={5}
          value={settings.intervalMinutes}
          onChange={(event) => updateGeneratedRange({ intervalMinutes: Number(event.target.value) })}
        />
      </Field>
      <Button type="button" variant="outline" className="w-full" onClick={() => setSlots(generateTimeSlots({ ...settings, timeSlots: [] }))}>
        สร้างช่วงเวลาใหม่
      </Button>
      <details className="group rounded-lg border bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">กำหนดช่วงเวลาเอง (ขั้นสูง)</summary>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input type="time" value={newSlot} onChange={(event) => setNewSlot(event.target.value)} />
            <Button type="button" variant="secondary" onClick={() => isValidTime(newSlot) && setSlots([...slots, newSlot])}>
              <Plus className="h-4 w-4" />
              เพิ่ม
            </Button>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {slots.map((slot, index) => (
              <div key={`${slot}-${index}`} className="flex items-center gap-2 rounded-md border bg-slate-50 p-2">
                <Input type="time" value={slot} onChange={(event) => updateSlot(index, event.target.value)} className="h-8" />
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSlot(index, -1)} disabled={index === 0} aria-label="Move time slot up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSlot(index, 1)} disabled={index === slots.length - 1} aria-label="Move time slot down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setSlots(slots.filter((_, slotIndex) => slotIndex !== index))}
                  disabled={slots.length <= 1}
                  aria-label="Remove time slot"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </details>
      {invalidRange ? <p className="text-sm text-destructive">เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม</p> : null}
    </div>
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

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <div className={`text-lg font-semibold ${tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function toPayload(item: ClassItem): ClassPayload {
  return {
    courseCode: item.courseCode,
    courseName: item.courseName,
    section: item.section,
    instructor: item.instructor,
    room: item.room,
    days: safeDays(item.days),
    startTime: item.startTime,
    endTime: item.endTime,
    color: item.color,
    note: item.note
  };
}

function buildSemesterOptions(current?: string) {
  const buddhistYear = new Date().getFullYear() + 543;
  const options = [
    `1/${buddhistYear}`,
    `2/${buddhistYear}`,
    `ฤดูร้อน/${buddhistYear}`,
    `1/${buddhistYear + 1}`,
    `2/${buddhistYear + 1}`
  ];

  return current && !options.includes(current) ? [current, ...options] : options;
}

type RawTimetableImport = Partial<TimetableBackup> & {
  subjects?: unknown;
  classes?: unknown;
};

function normalizeImport(value: RawTimetableImport): TimetableBackup {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid backup");
  }

  const rawClasses = Array.isArray(value.classes) ? value.classes : Array.isArray(value.subjects) ? value.subjects : null;
  if (!rawClasses) {
    throw new Error("Invalid backup");
  }

  return {
    version: 1,
    exportedAt: value.exportedAt ?? new Date().toISOString(),
    settings: value.settings ?? defaultSettings,
    classes: rawClasses as TimetableBackup["classes"]
  };
}
