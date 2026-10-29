"use client";

import Link from "next/link";
import { ArrowUpRight, Link2, Pencil, Star, Trash2 } from "lucide-react";
import { Bookmark, dateLabel, hostname } from "@/lib/api";

export default function BookmarkCard({
  bookmark,
  onFavorite,
  onDelete,
  busy = false,
}: {
  bookmark: Bookmark;
  onFavorite?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  busy?: boolean;
}) {
  const domain = hostname(bookmark.url);
  return (
    <article className="bookmark-card">
      <div className="card-top">
        <div className="site-icon">
          <Link2 size={20} />
        </div>
        {onFavorite ? (
          <button
            type="button"
            className={`icon-button favorite ${bookmark.is_favorite ? "selected" : ""}`}
            aria-label={`${bookmark.is_favorite ? "นำออกจาก" : "เพิ่มใน"}รายการโปรด: ${bookmark.title}`}
            aria-pressed={bookmark.is_favorite}
            onClick={() => onFavorite(bookmark)}
            disabled={busy}
          >
            <Star
              size={19}
              fill={bookmark.is_favorite ? "currentColor" : "none"}
            />
          </button>
        ) : (
          bookmark.is_favorite && (
            <Star size={18} className="star-static" fill="currentColor" />
          )
        )}
      </div>
      <a
        className="bookmark-title"
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <h2>{bookmark.title}</h2>
        <ArrowUpRight size={18} />
      </a>
      <a
        href={bookmark.url}
        className="domain"
        target="_blank"
        rel="noopener noreferrer"
        title={bookmark.url}
      >
        {domain}
      </a>
      <p
        className={`bookmark-description ${!bookmark.description ? "muted" : ""}`}
      >
        {bookmark.description || "ยังไม่มีคำอธิบาย"}
      </p>
      <div className="card-category">
        <span className="category-chip">
          <i
            style={{ backgroundColor: bookmark.category?.color || "#94A3B8" }}
          />
          {bookmark.category?.name || "ไม่มีหมวดหมู่"}
        </span>
      </div>
      <div className="card-footer">
        <span>{dateLabel(bookmark.created_at)}</span>
        <div>
          <Link
            href={`/bookmarks/${bookmark.id}/edit`}
            className="icon-button"
            aria-label={`แก้ไข: ${bookmark.title}`}
          >
            <Pencil size={16} />
          </Link>
          {onDelete && (
            <button
              type="button"
              className="icon-button delete-button"
              aria-label={`ลบ: ${bookmark.title}`}
              onClick={() => onDelete(bookmark)}
              disabled={busy}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
