"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, FileDown, FileUp, Plus, Printer, RotateCcw, Settings, Trash2 } from "lucide-react";
import { ClassForm } from "@/components/ClassForm";
import { ExportButton } from "@/components/ExportButton";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimetableStore } from "@/lib/timetable-store";
import { buildTimeOptions, generateTimeSlots, isValidTime, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
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
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [draft, setDraft] = useState<ClassPayload | null>(null);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [importError, setImportError] = useState("");
  const timeOptions = useMemo(() => generateTimeSlots(settings), [settings]);

  const overlaps = draft ? findOverlaps(draft, editingClass?.id) : [];
  const totalOverlaps = useMemo(
    () =>
      classes.reduce((count, item, index) => {
        const hasEarlierOverlap = classes
          .slice(0, index)
          .some(
            (other) =>
              other.days.some((day) => item.days.includes(day)) &&
              timeToMinutes(other.startTime) < timeToMinutes(item.endTime) &&
              timeToMinutes(item.startTime) < timeToMinutes(other.endTime)
          );
        return count + (hasEarlierOverlap ? 1 : 0);
      }, 0),
    [classes]
  );

  function openNewForm() {
    setEditingClass(null);
    setDraft(null);
    setFormOpen(true);
  }

  function openEditForm(item: ClassItem) {
    setEditingClass(item);
    setDraft(toPayload(item));
    setFormOpen(true);
  }

  function exportJson() {
    const backup: TimetableBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      classes
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
      const parsed = JSON.parse(await file.text()) as TimetableBackup;
      validateBackup(parsed);
      replaceAll(parsed);
      setImportError("");
    } catch {
      setImportError("Could not import this JSON file. Please use a backup exported from this app.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fafc_0%,#eef6f5_100%)] px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col justify-between gap-4 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center no-print">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              PSU-inspired timetable builder
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">University Class Timetable</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Manually create a clean class schedule, keep it in this browser, and export it for sharing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openNewForm}>
              <Plus className="h-4 w-4" />
              Add class
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 no-print">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                Timetable settings
              </div>
              <SettingsForm settings={settings} onChange={updateSettings} />
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold">Export and backup</h2>
              <div className="space-y-3">
                <Select value={imageFormat} onValueChange={(value) => setImageFormat(value as "png" | "jpeg")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG image</SelectItem>
                    <SelectItem value="jpeg">JPEG image</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton targetId="timetable-export" format={imageFormat} />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={exportJson}>
                    <FileDown className="h-4 w-4" />
                    JSON
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4" />
                    Import
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
                {importError ? <p className="text-sm text-destructive">{importError}</p> : null}
                <Button variant="ghost" onClick={resetSample} className="w-full justify-start">
                  <RotateCcw className="h-4 w-4" />
                  Restore sample data
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
              <h2 className="font-semibold">Schedule status</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Classes" value={classes.length.toString()} />
                <Metric label="Overlap warnings" value={totalOverlaps.toString()} />
              </div>
            </div>
          </aside>

          <TimetableGrid
            classes={classes}
            settings={settings}
            onDropClass={moveClass}
            onEdit={openEditForm}
            onDuplicate={duplicateClass}
            onDelete={deleteClass}
          />
        </section>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit class" : "Add class"}</DialogTitle>
          </DialogHeader>
          <ClassForm
            initialValue={editingClass}
            overlaps={overlaps}
            timeOptions={timeOptions}
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
    onChange({
      ...settings,
      timeSlots: normalized,
      startTime: normalized[0] ?? settings.startTime,
      endTime: normalized[normalized.length - 1] ?? settings.endTime
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
    onChange({ ...settings, timeSlots: next });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start</Label>
          <Select value={settings.startTime} onValueChange={(startTime) => onChange({ ...settings, startTime })}>
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
          <Label>End</Label>
          <Select value={settings.endTime} onValueChange={(endTime) => onChange({ ...settings, endTime })}>
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
        <Label>Interval minutes</Label>
        <Input
          type="number"
          min={5}
          max={120}
          step={5}
          value={settings.intervalMinutes}
          onChange={(event) => onChange({ ...settings, intervalMinutes: Number(event.target.value) })}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setSlots(generateTimeSlots({ ...settings, timeSlots: [] }))}
      >
        Generate slots from range
      </Button>
      <div className="space-y-2">
        <Label>Custom time slots</Label>
        <div className="flex gap-2">
          <Input type="time" value={newSlot} onChange={(event) => setNewSlot(event.target.value)} />
          <Button type="button" variant="secondary" onClick={() => isValidTime(newSlot) && setSlots([...slots, newSlot])}>
            <Plus className="h-4 w-4" />
            Add
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
      {invalidRange ? <p className="text-sm text-destructive">End time must be after start time.</p> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xl font-semibold">{value}</div>
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
    days: item.days,
    startTime: item.startTime,
    endTime: item.endTime,
    color: item.color,
    note: item.note
  };
}

function validateBackup(value: TimetableBackup) {
  if (value.version !== 1 || !Array.isArray(value.classes) || !value.settings) {
    throw new Error("Invalid backup");
  }
}
