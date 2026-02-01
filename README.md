# Hotel Management System

Hệ thống quản lý khách sạn toàn diện được xây dựng theo kiến trúc **Monorepo** với Backend RESTful API và Frontend SPA, hỗ trợ đa vai trò người dùng: Khách hàng, Đối tác (Hotel Owner) và Quản trị viên.

<div align="center">

### Backend

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Joi](https://img.shields.io/badge/Joi-0080FF?style=for-the-badge&logo=joi&logoColor=white)](https://joi.dev)

### Frontend

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com)

### 🔧 Tools & Platform

[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org)
[![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)](https://nodemon.io)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com)

</div>

---

## Mục lục

- [Tổng quan](#-tổng-quan)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Tính năng](#-tính-năng)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Phân quyền](#-phân-quyền)

---

## Tổng quan

Hotel Management System là nền tảng đặt phòng khách sạn trực tuyến, cung cấp:

- **Giao diện khách hàng** — tìm kiếm, xem chi tiết và đặt phòng khách sạn.
- **Cổng đối tác (Partner)** — quản lý khách sạn, phòng, đặt chỗ và doanh thu.
- **Bảng điều khiển Admin** — quản lý toàn bộ hệ thống: người dùng, khách sạn, vai trò, quyền, thanh toán, đánh giá.

---

## 🛠 Công nghệ sử dụng

### Backend

| Công nghệ  | Phiên bản | Mô tả                |
| ---------- | --------- | -------------------- |
| Node.js    | LTS       | Runtime environment  |
| Express.js | ^5.2.1    | Web framework        |
| Sequelize  | ^6.37.8   | ORM                  |
| MySQL2     | ^3.22.3   | Database driver      |
| JWT        | ^9.0.2    | Authentication       |
| Bcrypt     | ^6.0.0    | Password hashing     |
| Cloudinary | ^2.10.0   | Image storage        |
| Multer     | ^2.1.1    | File upload          |
| Joi        | ^18.1.2   | Request validation   |
| Morgan     | ^1.10.1   | HTTP request logger  |
| UUID       | ^14.0.0   | Unique ID generation |
| Slugify    | ^1.6.9    | URL slug generation  |

### Frontend

| Công nghệ        | Phiên bản | Mô tả                |
| ---------------- | --------- | -------------------- |
| React            | ^19.2.5   | UI library           |
| TypeScript       | ~6.0.2    | Type-safe JavaScript |
| Vite             | ^8.0.10   | Build tool           |
| React Router DOM | ^7.14.2   | Client-side routing  |
| Tailwind CSS     | ^4.2.4    | Utility-first CSS    |
| Axios            | ^1.15.2   | HTTP client          |
| Lucide React     | ^1.14.0   | Icon library         |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hotel Management System                  │
│                                                                 │
│   ┌──────────────────┐          ┌──────────────────────────┐   │
│   │    FRONTEND       │  HTTP    │         BACKEND          │   │
│   │  React + TS       │ ◄──────► │  Express.js + Sequelize  │   │
│   │  Vite + Tailwind  │          │  REST API                │   │
│   └──────────────────┘          └────────────┬─────────────┘   │
│                                              │                  │
│                                   ┌──────────▼──────────┐      │
│                                   │       MySQL DB        │      │
│                                   └─────────────────────┘      │
│                                                                 │
│                                   ┌──────────────────────┐      │
│                                   │  Cloudinary (Images) │      │
│                                   └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

Kiến trúc Backend theo mô hình phân lớp:

```
Routes → Middlewares → Controllers → Services → Models → Database
```

---

## 📁 Cấu trúc thư mục

```
Hotel_Management_System/
├── BACKEND/
│   ├── src/
│   │   ├── config/           # Cấu hình database, cloudinary
│   │   ├── controllers/      # Xử lý HTTP request/response
│   │   ├── middlewares/      # Auth, validation, error handling
│   │   ├── migrations/       # Database schema migrations
│   │   ├── models/           # Sequelize models
│   │   │   ├── user.model.js
│   │   │   ├── hotel.model.js
│   │   │   ├── room.model.js
│   │   │   ├── roomType.model.js
│   │   │   ├── booking.model.js
│   │   │   ├── payment.model.js
│   │   │   ├── review.model.js
│   │   │   ├── amenity.model.js
│   │   │   ├── image.model.js
│   │   │   ├── city.model.js
│   │   │   ├── district.model.js
│   │   │   ├── role.model.js
│   │   │   ├── permission.model.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── admin/        # Các route dành cho Admin
│   │   │   ├── partner/      # Các route dành cho Partner
│   │   │   ├── auth.routes.js
│   │   │   ├── hotel.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── location.route.js
│   │   ├── seeders/          # Seed data mẫu
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   ├── validations/      # Joi validation schemas
│   │   └── index.js          # Entry point
│   ├── .env.example
│   ├── .sequelizerc
│   └── package.json
│
└── FRONTEND/
    ├── src/
    │   ├── api/              # Axios API calls
    │   ├── assets/           # Static assets
    │   ├── components/       # Shared UI components
    │   ├── contexts/         # React Context (Auth, etc.)
    │   ├── features/         # Feature-based modules
    │   ├── hooks/            # Custom React hooks
    │   ├── pages/
    │   │   ├── admin/        # Trang quản trị viên
    │   │   │   ├── AdminDashboard.tsx
    │   │   │   ├── AdminUsersPage.tsx
    │   │   │   ├── AdminHotelsPage.tsx
    │   │   │   ├── AdminRoomsPage.tsx
    │   │   │   ├── AdminBookingsPage.tsx
    │   │   │   ├── AdminPaymentsPage.tsx
    │   │   │   ├── AdminReviewsPage.tsx
    │   │   │   ├── AdminAmenitiesPage.tsx
    │   │   │   ├── AdminImagesPage.tsx
    │   │   │   ├── AdminRolesPage.tsx
    │   │   │   └── AdminPermissionsPage.tsx
    │   │   ├── partner/      # Trang đối tác
    │   │   │   ├── PartnerDashboardPage.tsx
    │   │   │   ├── PartnerHotelsPage.tsx
    │   │   │   ├── PartnerRoomsPage.tsx
    │   │   │   ├── PartnerBookingsPage.tsx
    │   │   │   ├── PartnerPaymentsPage.tsx
    │   │   │   └── PartnerReviewsPage.tsx
    │   │   ├── auth/         # Đăng nhập / Đăng ký
    │   │   ├── HomePage.tsx
    │   │   ├── HotelListPage.tsx
    │   │   ├── HotelDetailPage.tsx
    │   │   ├── BookingDetailPage.tsx
    │   │   ├── MyBookingsPage.tsx
    │   │   ├── MyPaymentsPage.tsx
    │   │   ├── MyReviewsPage.tsx
    │   │   └── ProfilePage.tsx
    │   ├── router/           # React Router configuration
    │   ├── types/            # TypeScript type definitions
    │   └── utils/            # Utility functions
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## ✨ Tính năng

### 👤 Khách hàng (Customer)

- 🔍 Tìm kiếm khách sạn theo thành phố, quận/huyện, ngày nhận/trả phòng
- 🏨 Xem danh sách và chi tiết khách sạn (ảnh, tiện nghi, đánh giá)
- 🛏 Đặt phòng và theo dõi lịch sử đặt phòng
- 💳 Xem lịch sử thanh toán
- ⭐ Viết và quản lý đánh giá
- 👤 Quản lý hồ sơ cá nhân

### 🤝 Đối tác / Hotel Owner (Partner)

- 🏨 Quản lý danh sách khách sạn (thêm, sửa, xóa)
- 🛏 Quản lý loại phòng và phòng
- 📅 Theo dõi và quản lý đặt phòng
- 💰 Xem báo cáo thanh toán / doanh thu
- ⭐ Xem đánh giá từ khách hàng
- 📊 Dashboard tổng quan

### 🔧 Quản trị viên (Admin)

- 👥 Quản lý người dùng toàn hệ thống
- 🏨 Quản lý và duyệt khách sạn
- 🛏 Quản lý phòng và loại phòng
- 📅 Quản lý toàn bộ đặt phòng
- 💳 Quản lý thanh toán
- ⭐ Quản lý đánh giá
- 🖼 Quản lý hình ảnh (Cloudinary)
- 🎁 Quản lý tiện nghi
- 🔐 Quản lý Roles & Permissions (RBAC)
- 📊 Dashboard thống kê tổng quan

---

## Cài đặt & Chạy dự án

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** >= 9.x

### 1. Clone dự án

```bash
git clone https://github.com/NgocDanh1510/Hotel_Management_System.git
cd Hotel_Management_System
```

### 2. Cài đặt Backend

```bash
cd BACKEND
npm install
```

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường trong `.env` (xem phần [Biến môi trường](#-biến-môi-trường)).

Chạy migrations và seed data:

```bash
# Tạo database schema
npx sequelize-cli db:migrate

# Seed dữ liệu mẫu
npx sequelize-cli db:seed:all
```

Khởi động server:

```bash
# Development (với nodemon)
npm run dev

# Production
npm start
```

> Server chạy tại: `http://localhost:5000`

### 3. Cài đặt Frontend

Mở terminal mới:

```bash
cd FRONTEND
npm install
npm run dev
```

> Ứng dụng chạy tại: `http://localhost:5173`

---

## 🔧 Biến môi trường

Tạo file `BACKEND/.env` với nội dung sau:

```env
# Environment
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_ACCESS_SECRET=your-secure-access-token-secret-change-this-in-production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hotel_management
DB_USER=root
DB_PASSWORD=your_password

# Server
SERVER_URL=http://localhost:5000

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ **Lưu ý:** Không commit file `.env` lên Git. File này đã được thêm vào `.gitignore`.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                  | Mô tả                |
| ------ | ------------------------- | -------------------- |
| POST   | `/api/auth/register`      | Đăng ký tài khoản    |
| POST   | `/api/auth/login`         | Đăng nhập            |
| POST   | `/api/auth/logout`        | Đăng xuất            |
| POST   | `/api/auth/refresh-token` | Làm mới access token |

### Public — Hotels & Locations

| Method | Endpoint                   | Mô tả                           |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/api/hotels`              | Danh sách khách sạn (có bộ lọc) |
| GET    | `/api/hotels/:id`          | Chi tiết khách sạn              |
| GET    | `/api/locations/cities`    | Danh sách thành phố             |
| GET    | `/api/locations/districts` | Danh sách quận/huyện            |

### User (Khách hàng)

| Method | Endpoint              | Mô tả              |
| ------ | --------------------- | ------------------ |
| GET    | `/api/users/profile`  | Xem hồ sơ cá nhân  |
| PUT    | `/api/users/profile`  | Cập nhật hồ sơ     |
| GET    | `/api/users/bookings` | Lịch sử đặt phòng  |
| GET    | `/api/users/payments` | Lịch sử thanh toán |
| GET    | `/api/users/reviews`  | Danh sách đánh giá |

### Bookings

| Method | Endpoint                   | Mô tả              |
| ------ | -------------------------- | ------------------ |
| POST   | `/api/bookings`            | Tạo đặt phòng      |
| GET    | `/api/bookings/:id`        | Chi tiết đặt phòng |
| PATCH  | `/api/bookings/:id/cancel` | Hủy đặt phòng      |

### Reviews

| Method | Endpoint           | Mô tả             |
| ------ | ------------------ | ----------------- |
| POST   | `/api/reviews`     | Tạo đánh giá      |
| PUT    | `/api/reviews/:id` | Cập nhật đánh giá |
| DELETE | `/api/reviews/:id` | Xóa đánh giá      |

### Partner (Hotel Owner)

| Method | Endpoint                  | Mô tả                       |
| ------ | ------------------------- | --------------------------- |
| GET    | `/api/partner/hotels`     | Danh sách khách sạn của tôi |
| POST   | `/api/partner/hotels`     | Tạo khách sạn mới           |
| PUT    | `/api/partner/hotels/:id` | Cập nhật khách sạn          |
| GET    | `/api/partner/bookings`   | Đặt phòng tại khách sạn     |
| GET    | `/api/partner/payments`   | Thanh toán                  |
| GET    | `/api/partner/reviews`    | Đánh giá                    |

### Admin

| Method | Endpoint                       | Mô tả                  |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/api/admin/users`             | Quản lý người dùng     |
| GET    | `/api/admin/hotels`            | Quản lý khách sạn      |
| PATCH  | `/api/admin/hotels/:id/status` | Duyệt / khóa khách sạn |
| GET    | `/api/admin/rooms`             | Quản lý phòng          |
| GET    | `/api/admin/bookings`          | Quản lý đặt phòng      |
| GET    | `/api/admin/payments`          | Quản lý thanh toán     |
| GET    | `/api/admin/reviews`           | Quản lý đánh giá       |
| GET    | `/api/admin/amenities`         | Quản lý tiện nghi      |
| GET    | `/api/admin/roles`             | Quản lý vai trò        |
| GET    | `/api/admin/permissions`       | Quản lý quyền          |

---

## 🗄 Database Schema

Hệ thống sử dụng **MySQL** với **Sequelize ORM**. Các entity chính:

```
Users ──────────────── UserRoles ──── Roles ──── RolePermissions ──── Permissions
  │
  ├── Bookings ──────── Payments
  │       │
  │    (via Hotel)
  │
  └── Reviews

Hotels (owner: User) ── Images
  │       │
  │   Districts ─── Cities
  │
  ├── RoomTypes ──── RoomTypeAmenities ──── Amenities
  │       │
  │    Rooms
  │
  └── HotelAmenities ──── Amenities

RefreshTokens ── Users
```

### Các bảng chính

| Bảng          | Mô tả                              |
| ------------- | ---------------------------------- |
| `users`       | Tài khoản người dùng               |
| `roles`       | Vai trò (admin, partner, customer) |
| `permissions` | Quyền hạn chi tiết                 |
| `hotels`      | Thông tin khách sạn                |
| `room_types`  | Loại phòng                         |
| `rooms`       | Phòng cụ thể                       |
| `bookings`    | Đặt phòng                          |
| `payments`    | Thanh toán                         |
| `reviews`     | Đánh giá                           |
| `amenities`   | Tiện nghi                          |
| `images`      | Hình ảnh (Cloudinary)              |
| `cities`      | Thành phố                          |
| `districts`   | Quận/huyện                         |

---

## 🔐 Phân quyền

Hệ thống sử dụng **RBAC (Role-Based Access Control)** với JWT Authentication.

| Vai trò    | Mô tả                                         |
| ---------- | --------------------------------------------- |
| `customer` | Khách hàng — tìm kiếm, đặt phòng, đánh giá    |
| `partner`  | Đối tác — quản lý khách sạn và phòng của mình |
| `admin`    | Quản trị viên — toàn quyền hệ thống           |

**Luồng xác thực:**

1. Người dùng đăng nhập → nhận `accessToken` (JWT) và `refreshToken` (httpOnly cookie)
2. Mọi request cần xác thực gửi kèm `Authorization: Bearer <accessToken>`
3. Khi `accessToken` hết hạn, dùng `refreshToken` để lấy token mới

---

## 📝 Scripts hữu ích

```bash
# Backend — Reset toàn bộ database
npx sequelize-cli db:migrate:undo:all && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all

# Backend — Undo tất cả seed
npx sequelize-cli db:seed:undo:all

# Frontend — Build production
npm run build

# Frontend — Preview bản build
npm run preview

# Frontend — Kiểm tra lỗi ESLint
npm run lint
```

---

<div align="center">
  <p>Made with ❤️ by <strong>NgocDanh1510</strong></p>
</div>
