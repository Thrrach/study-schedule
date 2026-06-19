"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import { hasTimeOverlap, normalizeTimeSlots } from "@/lib/time";
import { normalizeClass, normalizeClasses, subjectsShareDay, withAddedDay } from "@/lib/subject-utils";
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
              courseName: `${source.courseName} (copy)`,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ])
        }));
      },
      deleteClass: (id) => {
        set((state) => ({ classes: (Array.isArray(state.classes) ? state.classes : []).filter((item) => item.id !== id) }));
      },
      moveClass: (id, day, startTime, endTime) => {
        set((state) => ({
          classes: normalizeClasses((Array.isArray(state.classes) ? state.classes : []).map((item) => {
            if (item.id !== id) return item;
            const duration = endTime ? 0 : Math.max(10, timeDiff(item.startTime, item.endTime));
            return {
              ...item,
              days: withAddedDay(item.days, day),
              startTime,
              endTime: endTime ?? addMinutes(startTime, duration),
              updatedAt: Date.now()
            };
          }))
        }));
      },
      updateSettings: (settings) =>
        set({
          settings: {
            ...settings,
            timeSlots: normalizeTimeSlots(settings.timeSlots ?? [])
          }
        }),
      resetSample: () => set({ classes: normalizeClasses(sampleClasses), settings: defaultSettings }),
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
      merge: (persisted, current) => {
        const state = persisted as Partial<Pick<TimetableState, "classes" | "settings">>;
        return {
          ...current,
          classes: normalizeClasses(state.classes ?? current.classes),
          settings: {
            ...current.settings,
            ...state.settings,
            timeSlots: normalizeTimeSlots(state.settings?.timeSlots ?? current.settings.timeSlots)
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
