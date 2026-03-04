const express = require("express");
const router = express.Router();

const partnerHotelsRoutes = require("./hotels.routes");
const partnerRoomTypesRoutes = require("./roomTypes.routes");
const partnerRoomsRoutes = require("./rooms.routes");
const partnerBookingsRoutes = require("./bookings.routes");
const partnerReviewsRoutes = require("./review.routes");
const partnerImagesRoutes = require("./image.routes");
const partnerAmenitiesRoutes = require("./amenity.routes");
const partnerPaymentsRoutes = require("./payment.routes");
const partnerDashboardRoutes = require("./dashboard.routes");
const partnerWalletRoutes = require("./wallet.routes");
const partnerWithdrawalRoutes = require("./withdrawal.routes");

router.use("/hotels", partnerHotelsRoutes);
router.use("/room-types", partnerRoomTypesRoutes);
router.use("/rooms", partnerRoomsRoutes);
router.use("/bookings", partnerBookingsRoutes);
router.use("/reviews", partnerReviewsRoutes);
router.use("/images", partnerImagesRoutes);
router.use("/amenities", partnerAmenitiesRoutes);
router.use("/payments", partnerPaymentsRoutes);
router.use("/dashboard", partnerDashboardRoutes);
router.use("/wallet", partnerWalletRoutes);
router.use("/withdrawals", partnerWithdrawalRoutes);

module.exports = router;
