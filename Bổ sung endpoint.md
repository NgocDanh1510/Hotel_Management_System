Now I have a comprehensive understanding of your current API structure. Let me create a detailed analysis of what's available and what's missing for customer role:

## **Hiện Tại - API Công Khai cho Khách Hàng (Guest Role)**

### **Public APIs (Không cần auth)**

| Endpoint                                         | Tác vụ                                                |
| ------------------------------------------------ | ----------------------------------------------------- |
| `POST /api/v1/auth/register`                     | Đăng ký tài khoản                                     |
| `POST /api/v1/auth/login`                        | Đăng nhập                                             |
| `POST /api/v1/auth/refresh`                      | Làm mới token                                         |
| `GET /api/v1/hotels`                             | Liệt kê khách sạn (với filter giá, ngày check-in/out) |
| `GET /api/v1/hotels/:slug`                       | Chi tiết khách sạn (phòng, tiện ích, ảnh, rating)     |
| `GET /api/v1/hotels/:hotelId/rooms/availability` | Kiểm tra phòng còn trống                              |
| `GET /api/v1/hotels/:hotelId/reviews`            | Xem đánh giá của khách sạn                            |
| `GET /api/v1/locations/cities`                   | Lấy danh sách thành phố                               |
| `GET /api/v1/locations/districts`                | Lấy danh sách quận (lọc theo thành phố)               |

### **Protected APIs (Cần auth + booking.create permission)**

| Endpoint                           | Tác vụ                                            |
| ---------------------------------- | ------------------------------------------------- |
| `POST /api/v1/bookings`            | Tạo đặt phòng                                     |
| `GET /api/v1/bookings/:id`         | Chi tiết đặt phòng                                |
| `POST /api/v1/bookings/:id/cancel` | Hủy đặt phòng                                     |
| `GET /api/v1/me/bookings`          | Danh sách đặt phòng của tôi (pagination, filters) |
| `POST /api/v1/reviews`             | Viết đánh giá                                     |
| `POST /api/v1/payments`            | Khởi tạo thanh toán                               |
| `GET /api/v1/me`                   | Lấy thông tin profile                             |
| `PUT /api/v1/me`                   | Cập nhật profile                                  |
| `POST /api/v1/auth/logout`         | Đăng xuất                                         |
| `POST /api/v1/auth/logout-all`     | Đăng xuất tất cả session                          |

---

## **🎯 API Cần Bổ Sung**

| Tính năng      | API Còn Thiếu                      | Mô tả                         |
| -------------- | ---------------------------------- | ----------------------------- |
| **Thanh toán** | `GET /api/v1/payments/:id`         | Chi tiết thanh toán           |
| **Thanh toán** | `GET /api/v1/me/payments`          | Danh sách thanh toán của tôi  |
| **Đánh giá**   | `GET /api/v1/reviews/my-reviews`   | Danh sách đánh giá của tôi    |
| **Wishlist**   | `GET/POST /api/v1/wishlist`        | Lưu khách sạn yêu thích       |
| **Wishlist**   | `DELETE /api/v1/wishlist/:hotelId` | Xóa khỏi wishlist             |
| **Profile**    | `POST /api/v1/me/avatar`           | Cập nhật ảnh đại diện         |
| **Profile**    | `POST /api/v1/me/password`         | Đổi mật khẩu                  |
| **Tìm kiếm**   | `GET /api/v1/hotels/search`        | Tìm kiếm nâng cao với history |
| **Thông báo**  | `GET /api/v1/me/notifications`     | Danh sách thông báo           |
| **Hóa đơn**    | `GET /api/v1/bookings/:id/invoice` | Tải hóa đơn                   |

---

## **📱 Các Trang Cần Xây Dựng cho Khách Hàng**

### **1. 🏠 Trang Chủ (Homepage)**

**Hiển thị:**

- Khách sạn featured/hot deals
- Search bar (thành phố, ngày, số người)
- Top reviews gần đây
- Categories (beach, mountain, city, etc.)

**APIs:**

- `GET /api/v1/hotels` (with featured filter)
- `GET /api/v1/hotels/:hotelId/reviews` (top 5-10)
- `GET /api/v1/locations/cities`

---

### **2. 🔍 Trang Kết Quả Tìm Kiếm (Search Results)**

**Hiển thị:**

- Danh sách khách sạn (card view)
- Filter: giá, sao, tiện ích, loại phòng
- Sắp xếp: giá, sao, phổ biến
- Bản đồ
- Phân trang

**APIs:**

- `GET /api/v1/hotels?check_in=...&check_out=...&price_min=...&price_max=...&sort=...&page=...`
- `GET /api/v1/hotels/:hotelId/rooms/availability`

---

### **3. 🏨 Trang Chi Tiết Khách Sạn (Hotel Detail)**

**Hiển thị:**

- Ảnh gallery (slider)
- Thông tin khách sạn
- Liệt kê phòng (types, prices, amenities)
- Tiện ích khách sạn
- Đánh giá & bình luận (sorted by date/rating)
- Form đặt phòng (check-in, check-out, số người)
- Bản đồ vị trí
- Chính sách hủy

**APIs:**

- `GET /api/v1/hotels/:slug`
- `GET /api/v1/hotels/:hotelId/rooms/availability`
- `GET /api/v1/hotels/:hotelId/reviews`
- `POST /api/v1/bookings` (call from this page)

---

### **4. 📋 Trang Đặt Phòng (Booking Confirmation)**

**Hiển thị:**

- Chi tiết phòng đã chọn
- Tổng giá + breakdown (room, tax, fees)
- Form thông tin khách hàng (pre-fill từ profile)
- Hình thức thanh toán
- Chính sách huỷ

**APIs:**

- `GET /api/v1/me` (pre-fill guest info)
- `POST /api/v1/bookings` (submit booking)

---

### **5. 💳 Trang Thanh Toán (Payment)**

**Hiển thị:**

- Tóm tắt order
- Gateway thanh toán (Stripe, PayPal, VNPay, etc.)
- Receipt sau thanh toán thành công
- Confirmation number

**APIs:**

- `POST /api/v1/payments` (init payment)
- `POST /api/v1/webhooks/payment` (handle payment callback)
- `GET /api/v1/payments/:id` ✅ **CẦN THÊM**

---

### **6. 📅 Trang Lịch Sử Đặt Phòng (My Bookings)**

**Hiển thị:**

- Danh sách đặt phòng (upcoming, past, cancelled)
- Status badge (confirmed, check-in, checked-out, cancelled)
- Quick actions: cancel, view detail, write review
- Filter: status, date range
- Search: hotel name, booking ID

**APIs:**

- `GET /api/v1/me/bookings?status=...&sort=...&page=...`
- `GET /api/v1/bookings/:id`
- `POST /api/v1/bookings/:id/cancel`

---

### **7. 📝 Trang Chi Tiết Đặt Phòng (Booking Detail)**

**Hiển thị:**

- Thông tin khách sạn & phòng
- Ngày check-in/check-out
- Giá breakdown
- Status timeline (pending → confirmed → checked-in → checked-out)
- Hóa đơn / receipt
- Nút "Write Review" (nếu checked-out)
- Nút "Cancel" (nếu chưa checked-in)

**APIs:**

- `GET /api/v1/bookings/:id`
- `GET /api/v1/bookings/:id/invoice` ✅ **CẦN THÊM**
- `POST /api/v1/reviews` (call từ page này)

---

### **8. ⭐ Trang Viết Đánh Giá (Write Review)**

**Hiển thị:**

- Thông tin booking (khách sạn, ngày, phòng)
- Form: rating (1-5 sao), tiêu đề, nội dung
- Hình ảnh upload
- Nút submit

**APIs:**

- `POST /api/v1/reviews`

---

### **9. 📖 Trang Đánh Giá Của Tôi (My Reviews)**

**Hiển thị:**

- Danh sách đánh giá đã viết
- Status: pending approval, approved, rejected
- Edit/delete option
- Filter by status, rating

**APIs:**

- `GET /api/v1/reviews/my-reviews` ✅ **CẦN THÊM**
- `PUT /api/v1/reviews/:id` ✅ **CẦN THÊM**
- `DELETE /api/v1/reviews/:id` ✅ **CẦN THÊM**

---

### **10. ❤️ Trang Wishlist (Saved Hotels)**

**Hiển thị:**

- Danh sách khách sạn yêu thích (card view)
- Nút remove
- Nút "Book Now"
- Filter, sort

**APIs:**

- `GET /api/v1/wishlist` ✅ **CẦN THÊM**
- `POST /api/v1/wishlist` ✅ **CẦN THÊM**
- `DELETE /api/v1/wishlist/:hotelId` ✅ **CẦN THÊM**

---

### **11. 👤 Trang Hồ Sơ (Profile)**

**Hiển thị:**

- Avatar, tên, email, số điện thoại
- Địa chỉ
- Ngôn ngữ, múi giờ
- Tùy chọn thông báo
- Quản lý mật khẩu
- Connected devices / sessions

**APIs:**

- `GET /api/v1/me`
- `PUT /api/v1/me`
- `POST /api/v1/me/avatar` ✅ **CẦN THÊM**
- `POST /api/v1/me/password` ✅ **CẦN THÊM**

---

### **12. 🔔 Trang Thông Báo (Notifications)**

**Hiển thị:**

- Danh sách thông báo (booking confirmation, review approved, special offers)
- Filter: read/unread, type
- Mark as read

**APIs:**

- `GET /api/v1/me/notifications` ✅ **CẦN THÊM**
- `PUT /api/v1/notifications/:id` ✅ **CẦN THÊM** (mark as read)

---

## **📊 Tóm Tắt API Cần Thêm (15 APIs)**

```
Profile & Account:
1. POST /api/v1/me/avatar
2. POST /api/v1/me/password
3. GET /api/v1/me/notifications
4. PUT /api/v1/notifications/:id

Payment:
5. GET /api/v1/payments/:id
6. GET /api/v1/me/payments

Booking:
7. GET /api/v1/bookings/:id/invoice

Review:
8. GET /api/v1/reviews/my-reviews
9. PUT /api/v1/reviews/:id
10. DELETE /api/v1/reviews/:id

Wishlist:
11. GET /api/v1/wishlist
12. POST /api/v1/wishlist
13. DELETE /api/v1/wishlist/:hotelId
14. POST /api/v1/wishlist/:hotelId (alternative)

Search (Enhancement):
15. GET /api/v1/hotels/search-history (optional)
```

---

Bạn muốn tôi giúp:

1. **Design chi tiết các API còn thiếu?**
2. **Implement wishlist, reviews, notifications?**
3. **Cấu trúc database cho các feature mới?**
4. **Frontend pages structure?**You've used 57% of your weekly rate limit. Your weekly rate limit will reset on May 4 at 7:00 AM. [Learn More](https://aka.ms/github-copilot-rate-limit-error)
