import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** รวม className แบบมีเงื่อนไขและแก้ไข Tailwind class ที่ซ้ำกัน */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** สร้างรหัสเฉพาะแบบสั้นสำหรับข้อมูลที่สร้างใหม่ */
export function uid(prefix = "cls") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
