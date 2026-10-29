"use client";
import { Notice } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <>
      <Notice message="โหลดหน้าไม่สำเร็จ กรุณาลองอีกครั้ง" />
      <button className="button secondary" onClick={reset}>
        ลองใหม่
      </button>
    </>
  );
}
