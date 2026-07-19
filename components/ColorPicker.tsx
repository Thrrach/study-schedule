"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

const presetColors = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#dc2626",
  "#16a34a",
  "#0891b2",
  "#be123c",
  
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

/** ให้ผู้ใช้เลือกสีรายวิชาจากสีสำเร็จรูปหรือ color input */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const inputId = useId();
  const safeValue = isValidHexColor(value) ? value : presetColors[0];

  return (
    <div className="space-y-2">
      <Label id={labelId} htmlFor={inputId}>
        {t("form.color")}
      </Label>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby={labelId}>
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border border-border shadow-sm transition hover:scale-105",
              value === color && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`${t("form.color")} ${color}`}
            aria-pressed={value === color}
            title={`${t("form.color")} ${color}`}
          >
            {value === color ? <Check className="h-4 w-4 text-white" /> : null}
          </button>
        ))}
        <Input
          id={inputId}
          className="h-8 w-14 cursor-pointer p-1"
          type="color"
          value={safeValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label={t("form.color")}
        />
      </div>
    </div>
  );
}

/** ตรวจสอบว่าสีเป็นรหัส hexadecimal 6 หลัก */
function isValidHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
