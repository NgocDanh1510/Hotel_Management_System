"use strict";
const crypto = require("crypto");

// ─── Permission registry ────────────────────────────────────────────────────
const permissionCodes = [
  // Hotel lifecycle
  "hotel.read_public", // Xem khách sạn đã published — tất cả
  "hotel.read_all", // Xem cả hotel chưa duyệt / bị ẩn — owner + admin
  "hotel.create", // Tạo mới khách sạn — hotel_owner
  "hotel.manage_own", // Sửa thông tin hotel của mình — hotel_owner
  "hotel.manage_all", // Sửa bất kỳ hotel — admin
  "hotel.submit_for_review", // Submit hotel chờ admin duyệt — hotel_owner
  "hotel.approve", // Duyệt hotel — admin
  "hotel.reject", // Từ chối hotel — admin
  "hotel.suspend", // Tạm khóa hotel — admin

  // Room
  "room.read_public", // Xem phòng đã published — tất cả
  "room.manage_own_hotel", // Quản lý phòng hotel của mình — hotel_owner
  "room.manage_all", // Quản lý phòng bất kỳ — admin
  "room.set_availability", // Đặt lịch trống/bận — hotel_owner
  "room.set_price", // Đặt giá phòng — hotel_owner

  // Booking
  "booking.create", // Tạo booking — guest
  "booking.read_own", // Xem booking của chính mình (guest) — guest
  "booking.read_own_hotel", // Xem booking thuộc hotel của mình — hotel_owner
  "booking.read_all", // Xem toàn bộ booking — admin
  "booking.cancel_own", // Hủy booking của chính mình — guest
  "booking.cancel_own_hotel", // Hủy booking tại hotel của mình — hotel_owner
  "booking.cancel_all", // Hủy bất kỳ booking — admin
  "booking.update_status_own_hotel", // Cập nhật trạng thái booking tại hotel mình — hotel_owner
  "booking.update_status_all", // Cập nhật trạng thái bất kỳ — admin
  "booking.set_no_show", // Đánh dấu no-show — hotel_owner

  // Review
  "review.create", // Viết review — guest
  "review.read_all", // Xem tất cả review — tất cả
  "review.edit_own", // Sửa review của mình — guest
  "review.delete_own", // Xóa review của mình — guest
  "review.reply_own_hotel", // Phản hồi review tại hotel của mình — hotel_owner
  "review.flag_own_hotel", // Báo cáo review vi phạm tại hotel mình — hotel_owner
  "review.moderate_all", // Kiểm duyệt / xóa bất kỳ review — admin
  "review.delete_all", // Xóa bất kỳ review — admin

  // Payment
  "payment.create", // Thanh toán booking — guest
  "payment.read_own", // Xem lịch sử thanh toán của mình — guest
  "payment.read_own_hotel", // Xem thanh toán thuộc hotel của mình — hotel_owner
  "payment.read_all", // Xem toàn bộ giao dịch — admin
  "payment.refund", // Hoàn tiền — admin
  "payment.request_payout", // Yêu cầu rút tiền — hotel_owner
  "payment.approve_payout", // Duyệt rút tiền — admin

  // Image & Amenity
  "image.manage_own_hotel", // Quản lý ảnh hotel của mình — hotel_owner
  "image.manage_all", // Quản lý ảnh bất kỳ — admin
  "amenity.read_all", // Xem danh sách tiện nghi để gán vào hotel — hotel_owner + admin
  "amenity.manage", // Thêm / sửa / xóa tiện nghi — admin

  // Account (profile của chính user)
  "account.read_own", // Xem profile của mình — guest + hotel_owner
  "account.update_own", // Cập nhật profile của mình — guest + hotel_owner

  // User management (admin)
  "user.manage", // Quản lý người dùng — admin
  "user.ban", // Khóa tài khoản — admin
  "user.verify_partner", // Xác minh đối tác hotel — admin

  // Role & Permission
  "role.manage", // Quản lý roles — admin
  "permission.read", // Xem danh sách permissions — admin
  "permission.manage", // Quản lý permissions — admin

  // Dashboard & System
  "dashboard.read", // Xem dashboard hotel của mình — hotel_owner
  "dashboard.read_all", // Xem dashboard toàn hệ thống — admin
  "audit_log.read", // Xem audit log — admin
  "system.config", // Cấu hình hệ thống — admin
];

// ─── RBAC Matrix ────────────────────────────────────────────────────────────

const guestPerms = [
  "hotel.read_public",
  "room.read_public",
  "booking.create",
  "booking.read_own",
  "booking.cancel_own",
  "review.create",
  "review.read_all",
  "review.edit_own",
  "review.delete_own",
  "payment.create",
  "payment.read_own",
  "account.read_own",
  "account.update_own",
];

const hotelOwnerPerms = [
  "hotel.read_public",
  "hotel.read_all",
  "hotel.create",
  "hotel.manage_own",
  "hotel.submit_for_review",
  "room.read_public",
  "room.manage_own_hotel",
  "room.set_availability",
  "room.set_price",
  "booking.read_own_hotel",
  "booking.cancel_own_hotel",
  "booking.update_status_own_hotel",
  "booking.set_no_show",
  "review.read_all",
  "review.reply_own_hotel",
  "review.flag_own_hotel",
  "payment.create",
  "payment.read_own_hotel",
  "payment.request_payout",
  "image.manage_own_hotel",
  "amenity.read_all",
  "account.read_own",
  "account.update_own",
  "dashboard.read",
];

// Admin có tất cả permissions
const adminPerms = [...permissionCodes];

// ─── Seeder ──────────────────────────────────────────────────────────────────

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Roles
    const rolesData = [
      {
        id: crypto.randomUUID(),
        name: "guest",
        description: "Khách hàng đặt phòng",
        is_system: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        name: "hotel_owner",
        description: "Đối tác sở hữu / quản lý hotel",
        is_system: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        name: "admin",
        description: "Quản trị viên hệ thống",
        is_system: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // 2. Permissions
    const permissionsData = permissionCodes.map((code) => ({
      id: crypto.randomUUID(),
      code,
      module: code.split(".")[0],
      description: `Permission: ${code}`,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert("roles", rolesData, {
      ignoreDuplicates: true,
    });
    await queryInterface.bulkInsert("permissions", permissionsData, {
      ignoreDuplicates: true,
    });

    // 3. Lấy lại ID từ DB
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('guest', 'hotel_owner', 'admin');`,
    );
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, code FROM permissions WHERE code IN (${permissionCodes.map(() => "?").join(",")});`,
      { replacements: permissionCodes },
    );

    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    const permMap = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

    // 4. Build role_permissions
    const rolePermissionsData = [];

    const addMapping = (roleName, codes) => {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.warn(
          `[seeder] Role "${roleName}" không tìm thấy trong DB, bỏ qua.`,
        );
        return;
      }
      codes.forEach((code) => {
        const permId = permMap[code];
        if (!permId) {
          console.warn(
            `[seeder] Permission "${code}" không tìm thấy trong DB, bỏ qua.`,
          );
          return;
        }
        rolePermissionsData.push({
          role_id: roleId,
          permission_id: permId,
          created_at: now,
        });
      });
    };

    addMapping("guest", guestPerms);
    addMapping("hotel_owner", hotelOwnerPerms);
    addMapping("admin", adminPerms);

    if (rolePermissionsData.length > 0) {
      await queryInterface.bulkInsert("role_permissions", rolePermissionsData, {
        ignoreDuplicates: true,
      });
    }
  },

  async down(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name IN ('guest', 'hotel_owner', 'admin');`,
    );
    const roleIds = roles.map((r) => r.id);

    if (roleIds.length > 0) {
      await queryInterface.bulkDelete(
        "role_permissions",
        { role_id: roleIds },
        {},
      );
      await queryInterface.bulkDelete(
        "roles",
        { name: ["guest", "hotel_owner", "admin"] },
        {},
      );
    }

    await queryInterface.bulkDelete(
      "permissions",
      { code: permissionCodes },
      {},
    );
  },
};
