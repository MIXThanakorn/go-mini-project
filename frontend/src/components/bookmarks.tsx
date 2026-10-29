"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { api, Bookmark, Category, errorMessage, Pagination } from "@/lib/api";
import BookmarkCard from "./bookmark-card";
import { ConfirmDelete, Empty, Loading, Notice, PageHeading } from "./ui";

export default function BookmarksView() {
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [favorite, setFavorite] = useState(params.get("favorite") === "true");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<{
    data: Bookmark[];
    pagination: Pagination;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    params.get("saved") ? "บันทึกลิงก์เรียบร้อยแล้ว" : "",
  );
  const [reload, setReload] = useState(0);
  const [busyID, setBusyID] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Bookmark | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== debouncedSearch) {
        setDebouncedSearch(search);
        setPage(1);
        setLoading(true);
        setError("");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);
  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Category[] }>("/categories", { signal: controller.signal })
      .then((r) => setCategories(r.data))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), limit: "12" });
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (category) query.set("category_id", category);
    if (favorite) query.set("favorite", "true");
    api<{ data: Bookmark[]; pagination: Pagination }>(`/bookmarks?${query}`, {
      signal: controller.signal,
    })
      .then((r) => setResult(r))
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedSearch, category, favorite, page, reload]);

  function refresh() {
    setLoading(true);
    setError("");
    setReload((n) => n + 1);
  }
  async function toggle(bookmark: Bookmark) {
    setBusyID(bookmark.id);
    setError("");
    setSuccess("");
    try {
      await api(`/bookmarks/${bookmark.id}/favorite`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: !bookmark.is_favorite }),
      });
      setSuccess(
        bookmark.is_favorite
          ? "นำลิงก์ออกจากรายการโปรดแล้ว"
          : "เพิ่มลิงก์ในรายการโปรดแล้ว",
      );
      if (favorite && result?.data.length === 1 && page > 1) {
        setLoading(true);
        setPage(page - 1);
      } else refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyID(null);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusyID(deleting.id);
    setError("");
    setSuccess("");
    try {
      await api(`/bookmarks/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      setSuccess("ลบลิงก์เรียบร้อยแล้ว");
      if (result?.data.length === 1 && page > 1) {
        setLoading(true);
        setPage(page - 1);
      } else refresh();
    } catch (e) {
      setError(errorMessage(e));
      setDeleting(null);
    } finally {
      setBusyID(null);
    }
  }
  const filtered = !!(search || category || favorite);
  return (
    <>
      <PageHeading
        eyebrow="YOUR BOOKMARKS"
        title="ลิงก์ทั้งหมด"
        description="ทุกไอเดีย ทุกเรื่องที่สนใจ เก็บไว้ให้หาเจอในที่เดียว"
        add
      />
      <Notice message={error} />
      <Notice message={success} success />
      <section className="filter-panel" aria-label="ค้นหาและกรองลิงก์">
        <div className="search-field">
          <Search size={19} />
          <label className="sr-only" htmlFor="search">
            ค้นหาลิงก์
          </label>
          <input
            id="search"
            type="search"
            placeholder="ค้นหาชื่อ ลิงก์ หรือคำอธิบาย…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <SlidersHorizontal size={17} className="filter-icon" />
          <label className="sr-only" htmlFor="category-filter">
            กรองหมวดหมู่
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
              setLoading(true);
              setError("");
            }}
          >
            <option value="">ทุกหมวดหมู่</option>
            <option value="uncategorized">ไม่มีหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`favorite-filter ${favorite ? "selected" : ""}`}
            aria-pressed={favorite}
            onClick={() => {
              setFavorite(!favorite);
              setPage(1);
              setLoading(true);
              setError("");
            }}
          >
            <Star size={16} fill={favorite ? "currentColor" : "none"} />{" "}
            รายการโปรด
          </button>
        </div>
      </section>
      <div className="list-meta">
        <span>
          {result ? (
            <>
              พบ <strong>{result.pagination.total}</strong> ลิงก์
            </>
          ) : (
            "คลังลิงก์ของคุณ"
          )}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setLoading(
                  !!(category || favorite || page !== 1 || debouncedSearch),
                );
                setSearch("");
                setCategory("");
                setFavorite(false);
                setPage(1);
                setError("");
              }}
              className="clear-filters"
            >
              <X size={13} /> ล้างตัวกรอง
            </button>
          )}
        </span>
        <span>เรียงจากใหม่ไปเก่า</span>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="retry-area">
          <button type="button" className="button secondary" onClick={refresh}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      ) : result?.data.length ? (
        <div className="bookmark-grid">
          {result.data.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onFavorite={toggle}
              onDelete={setDeleting}
              busy={busyID !== null}
            />
          ))}
        </div>
      ) : (
        <Empty filtered={filtered} />
      )}
      {!loading && result && result.pagination.total_pages > 1 && (
        <nav className="pagination" aria-label="เปลี่ยนหน้ารายการ">
          <button
            className="button secondary"
            disabled={page === 1}
            onClick={() => {
              setPage(page - 1);
              setLoading(true);
            }}
          >
            <ChevronLeft size={16} /> ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {result.pagination.total_pages}
          </span>
          <button
            className="button secondary"
            disabled={page >= result.pagination.total_pages}
            onClick={() => {
              setPage(page + 1);
              setLoading(true);
            }}
          >
            ถัดไป <ChevronRight size={16} />
          </button>
        </nav>
      )}
      <ConfirmDelete
        name={deleting?.title ?? null}
        busy={busyID !== null}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
