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
  past: TimetableSnapshot[];
  future: TimetableSnapshot[];
  setHydrated: (value: boolean) => void;
  setClasses: (classes: ClassItem[]) => void;
  setSettings: (settings: TimetableSettings) => void;
  replaceAll: (classes: ClassItem[], settings: TimetableSettings) => void;
  undo: () => void;
  redo: () => void;
}

interface TimetableSnapshot {
  classes: ClassItem[];
  settings: TimetableSettings;
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
      past: [],
      future: [],
      setHydrated: (value) => set({ hydrated: value }),
      setClasses: (classes) => set((state) => ({
        classes,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      setSettings: (settings) => set((state) => ({
        settings,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      replaceAll: (classes, settings) => set((state) => ({
        classes,
        settings,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      undo: () => set((state) => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return state;
        return {
          classes: previous.classes,
          settings: previous.settings,
          past: state.past.slice(0, -1),
          future: [snapshotOf(state), ...state.future].slice(0, 50)
        };
      }),
      redo: () => set((state) => {
        const next = state.future[0];
        if (!next) return state;
        return {
          classes: next.classes,
          settings: next.settings,
          past: [...state.past, snapshotOf(state)].slice(-50),
          future: state.future.slice(1)
        };
      }),
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
          settings: normalizeSettings(state.settings, current.settings),
          past: [],
          future: []
        };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(true)
    }
  )
);

function snapshotOf(state: Pick<TimetableState, "classes" | "settings">): TimetableSnapshot {
  return { classes: state.classes, settings: state.settings };
}
