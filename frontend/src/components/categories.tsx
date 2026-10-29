"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { api, ApiError, Category, errorMessage } from "@/lib/api";
import { ConfirmDelete, Empty, Loading, Notice, PageHeading } from "./ui";

export default function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748B");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Category[] }>("/categories", { signal: controller.signal })
      .then((r) => setCategories(r.data))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);
  function reset() {
    setEditing(null);
    setName("");
    setColor("#64748B");
    setFields({});
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const errors: Record<string, string> = {};
    if (!name.trim() || [...name.trim()].length > 60)
      errors.name = "กรุณาระบุชื่อหมวดหมู่ 1–60 ตัวอักษร";
    if (!/^#[0-9A-Fa-f]{6}$/.test(color))
      errors.color = "กรุณาเลือกสีในรูปแบบ #RRGGBB";
    setFields(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      await api(editing ? `/categories/${editing.id}` : "/categories", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ name, color }),
      });
      setSuccess(
        editing ? "แก้ไขหมวดหมู่เรียบร้อยแล้ว" : "เพิ่มหมวดหมู่เรียบร้อยแล้ว",
      );
      reset();
      setLoading(true);
      setReload((n) => n + 1);
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError) setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api(`/categories/${deleting.id}`, { method: "DELETE" });
      if (editing?.id === deleting.id) reset();
      setSuccess("ลบหมวดหมู่เรียบร้อยแล้ว");
      setLoading(true);
      setReload((n) => n + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A PLACE FOR EVERY LINK"
        title="หมวดหมู่"
        description="จัดลิงก์ที่เกี่ยวข้องไว้ด้วยกัน จะกลับมาหาเมื่อไรก็ง่าย"
      />
      <Notice message={error} />
      <Notice message={success} success />
      <form className="panel category-form" onSubmit={submit} noValidate>
        <div className="form-section-title">
          <FolderOpen size={19} />
          <h2>{editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</h2>
          {editing && (
            <button
              type="button"
              className="icon-button"
              onClick={reset}
              aria-label="ยกเลิกแก้ไข"
              disabled={busy}
            >
              <X size={17} />
            </button>
          )}
        </div>
        <fieldset className="category-fields" disabled={busy}>
          <div className="field">
            <label htmlFor="category-name">
              ชื่อหมวดหมู่ <span>*</span>
            </label>
            <input
              id="category-name"
              placeholder="เช่น การเรียนรู้, ออกแบบ, อ่านทีหลัง"
              value={name}
              maxLength={60}
              required
              onChange={(e) => {
                setName(e.target.value);
                setFields((f) => ({ ...f, name: "" }));
              }}
              aria-invalid={!!fields.name}
              aria-describedby={fields.name ? "category-name-error" : undefined}
            />
            {fields.name && (
              <span className="field-error" id="category-name-error">
                {fields.name}
              </span>
            )}
          </div>
          <div className="field color-field">
            <label htmlFor="category-color">สีหมวดหมู่</label>
            <div className="color-picker">
              <input
                type="color"
                id="category-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span>{color.toUpperCase()}</span>
            </div>
            {fields.color && (
              <span className="field-error">{fields.color}</span>
            )}
          </div>
          <button className="button primary" type="submit" disabled={busy}>
            {editing ? <Check size={17} /> : <Plus size={17} />}
            {busy
              ? "กำลังบันทึก…"
              : editing
                ? "บันทึกการแก้ไข"
                : "เพิ่มหมวดหมู่"}
          </button>
          {editing && (
            <button type="button" className="button secondary" onClick={reset}>
              ยกเลิก
            </button>
          )}
        </fieldset>
      </form>
      <div className="section-heading category-list-heading">
        <h2>
          หมวดหมู่ของคุณ{" "}
          <span className="count-badge">{categories.length}</span>
        </h2>
        <span>เรียงตามชื่อ</span>
      </div>
      {loading ? (
        <Loading />
      ) : categories.length ? (
        <div className="category-grid">
          {categories.map((category) => (
            <article
              className={`category-card ${editing?.id === category.id ? "editing" : ""}`}
              key={category.id}
            >
              <div
                className="category-symbol"
                style={{ color: category.color }}
              >
                <FolderOpen size={24} />
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.bookmark_count ?? 0} ลิงก์</p>
              </div>
              <div className="category-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`แก้ไขหมวดหมู่: ${category.name}`}
                  disabled={busy}
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                    setColor(category.color);
                    setError("");
                    setFields({});
                    document.getElementById("category-name")?.focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button delete-button"
                  aria-label={`ลบหมวดหมู่: ${category.name}`}
                  disabled={busy}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : error ? (
        <button
          className="button secondary"
          onClick={() => {
            setError("");
            setLoading(true);
            setReload((n) => n + 1);
          }}
        >
          ลองโหลดอีกครั้ง
        </button>
      ) : (
        <Empty categories />
      )}
      <p className="category-note">
        ลบหมวดหมู่ได้เมื่อไม่มีลิงก์อยู่ภายใน หากยังมีลิงก์
        ให้ย้ายไปหมวดหมู่อื่นหรือเลือก “ไม่มีหมวดหมู่” ก่อน
      </p>
      <ConfirmDelete
        name={deleting?.name ?? null}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
