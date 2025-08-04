'use strict';
const crypto = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Dữ liệu Roles
    const roleNames = ['guest', 'hotel_staff', 'admin'];
    const rolesData = roleNames.map(name => ({
      id: crypto.randomUUID(),
      name: name,
      description: name === 'guest' ? 'Guest user' : name === 'hotel_staff' ? 'Hotel Staff' : 'System Administrator',
      is_system: true,
      created_at: now,
      updated_at: now
    }));

    // 2. Dữ liệu Permissions
    const permissionCodes = [
      'hotel.read_public', 'hotel.read_all', 'hotel.manage_own', 'hotel.manage_all', 'hotel.create',
      'booking.create', 'booking.read_own', 'booking.read_all', 'booking.cancel_own', 'booking.cancel_all', 'booking.update_status_own_hotel', 'booking.update_status_all',
      'review.create', 'review.read_all', 'review.moderate_own_hotel', 'review.moderate_all',
      'user.manage', 'role.manage', 'permission.read', 'permission.manage',
      'dashboard.read', 'room.manage_own_hotel', 'room.manage_all',
      'image.manage_own_hotel', 'image.manage_all', 'amenity.manage',
      'payment.create', 'payment.read_all', 'payment.refund'
    ];

    const permissionsData = permissionCodes.map(code => ({
      id: crypto.randomUUID(),
      code: code,
      module: code.split('.')[0],
      description: `Permission to ${code.replace('.', ' ')}`,
      created_at: now,
      updated_at: now
    }));

    // Insert Roles & Permissions (dùng ignoreDuplicates = INSERT IGNORE trong MySQL)
    await queryInterface.bulkInsert('roles', rolesData, { ignoreDuplicates: true });
    await queryInterface.bulkInsert('permissions', permissionsData, { ignoreDuplicates: true });

    // 3. Lấy lại ID thực tế từ DB để map role_permissions
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('guest', 'hotel_staff', 'admin');`
    );
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, code FROM permissions;`
    );

    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r.id);

    const permMap = {};
    permissions.forEach(p => permMap[p.code] = p.id);

    // Ma trận RBAC
    const guestPerms = ['hotel.read_public', 'booking.create', 'booking.read_own', 'booking.cancel_own', 'review.create', 'payment.create'];
    const staffPerms = ['hotel.read_public', 'hotel.manage_own', 'review.moderate_own_hotel', 'room.manage_own_hotel', 'image.manage_own_hotel'];
    const adminPerms = permissionCodes;

    const rolePermissionsData = [];

    const addMapping = (roleName, permCodes) => {
      const roleId = roleMap[roleName];
      if (!roleId) return; // Nếu chưa có role thì bỏ qua

      permCodes.forEach(code => {
        const permId = permMap[code];
        if (permId) {
          rolePermissionsData.push({
            role_id: roleId,
            permission_id: permId,
            created_at: now
          });
        }
      });
    };

    addMapping('guest', guestPerms);
    addMapping('hotel_staff', staffPerms);
    addMapping('admin', adminPerms);

    // Insert Role Permissions
    if (rolePermissionsData.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissionsData, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    // Để down an toàn, lấy id của 3 role này và xóa các role_permissions tương ứng
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name IN ('guest', 'hotel_staff', 'admin');`
    );
    const roleIds = roles.map(r => r.id);

    if (roleIds.length > 0) {
      await queryInterface.bulkDelete('role_permissions', { role_id: roleIds }, {});
      await queryInterface.bulkDelete('roles', { id: roleIds }, {});
    }

    const permissionCodes = [
      'hotel.read_public', 'hotel.read_all', 'hotel.manage_own', 'hotel.manage_all', 'hotel.create',
      'booking.create', 'booking.read_own', 'booking.read_all', 'booking.cancel_own', 'booking.cancel_all', 'booking.update_status_own_hotel', 'booking.update_status_all',
      'review.create', 'review.read_all', 'review.moderate_own_hotel', 'review.moderate_all',
      'user.manage', 'role.manage', 'permission.read', 'permission.manage',
      'dashboard.read', 'room.manage_own_hotel', 'room.manage_all',
      'image.manage_own_hotel', 'image.manage_all', 'amenity.manage',
      'payment.create', 'payment.read_all', 'payment.refund'
    ];
    await queryInterface.bulkDelete('permissions', { code: permissionCodes }, {});
  }
};
