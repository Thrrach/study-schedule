"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const presetColors = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#dc2626",
  "#16a34a",
  "#0891b2",
  "#be123c"
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Subject color</Label>
      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border border-slate-200",
              value === color && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Use color ${color}`}
          >
            {value === color ? <Check className="h-4 w-4 text-white" /> : null}
          </button>
        ))}
        <Input
          className="h-8 w-14 cursor-pointer p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Custom subject color"
        />
      </div>
    </div>
  );
}
