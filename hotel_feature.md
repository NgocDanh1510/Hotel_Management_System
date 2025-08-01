# Hotel Booking Management System — Feature Specification

> Level: Production · Audience: Backend Engineers · Version: 1.1

### công nghệ:

---

```
Backend: Node.js, Express.js |
Database: MySql, sequenlize |
File Upload: Multer, Cloudinary |
```

---

## RBAC model update

Hệ thống không còn dùng **role cứng thuần trong code** làm nguồn phân quyền chính. Thay vào đó dùng mô hình RBAC động với các bảng:

- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

### đề xuất cập nhật database

#### users

- Authorization runtime nên đọc từ `user_roles` + `role_permissions`.

#### roles

- `id`: UUID PK
- `name`: VARCHAR(50) UNIQUE NOT NULL
- `description`: VARCHAR(255) NULL
- `is_system`: BOOLEAN DEFAULT false
- `created_at`, `updated_at`

#### permissions

- `id`: UUID PK
- `code`: VARCHAR(100) UNIQUE NOT NULL
- `module`: VARCHAR(50) NOT NULL
- `description`: VARCHAR(255) NULL
- `created_at`, `updated_at`

Ví dụ `code`:

- `hotel.read_public`
- `hotel.read_all`
- `hotel.manage_own`
- `booking.create`
- `booking.read_own`
- `booking.read_all`
- `review.moderate_own_hotel`
- `user.manage`
- `role.manage`
- `permission.manage`

#### user_roles

- `user_id`: UUID FK → users(id) ON DELETE CASCADE
- `role_id`: UUID FK → roles(id) ON DELETE CASCADE
- `assigned_by`: UUID FK → users(id) NULL
- `created_at`
- `PRIMARY KEY (user_id, role_id)`

#### role_permissions

- `role_id`: UUID FK → roles(id) ON DELETE CASCADE
- `permission_id`: UUID FK → permissions(id) ON DELETE CASCADE
- `created_at`
- `PRIMARY KEY (role_id, permission_id)`

### ghi chú business

- Một user có thể có **nhiều role**.
- Permission check ưu tiên theo `permission code`, không hard-code theo `role` string trong middleware.
- Có thể vẫn seed 3 role mặc định ban đầu:
  - `guest`
  - `hotel_staff`
  - `admin`
- `admin` thường có full permissions, nhưng vẫn nên map qua DB thay vì bypass hoàn toàn trong code.

---

## MODULE 1 — Authentication & Authorization (RBAC)

### 1.1 Register

| Field              | Detail                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**            | `POST /api/v1/auth/register`                                                                                                                                                        |
| **Description**    | Khách hàng tự đăng ký tài khoản. Hệ thống tạo user mới và tự gán role mặc định là `guest` thông qua bảng `user_roles`.                                                              |
| **Validation**     | `email`: unique + đúng format · `password`: min 8 ký tự, có uppercase + number + special char · `name`: 2–100 chars · `phone`: optional, E.164 format                               |
| **Business rules** | Tài khoản mới tạo có `is_active = true`, `failed_login_attempts = 0`, `locked_until = null` · Sau khi tạo user, insert thêm 1 record vào `user_roles` với role `guest`              |
| **Edge cases**     | Email đã tồn tại → `409` · Email thuộc tài khoản đã soft-delete → `409` · Không tìm thấy role mặc định `guest` trong hệ thống → `500` + log cảnh báo · Rate limit: max 5 lần/IP/giờ |

### 1.2 Login

| Field              | Detail                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**            | `POST /api/v1/auth/login`                                                                                                                                                                                                                                                                                                                                  |
| **Description**    | Xác thực bằng email/password. Nếu thành công, server trả `access_token` (JWT, 15 phút) và `refresh_token` (httpOnly cookie, 7 ngày). Đồng thời server lưu **hash của refresh token** vào bảng `refresh_tokens`.                                                                                                                                            |
| **Validation**     | `email` + `password` required                                                                                                                                                                                                                                                                                                                              |
| **Business rules** | `access_token` chứa thông tin tối thiểu như `user_id`, `email`, và danh sách `roles` hoặc `permissions` đã resolve tại thời điểm login · `refresh_token` được hash trước khi lưu DB · mỗi lần login tạo một session mới trong `refresh_tokens`                                                                                                             |
| **Edge cases**     | Sai password 5 lần → khóa account 15 phút (`locked_until`) · Account bị deactivate (`is_active = false`) → `403` · Account bị soft-delete (`deleted_at != null`) → `403` hoặc `404` tùy convention · User không có role nào → `403` hoặc fallback role `guest` tùy policy · Login khi đã có token cũ → vẫn cấp token mới, **không tự động xóa session cũ** |

### 1.3 Refresh Token

| Field              | Detail                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**            | `POST /api/v1/auth/refresh`                                                                                                                                                                                                                                         |
| **Description**    | Dùng `refresh_token` từ httpOnly cookie để cấp `access_token` mới. Theo logic hiện tại, ưu tiên **chỉ cấp access token mới**.                                                                                                                                       |
| **Validation**     | Phải có `refresh_token` trong cookie                                                                                                                                                                                                                                |
| **Business rules** | Server thực hiện 2 bước: `(1)` verify JWT refresh token `(2)` hash refresh token nhận được và so với `token_hash` trong DB. Nếu hợp lệ thì load lại `roles` + `permissions` hiện tại từ DB rồi cấp access token mới.                                                |
| **Edge cases**     | Không có refresh token → `401` · Refresh token sai chữ ký / hết hạn → `401` · Refresh token không còn trong DB → `401`, yêu cầu login lại · Role hoặc permission của user vừa bị đổi → token refresh thành công nhưng access token mới phải phản ánh quyền mới nhất |

### 1.4 Logout

| Field           | Detail                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **API**         | `POST /api/v1/auth/logout`                                                                                                                                   |
| **Description** | Logout session hiện tại bằng cách lấy `refresh_token` từ cookie, hash token đó, xóa record tương ứng trong bảng `refresh_tokens`, rồi clear cookie ở client. |
| **Validation**  | Refresh token trong cookie là optional về mặt xử lý; nếu không có vẫn có thể trả thành công để logout idempotent                                             |
| **Edge cases**  | Token không tồn tại trong DB nhưng client vẫn gọi logout → vẫn trả `200` và clear cookie · Không cần cấp token mới khi logout                                |

### 1.5 Logout All

| Field           | Detail                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **API**         | `POST /api/v1/auth/logout-all`                                                                      |
| **Description** | Xóa toàn bộ refresh token của user trong bảng `refresh_tokens`, buộc tất cả thiết bị phải login lại |
| **Edge cases**  | Nếu user chỉ có 1 session → tương đương logout thường                                               |

### 1.6 Authorization Middleware

| Field              | Detail                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**    | Middleware authorization kiểm tra theo permission code, ví dụ `requirePermission('hotel.manage_own')` hoặc `requirePermission('user.manage')`. |
| **Business rules** | Có thể hỗ trợ `requireAnyPermission([...])` và `requireAllPermissions([...])` để linh hoạt hơn cho endpoint phức tạp.                          |
| **Edge cases**     | User có role nhưng role không map permission nào → mặc định deny · Token hợp lệ nhưng permission thiếu → `403`                                 |

### 1.7 RBAC Matrix (seed mặc định)

| Permission Code             | guest | hotel_staff | admin |
| --------------------------- | ----- | ----------- | ----- |
| `hotel.read_public`         | ✅    | ✅          | ✅    |
| `hotel.read_all`            | ❌    | ❌          | ✅    |
| `hotel.manage_own`          | ❌    | ✅          | ✅    |
| `booking.create`            | ✅    | ❌          | ✅    |
| `booking.read_own`          | ✅    | ❌          | ✅    |
| `booking.read_all`          | ❌    | ❌          | ✅    |
| `review.moderate_own_hotel` | ❌    | ✅          | ✅    |
| `user.manage`               | ❌    | ❌          | ✅    |
| `role.manage`               | ❌    | ❌          | ✅    |
| `permission.read`           | ❌    | ❌          | ✅    |
| `permission.manage`         | ❌    | ❌          | ✅    |
| `dashboard.read`            | ❌    | ❌          | ✅    |
| `room.manage_own_hotel`     | ❌    | ✅          | ✅    |
| `image.manage_own_hotel`    | ❌    | ✅          | ✅    |
| `amenity.manage`            | ❌    | ❌          | ✅    |

---

## MODULE 2 — User Management

### 2.1 Get List Users (Admin only)

| Field          | Detail                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/users`                                                                                         |
| **Permission** | `user.manage`                                                                                                     |
| **Filter**     | `role_id` · `role_name` · `is_active` (true/false) · `created_at` (date range: from/to) · `city` (nếu có profile) |
| **Search**     | `q`: full-text trên `name`, `email`, `phone` — case-insensitive, partial match                                    |
| **Sort**       | `created_at` (default DESC) · `name` · `email` · `total_bookings`                                                 |
| **Pagination** | cursor-based hoặc offset. Default limit 10. Trả về `total`, `page`, `limit`, `has_next`                           |
| **Edge cases** | Search query quá ngắn (< 2 chars) → 400 · Sort field không hợp lệ → 400                                           |

### 2.2 Get User Detail (Admin)

| Field           | Detail                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **API**         | `GET /api/v1/admin/users/:id`                                                                                    |
| **Permission**  | `user.manage`                                                                                                    |
| **Description** | Trả về thông tin user + roles + thống kê: `total_bookings`, `total_spent`, `last_booking_at`, `avg_rating_given` |

### 2.3 Update User (Admin)

| Field            | Detail                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **API**          | `PUT /api/v1/admin/users/:id`                                                             |
| **Permission**   | `user.manage`                                                                             |
| **Update scope** | `is_active` · `name` · `phone`                                                            |
| **Validation**   | Không deactivate chính mình                                                               |
| **Edge cases**   | Deactivate user đang có booking `pending/confirmed` → cảnh báo, không auto-cancel booking |

### 2.4 Assign Roles to User (Admin)

| Field           | Detail                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**         | `PUT /api/v1/admin/users/:id/roles`                                                                                                          |
| **Permission**  | `user.manage` + `role.manage`                                                                                                                |
| **Body**        | `{ role_ids: UUID[] }` hoặc `{ role_names: string[] }`                                                                                       |
| **Description** | Replace toàn bộ danh sách role của user. Sync theo kiểu thêm role mới, xóa role không còn được gán.                                          |
| **Validation**  | Không cho xóa hết role của chính mình nếu policy yêu cầu luôn phải có ít nhất 1 role · Không cho gán role không tồn tại                      |
| **Edge cases**  | Gỡ role admin của chính mình → `400` · User sau khi đổi role vẫn đang online → access token cũ còn hiệu lực cho đến khi hết hạn hoặc refresh |

### 2.5 Get My Profile

| Field           | Detail                                                  |
| --------------- | ------------------------------------------------------- |
| **API**         | `GET /api/v1/me`                                        |
| **Description** | Trả về profile + roles + booking summary của chính mình |

### 2.6 Update My Profile

| Field            | Detail                                                           |
| ---------------- | ---------------------------------------------------------------- |
| **API**          | `PUT /api/v1/me`                                                 |
| **Update scope** | `name` · `phone` · `password` (cần current_password để xác nhận) |
| **Validation**   | Email không được tự đổi (phải qua flow verify email riêng)       |

---

## MODULE 3 — Role Management

### 3.1 Get List Roles

| Field          | Detail                          |
| -------------- | ------------------------------- |
| **API**        | `GET /api/v1/admin/roles`       |
| **Permission** | `role.manage`                   |
| **Filter**     | `is_system`                     |
| **Search**     | `q`: trên `name`, `description` |
| **Sort**       | `created_at` DESC · `name`      |
| **Pagination** | Offset, default 20              |

### 3.2 Get Role Detail

| Field           | Detail                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| **API**         | `GET /api/v1/admin/roles/:id`                                                      |
| **Permission**  | `role.manage`                                                                      |
| **Description** | Trả về role info + danh sách permissions đã gán + số lượng users đang dùng role đó |

### 3.3 Create Role

| Field          | Detail                                                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/roles`                                                            |
| **Permission** | `role.manage`                                                                         |
| **Validation** | `name` unique, lowercase snake_case hoặc kebab-case thống nhất theo convention nội bộ |
| **Edge cases** | Tạo role trùng tên → `409`                                                            |

### 3.4 Update Role

| Field            | Detail                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **API**          | `PUT /api/v1/admin/roles/:id`                                                                    |
| **Permission**   | `role.manage`                                                                                    |
| **Update scope** | `name` · `description`                                                                           |
| **Validation**   | Không cho sửa role hệ thống nếu `is_system = true`, trừ khi policy cho phép                      |
| **Edge cases**   | Đổi tên role đang được nhiều user sử dụng → hợp lệ, nhưng cần invalidate cache permission nếu có |

### 3.5 Delete Role

| Field          | Detail                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `DELETE /api/v1/admin/roles/:id`                                                                                             |
| **Permission** | `role.manage`                                                                                                                |
| **Validation** | Không cho xóa role hệ thống (`is_system = true`) · Không cho xóa role đang còn user gán nếu policy yêu cầu phải detach trước |
| **Edge cases** | Role đang được dùng → `409` hoặc hỗ trợ force detach theo policy                                                             |

### 3.6 Assign Permissions to Role

| Field           | Detail                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| **API**         | `PUT /api/v1/admin/roles/:id/permissions`                                                                             |
| **Permission**  | `role.manage` + `permission.manage`                                                                                   |
| **Body**        | `{ permission_ids: UUID[] }` hoặc `{ permission_codes: string[] }`                                                    |
| **Description** | Replace toàn bộ permission của role.                                                                                  |
| **Edge cases**  | Role đang được nhiều user sử dụng → thay đổi có hiệu lực cho token mới tạo sau đó; token hiện tại chỉ đổi sau refresh |

---

## MODULE 4 — Permission Management

### 4.1 Get List Permissions

| Field          | Detail                                     |
| -------------- | ------------------------------------------ |
| **API**        | `GET /api/v1/admin/permissions`            |
| **Permission** | `permission.read` hoặc `permission.manage` |
| **Filter**     | `module`                                   |
| **Search**     | `q`: trên `code`, `description`            |
| **Sort**       | `module` · `code`                          |
| **Pagination** | Offset, default 50                         |

### 4.2 Create Permission

| Field          | Detail                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/permissions`                                           |
| **Permission** | `permission.manage`                                                        |
| **Validation** | `code` unique · format gợi ý: `resource.action.scope` hoặc `module.action` |
| **Edge cases** | Tạo permission trùng `code` → `409`                                        |

### 4.3 Update Permission

| Field            | Detail                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| **API**          | `PUT /api/v1/admin/permissions/:id`                                                     |
| **Permission**   | `permission.manage`                                                                     |
| **Update scope** | `description` · `module`                                                                |
| **Validation**   | Không nên đổi `code` nếu permission đã được dùng rộng rãi, trừ khi có migration rõ ràng |

### 4.4 Delete Permission

| Field          | Detail                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| **API**        | `DELETE /api/v1/admin/permissions/:id`                                    |
| **Permission** | `permission.manage`                                                       |
| **Validation** | Không cho xóa permission đang còn được role sử dụng, trừ khi detach trước |

---

## MODULE 5 — Hotel Management

### 5.1 Get List Hotels (Public)

| Field          | Detail                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/hotels`                                                                                                                                                                           |
| **Filter**     | `city` · `country` · `star_rating` (min/max) · `price_min`/`price_max` (dựa vào `room_types.base_price`) · `amenity_ids[]` (array) · `check_in` + `check_out` + `guests` (availability filter) |
| **Search**     | `q`: search trên `name`, `city`, `address` — fuzzy match hoặc ILIKE                                                                                                                            |
| **Sort**       | `star_rating` · `price_asc` · `price_desc` · `avg_rating` · `created_at`                                                                                                                       |
| **Pagination** | Offset-based, default 12 per page (phù hợp grid UI)                                                                                                                                            |
| **Edge cases** | Filter `check_in/check_out` mà thiếu 1 trong 2 → 400 · `price_min > price_max` → 400                                                                                                           |

### 5.2 Get Hotel Detail (Public)

| Field           | Detail                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **API**         | `GET /api/v1/hotels/:slug`                                                                                        |
| **Description** | Trả về hotel info + room_types + amenities + images + avg_rating + review_count. Slug thay vì ID để SEO-friendly. |

### 5.3 Create Hotel

| Field          | Detail                                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/hotels`                                                                                                                                                                                                |
| **Permission** | `hotel.create` hoặc `hotel.manage_all`                                                                                                                                                                                     |
| **Validation** | `name`: 3–200 chars · `slug`: unique, auto-generate từ name nếu không truyền, lowercase + hyphen only · `star_rating`: 1.0–5.0, bước 0.5 · `owner_id`: phải tồn tại và user đó có role/phân quyền phù hợp để quản lý hotel |
| **Edge cases** | Slug conflict → auto-append số (hotel-abc-2)                                                                                                                                                                               |

### 5.4 Get List Hotels (Admin)

| Field          | Detail                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/hotels`                                                               |
| **Permission** | `hotel.read_all`                                                                         |
| **Filter**     | `is_active` · `owner_id` · `city` · `country` · `star_rating` range · `created_at` range |
| **Search**     | `q`: trên `name`, `slug`, `city`                                                         |
| **Sort**       | `created_at` · `name` · `star_rating` · `total_bookings`                                 |
| **Pagination** | Offset, default 20                                                                       |

### 5.5 Update Hotel (Admin / hotel_staff owner)

| Field            | Detail                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **API**          | `PUT /api/v1/admin/hotels/:id`                                                                                                           |
| **Permission**   | `hotel.manage_own` hoặc `hotel.manage_all`                                                                                               |
| **Update scope** | `name` · `description` · `address` · `city` · `country` · `star_rating` · `contact_email` · `contact_phone` · `is_active`                |
| **Validation**   | Nếu chỉ có `hotel.manage_own` thì caller chỉ update hotel mình own (check `owner_id`) · Deactivate hotel đang có booking confirmed → 400 |
| **Edge cases**   | Thay đổi `city` → không tự update các booking đang pending                                                                               |

### 5.6 Soft Delete Hotel

| Field           | Detail                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **API**         | `DELETE /api/v1/admin/hotels/:id`                                                                            |
| **Permission**  | `hotel.manage_all`                                                                                           |
| **Description** | Set `is_active = false`. Không xóa thật.                                                                     |
| **Edge cases**  | Hotel có active booking (status = pending/confirmed/checked_in) → 409, trả về danh sách booking bị ảnh hưởng |

---

## MODULE 6 — Room Management

### 6.1 Get List Room Types

| Field          | Detail                                                          |
| -------------- | --------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/hotels/:hotelId/room-types`                  |
| **Permission** | `room.manage_own_hotel` hoặc `room.manage_all`                  |
| **Filter**     | `max_occupancy` (min/max) · `base_price` (min/max) · `currency` |
| **Search**     | `q`: trên `name`                                                |
| **Sort**       | `base_price` · `max_occupancy` · `created_at`                   |
| **Pagination** | Offset, default 20                                              |

### 6.2 Create Room Type

| Field          | Detail                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/hotels/:hotelId/room-types`                                                                      |
| **Permission** | `room.manage_own_hotel` hoặc `room.manage_all`                                                                       |
| **Validation** | `name`: unique trong cùng hotel · `base_price` > 0 · `max_occupancy` 1–20 · `total_rooms` ≥ 1 · `currency`: ISO 4217 |

### 6.3 Get List Rooms

| Field          | Detail                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/rooms`                                                         |
| **Permission** | `room.manage_own_hotel` hoặc `room.manage_all`                                    |
| **Filter**     | `hotel_id` · `room_type_id` · `status` (available/occupied/maintenance) · `floor` |
| **Search**     | `q`: trên `room_number`, hotel `name`                                             |
| **Sort**       | `room_number` · `floor` · `status` · `updated_at`                                 |
| **Pagination** | Offset, default 20                                                                |

### 6.4 Update Single Room

| Field            | Detail                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **API**          | `PUT /api/v1/admin/rooms/:id`                                                                                          |
| **Permission**   | `room.manage_own_hotel` hoặc `room.manage_all`                                                                         |
| **Update scope** | `status` · `floor` · `room_number` · `room_type_id`                                                                    |
| **Validation**   | `room_number`: unique trong hotel · `room_type_id`: phải thuộc cùng hotel · Không cho cập nhật trái quyền sở hữu hotel |
| **Edge cases**   | Đổi `room_type_id` của phòng đang có booking → 409                                                                     |

### 6.5 Bulk Update Room Status

| Field          | Detail                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| **API**        | `PATCH /api/v1/admin/rooms/bulk-status`                                                                                                                                              |
| **Permission** | `room.manage_own_hotel` hoặc `room.manage_all`                                                                                                                                       |
| **Body**       | `{ room_ids: UUID[], status: "maintenance"                                                                                                                                           | "available" }` |
| **Validation** | Max 100 IDs/request · Tất cả room_ids phải thuộc hotel mà caller có quyền · Không cho bulk set `available` nếu bất kỳ room nào đang có active booking → trả về list room bị conflict |
| **Edge cases** | Một số IDs không tồn tại → partial success + report những IDs lỗi                                                                                                                    |

### 6.6 Get Room Availability (Public)

| Field           | Detail                                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**         | `GET /api/v1/hotels/:hotelId/rooms/availability?check_in=&check_out=&guests=`                                                                                           |
| **Description** | Trả về danh sách room_types còn phòng trống trong khoảng ngày, cùng số phòng còn lại và giá. Logic: đếm rooms không có booking overlap với status confirmed/checked_in. |
| **Edge cases**  | `check_in` < today → 400 · `check_out <= check_in` → 400 · guests > max_occupancy của tất cả room type → trả về empty với message rõ ràng                               |

---

## MODULE 7 — Booking Management

### 7.1 Create Booking

| Field           | Detail                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**         | `POST /api/v1/bookings`                                                                                                                                               |
| **Permission**  | `booking.create`                                                                                                                                                      |
| **Description** | Tạo booking với status `pending`. Hệ thống tự assign phòng available thuộc room_type được chọn. Tính `total_price = base_price × số đêm` và lưu snapshot vào booking. |
| **Validation**  | `check_in` ≥ ngày mai · `check_out > check_in` · `guests_count ≤ room_type.max_occupancy` · Room còn available trong khoảng ngày                                      |
| **Edge cases**  | Race condition: 2 user đặt cùng phòng cùng lúc → dùng DB transaction + SELECT FOR UPDATE hoặc optimistic locking · Sau 15 phút không thanh toán → auto-expire booking |

### 7.2 Get My Bookings

| Field          | Detail                                   |
| -------------- | ---------------------------------------- |
| **API**        | `GET /api/v1/me/bookings`                |
| **Permission** | `booking.read_own`                       |
| **Filter**     | `status` · `check_in` range · `hotel_id` |
| **Sort**       | `created_at` DESC (default) · `check_in` |
| **Pagination** | Offset, default 10                       |

### 7.3 Get Booking Detail

| Field           | Detail                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **API**         | `GET /api/v1/bookings/:id`                                                                                                        |
| **Permission**  | `booking.read_own` hoặc `booking.read_all`                                                                                        |
| **Description** | User chỉ xem booking của mình nếu không có `booking.read_all`. Admin hoặc role có quyền rộng xem được tất cả. Trả về full detail. |

### 7.4 Cancel Booking

| Field          | Detail                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **API**        | `POST /api/v1/bookings/:id/cancel`                                                                                                   |
| **Permission** | `booking.cancel_own` hoặc `booking.cancel_all`                                                                                       |
| **Validation** | User thường chỉ cancel booking của mình · Chỉ cancel được khi status = `pending` hoặc `confirmed` · Không cancel khi đã `checked_in` |
| **Edge cases** | Cancel booking đã có payment success → trigger refund flow · Hủy trong vòng 24h trước check_in → có thể apply cancellation policy    |

### 7.5 Get All Bookings

| Field          | Detail                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/bookings`                                                                                                                   |
| **Permission** | `booking.read_all`                                                                                                                             |
| **Filter**     | `status` (multi-select) · `hotel_id` · `room_id` · `user_id` · `check_in` range · `check_out` range · `created_at` range · `total_price` range |
| **Search**     | `q`: trên user `name`, user `email`, `room_number`, hotel `name`                                                                               |
| **Sort**       | `created_at` · `check_in` · `total_price` · `status`                                                                                           |
| **Pagination** | Offset, default 20                                                                                                                             |

### 7.6 Update Booking Status

| Field                     | Detail                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **API**                   | `PATCH /api/v1/admin/bookings/:id/status`                                                                                         |
| **Permission**            | `booking.update_status_own_hotel` hoặc `booking.update_status_all`                                                                |
| **Allowed transitions**   | `pending → confirmed` · `confirmed → checked_in` · `checked_in → checked_out` · `pending/confirmed → cancelled`                   |
| **Forbidden transitions** | `checked_out → *` · `cancelled → *` · `checked_in → confirmed`                                                                    |
| **Edge cases**            | `confirmed → checked_in` chỉ được thực hiện từ ngày check_in trở đi · Transition `→ cancelled` khi có payment → phải xử lý refund |

---

## MODULE 8 — Payment Management

### 8.1 Create Payment

| Field           | Detail                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| **API**         | `POST /api/v1/payments`                                                                                                       |
| **Permission**  | `payment.create` hoặc gộp vào `booking.create` tùy policy                                                                     |
| **Body**        | `{ booking_id, amount, gateway: "vnpay"                                                                                       | "momo" | "stripe" }` |
| **Description** | Tạo payment record với status `pending`, gọi payment gateway, trả về payment URL để redirect.                                 |
| **Validation**  | Booking phải ở trạng thái `pending` · User phải là owner của booking · Amount phải khớp với booking total hoặc deposit amount |
| **Edge cases**  | Gateway timeout → giữ status `pending`, cho retry · Double payment cùng booking → 409 nếu đã có payment success               |

### 8.2 Payment Webhook

| Field           | Detail                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **API**         | `POST /api/v1/webhooks/payment/:gateway`                                                                                                |
| **Description** | Nhận callback từ payment gateway. Verify signature → update payment status → nếu success thì update booking status → `confirmed`.       |
| **Edge cases**  | Webhook đến 2 lần (duplicate) → idempotent bằng `transaction_id` · Webhook đến sau khi booking đã bị cancel → log warning, không update |

### 8.3 Get Payment History

| Field          | Detail                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/payments`                                                                                  |
| **Permission** | `payment.read_all`                                                                                            |
| **Filter**     | `status` · `type` (deposit/full_payment/refund) · `gateway` · `booking_id` · `paid_at` range · `amount` range |
| **Search**     | `q`: trên `transaction_id`, user `email`                                                                      |
| **Sort**       | `paid_at` DESC · `amount` · `created_at`                                                                      |
| **Pagination** | Offset, default 20                                                                                            |

### 8.4 Issue Refund

| Field          | Detail                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/payments/:id/refund`                                                                         |
| **Permission** | `payment.refund`                                                                                                 |
| **Body**       | `{ amount, reason }`                                                                                             |
| **Validation** | Chỉ refund payment có status `success` · Refund amount ≤ original amount · Không refund nhiều lần vượt tổng paid |
| **Edge cases** | Gateway refund fail → tạo refund record với status `failed`, cần manual xử lý                                    |

---

## MODULE 9 — Review Management

### 9.1 Create Review

| Field          | Detail                                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/reviews`                                                                                                                                                                                                     |
| **Permission** | `review.create`                                                                                                                                                                                                            |
| **Body**       | `{ booking_id, rating_overall, rating_cleanliness, rating_service, rating_location, comment }`                                                                                                                             |
| **Validation** | Booking phải có status `checked_out` · Booking phải thuộc chính user đó · Chưa có review cho booking này (`booking_id` unique) · `rating_overall` 1–5, required · Các rating khác 1–5, optional · `comment` max 2000 chars |
| **Edge cases** | Review chỉ cho phép tạo trong vòng 30 ngày sau `check_out` · Mặc định `is_published = false`, cần admin/staff duyệt                                                                                                        |

### 9.2 Get Reviews of Hotel (Public)

| Field          | Detail                                                     |
| -------------- | ---------------------------------------------------------- |
| **API**        | `GET /api/v1/hotels/:hotelId/reviews`                      |
| **Filter**     | `rating_overall` (min/max) · Chỉ lấy `is_published = true` |
| **Sort**       | `created_at` DESC · `rating_overall`                       |
| **Pagination** | Offset, default 10                                         |

### 9.3 Get All Reviews

| Field          | Detail                                                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/reviews`                                                           |
| **Permission** | `review.read_all`                                                                     |
| **Filter**     | `is_published` · `hotel_id` · `user_id` · `rating_overall` range · `created_at` range |
| **Search**     | `q`: trên `comment`, user `name`                                                      |
| **Sort**       | `created_at` · `rating_overall`                                                       |
| **Pagination** | Offset, default 20                                                                    |

### 9.4 Moderate Review

| Field            | Detail                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **API**          | `PATCH /api/v1/admin/reviews/:id`                                                                                                          |
| **Permission**   | `review.moderate_own_hotel` hoặc `review.moderate_all`                                                                                     |
| **Update scope** | `is_published` (true/false)                                                                                                                |
| **Description**  | Nếu chỉ có quyền own-hotel thì hotel_staff chỉ moderate review của hotel mình. Khi publish/unpublish → recalculate `avg_rating` của hotel. |

### 9.5 Bulk Moderate

| Field          | Detail                                          |
| -------------- | ----------------------------------------------- |
| **API**        | `PATCH /api/v1/admin/reviews/bulk-publish`      |
| **Permission** | `review.moderate_all`                           |
| **Body**       | `{ review_ids: UUID[], is_published: boolean }` |
| **Validation** | Max 50 IDs/request                              |

---

## MODULE 10 — Image / Media Management

### 10.1 Upload Images

| Field          | Detail                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `POST /api/v1/admin/images/upload`                                                                                                                      |
| **Permission** | `image.manage_own_hotel` hoặc `image.manage_all`                                                                                                        |
| **Body**       | `multipart/form-data: files[], entity_type, entity_id`                                                                                                  |
| **Validation** | `entity_type`: `hotel` hoặc `room_type` · `entity_id` phải tồn tại và caller có quyền · File: jpeg/png/webp · Max size: 5MB/file · Max 10 files/request |
| **Edge cases** | Upload thành công 7/10 file → partial success response · hotel_staff chỉ upload cho hotel mình own                                                      |

### 10.2 Reorder Images

| Field           | Detail                                                     |
| --------------- | ---------------------------------------------------------- |
| **API**         | `PATCH /api/v1/admin/images/reorder`                       |
| **Permission**  | `image.manage_own_hotel` hoặc `image.manage_all`           |
| **Body**        | `{ images: [{id: UUID, sort_order: int}] }`                |
| **Description** | Cập nhật thứ tự ảnh để ảnh đầu tiên hiển thị làm thumbnail |

### 10.3 Set Primary Image

| Field           | Detail                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **API**         | `PATCH /api/v1/admin/images/:id/set-primary`                                                        |
| **Permission**  | `image.manage_own_hotel` hoặc `image.manage_all`                                                    |
| **Description** | Set `is_primary = true` cho ảnh này, reset `is_primary = false` cho tất cả ảnh khác của cùng entity |

### 10.4 Delete Image

| Field          | Detail                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `DELETE /api/v1/admin/images/:id`                                                                                                |
| **Permission** | `image.manage_own_hotel` hoặc `image.manage_all`                                                                                 |
| **Edge cases** | Xóa ảnh đang là primary → auto-promote ảnh kế tiếp (theo sort_order) lên primary · Xóa ảnh trên CDN/S3 có thể async (dùng queue) |

---

## MODULE 11 — Amenity Management

### 11.1 CRUD Amenities

| Field          | Detail                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **API**        | `GET/POST /api/v1/admin/amenities` · `PUT/DELETE /api/v1/admin/amenities/:id`                            |
| **Permission** | `amenity.manage` hoặc tách nhỏ thành `amenity.read` / `amenity.manage`                                   |
| **Validation** | `name` unique · Không xóa amenity đang được dùng bởi hotel/room_type (hoặc cascade xóa junction records) |

### 11.2 Assign Amenities to Hotel

| Field           | Detail                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **API**         | `PUT /api/v1/admin/hotels/:id/amenities`                                                          |
| **Permission**  | `hotel.manage_own` hoặc `hotel.manage_all`                                                        |
| **Body**        | `{ amenity_ids: UUID[] }`                                                                         |
| **Description** | Replace toàn bộ (không phải append). Sync: xóa những gì không còn trong list, thêm những cái mới. |

### 11.3 Assign Amenities to Room Type

| Field          | Detail                                         |
| -------------- | ---------------------------------------------- |
| **API**        | `PUT /api/v1/admin/room-types/:id/amenities`   |
| **Permission** | `room.manage_own_hotel` hoặc `room.manage_all` |
| **Body**       | `{ amenity_ids: UUID[] }`                      |

---

## MODULE 12 — Dashboard & Analytics

### 12.1 Overview Stats

| Field          | Detail                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/dashboard/stats`                                                                                        |
| **Permission** | `dashboard.read`                                                                                                           |
| **Returns**    | `total_hotels` · `total_bookings_today` · `revenue_this_month` · `occupancy_rate` · `pending_bookings` · `pending_reviews` |

### 12.2 Revenue Report

| Field          | Detail                                                   |
| -------------- | -------------------------------------------------------- |
| **API**        | `GET /api/v1/admin/reports/revenue`                      |
| **Permission** | `dashboard.read`                                         |
| **Filter**     | `hotel_id` · `from` · `to` · `group_by` (day/week/month) |
| **Returns**    | Time series data: `[{ period, revenue, booking_count }]` |

### 12.3 Occupancy Report

| Field          | Detail                                             |
| -------------- | -------------------------------------------------- |
| **API**        | `GET /api/v1/admin/reports/occupancy`              |
| **Permission** | `dashboard.read`                                   |
| **Filter**     | `hotel_id` · `room_type_id` · `from` · `to`        |
| **Returns**    | `occupancy_rate` theo từng room_type, peak periods |
