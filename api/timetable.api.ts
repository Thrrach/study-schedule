"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import { normalizeClasses } from "@/lib/subject-utils";
import { uid } from "@/lib/utils";
import type { ClassItem, TimetablePlan, TimetableSettings } from "@/types/timetable";
import { normalizeSettings } from "@/services/timetable.service";

export interface TimetableState {
  classes: ClassItem[];
  settings: TimetableSettings;
  hydrated: boolean;
  past: TimetableSnapshot[];
  future: TimetableSnapshot[];
  plans: TimetablePlan[];
  activePlanId: string;
  setHydrated: (value: boolean) => void;
  setClasses: (classes: ClassItem[]) => void;
  setSettings: (settings: TimetableSettings) => void;
  replaceAll: (classes: ClassItem[], settings: TimetableSettings) => void;
  replacePlans: (plans: TimetablePlan[], activePlanId: string) => void;
  createPlan: (name: string) => void;
  renamePlan: (id: string, name: string) => void;
  switchPlan: (id: string) => void;
  deletePlan: (id: string) => void;
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
function asPartialState(value: unknown): Partial<Pick<TimetableState, "classes" | "settings" | "plans" | "activePlanId">> {
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
      plans: [makePlan("default", "ตารางหลัก", normalizeClasses(sampleClasses), defaultSettings)],
      activePlanId: "default",
      /** บันทึกสถานะว่า state จาก local storage พร้อมใช้งานแล้ว */
      setHydrated: (value) => set({ hydrated: value }),
      /** แทนที่รายวิชาและเก็บ state ก่อนหน้าเพื่อรองรับ undo */
      setClasses: (classes) => set((state) => ({
        classes,
        plans: updateActivePlan(state, classes, state.settings),
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      /** แทนที่การตั้งค่าและเก็บ state ก่อนหน้าเพื่อรองรับ undo */
      setSettings: (settings) => set((state) => ({
        settings,
        plans: updateActivePlan(state, state.classes, settings),
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      /** แทนที่รายวิชาและการตั้งค่าพร้อมกัน พร้อมบันทึกประวัติ */
      replaceAll: (classes, settings) => set((state) => ({
        classes,
        settings,
        plans: updateActivePlan(state, classes, settings),
        past: [...state.past, snapshotOf(state)].slice(-50),
        future: []
      })),
      replacePlans: (plans, activePlanId) => set((state) => {
        const normalized = normalizePlans(plans);
        const active = normalized.find((plan) => plan.id === activePlanId) ?? normalized[0];
        return {
          plans: normalized,
          activePlanId: active.id,
          classes: active.classes,
          settings: active.settings,
          past: [...state.past, snapshotOf(state)].slice(-50),
          future: []
        };
      }),
      createPlan: (name) => set((state) => {
        const id = uid();
        const plan = makePlan(id, name.trim() || `ตาราง ${state.plans.length + 1}`, [], state.settings);
        return { plans: [...state.plans, plan], activePlanId: id, classes: [], settings: plan.settings, past: [], future: [] };
      }),
      renamePlan: (id, name) => set((state) => ({
        plans: state.plans.map((plan) => plan.id === id ? { ...plan, name: name.trim() || plan.name, updatedAt: Date.now() } : plan)
      })),
      switchPlan: (id) => set((state) => {
        const plan = state.plans.find((item) => item.id === id);
        return plan ? { activePlanId: id, classes: plan.classes, settings: plan.settings, past: [], future: [] } : state;
      }),
      deletePlan: (id) => set((state) => {
        if (state.plans.length <= 1) return state;
        const plans = state.plans.filter((plan) => plan.id !== id);
        const active = id === state.activePlanId ? plans[0] : plans.find((plan) => plan.id === state.activePlanId) ?? plans[0];
        return { plans, activePlanId: active.id, classes: active.classes, settings: active.settings, past: [], future: [] };
      }),
      /** ย้อน state ล่าสุดจากประวัติ past ไปยัง future */
      undo: () => set((state) => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return state;
        return {
          classes: previous.classes,
          settings: previous.settings,
          plans: updateActivePlan(state, previous.classes, previous.settings),
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
          plans: updateActivePlan(state, next.classes, next.settings),
          past: [...state.past, snapshotOf(state)].slice(-50),
          future: state.future.slice(1)
        };
      }),
    }),
    {
      name: "psu-timetable-builder",
      version: 3,
      /** เลือกเฉพาะข้อมูลถาวรที่ต้องเก็บลง local storage */
      partialize: (state) => ({ classes: state.classes, settings: state.settings, plans: state.plans, activePlanId: state.activePlanId }),
      /** ปรับข้อมูล persistence รุ่นเก่าให้เป็น schema ปัจจุบัน */
      migrate: (persisted) => {
        const state = asPartialState(persisted);
        const classes = normalizeClasses(state.classes ?? sampleClasses);
        const settings = normalizeSettings(state.settings, defaultSettings);
        const plans = normalizePlans(state.plans, classes, settings);
        const active = plans.find((plan) => plan.id === state.activePlanId) ?? plans[0];
        return { classes: active.classes, settings: active.settings, plans, activePlanId: active.id };
      },
      /** รวมข้อมูล persistence เข้ากับ state เริ่มต้นอย่างปลอดภัย */
      merge: (persisted, current) => {
        const state = asPartialState(persisted);
        const fallbackClasses = normalizeClasses(state.classes ?? current.classes);
        const fallbackSettings = normalizeSettings(state.settings, current.settings);
        const plans = normalizePlans(state.plans, fallbackClasses, fallbackSettings);
        const active = plans.find((plan) => plan.id === state.activePlanId) ?? plans[0];
        return {
          ...current,
          classes: active.classes,
          settings: active.settings,
          plans,
          activePlanId: active.id,
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

function makePlan(id: string, name: string, classes: ClassItem[], settings: TimetableSettings): TimetablePlan {
  const timestamp = Date.now();
  return { id, name, classes: normalizeClasses(classes), settings: normalizeSettings(settings, defaultSettings), createdAt: timestamp, updatedAt: timestamp };
}

function normalizePlans(value: unknown, fallbackClasses = normalizeClasses(sampleClasses), fallbackSettings = defaultSettings): TimetablePlan[] {
  if (!Array.isArray(value) || value.length === 0) return [makePlan("default", "ตารางหลัก", fallbackClasses, fallbackSettings)];
  const plans = value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const plan = raw as Partial<TimetablePlan>;
    const id = typeof plan.id === "string" && plan.id ? plan.id : uid();
    return [{
      id,
      name: typeof plan.name === "string" && plan.name.trim() ? plan.name.trim() : "ตารางเรียน",
      classes: normalizeClasses(plan.classes),
      settings: normalizeSettings(plan.settings, fallbackSettings),
      createdAt: typeof plan.createdAt === "number" ? plan.createdAt : Date.now(),
      updatedAt: typeof plan.updatedAt === "number" ? plan.updatedAt : Date.now()
    }];
  });
  return plans.length ? plans : [makePlan("default", "ตารางหลัก", fallbackClasses, fallbackSettings)];
}

function updateActivePlan(state: Pick<TimetableState, "plans" | "activePlanId">, classes: ClassItem[], settings: TimetableSettings) {
  return state.plans.map((plan) => plan.id === state.activePlanId ? { ...plan, classes, settings, updatedAt: Date.now() } : plan);
}
