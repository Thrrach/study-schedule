"use client";

import { Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import type { ImageFormat } from "@/types/timetable";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  targetId: string;
  format: ImageFormat;
}

export function ExportButton({ targetId, format }: ExportButtonProps) {
  async function exportImage() {
    const node = document.getElementById(targetId);
    if (!node) return;

    const options = {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: node.scrollWidth,
      height: node.scrollHeight,
      style: {
        maxHeight: "none",
        overflow: "visible"
      }
    };
    const dataUrl =
      format === "png" ? await htmlToImage.toPng(node, options) : await htmlToImage.toJpeg(node, { ...options, quality: 0.96 });

    const link = document.createElement("a");
    link.download = `psu-timetable.${format}`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <Button onClick={exportImage} variant="secondary">
      <Download className="h-4 w-4" />
      Export {format.toUpperCase()}
    </Button>
  );
}
