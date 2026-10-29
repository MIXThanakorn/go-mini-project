package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"

	"github.com/gin-gonic/gin"
	driver "github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
	"linknest/backend/internal/dto"
	"linknest/backend/internal/repositories"
)

type Handler struct{ Store repositories.Store }

func Fail(c *gin.Context, status int, code, message string, fields map[string]string) {
	errorBody := gin.H{"code": code, "message": message}
	if len(fields) > 0 {
		errorBody["fields"] = fields
	}
	c.AbortWithStatusJSON(status, gin.H{"error": errorBody})
}

func decode(c *gin.Context, target any) bool {
	mediaType, _, err := mime.ParseMediaType(c.GetHeader("Content-Type"))
	if err != nil || mediaType != "application/json" {
		Fail(c, 400, "INVALID_REQUEST", "กรุณาส่งข้อมูล JSON พร้อม Content-Type: application/json", nil)
		return false
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		Fail(c, 400, "INVALID_REQUEST", "ข้อมูล JSON ไม่ถูกต้อง หรือชนิดข้อมูลไม่ตรงตามที่กำหนด", nil)
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		Fail(c, 400, "INVALID_REQUEST", "กรุณาส่ง JSON เพียงหนึ่ง object", nil)
		return false
	}
	return true
}

func routeID(c *gin.Context) (uint, bool) {
	id, err := dto.PositiveInt(c.Param("id"))
	if err != nil {
		Fail(c, 400, "INVALID_REQUEST", "รหัสต้องเป็นจำนวนเต็มบวก", nil)
		return 0, false
	}
	return uint(id), true
}

func dbError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		Fail(c, 404, "NOT_FOUND", "ไม่พบข้อมูลที่ต้องการ", nil)
		return
	}
	var mysqlError *driver.MySQLError
	if errors.As(err, &mysqlError) {
		switch mysqlError.Number {
		case 1062:
			Fail(c, 409, "DUPLICATE_CATEGORY", "มีชื่อหมวดหมู่นี้แล้ว กรุณาใช้ชื่ออื่น", map[string]string{"name": "ชื่อหมวดหมู่นี้ถูกใช้แล้ว"})
			return
		case 1451:
			Fail(c, 409, "CATEGORY_NOT_EMPTY", "หมวดหมู่นี้ยังมีลิงก์อยู่ กรุณาย้ายหรือลบลิงก์ก่อน", nil)
			return
		case 1452:
			Fail(c, 422, "VALIDATION_ERROR", "ไม่พบหมวดหมู่ที่เลือก", map[string]string{"category_id": "หมวดหมู่นี้ไม่มีอยู่แล้ว"})
			return
		}
	}
	log.Printf("database operation failed: %v", err)
	Fail(c, 500, "INTERNAL_ERROR", "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง", nil)
}

func validate(c *gin.Context, fields map[string]string) bool {
	if len(fields) == 0 {
		return true
	}
	Fail(c, 422, "VALIDATION_ERROR", "กรุณาตรวจสอบข้อมูลที่กรอก", fields)
	return false
}
