export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  bookmark_count?: number;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  description: string;
  category_id: number | null;
  category?: Category;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookmarkInput {
  title: string;
  url: string;
  description: string;
  category_id: number | null;
  is_favorite: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Dashboard {
  total_bookmarks: number;
  favorite_bookmarks: number;
  total_categories: number;
  recent_bookmarks: Bookmark[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const baseURL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"
).replace(/\/$/, "");

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseURL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      "เชื่อมต่อ API ไม่ได้ กรุณาตรวจสอบว่า Go server และ MySQL ใน XAMPP กำลังทำงาน",
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      body.error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่",
      response.status,
      body.error?.fields,
    );
  return body as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function hostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}
