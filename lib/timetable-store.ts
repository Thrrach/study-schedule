"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import { hasTimeOverlap, isValidTime, normalizeInterval, normalizeTimeSlots, timeToMinutes } from "@/lib/time";
import { normalizeClass, normalizeClasses, safeDays, subjectsShareDay } from "@/lib/subject-utils";
import { uid } from "@/lib/utils";
import type { ClassItem, TimetableBackup, TimetableSettings, WeekDay } from "@/types/timetable";

interface TimetableState {
  classes: ClassItem[];
  settings: TimetableSettings;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addClass: (item: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => void;
  updateClass: (id: string, updates: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => void;
  duplicateClass: (id: string) => void;
  deleteClass: (id: string) => void;
  moveClass: (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => void;
  updateSettings: (settings: TimetableSettings) => void;
  resetSample: () => void;
  replaceAll: (backup: TimetableBackup) => void;
  findOverlaps: (candidate: Omit<ClassItem, "id" | "createdAt" | "updatedAt">, ignoreId?: string) => ClassItem[];
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      classes: normalizeClasses(sampleClasses),
      settings: defaultSettings,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      addClass: (item) => {
        const timestamp = Date.now();
        set((state) => ({
          classes: normalizeClasses([
            ...(Array.isArray(state.classes) ? state.classes : []),
            {
              ...normalizeClass(item),
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ])
        }));
      },
      updateClass: (id, updates) => {
        set((state) => ({
          classes: normalizeClasses((Array.isArray(state.classes) ? state.classes : []).map((item) =>
            item.id === id ? { ...normalizeClass({ ...item, ...updates }), id, updatedAt: Date.now() } : item
          ))
        }));
      },
      duplicateClass: (id) => {
        const source = (Array.isArray(get().classes) ? get().classes : []).find((item) => item.id === id);
        if (!source) return;
        const timestamp = Date.now();
        set((state) => ({
          classes: normalizeClasses([
            ...(Array.isArray(state.classes) ? state.classes : []),
            {
              ...source,
              id: uid(),
              courseName: source.courseName ? `${source.courseName} (สำเนา)` : "รายวิชาไม่มีชื่อ (สำเนา)",
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ])
        }));
      },
      deleteClass: (id) => {
        set((state) => ({ classes: (Array.isArray(state.classes) ? state.classes : []).filter((item) => item.id !== id) }));
      },
      moveClass: (id, day, startTime, sourceDay) => {
        set((state) => ({
          classes: normalizeClasses((Array.isArray(state.classes) ? state.classes : []).map((item) => {
            if (item.id !== id) return item;
            const duration = Math.max(10, timeDiff(item.startTime, item.endTime));
            return {
              ...item,
              days: moveDay(item.days, day, sourceDay),
              startTime,
              endTime: addMinutes(startTime, duration),
              updatedAt: Date.now()
            };
          }))
        }));
      },
      updateSettings: (settings) =>
        set({
          settings: normalizeSettings(settings, get().settings)
        }),
      resetSample: () => set({ classes: normalizeClasses(sampleClasses), settings: defaultSettings }),
      replaceAll: (backup) =>
        set({
          classes: normalizeClasses(backup.classes),
          settings: normalizeSettings(backup.settings, defaultSettings)
        }),
      findOverlaps: (candidate, ignoreId) =>
        (Array.isArray(get().classes) ? get().classes : []).filter(
          (item) =>
            item.id !== ignoreId &&
            subjectsShareDay(item, candidate) &&
            hasTimeOverlap(item.startTime, item.endTime, candidate.startTime, candidate.endTime)
        )
    }),
    {
      name: "psu-timetable-builder",
      version: 2,
      partialize: (state) => ({ classes: state.classes, settings: state.settings }),
      migrate: (persisted) => {
        const state = asPartialState(persisted);
        return {
          classes: normalizeClasses(state.classes ?? sampleClasses),
          settings: normalizeSettings(state.settings, defaultSettings)
        };
      },
      merge: (persisted, current) => {
        const state = asPartialState(persisted);
        return {
          ...current,
          classes: normalizeClasses(state.classes ?? current.classes),
          settings: normalizeSettings(state.settings, current.settings)
        };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(true)
    }
  )
);

function timeDiff(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60)
    .toString()
    .padStart(2, "0")}`;
}

function moveDay(days: unknown, targetDay: WeekDay, sourceDay?: WeekDay) {
  const currentDays = safeDays(days);
  if (!currentDays.length) return [targetDay];

  const movedDays =
    sourceDay && currentDays.includes(sourceDay)
      ? currentDays.map((day) => (day === sourceDay ? targetDay : day))
      : currentDays.includes(targetDay)
        ? currentDays
        : [...currentDays, targetDay];

  return Array.from(new Set(movedDays));
}

function normalizeSettings(rawSettings: unknown, fallback: TimetableSettings): TimetableSettings {
  const raw = isRecord(rawSettings) ? rawSettings : {};
  const startTime = normalizeTime(raw.startTime, fallback.startTime);
  const endTime = normalizeTime(raw.endTime, fallback.endTime);
  const hasCustomSlots = Object.prototype.hasOwnProperty.call(raw, "timeSlots");
  const timeSlots = hasCustomSlots ? normalizeTimeSlots(raw.timeSlots) : normalizeTimeSlots(fallback.timeSlots);
  const intervalMinutes = normalizeInterval(raw.intervalMinutes, fallback.intervalMinutes);
  const semester = stringValue(raw.semester, fallback.semester ?? "");
  const studentName = stringValue(raw.studentName, fallback.studentName ?? "");
  const language = raw.language === "en" || raw.language === "th" ? raw.language : (fallback.language ?? "th");

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return {
      ...fallback,
      intervalMinutes,
      timeSlots,
      semester,
      studentName,
      language
    };
  }

  return {
    startTime,
    endTime,
    intervalMinutes,
    timeSlots,
    semester,
    studentName,
    language
  };
}

function normalizeTime(value: unknown, fallback: string) {
  return typeof value === "string" && isValidTime(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asPartialState(value: unknown): Partial<Pick<TimetableState, "classes" | "settings">> {
  return isRecord(value) ? value : {};
}

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}
