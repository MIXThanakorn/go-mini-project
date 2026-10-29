"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  FolderOpen,
  Layers3,
  LayoutDashboard,
  Plus,
  ArrowUpRight,
} from "lucide-react";

const navigation = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/bookmarks", label: "ลิงก์ทั้งหมด", icon: Bookmark },
  { href: "/categories", label: "หมวดหมู่", icon: FolderOpen },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="LinkNest หน้าหลัก">
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          <span>
            LinkNest<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="sidebar-caption">พื้นที่เล็ก ๆ สำหรับลิงก์ดี ๆ</div>
        <Link href="/bookmarks/new" className="button primary sidebar-add">
          <Plus size={18} /> เพิ่มลิงก์ใหม่
        </Link>
        <div className="nav-label">คลังของคุณ</div>
        <nav aria-label="เมนูหลัก">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} />
                <span>{label}</span>
                {active && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-tag">
            <span /> พื้นที่ส่วนตัวในเครื่อง
          </div>
          <p>
            เก็บเป็นระเบียบ แล้วกลับมาอ่าน
            <br />
            ในเวลาที่ใช่ <ArrowUpRight size={13} />
          </p>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <span>PERSONAL LINK LIBRARY</span>
          <span className="topbar-note">เก็บไว้ ไม่หลงลืม</span>
        </div>
        <div className="page-content">{children}</div>
        <footer>
          LinkNest <span>·</span> ทุกลิงก์มีที่ของมัน
        </footer>
      </main>
    </div>
  );
}
