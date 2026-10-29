package router

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestRequestBoundary(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := New(nil, "http://localhost:3000")
	tests := []struct {
		method, path, body string
		status             int
	}{
		{"GET", "/api/v1/bookmarks/abc", "", 400},
		{"GET", "/api/v1/categories/0", "", 400},
		{"GET", "/api/v1/bookmarks?page=0", "", 400},
		{"GET", "/api/v1/unknown", "", 404},
		{"POST", "/api/v1/health", `{}`, 405},
		{"POST", "/api/v1/bookmarks", `{`, 400},
		{"POST", "/api/v1/bookmarks", `{} {}`, 400},
		{"POST", "/api/v1/bookmarks", `{"unknown":1}`, 400},
		{"POST", "/api/v1/bookmarks", `{"title":" ","url":"javascript:alert(1)"}`, 422},
		{"PATCH", "/api/v1/bookmarks/1/favorite", `{"is_favorite":"false"}`, 400},
		{"PATCH", "/api/v1/bookmarks/1/favorite", `{}`, 422},
		{"PATCH", "/api/v1/bookmarks/1/favorite", `{"is_favorite":null}`, 422},
		{"POST", "/api/v1/categories", `{"name":"","color":"bad"}`, 422},
	}
	for _, tt := range tests {
		t.Run(tt.method+" "+tt.path+" "+tt.body, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()
			r.ServeHTTP(response, req)
			if response.Code != tt.status {
				t.Fatalf("got %d: %s, want %d", response.Code, response.Body, tt.status)
			}
			var body struct {
				Error struct{ Code, Message string }
			}
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil || body.Error.Code == "" || body.Error.Message == "" {
				t.Fatalf("invalid error contract: %s", response.Body)
			}
		})
	}
}

func TestCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := New(nil, "http://localhost:3000")
	for _, origin := range []string{"http://localhost:3000", "https://example.com"} {
		req := httptest.NewRequest("OPTIONS", "/api/v1/bookmarks", nil)
		req.Header.Set("Origin", origin)
		req.Header.Set("Access-Control-Request-Method", "PATCH")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, req)
		if origin == "http://localhost:3000" {
			if response.Code != 204 || response.Header().Get("Access-Control-Allow-Origin") != origin || !strings.Contains(response.Header().Get("Access-Control-Allow-Methods"), "PATCH") {
				t.Fatal("allowed CORS failed")
			}
		} else if response.Code != 403 || response.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Fatal("foreign origin was allowed")
		}
	}
}

func TestHealthUnavailable(t *testing.T) {
	// A closed pool simulates a lost database without stopping the user's XAMPP.
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN: "root@tcp(127.0.0.1:1)/linknest_db", SkipInitializeWithVersion: true,
	}), &gorm.Config{DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	pool, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	if err := pool.Close(); err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	New(db, "http://localhost:3000").ServeHTTP(response, httptest.NewRequest("GET", "/api/v1/health", nil))
	if response.Code != 503 || !strings.Contains(response.Body.String(), "DATABASE_UNAVAILABLE") {
		t.Fatalf("health must report unavailable DB: %d %s", response.Code, response.Body)
	}
}
