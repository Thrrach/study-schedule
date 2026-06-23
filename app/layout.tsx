import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "จัดตารางเรียน PSU",
  description: "สร้าง จัดเวลา และส่งออกตารางเรียนมหาวิทยาลัยได้อย่างง่ายดาย"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
