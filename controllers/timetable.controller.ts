"use client";

import { useTimetableApi } from "@/api/timetable.api";
import { timetableService, normalizeSettings } from "@/services/timetable.service";
import { normalizeClasses } from "@/lib/subject-utils";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import type { ClassItem, TimetableBackup, TimetableSettings, WeekDay } from "@/types/timetable";

/** เชื่อม UI เข้ากับ state และรวมคำสั่งจัดการตารางเรียนไว้ใน hook เดียว */
export function useTimetableController() {
  const {
    classes,
    settings,
    hydrated,
    past,
    future,
    setHydrated,
    setClasses,
    setSettings,
    replaceAll: replaceStoredState,
    undo,
    redo
  } = useTimetableApi();

  /** สร้างรายวิชาใหม่แล้วบันทึกลง state */
  const addClass = (item: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => {
    const newClass = timetableService.createClass(item);
    setClasses(normalizeClasses([...classes, newClass]));
  };

  /** แก้ไขรายวิชาที่มีรหัสตรงกัน */
  const updateClass = (id: string, updates: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => {
    const updatedClasses = classes.map((item) =>
      item.id === id ? timetableService.updateClass(item, updates) : item
    );
    setClasses(normalizeClasses(updatedClasses));
  };

  /** ทำสำเนารายวิชาที่เลือกเมื่อพบข้อมูลต้นฉบับ */
  const duplicateClass = (id: string) => {
    const source = classes.find((item) => item.id === id);
    if (!source) return;
    const newClass = timetableService.duplicateClass(source);
    setClasses(normalizeClasses([...classes, newClass]));
  };

  /** ลบรายวิชาที่มีรหัสตรงกันออกจาก state */
  const deleteClass = (id: string) => {
    setClasses(classes.filter((item) => item.id !== id));
  };

  /** ย้ายรายวิชาไปยังวันและเวลาใหม่จากการลากวาง */
  const moveClass = (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => {
    const updatedClasses = classes.map((item) => {
      if (item.id !== id) return item;
      return timetableService.moveClass(item, day, startTime, sourceDay);
    });
    setClasses(normalizeClasses(updatedClasses));
  };

  /** ตรวจสอบและบันทึกการตั้งค่าตารางชุดใหม่ */
  const updateSettings = (newSettings: TimetableSettings) => {
    setSettings(normalizeSettings(newSettings, settings));
  };

  /** คืนค่ารายวิชาและการตั้งค่าเป็นข้อมูลตัวอย่าง */
  const resetSample = () => {
    replaceStoredState(normalizeClasses(sampleClasses), defaultSettings);
  };

  /** นำข้อมูลสำรองที่ผ่านการปรับรูปแบบแล้วมาแทน state ปัจจุบัน */
  const replaceAll = (backup: TimetableBackup) => {
    replaceStoredState(
      normalizeClasses(backup.classes),
      normalizeSettings(backup.settings, defaultSettings)
    );
  };

  /** ตรวจสอบรายวิชาที่มีช่วงเวลาเรียนทับซ้อนกับข้อมูลที่กรอก */
  const findOverlaps = (candidate: Omit<ClassItem, "id" | "createdAt" | "updatedAt">, ignoreId?: string) => {
    return timetableService.findOverlaps(classes, candidate, ignoreId);
  };

  return {
    classes,
    settings,
    hydrated,
    setHydrated,
    addClass,
    updateClass,
    duplicateClass,
    deleteClass,
    moveClass,
    updateSettings,
    resetSample,
    replaceAll,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    findOverlaps
  };
}
