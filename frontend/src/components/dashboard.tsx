"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, FolderOpen, Star } from "lucide-react";
import { api, Dashboard, errorMessage } from "@/lib/api";
import BookmarkCard from "./bookmark-card";
import { Empty, Loading, Notice, PageHeading } from "./ui";

export default function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Dashboard }>("/dashboard", { signal: controller.signal })
      .then((result) => setData(result.data))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [reload]);
  return (
    <>
      <PageHeading
        eyebrow="YOUR LITTLE CORNER OF THE INTERNET"
        title="ลิงก์ดี ๆ อยู่ที่นี่แล้ว"
        description="รวบรวมสิ่งที่สนใจ จัดให้เป็นระเบียบ แล้วกลับมาอ่านได้เสมอ"
        add
      />
      <Notice message={error} />
      {error && (
        <button
          className="button secondary retry"
          onClick={() => {
            setError("");
            setReload((n) => n + 1);
          }}
        >
          ลองเชื่อมต่ออีกครั้ง
        </button>
      )}
      {!data && !error ? (
        <Loading />
      ) : (
        data && (
          <>
            <section className="stats-grid" aria-label="สรุปคลังลิงก์">
              {[
                {
                  label: "ลิงก์ทั้งหมด",
                  value: data.total_bookmarks,
                  icon: Bookmark,
                  href: "/bookmarks",
                  tone: "teal",
                },
                {
                  label: "รายการโปรด",
                  value: data.favorite_bookmarks,
                  icon: Star,
                  href: "/bookmarks?favorite=true",
                  tone: "amber",
                },
                {
                  label: "หมวดหมู่",
                  value: data.total_categories,
                  icon: FolderOpen,
                  href: "/categories",
                  tone: "blue",
                },
              ].map(({ label, value, icon: Icon, href, tone }) => (
                <Link href={href} className="stat-card" key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>{value.toLocaleString("th-TH")}</strong>
                    <small>ในคลังของคุณ</small>
                  </div>
                  <span className={`stat-icon ${tone}`}>
                    <Icon size={23} />
                  </span>
                </Link>
              ))}
            </section>
            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <h2>เพิ่งเก็บเข้าคลัง</h2>
                  <p>5 ลิงก์ล่าสุดที่คุณอยากกลับมาอ่าน</p>
                </div>
                <Link href="/bookmarks" className="text-link">
                  ดูทั้งหมด <ArrowRight size={16} />
                </Link>
              </div>
              {data.recent_bookmarks.length ? (
                <div className="bookmark-grid">
                  {data.recent_bookmarks.map((bookmark) => (
                    <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                  ))}
                </div>
              ) : (
                <Empty />
              )}
            </section>
            <div className="tip">
              <span>นิดหนึ่งก่อนเก็บ</span>
              <p>
                ตั้งชื่อให้จำง่าย และเลือกหมวดหมู่ให้ลิงก์
                ครั้งหน้าจะได้หาเจอเร็วขึ้น
              </p>
              <FolderOpen size={26} strokeWidth={1.4} />
            </div>
          </>
        )
      )}
    </>
  );
}
