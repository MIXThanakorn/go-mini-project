"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

export function PageHeading({
  eyebrow,
  title,
  description,
  add = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  add?: boolean;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {add && (
        <Link className="button primary" href="/bookmarks/new">
          <Plus size={18} /> เพิ่มลิงก์ใหม่
        </Link>
      )}
    </header>
  );
}

export function Notice({
  message,
  success = false,
}: {
  message: string;
  success?: boolean;
}) {
  if (!message) return null;
  return (
    <div
      className={`notice ${success ? "success" : "error"}`}
      role={success ? "status" : "alert"}
    >
      {success ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
      <span>{message}</span>
    </div>
  );
}

export function Loading({ label = "กำลังโหลดข้อมูล…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={23} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({
  filtered = false,
  categories = false,
}: {
  filtered?: boolean;
  categories?: boolean;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Bookmark size={30} strokeWidth={1.5} />
      </div>
      <h2>
        {filtered
          ? "ยังไม่พบลิงก์ที่ค้นหา"
          : categories
            ? "เริ่มจัดหมวดหมู่ให้ลิงก์ของคุณ"
            : "คลังลิงก์ของคุณเริ่มต้นที่นี่"}
      </h2>
      <p>
        {filtered
          ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง"
          : categories
            ? "เพิ่มหมวดหมู่แรกจากแบบฟอร์มด้านบนได้เลย"
            : "เจอเว็บไซต์ที่อยากกลับมาอ่าน? บันทึกลิงก์แรกไว้ได้เลย"}
      </p>
      {!filtered && !categories && (
        <Link href="/bookmarks/new" className="button primary">
          <Plus size={17} /> เพิ่มลิงก์แรก
        </Link>
      )}
    </div>
  );
}

export function ConfirmDelete({
  name,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = name !== null;
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open) ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="delete-icon">
        <Trash2 size={24} />
      </div>
      <h2 id="delete-title">ยืนยันการลบ</h2>
      <p id="delete-description">
        ต้องการลบ “{name}” ใช่ไหม?
        <br />
        เมื่อลบแล้วจะไม่สามารถกู้คืนได้
      </p>
      <div className="dialog-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
          autoFocus
        >
          ยกเลิก
        </button>
        <button
          type="button"
          className="button danger"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "กำลังลบ…" : "ยืนยันลบ"}
        </button>
      </div>
    </dialog>
  );
}
