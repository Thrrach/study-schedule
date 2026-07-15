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

/** ตรวจสอบว่าค่าเป็น object สำหรับอ่านข้อมูล state ที่บันทึกไว้ */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** จำกัดข้อมูล persistence ให้เหลือเฉพาะส่วน classes และ settings ที่รองรับ */
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
      /** บันทึกสถานะว่า state จาก local storage พร้อมใช้งานแล้ว */
      setHydrated: (value) => set({ hydrated: value }),
      /** แทนที่รายวิชาและเก็บ state ก่อนหน้าเพื่อรองรับ undo */
      setClasses: (classes) => set((state) => ({
        classes,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      /** แทนที่การตั้งค่าและเก็บ state ก่อนหน้าเพื่อรองรับ undo */
      setSettings: (settings) => set((state) => ({
        settings,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      /** แทนที่รายวิชาและการตั้งค่าพร้อมกัน พร้อมบันทึกประวัติ */
      replaceAll: (classes, settings) => set((state) => ({
        classes,
        settings,
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      /** ย้อน state ล่าสุดจากประวัติ past ไปยัง future */
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
      /** นำ state ล่าสุดจาก future กลับมาใช้งาน */
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
      /** เลือกเฉพาะข้อมูลถาวรที่ต้องเก็บลง local storage */
      partialize: (state) => ({ classes: state.classes, settings: state.settings }),
      /** ปรับข้อมูล persistence รุ่นเก่าให้เป็น schema ปัจจุบัน */
      migrate: (persisted) => {
        const state = asPartialState(persisted);
        return {
          classes: normalizeClasses(state.classes ?? sampleClasses),
          settings: normalizeSettings(state.settings, defaultSettings)
        };
      },
      /** รวมข้อมูล persistence เข้ากับ state เริ่มต้นอย่างปลอดภัย */
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
      /** ตั้งสถานะ hydrated เมื่ออ่าน persistence เสร็จ */
      onRehydrateStorage: () => (state) => state?.setHydrated(true)
    }
  )
);

/** เก็บภาพรวมของข้อมูลที่เปลี่ยนแปลงได้เพื่อใช้ใน undo และ redo */
function snapshotOf(state: Pick<TimetableState, "classes" | "settings">): TimetableSnapshot {
  return { classes: state.classes, settings: state.settings };
}
