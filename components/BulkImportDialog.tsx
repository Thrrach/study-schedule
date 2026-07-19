"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseClassImport, type ImportedClass } from "@/lib/import-classes";
import { useTranslation } from "@/lib/i18n";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (classes: ImportedClass[]) => void;
}

const example = `courseCode,courseName,section,days,startTime,endTime,instructor,room,credits,type,status
344-211,Database Systems,01,Monday/Wednesday,08:00,09:50,Instructor Name,LRC 205,3,lecture,enrolled`;

export function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const { t, language } = useTranslation();
  const [text, setText] = useState("");
  const result = useMemo(() => parseClassImport(text, language), [language, text]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm text-foreground">
            {t("import.description")}
          </div>
          <Textarea className="min-h-56 font-mono text-xs" value={text} onChange={(event) => setText(event.target.value)} placeholder={example} aria-label={t("import.aria")} />
          {text.trim() ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-3 text-sm"><strong>{result.classes.length}</strong> {t("import.valid")}</div>
              <div className={`rounded-xl border p-3 text-sm ${result.errors.length ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}><strong>{result.errors.length}</strong> {t("import.errors")}</div>
            </div>
          ) : null}
          {result.errors.length ? <ul className="max-h-28 overflow-auto rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("form.cancel")}</Button>
            <Button disabled={!result.classes.length} onClick={() => { onImport(result.classes); setText(""); onOpenChange(false); }}><FileSpreadsheet className="h-4 w-4" />{t("import.action", { count: result.classes.length })}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
