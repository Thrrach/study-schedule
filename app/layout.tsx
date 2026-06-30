import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "จัดตารางเรียน PSU",
  description: "วางแผน จัดเวลา และส่งออกตารางเรียนมหาวิทยาลัยได้สะดวกขึ้น"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
