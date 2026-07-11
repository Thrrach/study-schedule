"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  X
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
import { useToast } from "@/components/toast";
import { defaultSettings } from "@/data/sample-data";
import { useTimetableStore } from "@/lib/timetable-store";
import { buildTimeOptions, generateTimeSlots, isValidTime, minutesToTime, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { normalizeClasses, safeDays } from "@/lib/subject-utils";
import { cn } from "@/lib/utils";
import type { ClassItem, ImageFormat, TimetableBackup, TimetableSettings } from "@/types/timetable";
import { weekDays } from "@/types/timetable";
import { useTranslation } from "@/lib/i18n";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";
import "dayjs/locale/en";

dayjs.extend(buddhistEra);

type ClassPayload = Omit<ClassItem, "id" | "createdAt" | "updatedAt">;
type ViewMode = "grid" | "list";
type WeekDay = ClassItem["days"][number];
type SortBy = "day" | "time" | "code" | "name";

const DISPLAY_START = "08:00";
const DISPLAY_END = "16:00";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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
  const { t, language } = useTranslation();

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
  const [exportDate, setExportDate] = useState(() => formatExportDate(dayjs(), language));
  const [sortBy, setSortBy] = useState<SortBy>("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

  const safeClasses = useMemo(() => normalizeClasses(classes), [classes]);
  const displayedSettings = useMemo(
    () => ({ ...settings, startTime: DISPLAY_START, endTime: DISPLAY_END, timeSlots: defaultSettings.timeSlots }),
    [settings]
  );
  const timeOptions = useMemo(() => generateTimeSlots(displayedSettings), [displayedSettings]);
  const semesterOptions = useMemo(() => buildSemesterOptions(settings.semester), [settings.semester]);
  const overlaps = draft ? findOverlaps(draft, editingClass?.id) : [];
  const totalOverlaps = useMemo(() => countOverlaps(safeClasses), [safeClasses]);
  const availableInstructors = useMemo(
    () => Array.from(new Set(safeClasses.map((item) => item.instructor).filter(Boolean))).sort((a, b) => a.localeCompare(b, "th")),
    [safeClasses]
  );
  const availableDays = useMemo(() => {
    const daySet = new Set<WeekDay>();
    safeClasses.forEach((item) => safeDays(item.days).forEach((day) => daySet.add(day)));
    return Array.from(daySet);
  }, [safeClasses]);
  const filteredClasses = useMemo(
    () => sortAndFilterClasses(safeClasses, { searchTerm, sortBy, selectedDays, selectedInstructors }),
    [safeClasses, searchTerm, sortBy, selectedDays, selectedInstructors]
  );

  function openNewForm(defaults: Partial<ClassPayload> = {}) {
    setEditingClass(null);
    setDraft(null);
    setNewClassDefaults(defaults);
    setFormOpen(true);
  }

  function openNewFormAt(day: WeekDay, startTime: string) {
    const start = timeToMinutes(startTime);
    const end = Math.min(start + 50, timeToMinutes(DISPLAY_END));
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

  function formatClassLabel(item: Pick<ClassItem, "courseCode" | "courseName">) {
    return `${item.courseCode} ${item.courseName}`.trim();
  }

  function handleSaveSuccess(action: "create" | "update", payload: ClassPayload) {
    toast({
      variant: "success",
      title: action === "create" ? "เพิ่มรายวิชาแล้ว" : "บันทึกการแก้ไขแล้ว",
      description: formatClassLabel(payload)
    });
  }

  function handleDuplicateClass(id: string) {
    const source = safeClasses.find((item) => item.id === id);
    duplicateClass(id);
    if (!source) return;
    toast({ variant: "success", title: "สร้างสำเนารายวิชาแล้ว", description: formatClassLabel(source) });
  }

  function handleDeleteClass() {
    if (!classToDelete) return;
    const removed = classToDelete;
    deleteClass(removed.id);
    setClassToDelete(null);
    toast({ variant: "success", title: "ลบรายวิชาแล้ว", description: formatClassLabel(removed) });
  }

  function handleMoveClass(id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) {
    const source = safeClasses.find((item) => item.id === id);
    moveClass(id, day, startTime, sourceDay);
    if (!source) return;
    toast({ variant: "info", title: "ย้ายรายวิชาแล้ว", description: `${formatClassLabel(source)} • ${day} ${startTime}` });
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
      toast({ variant: "success", title: "นำเข้าข้อมูลแล้ว", description: `${backup.classes.length} รายวิชา` });
    } catch {
      setImportError("นำเข้าไฟล์ไม่ได้ กรุณาใช้ไฟล์สำรอง JSON ที่ส่งออกจากหน้านี้");
      toast({ variant: "error", title: "นำเข้าข้อมูลไม่สำเร็จ", description: "กรุณาใช้ไฟล์ JSON ที่ส่งออกจากหน้านี้" });
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
                {t("app.title")}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{t("app.subtitle")}</h1>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
              <Select value={settings.semester || "none"} onValueChange={(semester) => updateSettings({ ...settings, semester: semester === "none" ? "" : semester })}>
                <SelectTrigger className="w-full sm:w-[190px]" aria-label={t("app.semester")}>
                  <SelectValue placeholder={t("app.semester")}>{settings.semester || t("app.semesterPlaceholder")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("app.semesterPlaceholder")}</SelectItem>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="inline-flex w-full rounded-md border bg-slate-50 p-1 sm:w-auto" aria-label="มุมมองตารางเรียน">
                <Button type="button" variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-8 flex-1 sm:flex-none" onClick={() => setViewMode("grid")}>
                  <Grid3X3 className="h-4 w-4" /> {t("app.viewGrid")}
                </Button>
                <Button type="button" variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="h-8 flex-1 sm:flex-none" onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" /> {t("app.viewList")}
                </Button>
              </div>

              <ExportButton targetId="timetable-export" format={imageFormat} onBeforeExport={() => setExportDate(formatExportDate(dayjs(), language))} />
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setToolsOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                {t("app.tools")}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto font-semibold" 
                onClick={() => updateSettings({ ...settings, language: language === "th" ? "en" : "th" })}
              >
                {language === "th" ? "EN" : "TH"}
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur no-print">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{t("filter.searchLabel")}</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={t("filter.searchPlaceholder")}
                      className="h-11 pl-10 pr-10"
                    />
                    {searchTerm ? (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        aria-label={t("filter.clearSearch")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">{t("filter.sortLabel")}</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <SelectTrigger className="h-11 w-full" aria-label={t("filter.sortLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">{t("filter.sortDayTime")}</SelectItem>
                      <SelectItem value="time">{t("filter.sortTime")}</SelectItem>
                      <SelectItem value="code">{t("filter.sortCode")}</SelectItem>
                      <SelectItem value="name">{t("filter.sortName")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">{t("filter.filterDay")}</p>
                  {selectedDays.length > 0 ? (
                    <button type="button" className="text-xs font-medium text-slate-500 hover:text-slate-700" onClick={() => setSelectedDays([])}>
                      {t("filter.clearDay")}
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableDays.length > 0 ? (
                    availableDays.map((day) => {
                      const isSelected = selectedDays.includes(day);
                      const dayLabel = weekDays.find((item) => item.key === day)?.shortLabelTh ?? day;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setSelectedDays((current) =>
                              isSelected ? current.filter((selectedDay) => selectedDay !== day) : [...current, day]
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                            isSelected
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary hover:bg-sky-50 hover:text-primary"
                          )}
                        >
                          {language === "en" ? weekDays.find((item) => item.key === day)?.shortLabelEn : weekDays.find((item) => item.key === day)?.shortLabelTh ?? dayLabel}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">{t("filter.noDayData")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">{t("filter.filterInstructor")}</p>
                  {selectedInstructors.length > 0 ? (
                    <button type="button" className="text-xs font-medium text-slate-500 hover:text-slate-700" onClick={() => setSelectedInstructors([])}>
                      {t("filter.clearInstructor")}
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableInstructors.length > 0 ? (
                    availableInstructors.slice(0, 8).map((instructor) => {
                      const isSelected = selectedInstructors.includes(instructor);
                      return (
                        <button
                          key={instructor}
                          type="button"
                          onClick={() =>
                            setSelectedInstructors((current) =>
                              isSelected ? current.filter((selectedInstructor) => selectedInstructor !== instructor) : [...current, instructor]
                            )
                          }
                          className={cn(
                            "max-w-full rounded-full border px-3 py-1.5 text-left text-sm font-medium transition",
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
                          )}
                          title={instructor}
                        >
                          <span className="inline-block max-w-[15rem] truncate align-middle">{instructor}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">{t("filter.noInstructorData")}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
                <div className="rounded-full bg-sky-100 p-2 text-sky-700">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("results.coursesCount", { count: filteredClasses.length })}</p>
                  <p className="text-xs text-slate-500">{t("results.filteredSubtext")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchTerm || selectedDays.length > 0 || selectedInstructors.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDays([]);
                      setSelectedInstructors([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                    {t("results.clearAll")}
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setToolsOpen(true)}>
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("results.settings")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 no-print">
          <Metric label={t("metrics.courses")} value={safeClasses.length.toString()} />
          <Metric label={t("metrics.overlaps")} value={totalOverlaps.toString()} tone={totalOverlaps > 0 ? "warning" : "success"} />
          <Metric label={t("metrics.displayTime")} value={`${DISPLAY_START}-${DISPLAY_END}`} />
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("metrics.autoSaved")}</p>
              <p className="text-xs text-slate-500">{t("metrics.autoSavedDesc")}</p>
            </div>
          </div>
        </section>

        <div className="relative">
          <div className={cn(viewMode === "grid" ? "absolute left-[-10000px] top-0 md:static" : "absolute left-[-10000px] top-0 w-max")}>
            <TimetableGrid
              classes={filteredClasses}
              exportMeta={{ semester: settings.semester ?? "", studentName: settings.studentName ?? "", exportedAt: exportDate }}
              onDropClass={handleMoveClass}
              onAddClassAt={openNewFormAt}
              onView={setSelectedClass}
              onEdit={openEditForm}
              onDuplicate={handleDuplicateClass}
              onDelete={(id) => setClassToDelete(safeClasses.find((item) => item.id === id) ?? null)}
            />
          </div>

          <div className={cn("block", viewMode === "grid" ? "md:hidden" : "md:block")}>
            <TimetableListView classes={filteredClasses} onView={setSelectedClass} />
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? t("form.editTitle") : t("form.addTitle")}</DialogTitle>
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
              if (editingClass) {
                updateClass(editingClass.id, payload);
                handleSaveSuccess("update", payload);
              } else {
                addClass(payload);
                handleSaveSuccess("create", payload);
              }
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
            <DialogTitle>{t("tools.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <HardDrive className="h-4 w-4" />
                {t("tools.settingsSection")}
              </div>
              <SettingsForm settings={settings} onChange={updateSettings} semesterOptions={semesterOptions} />
            </section>
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <FileDown className="h-4 w-4" />
                {t("tools.exportSection")}
              </div>
              <p className="mb-4 text-sm text-slate-500">{t("tools.exportDesc")}</p>
              <div className="space-y-3">
                <Button onClick={() => openNewForm()} className="w-full justify-start">
                  <Plus className="h-4 w-4" />
                  {t("tools.addClass")}
                </Button>
                <Select value={imageFormat} onValueChange={(value) => setImageFormat(value as ImageFormat)}>
                  <SelectTrigger aria-label="รูปแบบไฟล์ภาพ">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton targetId="timetable-export" format={imageFormat} onBeforeExport={() => setExportDate(formatExportDate(dayjs(), language))} />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={exportJson}>
                    <FileDown className="h-4 w-4" />
                    {t("tools.backupJson")}
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4" />
                    {t("tools.importJson")}
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
                  {t("tools.resetSample")}
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
            <DialogTitle>{t("dialog.deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {t("dialog.deleteWarning", { code: classToDelete?.courseCode ?? "", name: classToDelete?.courseName ?? "" })}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClassToDelete(null)}>
              {t("form.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              {t("dialog.deleteBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialog.resetConfirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("dialog.resetWarning")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>
              {t("form.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetSample();
                setResetConfirmOpen(false);
                toast({ variant: "success", title: "คืนค่าข้อมูลตัวอย่างแล้ว", description: "ตารางและการตั้งค่ากลับสู่ค่าเริ่มต้น" });
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
  const { t } = useTranslation();
  const baseTimeOptions = useMemo(() => buildTimeOptions(10), []);
  const slots = useMemo(
    () => generateTimeSlots(settings),
    [settings]
  );
  const invalidRange = timeToMinutes(settings.endTime) <= timeToMinutes(settings.startTime);
  const [newSlot, setNewSlot] = useState(slots[0] ?? "08:00");

  useEffect(() => {
    setNewSlot(slots[0] ?? "08:00");
  }, [slots]);

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
    onChange({ ...settings, ...updates, timeSlots: [] });
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
        <Field label={t("settings.studentName")}>
          <Input
            value={settings.studentName ?? ""}
            onChange={(event) => onChange({ ...settings, studentName: event.target.value })}
            placeholder={t("settings.studentNamePlaceholder")}
          />
        </Field>
        <Field label={t("app.semester")}>
          <Select value={settings.semester || "none"} onValueChange={(semester) => onChange({ ...settings, semester: semester === "none" ? "" : semester })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("app.semesterPlaceholder")}</SelectItem>
              {semesterOptions.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="rounded-md border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">
        {t("settings.timeNote", { start: DISPLAY_START, end: DISPLAY_END })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("settings.start")}>
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
        <Field label={t("settings.end")}>
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

      <Field label={t("settings.interval")}>
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
        {t("settings.regenerateSlots")}
      </Button>

      <details className="group rounded-lg border bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">{t("settings.customSlots")}</summary>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input type="time" value={newSlot} onChange={(event) => setNewSlot(event.target.value)} />
            <Button type="button" variant="secondary" onClick={() => isValidTime(newSlot) && setSlots([...slots, newSlot])}>
              <Plus className="h-4 w-4" /> {t("settings.addSlot")}
            </Button>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {slots.map((slot, index) => (
              <div key={`${slot}-${index}`} className="flex items-center gap-2 rounded-md border bg-slate-50 p-2">
                <Input type="time" value={slot} onChange={(event) => updateSlot(index, event.target.value)} className="h-8" />
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSlot(index, -1)} disabled={index === 0} aria-label="เลื่อนช่วงเวลาขึ้น">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSlot(index, 1)} disabled={index === slots.length - 1} aria-label="เลื่อนช่วงเวลาลง">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setSlots(slots.filter((_, slotIndex) => slotIndex !== index))} disabled={slots.length <= 1} aria-label="ลบช่วงเวลา">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </details>

      {invalidRange ? <p className="text-sm text-destructive">{t("settings.invalidRange")}</p> : null}
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
      <div className={`text-lg font-semibold ${tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "text-slate-900"}`}>
        {value}
      </div>
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

function countOverlaps(classes: ClassItem[]) {
  return classes.reduce((count, item, index) => {
    const hasEarlierOverlap = classes.slice(0, index).some((other) => subjectsOverlap(other, item));
    return count + (hasEarlierOverlap ? 1 : 0);
  }, 0);
}

function subjectsOverlap(first: Pick<ClassItem, "days" | "startTime" | "endTime">, second: Pick<ClassItem, "days" | "startTime" | "endTime">) {
  const firstDays = safeDays(first.days);
  const secondDays = safeDays(second.days);
  const sharesDay = firstDays.some((day) => secondDays.includes(day));
  return sharesDay && timeToMinutes(first.startTime) < timeToMinutes(second.endTime) && timeToMinutes(second.startTime) < timeToMinutes(first.endTime);
}

function sortAndFilterClasses(
  classes: ClassItem[],
  filters: {
    searchTerm: string;
    sortBy: SortBy;
    selectedDays: WeekDay[];
    selectedInstructors: string[];
  }
) {
  let result = [...classes];

  if (filters.searchTerm.trim()) {
    const query = filters.searchTerm.toLowerCase();
    result = result.filter((item) => {
      const haystack = [item.courseCode, item.courseName, item.section, item.instructor, item.room, item.note ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  if (filters.selectedDays.length > 0) {
    result = result.filter((item) => safeDays(item.days).some((day) => filters.selectedDays.includes(day)));
  }

  if (filters.selectedInstructors.length > 0) {
    result = result.filter((item) => filters.selectedInstructors.includes(item.instructor));
  }

  const sorted = [...result];
  sorted.sort((a, b) => {
    switch (filters.sortBy) {
      case "name":
        return a.courseName.localeCompare(b.courseName, "th");
      case "code":
        return a.courseCode.localeCompare(b.courseCode, "th");
      case "time":
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      case "day": {
        const aDayIndex = safeDays(a.days)[0] ? weekDayIndex(safeDays(a.days)[0]) : 0;
        const bDayIndex = safeDays(b.days)[0] ? weekDayIndex(safeDays(b.days)[0]) : 0;
        if (aDayIndex !== bDayIndex) return aDayIndex - bDayIndex;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      }
      default:
        return 0;
    }
  });
  return sorted;
}

function buildSemesterOptions(current?: string) {
  const buddhistYear = new Date().getFullYear() + 543;
  const options = [`1/${buddhistYear}`, `2/${buddhistYear}`, `ฤดูร้อน/${buddhistYear}`, `1/${buddhistYear + 1}`, `2/${buddhistYear + 1}`];
  return current && !options.includes(current) ? [current, ...options] : options;
}

type RawTimetableImport = Partial<TimetableBackup> & {
  subjects?: unknown;
  classes?: unknown;
};

function normalizeImport(value: RawTimetableImport): TimetableBackup {
  if (!value || typeof value !== "object") throw new Error("Invalid backup");
  const rawClasses = Array.isArray(value.classes) ? value.classes : Array.isArray(value.subjects) ? value.subjects : null;
  if (!rawClasses) throw new Error("Invalid backup");
  const rawSettings = value.settings && typeof value.settings === "object" ? value.settings : defaultSettings;

  return {
    version: 1,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    settings: {
      ...defaultSettings,
      ...(rawSettings as Partial<TimetableSettings>),
      timeSlots: Array.isArray((rawSettings as Partial<TimetableSettings>).timeSlots)
        ? normalizeTimeSlots((rawSettings as Partial<TimetableSettings>).timeSlots)
        : defaultSettings.timeSlots
    },
    classes: normalizeClasses(rawClasses)
  };
}

function formatExportDate(date: dayjs.Dayjs, lang: "th" | "en") {
  if (lang === "en") {
    return date.locale("en").format("MMMM D, YYYY HH:mm");
  }
  return date.locale("th").format("D MMMM BBBB เวลา HH:mm น.");
}

function weekDayIndex(day: string): number {
  const dayMap: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4
  };
  return dayMap[day] ?? 0;
}
