-- LinkNest: matches backend/internal/models/model.go. No destructive statements.
CREATE DATABASE IF NOT EXISTS linknest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE linknest_db;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#64748B',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookmarks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  description VARCHAR(500) NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_bookmarks_category_id (category_id),
  KEY idx_bookmarks_is_favorite (is_favorite),
  KEY idx_bookmarks_created_at (created_at),
  CONSTRAINT fk_bookmarks_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
