import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSU Timetable Builder",
  description: "Build and export a clean university class timetable."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
