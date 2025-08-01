# Hotel Booking — Database Schema

> 11 bảng · UUID làm PK · soft delete dùng `is_active` / `is_published`

---

## 1. `users` — Người dùng

| Column          | Type         | Constraint                | Mô tả                             |
| --------------- | ------------ | ------------------------- | --------------------------------- |
| `id`            | UUID         | PK                        |                                   |
| `name`          | VARCHAR(100) | NOT NULL                  | Họ tên đầy đủ                     |
| `email`         | VARCHAR(255) | NOT NULL, UNIQUE          | Dùng để đăng nhập                 |
| `phone`         | VARCHAR(20)  |                           |                                   |
| `password_hash` | TEXT         | NOT NULL                  | Bcrypt hoặc Argon2                |
| `role`          | ENUM         | NOT NULL, DEFAULT `guest` | `guest` · `admin` · `hotel_staff` |
| `created_at`    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()   |                                   |

> **Ghi chú:** Một user có thể vừa là khách, vừa là owner của nhiều hotel (role `admin`).

---

## 2. `hotels` — Khách sạn

| Column          | Type         | Constraint              | Mô tả                             |
| --------------- | ------------ | ----------------------- | --------------------------------- |
| `id`            | UUID         | PK                      |                                   |
| `owner_id`      | UUID         | FK → users.id           | Người sở hữu / quản lý            |
| `name`          | VARCHAR(200) | NOT NULL                |                                   |
| `slug`          | VARCHAR(200) | NOT NULL, UNIQUE        | Dùng cho URL: `/ha-noi/hotel-abc` |
| `description`   | TEXT         |                         |                                   |
| `address`       | TEXT         | NOT NULL                |                                   |
| `city`          | VARCHAR(100) | NOT NULL                |                                   |
| `country`       | VARCHAR(100) | NOT NULL                |                                   |
| `star_rating`   | NUMERIC(2,1) | CHECK (1.0–5.0)         |                                   |
| `contact_email` | VARCHAR(255) |                         |                                   |
| `contact_phone` | VARCHAR(20)  |                         |                                   |
| `is_active`     | BOOLEAN      | NOT NULL, DEFAULT true  | Soft delete                       |
| `created_at`    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |                                   |

---

## 3. `room_types` — Loại phòng

> Một khách sạn có thể có nhiều loại phòng (Standard, Deluxe, Suite…). Đây là nơi lưu **giá gốc** và **mô tả chung** của từng loại.

| Column          | Type          | Constraint               | Mô tả                               |
| --------------- | ------------- | ------------------------ | ----------------------------------- |
| `id`            | UUID          | PK                       |                                     |
| `hotel_id`      | UUID          | FK → hotels.id, NOT NULL |                                     |
| `name`          | VARCHAR(100)  | NOT NULL                 | VD: `Deluxe Ocean View`             |
| `description`   | TEXT          |                          |                                     |
| `max_occupancy` | SMALLINT      | NOT NULL                 | Số khách tối đa                     |
| `base_price`    | NUMERIC(12,2) | NOT NULL                 | Giá cơ bản mỗi đêm                  |
| `currency`      | CHAR(3)       | NOT NULL, DEFAULT `VND`  | ISO 4217                            |
| `total_rooms`   | SMALLINT      | NOT NULL                 | Tổng số phòng vật lý thuộc loại này |
| `created_at`    | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()  |                                     |

---

## 4. `rooms` — Phòng vật lý

> Mỗi phòng thực tế trong khách sạn. Booking sẽ link tới đây để tránh double-booking.

| Column         | Type        | Constraint                    | Mô tả                                    |
| -------------- | ----------- | ----------------------------- | ---------------------------------------- |
| `id`           | UUID        | PK                            |                                          |
| `hotel_id`     | UUID        | FK → hotels.id, NOT NULL      | Shortcut để query nhanh                  |
| `room_type_id` | UUID        | FK → room_types.id, NOT NULL  |                                          |
| `room_number`  | VARCHAR(20) | NOT NULL                      | VD: `101`, `B-502`                       |
| `floor`        | SMALLINT    |                               |                                          |
| `status`       | ENUM        | NOT NULL, DEFAULT `available` | `available` · `occupied` · `maintenance` |
| `updated_at`   | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()       |                                          |

> **Unique:** (`hotel_id`, `room_number`) — không có 2 phòng cùng số trong 1 khách sạn.

---

## 5. `bookings` — Đặt phòng

| Column             | Type          | Constraint                  | Mô tả                                                                |
| ------------------ | ------------- | --------------------------- | -------------------------------------------------------------------- |
| `id`               | UUID          | PK                          |                                                                      |
| `user_id`          | UUID          | FK → users.id, NOT NULL     | Người đặt                                                            |
| `room_id`          | UUID          | FK → rooms.id, NOT NULL     | Phòng cụ thể                                                         |
| `check_in`         | DATE          | NOT NULL                    |                                                                      |
| `check_out`        | DATE          | NOT NULL                    |                                                                      |
| `guests_count`     | SMALLINT      | NOT NULL                    |                                                                      |
| `total_price`      | NUMERIC(12,2) | NOT NULL                    | Tổng tiền đã tính tại thời điểm đặt                                  |
| `status`           | ENUM          | NOT NULL, DEFAULT `pending` | `pending` · `confirmed` · `checked_in` · `checked_out` · `cancelled` |
| `special_requests` | TEXT          |                             | Yêu cầu đặc biệt của khách                                           |
| `created_at`       | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()     |                                                                      |

> **Check:** `check_out > check_in`
> **Ghi chú:** `total_price` lưu giá tại thời điểm đặt để không bị ảnh hưởng khi giá phòng thay đổi sau này.

---

## 6. `payments` — Thanh toán

> Một booking có thể có nhiều lần thanh toán (đặt cọc → thanh toán đủ → hoàn tiền).

| Column           | Type          | Constraint                  | Mô tả                                 |
| ---------------- | ------------- | --------------------------- | ------------------------------------- |
| `id`             | UUID          | PK                          |                                       |
| `booking_id`     | UUID          | FK → bookings.id, NOT NULL  |                                       |
| `amount`         | NUMERIC(12,2) | NOT NULL                    |                                       |
| `currency`       | CHAR(3)       | NOT NULL, DEFAULT `VND`     |                                       |
| `type`           | ENUM          | NOT NULL                    | `deposit` · `full_payment` · `refund` |
| `status`         | ENUM          | NOT NULL, DEFAULT `pending` | `pending` · `success` · `failed`      |
| `gateway`        | VARCHAR(50)   |                             | VD: `vnpay`, `stripe`, `momo`         |
| `transaction_id` | VARCHAR(255)  | UNIQUE                      | ID từ payment gateway                 |
| `paid_at`        | TIMESTAMPTZ   |                             | Thời điểm giao dịch thành công        |
| `created_at`     | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()     |                                       |

---

## 7. `reviews` — Đánh giá

> Chỉ người có booking mới được review, mỗi booking chỉ review 1 lần.

| Column               | Type        | Constraint                         | Mô tả                               |
| -------------------- | ----------- | ---------------------------------- | ----------------------------------- |
| `id`                 | UUID        | PK                                 |                                     |
| `booking_id`         | UUID        | FK → bookings.id, NOT NULL, UNIQUE | UNIQUE đảm bảo 1 booking = 1 review |
| `user_id`            | UUID        | FK → users.id, NOT NULL            |                                     |
| `hotel_id`           | UUID        | FK → hotels.id, NOT NULL           | Shortcut để query rating khách sạn  |
| `rating_overall`     | SMALLINT    | NOT NULL, CHECK (1–5)              |                                     |
| `rating_cleanliness` | SMALLINT    | CHECK (1–5)                        |                                     |
| `rating_service`     | SMALLINT    | CHECK (1–5)                        |                                     |
| `rating_location`    | SMALLINT    | CHECK (1–5)                        |                                     |
| `comment`            | TEXT        |                                    |                                     |
| `is_published`       | BOOLEAN     | NOT NULL, DEFAULT false            | Admin duyệt trước khi hiển thị      |
| `created_at`         | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()            |                                     |

---

## 8. `amenities` — Danh mục tiện nghi

> Bảng master dùng chung cho cả hotel và room_type.

| Column     | Type         | Constraint       | Mô tả                                       |
| ---------- | ------------ | ---------------- | ------------------------------------------- |
| `id`       | UUID         | PK               |                                             |
| `name`     | VARCHAR(100) | NOT NULL, UNIQUE | VD: `Wi-Fi`, `Hồ bơi`, `Minibar`            |
| `icon`     | VARCHAR(100) |                  | Tên icon hoặc URL SVG                       |
| `category` | VARCHAR(50)  |                  | VD: `connectivity`, `recreation`, `in-room` |

---

## 9. `hotel_amenities` — Tiện nghi của khách sạn

| Column       | Type | Constraint        | Mô tả |
| ------------ | ---- | ----------------- | ----- |
| `hotel_id`   | UUID | FK → hotels.id    |       |
| `amenity_id` | UUID | FK → amenities.id |       |

> **PK:** (`hotel_id`, `amenity_id`)

---

## 10. `room_type_amenities` — Tiện nghi của loại phòng

| Column         | Type | Constraint         | Mô tả |
| -------------- | ---- | ------------------ | ----- |
| `room_type_id` | UUID | FK → room_types.id |       |
| `amenity_id`   | UUID | FK → amenities.id  |       |

> **PK:** (`room_type_id`, `amenity_id`)

---

## 11. `images` — Ảnh (polymorphic)

> Dùng chung cho cả hotel và room_type thay vì tạo 2 bảng riêng.

| Column        | Type         | Constraint              | Mô tả                        |
| ------------- | ------------ | ----------------------- | ---------------------------- |
| `id`          | UUID         | PK                      |                              |
| `entity_type` | ENUM         | NOT NULL                | `hotel` · `room_type`        |
| `entity_id`   | UUID         | NOT NULL                | ID của hotel hoặc room_type  |
| `url`         | TEXT         | NOT NULL                | URL đầy đủ (S3, Cloudinary…) |
| `alt_text`    | VARCHAR(255) |                         |                              |
| `is_primary`  | BOOLEAN      | NOT NULL, DEFAULT false | Ảnh đại diện                 |
| `sort_order`  | SMALLINT     | NOT NULL, DEFAULT 0     | Thứ tự hiển thị              |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |                              |

---

## Quan hệ tổng hợp

| Bảng A       | Quan hệ  | Bảng B       | Ghi chú                       |
| ------------ | -------- | ------------ | ----------------------------- |
| `users`      | 1 → N    | `hotels`     | 1 user sở hữu nhiều hotel     |
| `hotels`     | 1 → N    | `room_types` |                               |
| `room_types` | 1 → N    | `rooms`      |                               |
| `users`      | 1 → N    | `bookings`   |                               |
| `rooms`      | 1 → N    | `bookings`   |                               |
| `bookings`   | 1 → N    | `payments`   | Nhiều lần thanh toán          |
| `bookings`   | 1 → 0..1 | `reviews`    | Mỗi booking chỉ 1 review      |
| `hotels`     | N ↔ N    | `amenities`  | Qua `hotel_amenities`         |
| `room_types` | N ↔ N    | `amenities`  | Qua `room_type_amenities`     |
| `hotels`     | 1 → N    | `images`     | Polymorphic qua `entity_type` |
| `room_types` | 1 → N    | `images`     | Polymorphic qua `entity_type` |
