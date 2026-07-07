"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import * as htmlToImage from "html-to-image";
import type { ImageFormat } from "@/types/timetable";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  targetId: string;
  format: ImageFormat;
  onBeforeExport?: () => void;
}

export function ExportButton({ targetId, format, onBeforeExport }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function exportImage() {
    const node = document.getElementById(targetId);
    if (!node || exporting) return;

    setExporting(true);
    setExportError("");
    node.dataset.exporting = "true";
    onBeforeExport?.();

    try {
      await document.fonts?.ready;
      await nextPaint();

      const width = Math.ceil(Math.max(node.scrollWidth, node.getBoundingClientRect().width));
      const height = Math.ceil(Math.max(node.scrollHeight, node.getBoundingClientRect().height));
      const options = {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width,
        height,
        filter: (element: HTMLElement) => !element.classList?.contains("no-print"),
        style: {
          width: `${width}px`,
          height: `${height}px`,
          minWidth: "0",
          maxWidth: "none",
          maxHeight: "none",
          overflow: "visible",
          transform: "none"
        }
      };
      const dataUrl =
        format === "png"
          ? await htmlToImage.toPng(node, options)
          : await htmlToImage.toJpeg(node, { ...options, quality: 0.96 });

      const link = document.createElement("a");
      link.download = `psu-timetable.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Could not export timetable image", error);
      setExportError("ส่งออกรูปไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      delete node.dataset.exporting;
      setExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs leading-relaxed text-amber-700">
        ก่อนดาวน์โหลด โปรดตรวจสอบข้อมูลให้เรียบร้อย เนื้อหาที่ส่งออกจะอ้างอิงจากข้อมูลที่คุณกรอก และควรใช้ให้สอดคล้องกับระเบียบของมหาวิทยาลัย
      </p>
      <Button
        onClick={exportImage}
        variant="secondary"
        disabled={exporting}
        className="w-full sm:w-auto"
        aria-label={`ดาวน์โหลดตารางเป็น ${format.toUpperCase()}`}
      >
        {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {exporting ? "กำลังส่งออก..." : "ดาวน์โหลด"}
      </Button>
      {exportError ? (
        <p className="text-sm text-destructive" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
