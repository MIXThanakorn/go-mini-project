package database

import (
	"context"
	"fmt"
	"net"
	"time"

	driver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"linknest/backend/internal/config"
	"linknest/backend/internal/models"
)

func Connect(c config.Config) (*gorm.DB, error) {
	dsn := driver.NewConfig()
	dsn.User, dsn.Passwd = c.DBUser, c.DBPassword
	dsn.Net, dsn.Addr, dsn.DBName = "tcp", net.JoinHostPort(c.DBHost, c.DBPort), c.DBName
	dsn.ParseTime, dsn.Loc = true, time.Local
	dsn.Params = map[string]string{"charset": "utf8mb4"}
	dsn.Timeout, dsn.ReadTimeout, dsn.WriteTimeout = 5*time.Second, 5*time.Second, 5*time.Second
	db, err := gorm.Open(mysql.Open(dsn.FormatDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("cannot connect to XAMPP MySQL at %s:%s; check service, DB_NAME and credentials", c.DBHost, c.DBPort)
	}
	pool, err := db.DB()
	if err != nil {
		return nil, err
	}
	pool.SetMaxOpenConns(10)
	pool.SetMaxIdleConns(5)
	pool.SetConnMaxLifetime(5 * time.Minute)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := pool.PingContext(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("XAMPP database ping failed")
	}
	// Only the two LinkNest tables are migrated. Never drop tables or seed fake records.
	if err := db.Set("gorm:table_options", "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci").AutoMigrate(&models.Category{}, &models.Bookmark{}); err != nil {
		pool.Close()
		return nil, fmt.Errorf("LinkNest schema migration failed; inspect database/schema.sql: %w", err)
	}
	return db, nil
}
