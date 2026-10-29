package handlers

import (
	"github.com/gin-gonic/gin"
	"linknest/backend/internal/dto"
	"linknest/backend/internal/models"
)

func (h Handler) ListCategories(c *gin.Context) {
	data, err := h.Store.GetCategories(c.Request.Context())
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) GetCategory(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	data, err := h.Store.GetCategory(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h Handler) CreateCategory(c *gin.Context) {
	var input dto.CategoryInput
	if !decode(c, &input) || !validate(c, input.Validate(true)) {
		return
	}
	category := models.Category{Name: input.Name, Color: *input.Color}
	if err := h.Store.CreateCategory(c.Request.Context(), &category); err != nil {
		dbError(c, err)
		return
	}
	c.JSON(201, gin.H{"data": category})
}

func (h Handler) UpdateCategory(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	var input dto.CategoryInput
	if !decode(c, &input) || !validate(c, input.Validate(false)) {
		return
	}
	category, err := h.Store.GetCategory(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	category.Name, category.Color = input.Name, *input.Color
	if err := h.Store.UpdateCategory(c.Request.Context(), category); err != nil {
		dbError(c, err)
		return
	}
	c.JSON(200, gin.H{"data": category})
}

func (h Handler) DeleteCategory(c *gin.Context) {
	id, ok := routeID(c)
	if !ok {
		return
	}
	rows, err := h.Store.DeleteCategory(c.Request.Context(), id)
	if err != nil {
		dbError(c, err)
		return
	}
	if rows == 0 {
		Fail(c, 404, "NOT_FOUND", "ไม่พบหมวดหมู่ที่ต้องการ", nil)
		return
	}
	c.Status(204)
}
