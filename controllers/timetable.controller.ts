"use client";

import { useTimetableApi } from "@/api/timetable.api";
import { timetableService, normalizeSettings } from "@/services/timetable.service";
import { normalizeClasses } from "@/lib/subject-utils";
import { defaultSettings, sampleClasses } from "@/data/sample-data";
import type { ClassItem, TimetableBackup, TimetableSettings, WeekDay } from "@/types/timetable";

export function useTimetableController() {
  const { classes, settings, hydrated, setHydrated, setClasses, setSettings } = useTimetableApi();

  const addClass = (item: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => {
    const newClass = timetableService.createClass(item);
    setClasses(normalizeClasses([...classes, newClass]));
  };

  const updateClass = (id: string, updates: Omit<ClassItem, "id" | "createdAt" | "updatedAt">) => {
    const updatedClasses = classes.map((item) =>
      item.id === id ? timetableService.updateClass(item, updates) : item
    );
    setClasses(normalizeClasses(updatedClasses));
  };

  const duplicateClass = (id: string) => {
    const source = classes.find((item) => item.id === id);
    if (!source) return;
    const newClass = timetableService.duplicateClass(source);
    setClasses(normalizeClasses([...classes, newClass]));
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter((item) => item.id !== id));
  };

  const moveClass = (id: string, day: WeekDay, startTime: string, sourceDay?: WeekDay) => {
    const updatedClasses = classes.map((item) => {
      if (item.id !== id) return item;
      return timetableService.moveClass(item, day, startTime, sourceDay);
    });
    setClasses(normalizeClasses(updatedClasses));
  };

  const updateSettings = (newSettings: TimetableSettings) => {
    setSettings(normalizeSettings(newSettings, settings));
  };

  const resetSample = () => {
    setClasses(normalizeClasses(sampleClasses));
    setSettings(defaultSettings);
  };

  const replaceAll = (backup: TimetableBackup) => {
    setClasses(normalizeClasses(backup.classes));
    setSettings(normalizeSettings(backup.settings, defaultSettings));
  };

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
    findOverlaps
  };
}
