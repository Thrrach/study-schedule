"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import { normalizeClasses } from "@/lib/subject-utils";
import type { ClassItem, TimetableSettings } from "@/types/timetable";
import { normalizeSettings } from "@/services/timetable.service";

export interface TimetableState {
  classes: ClassItem[];
  settings: TimetableSettings;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setClasses: (classes: ClassItem[]) => void;
  setSettings: (settings: TimetableSettings) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asPartialState(value: unknown): Partial<Pick<TimetableState, "classes" | "settings">> {
  return isRecord(value) ? value : {};
}

export const useTimetableApi = create<TimetableState>()(
  persist(
    (set) => ({
      classes: normalizeClasses(sampleClasses),
      settings: defaultSettings,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setClasses: (classes) => set({ classes }),
      setSettings: (settings) => set({ settings }),
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
