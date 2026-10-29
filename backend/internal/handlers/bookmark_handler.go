package handlers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"linknest/backend/internal/dto"
	"linknest/backend/internal/models"
)

func (h Handler) ListBookmarks(c *gin.Context) {
	query, err := dto.ParseQuery(c.Request.URL.Query())
	if err != nil {
		Fail(c, 400, "INVALID_REQUEST", err.Error(), nil)
		return
	}
	data, total, err := h.Store.GetBookmarks(c.Request.Context(), query)
	if err != nil {
		dbError(c, err)
		return
	}
	totalPages := total / int64(query.Limit)
	if total%int64(query.Limit) != 0 {
		totalPages++
	}
	c.JSON(200, gin.H{"data": data, "pagination": gin.H{"page": query.Page, "limit": query.Limit, "total": total, "total_pages": totalPages}})
}

func (h Handler) GetBookmark(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	data, err := h.Store.GetBookmark(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) categoryExists(c *gin.Context, id *uint) bool {
	if id == nil {
		return true
	}
	_, err := h.Store.GetCategory(c.Request.Context(), *id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		Fail(c, 422, "VALIDATION_ERROR", "ไม่พบหมวดหมู่ที่เลือก", map[string]string{"category_id": "หมวดหมู่นี้ไม่มีอยู่แล้ว"})
		return false
	}
	if err != nil {
		dbError(c, err)
		return false
	}
	return true
}

func (h Handler) CreateBookmark(c *gin.Context) {
	var input dto.BookmarkInput
	if !decode(c, &input) || !validate(c, input.Validate()) || !h.categoryExists(c, input.CategoryID) {
		return
	}
	bookmark := models.Bookmark{Title: input.Title, URL: input.URL, Description: input.Description, CategoryID: input.CategoryID, IsFavorite: input.IsFavorite}
	if err := h.Store.CreateBookmark(c.Request.Context(), &bookmark); err != nil {
		dbError(c, err)
		return
	}
	data, err := h.Store.GetBookmark(c.Request.Context(), bookmark.ID)
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(201, gin.H{"data": data})
}

func (h Handler) UpdateBookmark(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	var input dto.BookmarkInput
	if !decode(c, &input) || !validate(c, input.Validate()) {
		return
	}
	bookmark, err := h.Store.GetBookmark(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	if !h.categoryExists(c, input.CategoryID) {
		return
	}
	bookmark.Title, bookmark.URL, bookmark.Description = input.Title, input.URL, input.Description
	bookmark.CategoryID, bookmark.IsFavorite = input.CategoryID, input.IsFavorite
	if err := h.Store.UpdateBookmark(c.Request.Context(), bookmark); err != nil {
		dbError(c, err)
		return
	}
	data, err := h.Store.GetBookmark(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) DeleteBookmark(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	rows, err := h.Store.DeleteBookmark(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	if rows == 0 {
		Fail(c, 404, "NOT_FOUND", "ไม่พบลิงก์ที่ต้องการ", nil)
		return
	}
	c.Status(204)
}

func (h Handler) Favorite(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	var input dto.FavoriteInput
	if !decode(c, &input) {
		return
	}
	if input.IsFavorite == nil {
		Fail(c, 422, "VALIDATION_ERROR", "กรุณาระบุ is_favorite เป็น true หรือ false", map[string]string{"is_favorite": "ต้องระบุ true หรือ false"})
		return
	}
	// Fetch first: setting an already-equal boolean is still a successful operation.
	if _, err := h.Store.GetBookmark(c.Request.Context(), id); err != nil {
		dbError(c, err)
		return
	}
	if _, err := h.Store.SetFavorite(c.Request.Context(), id, *input.IsFavorite); err != nil {
		dbError(c, err)
		return
	}
	data, err := h.Store.GetBookmark(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) Dashboard(c *gin.Context) {
	data, err := h.Store.GetDashboard(c.Request.Context())
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) Health(c *gin.Context) {
	pool, err := h.Store.DB.DB()
	if err == nil {
		err = pool.PingContext(c.Request.Context())
	}
	if err != nil {
		Fail(c, 503, "DATABASE_UNAVAILABLE", "เชื่อมต่อ MySQL ไม่ได้ กรุณาตรวจสอบ XAMPP", nil)
		return
	}
	c.JSON(200, gin.H{"data": gin.H{"status": "ok", "database": "connected"}})
}
