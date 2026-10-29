package models

import "time"

type Category struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(60);not null;uniqueIndex:idx_categories_name" json:"name"`
	Color     string    `gorm:"type:varchar(7);not null;default:#64748B" json:"color"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`
}

type Bookmark struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string    `gorm:"type:varchar(150);not null" json:"title"`
	URL         string    `gorm:"type:varchar(2048);not null" json:"url"`
	Description string    `gorm:"type:varchar(500);not null" json:"description"`
	CategoryID  *uint     `gorm:"index:idx_bookmarks_category_id" json:"category_id"`
	Category    *Category `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"category,omitempty"`
	IsFavorite  bool      `gorm:"not null;default:false;index:idx_bookmarks_is_favorite" json:"is_favorite"`
	CreatedAt   time.Time `gorm:"not null;index:idx_bookmarks_created_at" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`
}
