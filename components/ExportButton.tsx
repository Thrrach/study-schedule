"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import * as htmlToImage from "html-to-image";
import type { ImageFormat } from "@/types/timetable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ExportButtonProps {
  targetId: string;
  format: ImageFormat;
  onBeforeExport?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ExportButton({ targetId, format, onBeforeExport, className, variant = "secondary" }: ExportButtonProps) {
  const { t, language } = useTranslation();
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
      setExportError(language === "en" ? "Export failed. Please try again." : "ส่งออกรูปไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      delete node.dataset.exporting;
      setExporting(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        onClick={exportImage}
        variant={variant}
        disabled={exporting}
        className={cn("w-full sm:w-auto transition-all duration-300", exporting ? "opacity-90" : "")}
        aria-label={`${t("export.button")} ${format.toUpperCase()}`}
      >
        {exporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {exporting ? t("export.exporting") : `${language === "en" ? "Export" : "ส่งออก"} ${format.toUpperCase()}`}
      </Button>
      {exportError ? (
        <p className="absolute -bottom-6 left-0 right-0 text-center text-xs font-medium text-destructive" role="alert">
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
