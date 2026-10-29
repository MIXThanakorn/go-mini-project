import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <p className="eyebrow">404</p>
      <h1>ไม่พบหน้าที่ต้องการ</h1>
      <p>กลับไปที่คลังลิงก์ของคุณได้เลย</p>
      <Link className="button primary" href="/">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
