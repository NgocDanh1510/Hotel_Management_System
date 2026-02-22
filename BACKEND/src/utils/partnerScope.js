const ADMIN_SCOPE_PERMISSIONS = new Set([
  "booking.cancel_all",
  "booking.read_all",
  "booking.update_status_all",
  "hotel.manage_all",
  "image.manage_all",
  "payment.read_all",
  "room.manage_all",
]);

const toPartnerScopedUser = (user = {}) => ({
  ...user,
  permissions: (user.permissions || []).filter(
    (permission) => !ADMIN_SCOPE_PERMISSIONS.has(permission),
  ),
});

module.exports = {
  toPartnerScopedUser,
};
