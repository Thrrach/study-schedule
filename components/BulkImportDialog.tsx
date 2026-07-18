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
  const { language } = useTranslation();
  const [text, setText] = useState("");
  const result = useMemo(() => parseClassImport(text), [text]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{language === "en" ? "Import courses from CSV or text" : "นำเข้ารายวิชาจาก CSV หรือข้อความ"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">
            {language === "en" ? "Paste comma-separated or tab-separated rows. English and Thai column names are supported." : "วางข้อมูลที่คั่นด้วย comma หรือ tab รองรับชื่อคอลัมน์ภาษาไทยและอังกฤษ"}
          </div>
          <Textarea className="min-h-56 font-mono text-xs" value={text} onChange={(event) => setText(event.target.value)} placeholder={example} aria-label={language === "en" ? "Course import data" : "ข้อมูลรายวิชาสำหรับนำเข้า"} />
          {text.trim() ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-white p-3 text-sm"><strong>{result.classes.length}</strong> {language === "en" ? "valid courses" : "รายวิชาที่พร้อมนำเข้า"}</div>
              <div className={`rounded-lg border p-3 text-sm ${result.errors.length ? "border-amber-200 bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}><strong>{result.errors.length}</strong> {language === "en" ? "rows with errors" : "แถวที่มีข้อผิดพลาด"}</div>
            </div>
          ) : null}
          {result.errors.length ? <ul className="max-h-28 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{language === "en" ? "Cancel" : "ยกเลิก"}</Button>
            <Button disabled={!result.classes.length} onClick={() => { onImport(result.classes); setText(""); onOpenChange(false); }}><FileSpreadsheet className="h-4 w-4" />{language === "en" ? `Import ${result.classes.length}` : `นำเข้า ${result.classes.length} วิชา`}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
