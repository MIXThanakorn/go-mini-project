package repositories

import (
	"context"
	"strings"

	"gorm.io/gorm"
	"linknest/backend/internal/dto"
	"linknest/backend/internal/models"
)

func (s Store) GetBookmark(ctx context.Context, id uint) (*models.Bookmark, error) {
	var bookmark models.Bookmark
	err := s.DB.WithContext(ctx).Preload("Category").First(&bookmark, id).Error
	return &bookmark, err
}

func (s Store) GetBookmarks(ctx context.Context, q dto.BookmarkQuery) ([]models.Bookmark, int64, error) {
	query := s.DB.WithContext(ctx).Model(&models.Bookmark{})
	if q.Search != "" {
		// Treat % and _ as literal characters, not wildcard operators supplied by the user.
		pattern := "%" + strings.NewReplacer("!", "!!", "%", "!%", "_", "!_").Replace(q.Search) + "%"
		query = query.Where("(title LIKE ? ESCAPE '!' OR url LIKE ? ESCAPE '!' OR description LIKE ? ESCAPE '!')", pattern, pattern, pattern)
	}
	if q.Uncategorized {
		query = query.Where("category_id IS NULL")
	}
	if q.CategoryID != nil {
		query = query.Where("category_id = ?", *q.CategoryID)
	}
	if q.Favorite != nil {
		query = query.Where("is_favorite = ?", *q.Favorite)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	bookmarks := []models.Bookmark{}
	err := query.Preload("Category").Order("created_at DESC, id DESC").Limit(q.Limit).Offset((q.Page - 1) * q.Limit).Find(&bookmarks).Error
	return bookmarks, total, err
}

func (s Store) CreateBookmark(ctx context.Context, bookmark *models.Bookmark) error {
	return s.DB.WithContext(ctx).Omit("Category").Create(bookmark).Error
}

func (s Store) UpdateBookmark(ctx context.Context, bookmark *models.Bookmark) error {
	// Maps deliberately persist false, empty descriptions, and NULL category IDs.
	// Exclude the preloaded Category so GORM cannot restore its old foreign key.
	return s.DB.WithContext(ctx).Model(bookmark).Omit("Category").Updates(map[string]any{
		"title": bookmark.Title, "url": bookmark.URL, "description": bookmark.Description,
		"category_id": bookmark.CategoryID, "is_favorite": bookmark.IsFavorite,
	}).Error
}

func (s Store) SetFavorite(ctx context.Context, id uint, favorite bool) (int64, error) {
	result := s.DB.WithContext(ctx).Model(&models.Bookmark{}).Where("id = ?", id).Update("is_favorite", favorite)
	return result.RowsAffected, result.Error
}

func (s Store) DeleteBookmark(ctx context.Context, id uint) (int64, error) {
	result := s.DB.WithContext(ctx).Delete(&models.Bookmark{}, id)
	return result.RowsAffected, result.Error
}

type Dashboard struct {
	TotalBookmarks    int64             `json:"total_bookmarks"`
	FavoriteBookmarks int64             `json:"favorite_bookmarks"`
	TotalCategories   int64             `json:"total_categories"`
	RecentBookmarks   []models.Bookmark `json:"recent_bookmarks"`
}

func (s Store) GetDashboard(ctx context.Context) (Dashboard, error) {
	d := Dashboard{RecentBookmarks: []models.Bookmark{}}
	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Bookmark{}).Count(&d.TotalBookmarks).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Bookmark{}).Where("is_favorite = ?", true).Count(&d.FavoriteBookmarks).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.Category{}).Count(&d.TotalCategories).Error; err != nil {
			return err
		}
		return tx.Preload("Category").Order("created_at DESC, id DESC").Limit(5).Find(&d.RecentBookmarks).Error
	})
	return d, err
}
