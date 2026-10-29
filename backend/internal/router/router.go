package router

import (
	"context"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"linknest/backend/internal/handlers"
	"linknest/backend/internal/repositories"
	"time"
)

func New(db *gorm.DB, origin string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.CustomRecovery(func(c *gin.Context, recovered any) {
		handlers.Fail(c, 500, "INTERNAL_ERROR", "เกิดข้อผิดพลาดในระบบ", nil)
	}))
	r.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Vary", "Origin")
		if c.GetHeader("Origin") == origin {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type")
		}
		if c.Request.Method == "OPTIONS" {
			if c.GetHeader("Origin") != origin {
				handlers.Fail(c, 403, "ORIGIN_NOT_ALLOWED", "Origin is not allowed", nil)
				return
			}
			c.AbortWithStatus(204)
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	})
	r.HandleMethodNotAllowed = true
	r.NoRoute(func(c *gin.Context) {
		handlers.Fail(c, 404, "NOT_FOUND", "ไม่พบ API ที่ต้องการ", nil)
	})
	r.NoMethod(func(c *gin.Context) {
		handlers.Fail(c, 405, "METHOD_NOT_ALLOWED", "ไม่รองรับ HTTP method นี้", nil)
	})
	h := handlers.Handler{Store: repositories.Store{DB: db}}
	api := r.Group("/api/v1")
	api.GET("/health", h.Health)
	api.GET("/dashboard", h.Dashboard)
	api.GET("/categories", h.ListCategories)
	api.POST("/categories", h.CreateCategory)
	api.GET("/categories/:id", h.GetCategory)
	api.PUT("/categories/:id", h.UpdateCategory)
	api.DELETE("/categories/:id", h.DeleteCategory)
	api.GET("/bookmarks", h.ListBookmarks)
	api.POST("/bookmarks", h.CreateBookmark)
	api.GET("/bookmarks/:id", h.GetBookmark)
	api.PUT("/bookmarks/:id", h.UpdateBookmark)
	api.DELETE("/bookmarks/:id", h.DeleteBookmark)
	api.PATCH("/bookmarks/:id/favorite", h.Favorite)
	return r
}
