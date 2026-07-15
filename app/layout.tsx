import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจัดตารางเรียน PSU",
  description: "วางแผน จัดเวลา และส่งออกตารางเรียนมหาวิทยาลัยได้สะดวกยิ่งขึ้น"
};

/** ครอบทุกหน้าด้วยโครง HTML พื้นฐานและ provider สำหรับการแจ้งเตือน */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
