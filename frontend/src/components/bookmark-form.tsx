"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookmarkPlus, Check, Link2 } from "lucide-react";
import {
  api,
  ApiError,
  Bookmark,
  BookmarkInput,
  Category,
  errorMessage,
} from "@/lib/api";
import { Loading, Notice, PageHeading } from "./ui";

const initial: BookmarkInput = {
  title: "",
  url: "",
  description: "",
  category_id: null,
  is_favorite: false,
};

export default function BookmarkForm({ id }: { id?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<BookmarkInput>(initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<{ data: Category[] }>("/categories", { signal: controller.signal }),
      id
        ? api<{ data: Bookmark }>(`/bookmarks/${id}`, {
            signal: controller.signal,
          })
        : Promise.resolve(null),
    ])
      .then(([c, b]) => {
        setCategories(c.data);
        if (b) {
          const { title, url, description, category_id, is_favorite } = b.data;
          setValues({ title, url, description, category_id, is_favorite });
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(e));
          setLoadFailed(true);
          setNotFound(e instanceof ApiError && e.status === 404);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, reload]);

  function change<K extends keyof BookmarkInput>(
    key: K,
    value: BookmarkInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setFields((f) => ({ ...f, [key]: "" }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!values.title.trim() || [...values.title.trim()].length > 150)
      errors.title = "กรุณาระบุชื่อลิงก์ 1–150 ตัวอักษร";
    try {
      const u = new URL(values.url.trim());
      if (
        !["http:", "https:"].includes(u.protocol) ||
        !u.hostname ||
        !/^https?:\/\//.test(values.url.trim())
      )
        throw new Error();
    } catch {
      errors.url = "กรุณาระบุ URL แบบ http:// หรือ https:// ที่ถูกต้อง";
    }
    if ([...values.url.trim()].length > 2048)
      errors.url = "URL ยาวได้ไม่เกิน 2,048 ตัวอักษร";
    if ([...values.description.trim()].length > 500)
      errors.description = "คำอธิบายยาวได้ไม่เกิน 500 ตัวอักษร";
    setFields(errors);
    setError("");
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await api(id ? `/bookmarks/${id}` : "/bookmarks", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(values),
      });
      router.push(`/bookmarks?saved=${id ? "updated" : "created"}`);
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError) setFields(e.fields);
      setSaving(false);
    }
  }
  function fieldError(key: string) {
    return fields[key] ? (
      <span id={`${key}-error`} className="field-error">
        {fields[key]}
      </span>
    ) : null;
  }
  return (
    <>
      <Link href="/bookmarks" className="back-link">
        <ArrowLeft size={16} /> กลับไปลิงก์ทั้งหมด
      </Link>
      <PageHeading
        eyebrow={id ? "EDIT BOOKMARK" : "SAVE SOMETHING GOOD"}
        title={id ? "แก้ไขลิงก์" : "เก็บลิงก์ใหม่"}
        description={
          id
            ? "ปรับรายละเอียดให้ค้นหาและกลับมาอ่านได้ง่ายขึ้น"
            : "เจออะไรน่าสนใจ บันทึกไว้ในคลังของคุณได้เลย"
        }
      />
      <Notice message={error} />
      {loading ? (
        <Loading />
      ) : loadFailed ? (
        <div className="panel not-found">
          <h2>{notFound ? "ไม่พบลิงก์นี้" : "โหลดแบบฟอร์มไม่ได้"}</h2>
          <p>
            {notFound
              ? "ลิงก์อาจถูกลบไปแล้ว กลับไปตรวจสอบรายการได้เลย"
              : "ตรวจสอบ Go server และ XAMPP แล้วลองอีกครั้ง"}
          </p>
          {!notFound && (
            <button
              className="button secondary"
              onClick={() => {
                setLoadFailed(false);
                setError("");
                setLoading(true);
                setReload((n) => n + 1);
              }}
            >
              ลองใหม่
            </button>
          )}
          <Link href="/bookmarks" className="button secondary">
            กลับไปลิงก์ทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="form-layout">
          <form className="panel bookmark-form" onSubmit={submit} noValidate>
            <div className="form-section-title">
              <Link2 size={19} />
              <h2>รายละเอียดลิงก์</h2>
            </div>
            <fieldset disabled={saving}>
              <div className="field">
                <label htmlFor="title">
                  ชื่อลิงก์ <span>*</span>
                </label>
                <input
                  id="title"
                  value={values.title}
                  onChange={(e) => change("title", e.target.value)}
                  placeholder="เช่น Go Documentation"
                  required
                  maxLength={150}
                  aria-invalid={!!fields.title}
                  aria-describedby={fields.title ? "title-error" : undefined}
                />
                {fieldError("title")}
              </div>
              <div className="field">
                <label htmlFor="url">
                  URL <span>*</span>
                </label>
                <input
                  id="url"
                  type="url"
                  value={values.url}
                  onChange={(e) => change("url", e.target.value)}
                  placeholder="https://example.com"
                  required
                  maxLength={2048}
                  aria-invalid={!!fields.url}
                  aria-describedby={fields.url ? "url-error" : "url-hint"}
                />
                <small id="url-hint">
                  รองรับลิงก์ที่ขึ้นต้นด้วย http:// และ https://
                </small>
                {fieldError("url")}
              </div>
              <div className="field">
                <label htmlFor="description">
                  คำอธิบาย <small>ไม่บังคับ</small>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={values.description}
                  onChange={(e) => change("description", e.target.value)}
                  maxLength={500}
                  placeholder="ลิงก์นี้เกี่ยวกับอะไร หรือทำไมถึงอยากเก็บไว้…"
                  aria-invalid={!!fields.description}
                  aria-describedby={
                    fields.description ? "description-error" : undefined
                  }
                />
                <span className="character-count">
                  {[...values.description].length} / 500
                </span>
                {fieldError("description")}
              </div>
              <div className="field">
                <label htmlFor="category_id">
                  หมวดหมู่ <small>ไม่บังคับ</small>
                </label>
                <select
                  id="category_id"
                  value={values.category_id ?? ""}
                  onChange={(e) =>
                    change(
                      "category_id",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  aria-invalid={!!fields.category_id}
                  aria-describedby={
                    fields.category_id ? "category_id-error" : undefined
                  }
                >
                  <option value="">ไม่มีหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldError("category_id")}
                <small>
                  จัดการหมวดหมู่ได้ที่{" "}
                  <Link href="/categories" className="text-link">
                    หน้าหมวดหมู่
                  </Link>
                </small>
              </div>
              <label className="checkbox-field" htmlFor="is_favorite">
                <input
                  id="is_favorite"
                  type="checkbox"
                  checked={values.is_favorite}
                  onChange={(e) => change("is_favorite", e.target.checked)}
                />
                <div>
                  <strong>เพิ่มในรายการโปรด</strong>
                  <span>เก็บลิงก์ที่ใช้บ่อยให้หาเจอได้เร็วขึ้น</span>
                </div>
              </label>
            </fieldset>
            <div className="form-actions">
              <Link
                href="/bookmarks"
                className={`button secondary ${saving ? "disabled-link" : ""}`}
                aria-disabled={saving}
              >
                ยกเลิก
              </Link>
              <button
                className="button primary"
                type="submit"
                disabled={saving}
              >
                <Check size={17} />
                {saving
                  ? "กำลังบันทึก…"
                  : id
                    ? "บันทึกการแก้ไข"
                    : "บันทึกลิงก์"}
              </button>
            </div>
          </form>
          <aside className="form-tip">
            <BookmarkPlus size={27} strokeWidth={1.5} />
            <h2>เก็บวันนี้ อ่านวันไหนก็ได้</h2>
            <p>ชัดเจนตั้งแต่ชื่อ จัดหมวดหมู่สักนิด และเพิ่มคำอธิบายไว้ช่วยจำ</p>
            <div>
              ช่องที่มี <span>*</span> จำเป็นต้องกรอก
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
