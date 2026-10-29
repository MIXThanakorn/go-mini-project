# LinkNest — คลังลิงก์ส่วนตัว

เว็บ Mini Project สำหรับบันทึก ค้นหา จัดหมวดหมู่ และกลับมาอ่านลิงก์ที่สนใจ มี CRUD ทั้งลิงก์และหมวดหมู่ รายการโปรด และ Dashboard ภาษาไทย ข้อมูลเก็บจริงใน MySQL/MariaDB ของ XAMPP

```text
Browser → Next.js :3000 → Go / Gin :8080/api/v1 → GORM → XAMPP MySQL :3306
```

## สิ่งที่ต้องติดตั้ง

- Go 1.26 ขึ้นไป (เครื่องที่พัฒนาใช้ Go 1.26.5)
- Node.js 20.9 ขึ้นไป พร้อม npm (เครื่องที่พัฒนาใช้ Node 24)
- XAMPP และเปิดบริการ MySQL/MariaDB
- Windows PowerShell หรือ terminal อื่น ๆ

ใช้ Gin + GORM ตาม MD และอ้างอิงการแยกหน้าที่ CRUD จาก [go-sau-management](https://github.com/MIXThanakorn/go-sau-management) โดยตัวอย่างเดิมใช้ Fiber แต่โปรเจ็คนี้ใช้ Gin ตามข้อกำหนด ไม่ได้เพิ่ม service/repository interface ที่ซับซ้อนเกิน Mini Project

## 1. เตรียมฐานข้อมูล (ครั้งแรก)

เปิด XAMPP Control Panel แล้วกด **Start ที่ MySQL** ให้เป็นสีเขียว พอร์ตปกติคือ `3306` Apache ไม่จำเป็นต่อการรัน Go/Next.js เปิดเฉพาะเมื่อจะใช้ phpMyAdmin

เปิด PowerShell ที่โฟลเดอร์โปรเจ็ค:

```powershell
cd C:\Thanakorn\go-mini-project
& 'C:\xampp\mysql\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root --execute="CREATE DATABASE IF NOT EXISTS linknest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

หากตั้งรหัสผ่าน MySQL ให้เพิ่ม `-p` แล้วพิมพ์รหัสผ่านเมื่อโปรแกรมถาม หรือเปิด phpMyAdmin ที่ `http://localhost/phpmyadmin` และรัน SQL ข้างต้นในแท็บ SQL

**Go จะสร้างตารางให้เองตอนเริ่ม server** ด้วย `AutoMigrate` หลังเชื่อมต่อฐานข้อมูลสำเร็จ ไม่ต้องสร้างตารางด้วยมือ และไม่มีการลบตาราง/ล้างข้อมูลเมื่อเปิดใหม่ โดยมีเพียงสองตาราง:

| ตาราง | ข้อมูล | ข้อกำหนดสำคัญ |
| --- | --- | --- |
| `categories` | ชื่อ สี วันที่สร้าง/แก้ไข | ชื่อไม่ซ้ำแบบไม่แยกตัวพิมพ์เล็กใหญ่ |
| `bookmarks` | ชื่อ URL คำอธิบาย หมวดหมู่ รายการโปรด วันที่ | หมวดหมู่เป็น NULL ได้ และ URL ซ้ำกันได้ |

ทั้งสองตารางใช้ InnoDB/utf8mb4 มี foreign key `bookmarks.category_id → categories.id` แบบ `ON DELETE RESTRICT` จึงไม่ทำลายลิงก์เมื่อลบหมวดหมู่ มี index ที่ชื่อหมวดหมู่, category_id, is_favorite และ created_at

มี [database/schema.sql](database/schema.sql) สำหรับดูโครงสร้างหรือ import เป็นทางเลือก เช่น:

```powershell
Get-Content -Raw .\database\schema.sql | & 'C:\xampp\mysql\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root
```

ไม่จำเป็นต้อง import ซ้ำถ้า Go สร้างตารางให้แล้ว `CREATE TABLE IF NOT EXISTS` เป็น fallback สำหรับการเริ่มฐานข้อมูลใหม่ ไม่ใช้เปลี่ยนโครงสร้างตารางเดิม

## 2. รัน Go API (Terminal ที่ 1)

```powershell
cd C:\Thanakorn\go-mini-project\backend
Copy-Item .env.example .env
go mod download
go run ./cmd/server
```

คัดลอก `.env` เฉพาะครั้งแรก หากมีแล้วให้แก้ไฟล์เดิม อย่าทับค่าที่ตั้งไว้ ตัวอย่าง:

```dotenv
APP_PORT=8080
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=linknest_db
CORS_ORIGIN=http://localhost:3000
```

ค่า root ไม่มีรหัสผ่านเป็นค่า XAMPP ที่ตรวจสอบบนเครื่องนี้แล้ว หากเครื่องอื่นใช้บัญชี/พอร์ตต่างกันให้แก้ตามจริง `.env` อยู่ใน `.gitignore` ไม่ควรนำขึ้น Git

เมื่อพร้อมจะเห็น `LinkNest API: http://localhost:8080/api/v1 (MySQL connected)` และตารางทั้งสองถูกสร้างแล้ว ตรวจได้ด้วย:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
& 'C:\xampp\mysql\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root -D linknest_db --execute="SHOW TABLES; SHOW CREATE TABLE bookmarks;"
```

Go bind ที่ `127.0.0.1` สำหรับใช้ในเครื่อง หากเชื่อมต่อ DB ไม่สำเร็จจะหยุดและแสดงข้อความให้ตรวจ XAMPP/ชื่อฐานข้อมูล/บัญชี ไม่สลับไปใช้ข้อมูลจำลอง

## 3. รันหน้าเว็บ (Terminal ที่ 2)

```powershell
cd C:\Thanakorn\go-mini-project\frontend
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

เปิด **[http://localhost:3000](http://localhost:3000)** และเปิดทั้งสอง terminal ค้างไว้ ใช้ `Ctrl+C` เมื่อต้องการหยุดแต่ละ server ข้อมูลใน DB ยังคงอยู่

`frontend/.env.local` มีเฉพาะ URL ของ API:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

หากเปลี่ยนพอร์ต frontend ต้องเปลี่ยน `CORS_ORIGIN` ใน backend ให้ตรงกัน และหากเปลี่ยนพอร์ต Go ให้เปลี่ยน API URL ด้วย จากนั้น restart ทั้งสอง server

บน PowerShell ใช้ `npm.cmd` เพื่อเลี่ยงกรณี execution policy บล็อก `npm.ps1` ไม่จำเป็นต้องแก้ execution policy ของเครื่อง

## หน้าที่มีให้ใช้งาน

| URL | การใช้งาน |
| --- | --- |
| `/` | สรุปลิงก์ทั้งหมด รายการโปรด หมวดหมู่ และ 5 ลิงก์ล่าสุด |
| `/bookmarks` | ค้นหา กรองหมวดหมู่/ไม่มีหมวดหมู่ กรองรายการโปรด เปลี่ยนหน้า เปิด แก้ไข ลบ และกดดาว |
| `/bookmarks/new` | เพิ่มลิงก์ เลือกหมวดหมู่ และรายการโปรด |
| `/bookmarks/[id]/edit` | แก้ไขข้อมูลเดิม รวมถึงล้างหมวดหมู่และยกเลิกรายการโปรด |
| `/categories` | ดูจำนวนลิงก์ต่อหมวดหมู่ เพิ่ม แก้ไขชื่อ/สี และลบ |

การเปิดลิงก์ใช้แท็บใหม่ ส่วนการลบต้องกดยืนยัน หากลบหมวดหมู่ที่มีลิงก์จะได้รับข้อความให้ย้ายหรือลบลิงก์ก่อน

## โครงสร้างโค้ด

```text
backend/
  cmd/server/main.go                 เริ่มโปรแกรมและปิด server/DB
  internal/config/config.go          อ่าน .env
  internal/database/mysql.go         เชื่อม GORM, pool, ping, AutoMigrate
  internal/models/model.go           Category และ Bookmark
  internal/dto/request.go            JSON input, validation และ query parser
  internal/repositories/             ฟังก์ชัน CRUD ที่เรียก GORM
  internal/handlers/                 รับ Gin context และแปลงผลเป็น HTTP JSON
  internal/router/                   เส้นทาง API, CORS และ request timeout
frontend/
  src/app/                          Next.js App Router pages
  src/components/                   หน้าจอ แบบฟอร์ม การ์ด และ dialog
  src/lib/api.ts                     typed fetch client และ response types
database/schema.sql                  โครงสร้าง DB สำหรับตรวจ/ติดตั้งด้วยมือ
scripts/test-api.mjs                 ทดสอบ HTTP จริงกับ Go + MySQL
docs/TEST-RESULTS.md                  รายงานการทดสอบที่ได้รันจริง
```

ลำดับโค้ดใกล้เคียงตัวอย่างที่เรียน: `main → router → handler → ฟังก์ชัน CRUD → GORM` เปรียบเทียบ `database.go` กับ `internal/database/mysql.go`, `model.go` กับ `internal/models/model.go`, `student_crud.go` กับไฟล์ใน `repositories` และ `student_route.go` กับ `router`/`handlers`

## API ทั้งหมด

ทุก endpoint อยู่ใต้ `http://localhost:8080/api/v1`

| Method | Path | ผลสำเร็จ |
| --- | --- | --- |
| GET | `/health` | 200, หรือ 503 เมื่อ DB ใช้งานไม่ได้ |
| GET | `/dashboard` | 200 สรุปจำนวนและ 5 ลิงก์ล่าสุด |
| GET / POST | `/categories` | 200 รายการพร้อมจำนวนลิงก์ / 201 สร้าง |
| GET / PUT / DELETE | `/categories/:id` | 200 ดู / 200 แก้ไข / 204 ลบหมวดหมู่ว่าง |
| GET / POST | `/bookmarks` | 200 รายการพร้อม pagination / 201 สร้าง |
| GET / PUT / DELETE | `/bookmarks/:id` | 200 ดู / 200 แก้ไข / 204 ลบถาวร |
| PATCH | `/bookmarks/:id/favorite` | 200 ตั้งรายการโปรดเป็น true หรือ false |

`GET /bookmarks` รองรับ `search`, `category_id` (จำนวนเต็มบวก หรือ `uncategorized`), `favorite=true/false`, `page` (เริ่มที่ 1), `limit` (1–100, default 12) เรียงใหม่ไปเก่า ค้นชื่อ/URL/คำอธิบายแบบไม่แยกตัวพิมพ์เล็กใหญ่ สามารถใช้ตัวกรองร่วมกันได้

ตัวอย่าง list response:

```json
{"data":[],"pagination":{"page":1,"limit":12,"total":0,"total_pages":0}}
```

ข้อมูลเดี่ยวส่งกลับใน `{"data":{...}}` ส่วน error ใช้ `{"error":{"code":"...","message":"...","fields":{"url":"..."}}}` โดย `fields` มีเฉพาะเมื่อเกี่ยวข้อง

| Status | ความหมาย |
| --- | --- |
| 400 | JSON/ชนิดข้อมูล/ID/query parameter ไม่ถูกต้อง |
| 404 | ไม่มี ID หรือเส้นทาง API นี้ |
| 409 | ชื่อหมวดหมู่ซ้ำ (`DUPLICATE_CATEGORY`) หรือยังมีลิงก์ (`CATEGORY_NOT_EMPTY`) |
| 422 | ข้อมูลไม่ผ่าน validation หรือ category_id ไม่มีจริง |
| 500 | ปัญหาภายใน/ฐานข้อมูล โดยไม่ส่ง SQL หรือข้อมูลลับให้ client |

POST/PUT/PATCH ต้องใช้ `Content-Type: application/json` จำกัด body 1 MiB และไม่รับฟิลด์ภายในเช่น ID หรือ timestamps จาก client PUT ต้องส่ง title/URL และแทนที่ข้อมูลที่แก้ไขได้ทั้งหมด ส่ง `category_id: null`, `is_favorite: false`, `description: ""` เพื่อล้างค่าตามต้องการ

## ตัวอย่างทดสอบ API ด้วย PowerShell

เปิด Go API ไว้ก่อน ชุดคำสั่งนี้สร้างข้อมูลสำหรับลองเอง และท้ายสุดลบข้อมูลที่สร้างในชุดนี้:

```powershell
$base = 'http://localhost:8080/api/v1'

# 1) เพิ่มหมวดหมู่
$category = Invoke-RestMethod "$base/categories" -Method Post -ContentType 'application/json' -Body (@{ name = 'Development'; color = '#147D70' } | ConvertTo-Json)
$categoryId = $category.data.id

# 2) เพิ่มลิงก์จริงลง DB
$payload = @{ title = 'Go Documentation'; url = 'https://go.dev/doc/'; description = 'Go language documentation'; category_id = $categoryId; is_favorite = $false }
$bookmark = Invoke-RestMethod "$base/bookmarks" -Method Post -ContentType 'application/json' -Body ($payload | ConvertTo-Json)
$bookmarkId = $bookmark.data.id

# 3) ดูรายการ รายละเอียด และค้นหา/กรอง
Invoke-RestMethod "$base/bookmarks"
Invoke-RestMethod "$base/bookmarks/$bookmarkId"
Invoke-RestMethod "$base/bookmarks?search=Go&category_id=$categoryId&page=1&limit=12"

# 4) กดดาวและตรวจ dashboard
Invoke-RestMethod "$base/bookmarks/$bookmarkId/favorite" -Method Patch -ContentType 'application/json' -Body '{"is_favorite":true}'
Invoke-RestMethod "$base/dashboard"

# 5) ลบหมวดหมู่ขณะที่ยังมีลิงก์: ควรได้ 409 (PowerShell จะแสดง error ตามคาด)
Invoke-RestMethod "$base/categories/$categoryId" -Method Delete

# 6) แก้ไขและล้างค่า เป็นการทดสอบ false / null / empty string
$payload.title = 'Go Documentation Updated'
$payload.category_id = $null
$payload.is_favorite = $false
$payload.description = ''
Invoke-RestMethod "$base/bookmarks/$bookmarkId" -Method Put -ContentType 'application/json' -Body ($payload | ConvertTo-Json)

# 7) หมวดหมู่ลบได้แล้ว จากนั้นลบลิงก์ (204 ไม่มี body)
Invoke-RestMethod "$base/categories/$categoryId" -Method Delete
Invoke-RestMethod "$base/bookmarks/$bookmarkId" -Method Delete

# 8) GET ลิงก์ที่ลบไป: ควรได้ 404
Invoke-RestMethod "$base/bookmarks/$bookmarkId"
```

หากมี Development อยู่แล้วจะได้ 409 ตั้งชื่อใหม่หรือใช้ ID ของหมวดหมู่เดิมแทน อย่าลบข้อมูลเดิมเพื่อให้ตัวอย่างผ่าน

ใน Postman ตั้ง base URL เดียวกัน เลือก method ตามตาราง Body → raw → JSON แล้วใส่ payload เดียวกับตัวอย่าง ตรวจ status code และ response JSON จากนั้นดูข้อมูลได้ที่ phpMyAdmin → `linknest_db` → Browse

## การทดสอบอัตโนมัติ

### Go unit tests, static checks และ build

```powershell
cd C:\Thanakorn\go-mini-project\backend
go fmt ./...
go test ./...
go vet ./...
go build -o server.exe ./cmd/server
```

Unit tests ครอบคลุม URL, ความยาว Unicode, สี, query/pagination, การแยก false จาก missing/null ใน favorite DTO, request validation, JSON error contract และ CORS โดยไม่ต้องเปิด MySQL

### API integration กับ MySQL จริง

เปิด MySQL และ Go server ก่อน แล้วในอีก terminal:

```powershell
cd C:\Thanakorn\go-mini-project
node scripts/test-api.mjs
```

ใช้ Node built-in `fetch`/`assert` ไม่ต้องติดตั้ง test dependency เพิ่ม สคริปต์ทดสอบทุก endpoint รวม CRUD, duplicate URL, unique category, search/filter, pagination, favorite, dashboard, foreign key, null/false/empty update และ invalid inputs สร้างข้อมูลชื่อ `LN-test-...` และเก็บ ID ไว้เพื่อลบเฉพาะข้อมูลของรอบนั้นใน `finally` ไม่ล้างตารางหรือแตะข้อมูลเดิม อย่าปิด server ระหว่างทดสอบ

หากเปลี่ยนพอร์ต API:

```powershell
$env:API_BASE_URL = 'http://localhost:8081/api/v1'
node scripts/test-api.mjs
Remove-Item Env:API_BASE_URL
```

### Frontend checks และ production run

```powershell
cd C:\Thanakorn\go-mini-project\frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run typecheck
# หยุด dev server ก่อน เพื่อให้พอร์ต 3000 ว่าง
npm.cmd start
```

Go/MySQL ยังต้องทำงานอยู่เช่นเดิม `npm start` ใช้ผลจาก build ไม่ใช่การเปิด backend แทน

## ขั้นตอนทดสอบผ่านหน้าเว็บสำหรับสาธิต

1. เปิด `/` ขณะ DB ว่าง: จำนวนเป็น 0 และมีข้อความให้เพิ่มลิงก์แรก
2. ไปหมวดหมู่ สร้าง `Development` เลือกสี ตรวจว่าชื่อซ้ำต่างตัวพิมพ์เล็กใหญ่ถูกปฏิเสธ
3. เพิ่ม `Go Documentation` URL `https://go.dev/doc/` พร้อมหมวดหมู่ Development และคำอธิบาย
4. กลับลิงก์ทั้งหมด กด Refresh: ข้อมูลต้องยังอยู่ ลองค้น `Go` และกรอง Development
5. กดชื่อเพื่อเปิดเว็บในแท็บใหม่ กดดาวแล้วไปหน้าภาพรวม: จำนวนรายการโปรดต้องเพิ่ม
6. แก้ชื่อ/คำอธิบายและบันทึก กลับเข้าหน้าแก้ไขอีกครั้ง: ต้องได้ค่าที่บันทึกจริง
7. ไปหมวดหมู่ ลองลบ Development และยืนยัน: ต้องแสดงข้อความว่าหมวดหมู่ยังมีลิงก์
8. แก้ bookmark ให้ไม่มีหมวดหมู่ ล้างคำอธิบายและยกเลิก favorite บันทึกและ refresh ตรวจว่าค่าถูกล้างจริง
9. ลบ Development อีกครั้ง: ต้องสำเร็จ จากนั้นลบ bookmark ผ่านกล่องยืนยันและ refresh: ต้องหายไป
10. ลอง URL ผิด, title ว่าง และเปิด `/bookmarks/999999999/edit`: ต้องมีข้อความ validation/ไม่พบข้อมูล
11. ปิด Go server แล้วโหลดหน้าใหม่: หน้าเว็บต้องแสดง error และมีปุ่มลองใหม่ เปิด server แล้วลองอีกครั้ง
12. ปรับขนาด browser ให้แคบ ทดสอบเมนู/แบบฟอร์ม/ปุ่ม และใช้ Tab/Enter/Escape กับกล่องยืนยัน

## แก้ปัญหาที่พบบ่อย

| อาการ | วิธีตรวจ |
| --- | --- |
| `cannot connect to XAMPP MySQL` | MySQL เป็นสีเขียวหรือไม่ ตรวจ port, user, password, DB_NAME และสร้าง DB ก่อน |
| พอร์ต 8080 หรือ 3000 ถูกใช้ | ปิด server เก่าที่ตัวเองเปิด หรือเปลี่ยนพอร์ตพร้อม env ทั้งสองฝั่ง |
| หน้าจอเชื่อม API ไม่ได้ | เปิด `/api/v1/health` ตรง ๆ และดู terminal Go หาก DB หยุดให้เปิด XAMPP ใหม่ |
| CORS error | เข้าเว็บผ่าน `http://localhost:3000` ให้ตรง `CORS_ORIGIN` อย่าสลับ `127.0.0.1` โดยไม่แก้ env |
| เปลี่ยน `.env.local` แล้วยังใช้ URL เดิม | Restart Next.js; ถ้าใช้ production ให้ build ใหม่ |
| ลบหมวดหมู่ไม่ได้ (409) | ย้าย bookmark เป็นไม่มีหมวดหมู่/หมวดหมู่อื่นก่อน |
| `.next` หรือ build มีปัญหาระหว่างรัน dev | หยุด dev ก่อน build และอย่ารัน build สองชุดพร้อมกัน |

โปรเจ็คนี้เป็น single-user ใช้งานในเครื่อง ไม่มี login หรือ cloud deployment ตาม scope ที่กำหนด
