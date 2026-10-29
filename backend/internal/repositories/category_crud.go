package repositories

import (
	"context"

	"gorm.io/gorm"
	"linknest/backend/internal/models"
)

type Store struct{ DB *gorm.DB }

type CategoryWithCount struct {
	models.Category
	BookmarkCount int64 `json:"bookmark_count"`
}

func (s Store) GetCategories(ctx context.Context) ([]CategoryWithCount, error) {
	categories := []CategoryWithCount{}
	counts := s.DB.Model(&models.Bookmark{}).Select("COUNT(*)").Where("bookmarks.category_id = categories.id")
	err := s.DB.WithContext(ctx).Model(&models.Category{}).Select("categories.*, (?) AS bookmark_count", counts).Order("name ASC").Scan(&categories).Error
	return categories, err
}

func (s Store) GetCategory(ctx context.Context, id uint) (*models.Category, error) {
	var category models.Category
	err := s.DB.WithContext(ctx).First(&category, id).Error
	return &category, err
}

func (s Store) CreateCategory(ctx context.Context, category *models.Category) error {
	return s.DB.WithContext(ctx).Create(category).Error
}

func (s Store) UpdateCategory(ctx context.Context, category *models.Category) error {
	return s.DB.WithContext(ctx).Model(category).Updates(map[string]any{"name": category.Name, "color": category.Color}).Error
}

func (s Store) DeleteCategory(ctx context.Context, id uint) (int64, error) {
	// The foreign key enforces RESTRICT even when a bookmark is added concurrently.
	result := s.DB.WithContext(ctx).Delete(&models.Category{}, id)
	return result.RowsAffected, result.Error
}
