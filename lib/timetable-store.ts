"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import { hasTimeOverlap, normalizeTimeSlots } from "@/lib/time";
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
  moveClass: (id: string, day: WeekDay, startTime: string, endTime?: string) => void;
  updateSettings: (settings: TimetableSettings) => void;
  resetSample: () => void;
  replaceAll: (backup: TimetableBackup) => void;
  findOverlaps: (candidate: Omit<ClassItem, "id" | "createdAt" | "updatedAt">, ignoreId?: string) => ClassItem[];
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      classes: sampleClasses,
      settings: defaultSettings,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      addClass: (item) => {
        const timestamp = Date.now();
        set((state) => ({
          classes: [
            ...state.classes,
            {
              ...item,
              id: uid(),
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ]
        }));
      },
      updateClass: (id, updates) => {
        set((state) => ({
          classes: state.classes.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
          )
        }));
      },
      duplicateClass: (id) => {
        const source = get().classes.find((item) => item.id === id);
        if (!source) return;
        const timestamp = Date.now();
        set((state) => ({
          classes: [
            ...state.classes,
            {
              ...source,
              id: uid(),
              courseName: `${source.courseName} (copy)`,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ]
        }));
      },
      deleteClass: (id) => {
        set((state) => ({ classes: state.classes.filter((item) => item.id !== id) }));
      },
      moveClass: (id, day, startTime, endTime) => {
        set((state) => ({
          classes: state.classes.map((item) => {
            if (item.id !== id) return item;
            const duration = endTime ? 0 : Math.max(10, timeDiff(item.startTime, item.endTime));
            return {
              ...item,
              days: item.days.includes(day) ? item.days : [...item.days, day],
              startTime,
              endTime: endTime ?? addMinutes(startTime, duration),
              updatedAt: Date.now()
            };
          })
        }));
      },
      updateSettings: (settings) =>
        set({
          settings: {
            ...settings,
            timeSlots: normalizeTimeSlots(settings.timeSlots ?? [])
          }
        }),
      resetSample: () => set({ classes: sampleClasses, settings: defaultSettings }),
      replaceAll: (backup) =>
        set({
          classes: normalizeClasses(backup.classes),
          settings: {
            ...defaultSettings,
            ...backup.settings,
            timeSlots: normalizeTimeSlots(backup.settings.timeSlots ?? defaultSettings.timeSlots)
          }
        }),
      findOverlaps: (candidate, ignoreId) =>
        get().classes.filter(
          (item) =>
            item.id !== ignoreId &&
            item.days.some((day) => candidate.days.includes(day)) &&
            hasTimeOverlap(item.startTime, item.endTime, candidate.startTime, candidate.endTime)
        )
    }),
    {
      name: "psu-timetable-builder",
      partialize: (state) => ({ classes: state.classes, settings: state.settings }),
      migrate: (persisted) => {
        const state = persisted as Partial<Pick<TimetableState, "classes" | "settings">>;
        return {
          classes: normalizeClasses(state.classes ?? sampleClasses),
          settings: {
            ...defaultSettings,
            ...state.settings,
            timeSlots: normalizeTimeSlots(state.settings?.timeSlots ?? defaultSettings.timeSlots)
          }
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

type LegacyClassItem = Omit<ClassItem, "days"> & {
  day?: WeekDay;
  days?: WeekDay[];
};

function normalizeClasses(classes: Array<ClassItem | LegacyClassItem>) {
  return classes.map((item) => {
    const days = item.days?.length ? item.days : item.day ? [item.day] : ["monday"];
    const { day: _legacyDay, ...rest } = item;

    return {
      ...rest,
      days
    } as ClassItem;
  });
}
