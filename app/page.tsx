"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  FileDown,
  FileUp,
  HardDrive,
  Plus,
  Printer,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Trash2,
  TriangleAlert
} from "lucide-react";
import { ClassForm } from "@/components/ClassForm";
import { ExportButton } from "@/components/ExportButton";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSettings } from "@/data/sample-data";
import { useTimetableStore } from "@/lib/timetable-store";
import { buildTimeOptions, generateTimeSlots, isValidTime, minutesToTime, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { safeDays, subjectsShareDay } from "@/lib/subject-utils";
import type { ClassItem, TimetableBackup, TimetableSettings } from "@/types/timetable";

type ClassPayload = Omit<ClassItem, "id" | "createdAt" | "updatedAt">;

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
  const [draft, setDraft] = useState<ClassPayload | null>(null);
  const [newClassDefaults, setNewClassDefaults] = useState<Partial<ClassPayload>>({});
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [importError, setImportError] = useState("");
  const timeOptions = useMemo(() => generateTimeSlots(settings), [settings]);
  const safeClasses = useMemo(() => (Array.isArray(classes) ? classes : []), [classes]);

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
    const latestEnd = timeToMinutes(settings.endTime);
    const end = Math.min(start + 50, latestEnd);
    openNewForm({
      days: [day],
      startTime,
      endTime: minutesToTime(Math.max(start + 10, end))
    });
  }

  function openEditForm(item: ClassItem) {
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#edf5f4_100%)] px-3 py-4 text-slate-950 sm:px-5 md:px-8 md:py-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="flex flex-col justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center no-print">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              PSU Timetable
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">จัดตารางเรียนของฉัน</h1>
            <p className="mt-1 text-sm text-slate-600">เพิ่มวิชา จัดเวลา และบันทึกไว้ในเบราว์เซอร์เครื่องนี้โดยอัตโนมัติ</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button onClick={() => openNewForm()} className="col-span-2 sm:col-span-1">
              <Plus className="h-4 w-4" />
              เพิ่มรายวิชา
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              พิมพ์
            </Button>
            <Button variant="outline" onClick={() => setToolsOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              เครื่องมือ
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 no-print">
          <Metric label="รายวิชา" value={safeClasses.length.toString()} />
          <Metric
            label="เวลาชนกัน"
            value={totalOverlaps.toString()}
            tone={totalOverlaps > 0 ? "warning" : "success"}
          />
          <Metric label="ช่วงเวลา" value={`${settings.startTime}–${settings.endTime}`} />
          <div className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">บันทึกแล้ว</p>
              <p className="truncate text-xs text-slate-500">เก็บอัตโนมัติในเครื่องนี้</p>
            </div>
          </div>
        </section>

        <TimetableGrid
          classes={safeClasses}
          settings={settings}
          onDropClass={moveClass}
          onAddClassAt={openNewFormAt}
          onEdit={openEditForm}
          onDuplicate={duplicateClass}
          onDelete={(id) => setClassToDelete(safeClasses.find((item) => item.id === id) ?? null)}
        />
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
            timetableStart={settings.startTime}
            timetableEnd={settings.endTime}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ตั้งค่าและจัดการข้อมูล</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                ช่วงเวลาของตาราง
              </div>
              <SettingsForm settings={settings} onChange={updateSettings} />
            </section>
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <HardDrive className="h-4 w-4" />
                ส่งออกและสำรองข้อมูล
              </div>
              <p className="mb-4 text-sm text-slate-500">ดาวน์โหลดตารางเป็นรูป หรือเก็บไฟล์สำรองไว้ใช้เครื่องอื่น</p>
              <div className="space-y-3">
                <Select value={imageFormat} onValueChange={(value) => setImageFormat(value as "png" | "jpeg")}>
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
  onChange
}: {
  settings: TimetableSettings;
  onChange: (settings: TimetableSettings) => void;
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>เริ่ม</Label>
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
        </div>
        <div className="space-y-2">
          <Label>สิ้นสุด</Label>
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
        </div>
      </div>
      <div className="space-y-2">
        <Label>ระยะห่าง (นาที)</Label>
        <Input
          type="number"
          min={5}
          max={120}
          step={5}
          value={settings.intervalMinutes}
          onChange={(event) => updateGeneratedRange({ intervalMinutes: Number(event.target.value) })}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setSlots(generateTimeSlots({ ...settings, timeSlots: [] }))}
      >
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
              <Input
                type="time"
                value={slot}
                onChange={(event) => updateSlot(index, event.target.value)}
                className="h-8"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => moveSlot(index, -1)}
                disabled={index === 0}
                aria-label="Move time slot up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => moveSlot(index, 1)}
                disabled={index === slots.length - 1}
                aria-label="Move time slot down"
              >
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

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-lg border bg-white px-3 py-2.5 shadow-sm">
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
