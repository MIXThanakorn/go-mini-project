package dto

import (
	"fmt"
	"math"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

type CategoryInput struct {
	Name  string  `json:"name"`
	Color *string `json:"color"`
}

var hexColor = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

func (r *CategoryInput) Validate(create bool) map[string]string {
	r.Name = strings.TrimSpace(r.Name)
	fields := map[string]string{}
	if r.Name == "" || utf8.RuneCountInString(r.Name) > 60 {
		fields["name"] = "ชื่อหมวดหมู่ต้องมี 1–60 ตัวอักษร"
	}
	if r.Color == nil && create {
		value := "#64748B"
		r.Color = &value
	}
	if r.Color == nil || !hexColor.MatchString(*r.Color) {
		fields["color"] = "สีต้องอยู่ในรูปแบบ #RRGGBB"
	}
	return fields
}

type BookmarkInput struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	CategoryID  *uint  `json:"category_id"`
	IsFavorite  bool   `json:"is_favorite"`
}

func ValidURL(value string) bool {
	u, err := url.Parse(value)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Hostname() != "" && !strings.ContainsAny(u.Host, " \t\r\n")
}

func (r *BookmarkInput) Validate() map[string]string {
	r.Title, r.URL, r.Description = strings.TrimSpace(r.Title), strings.TrimSpace(r.URL), strings.TrimSpace(r.Description)
	fields := map[string]string{}
	if r.Title == "" || utf8.RuneCountInString(r.Title) > 150 {
		fields["title"] = "ชื่อลิงก์ต้องมี 1–150 ตัวอักษร"
	}
	if utf8.RuneCountInString(r.URL) > 2048 || !ValidURL(r.URL) {
		fields["url"] = "กรุณาระบุ URL แบบ http:// หรือ https:// ที่ถูกต้อง (ไม่เกิน 2,048 ตัวอักษร)"
	}
	if utf8.RuneCountInString(r.Description) > 500 {
		fields["description"] = "คำอธิบายยาวได้ไม่เกิน 500 ตัวอักษร"
	}
	if r.CategoryID != nil && *r.CategoryID == 0 {
		fields["category_id"] = "รหัสหมวดหมู่ต้องเป็นจำนวนเต็มบวก หรือ null"
	}
	return fields
}

type FavoriteInput struct {
	IsFavorite *bool `json:"is_favorite"`
}

type BookmarkQuery struct {
	Search        string
	CategoryID    *uint
	Uncategorized bool
	Favorite      *bool
	Page, Limit   int
}

func PositiveInt(value string) (int, error) {
	if value == "" || strings.IndexFunc(value, func(r rune) bool { return r < '0' || r > '9' }) != -1 {
		return 0, fmt.Errorf("expected a positive integer")
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 1 {
		return 0, fmt.Errorf("expected a positive integer")
	}
	return n, nil
}

func ParseQuery(values url.Values) (BookmarkQuery, error) {
	q := BookmarkQuery{Search: strings.TrimSpace(values.Get("search")), Page: 1, Limit: 12}
	for _, key := range []string{"page", "limit", "category_id", "favorite"} {
		if v, ok := values[key]; ok && (len(v) != 1 || v[0] == "") {
			return q, fmt.Errorf("%s ต้องระบุค่าเดียวที่ถูกต้อง", key)
		}
	}
	if value := values.Get("page"); value != "" {
		n, err := PositiveInt(value)
		if err != nil {
			return q, fmt.Errorf("page ต้องเป็นจำนวนเต็มบวก")
		}
		q.Page = n
	}
	if value := values.Get("limit"); value != "" {
		n, err := PositiveInt(value)
		if err != nil || n > 100 {
			return q, fmt.Errorf("limit ต้องอยู่ระหว่าง 1–100")
		}
		q.Limit = n
	}
	if q.Page-1 > math.MaxInt/q.Limit {
		return q, fmt.Errorf("page มีค่ามากเกินไป")
	}
	if value := values.Get("category_id"); value != "" {
		if value == "uncategorized" {
			q.Uncategorized = true
		} else {
			n, err := PositiveInt(value)
			if err != nil {
				return q, fmt.Errorf("category_id ต้องเป็นจำนวนเต็มบวก หรือ uncategorized")
			}
			id := uint(n)
			q.CategoryID = &id
		}
	}
	if value := values.Get("favorite"); value != "" {
		if value != "true" && value != "false" {
			return q, fmt.Errorf("favorite ต้องเป็น true หรือ false")
		}
		favorite := value == "true"
		q.Favorite = &favorite
	}
	return q, nil
}
