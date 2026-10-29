import type { Metadata } from "next";
import Shell from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkNest — คลังลิงก์ส่วนตัว",
  description: "บันทึก จัดหมวดหมู่ และค้นหาลิงก์ที่อยากกลับมาอ่าน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
