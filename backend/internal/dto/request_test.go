package dto

import (
	"encoding/json"
	"net/url"
	"strings"
	"testing"
)

func TestValidURL(t *testing.T) {
	for _, value := range []string{"https://go.dev/doc/", "http://localhost:3000/a?q=1#top", "https://example.com/ภาษาไทย", "https://example.com:8443"} {
		t.Run(value, func(t *testing.T) {
			if !ValidURL(value) {
				t.Errorf("rejected valid URL: %s", value)
			}
		})
	}
	for _, value := range []string{"", "go.dev", "/relative", "ftp://example.com", "javascript:alert(1)", "https://", "https:///path", "https://bad host.com", "https://example.com:bad", "https://example.com/\n"} {
		t.Run(value, func(t *testing.T) {
			if ValidURL(value) {
				t.Errorf("accepted invalid URL: %s", value)
			}
		})
	}
}

func TestCategoryValidation(t *testing.T) {
	for _, color := range []string{"#000000", "#aAbBcC", "#64748B"} {
		r := CategoryInput{Name: "  การเรียนรู้  ", Color: &color}
		if fields := r.Validate(true); len(fields) != 0 || r.Name != "การเรียนรู้" {
			t.Fatalf("valid category failed: %v", fields)
		}
	}
	for _, color := range []string{"", "red", "#fff", "#GG0000", "#0000000"} {
		r := CategoryInput{Name: "Valid", Color: &color}
		if r.Validate(true)["color"] == "" {
			t.Errorf("accepted color %q", color)
		}
	}
	r := CategoryInput{Name: strings.Repeat("ก", 60)}
	if len(r.Validate(true)) != 0 || *r.Color != "#64748B" {
		t.Fatal("default color or Unicode length failed")
	}
	r.Name += "ก"
	if r.Validate(true)["name"] == "" {
		t.Fatal("accepted overlong Unicode name")
	}
	r = CategoryInput{Name: "   "}
	if r.Validate(false)["name"] == "" || r.Validate(false)["color"] == "" {
		t.Fatal("missing required values accepted")
	}
}

func TestBookmarkValidation(t *testing.T) {
	r := BookmarkInput{Title: "  Go  ", URL: " https://go.dev/doc/ ", Description: "  text  "}
	if len(r.Validate()) != 0 || r.Title != "Go" || r.URL != "https://go.dev/doc/" || r.Description != "text" {
		t.Fatal("trim failed")
	}
	r.Title = strings.Repeat("ก", 150)
	if len(r.Validate()) != 0 {
		t.Fatal("150 Unicode characters should be accepted")
	}
	r.Title += "ก"
	r.Description = strings.Repeat("ก", 501)
	zero := uint(0)
	r.CategoryID = &zero
	fields := r.Validate()
	for _, field := range []string{"title", "description", "category_id"} {
		if fields[field] == "" {
			t.Errorf("missing validation for %s", field)
		}
	}
}

func TestParseQuery(t *testing.T) {
	defaults, err := ParseQuery(url.Values{})
	if err != nil || defaults.Page != 1 || defaults.Limit != 12 {
		t.Fatal("invalid defaults")
	}
	q, err := ParseQuery(url.Values{"search": {" Go "}, "page": {"2"}, "limit": {"100"}, "favorite": {"false"}, "category_id": {"uncategorized"}})
	if err != nil || q.Search != "Go" || q.Page != 2 || q.Limit != 100 || q.Favorite == nil || *q.Favorite || !q.Uncategorized {
		t.Fatalf("invalid parsed query: %+v, %v", q, err)
	}
	q, err = ParseQuery(url.Values{"category_id": {"7"}, "favorite": {"true"}})
	if err != nil || *q.CategoryID != 7 || !*q.Favorite {
		t.Fatal("category/favorite parsing failed")
	}
	for _, raw := range []string{"page=0", "page=-1", "page=1.2", "page=", "page=abc", "page=999999999999999999999999", "page=9223372036854775807&limit=100", "limit=0", "limit=101", "limit=x", "favorite=1", "favorite=False", "favorite=", "category_id=0", "category_id=nope", "category_id=", "limit=1&limit=2"} {
		t.Run(raw, func(t *testing.T) {
			values, _ := url.ParseQuery(raw)
			if _, err := ParseQuery(values); err == nil {
				t.Errorf("accepted invalid query %s", raw)
			}
		})
	}
}

func TestFavoriteBoolean(t *testing.T) {
	for _, value := range []bool{true, false} {
		body, _ := json.Marshal(map[string]bool{"is_favorite": value})
		var input FavoriteInput
		if err := json.Unmarshal(body, &input); err != nil || input.IsFavorite == nil || *input.IsFavorite != value {
			t.Fatalf("lost explicit boolean %v", value)
		}
	}
	for _, body := range []string{`{}`, `{"is_favorite":null}`} {
		var input FavoriteInput
		if err := json.Unmarshal([]byte(body), &input); err != nil || input.IsFavorite != nil {
			t.Fatal("omitted/null must remain distinguishable from false")
		}
	}
	var input FavoriteInput
	if err := json.Unmarshal([]byte(`{"is_favorite":"false"}`), &input); err == nil {
		t.Fatal("string boolean accepted")
	}
}
