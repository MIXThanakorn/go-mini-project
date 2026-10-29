package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort, DBHost, DBPort, DBUser, DBPassword, DBName, CORSOrigin string
}

func Load() (Config, error) {
	// Run from backend/ so the local .env file is found. OS variables take precedence.
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return Config{}, fmt.Errorf("read .env: %w", err)
	}
	c := Config{
		AppPort: env("APP_PORT", "8080"), DBHost: env("DB_HOST", "127.0.0.1"),
		DBPort: env("DB_PORT", "3306"), DBUser: env("DB_USER", "root"),
		DBPassword: os.Getenv("DB_PASSWORD"), DBName: env("DB_NAME", "linknest_db"),
		CORSOrigin: env("CORS_ORIGIN", "http://localhost:3000"),
	}
	for _, port := range []string{c.AppPort, c.DBPort} {
		n, err := strconv.Atoi(port)
		if err != nil || n < 1 || n > 65535 {
			return Config{}, fmt.Errorf("invalid port %q", port)
		}
	}
	return c, nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
