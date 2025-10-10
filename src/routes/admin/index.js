const express = require("express");
const router = express.Router();

const adminUsersRoutes = require("./users.routes");
const adminRolesRoutes = require("./roles.routes");
const adminPermissionsRoutes = require("./permissions.routes");
const adminHotelsRoutes = require("./hotels.routes");
const adminRoomsRoutes = require("./rooms.routes");
const adminBookingsRoutes = require("./bookings.routes");
const adminReviewsRoutes = require("./review.routes");

// Admin routes
router.use("/users", adminUsersRoutes);
router.use("/roles", adminRolesRoutes);
router.use("/permissions", adminPermissionsRoutes);
router.use("/hotels", adminHotelsRoutes);
router.use("/rooms", adminRoomsRoutes);
router.use("/bookings", adminBookingsRoutes);
router.use("/reviews", adminReviewsRoutes);

module.exports = router;
