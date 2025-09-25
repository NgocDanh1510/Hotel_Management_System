const {
  Booking,
  Room,
  RoomType,
  Hotel,
  Payment,
  User,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

// ===== State machine for booking status transitions =====
const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out"],
  // Terminal states — no transitions allowed
  checked_out: [],
  cancelled: [],
  cancellation_pending: [],
};

class BookingService {
  // ────────────────────────────────────────
  //  CREATE BOOKING
  // ────────────────────────────────────────

  /**
   * Create a new booking using a DB transaction with SELECT FOR UPDATE
   * to prevent race conditions on room availability.
   *
   * @param {Object} data - Booking body fields
   * @param {string} userId - Authenticated user's ID
   * @returns {Promise<Object>} Created booking snapshot
   */
  async createBooking(data, userId) {
    const {
      hotel_id,
      room_type_id,
      check_in,
      check_out,
      guests_count,
      special_requests,
    } = data;

    // --- Date validation ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const checkInDate = new Date(check_in);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(check_out);
    checkOutDate.setHours(0, 0, 0, 0);

    if (checkInDate < tomorrow) {
      const error = new Error("check_in must be at least tomorrow");
      error.statusCode = 400;
      throw error;
    }

    if (checkOutDate <= checkInDate) {
      const error = new Error("check_out must be after check_in");
      error.statusCode = 400;
      throw error;
    }

    // Calculate nights
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.round((checkOutDate - checkInDate) / msPerDay);

    const transaction = await sequelize.transaction();
    try {
      // --- Step 1: Load room type + hotel, validate occupancy ---
      const roomType = await RoomType.findOne({
        where: { id: room_type_id, hotel_id },
        include: [{ model: Hotel, attributes: ["id", "name"] }],
        transaction,
      });

      if (!roomType) {
        const error = new Error("Room type not found for this hotel");
        error.statusCode = 404;
        throw error;
      }

      if (guests_count > roomType.max_occupancy) {
        const error = new Error(
          `Room type supports max ${roomType.max_occupancy} guests`
        );
        error.statusCode = 400;
        throw error;
      }

      const checkInStr = checkInDate.toISOString().split("T")[0];
      const checkOutStr = checkOutDate.toISOString().split("T")[0];

      // --- Step 2: Find 1 available room with SELECT FOR UPDATE ---
      const bookedRoomIds = await Booking.findAll({
        where: {
          room_type_id,
          status: { [Op.in]: ["confirmed", "checked_in", "pending"] },
          check_in: { [Op.lt]: checkOutStr },
          check_out: { [Op.gt]: checkInStr },
        },
        attributes: ["room_id"],
        raw: true,
        transaction,
      });

      const excludedRoomIds = bookedRoomIds.map((b) => b.room_id).filter(Boolean);

      const whereRoom = {
        room_type_id,
        hotel_id,
        status: "available",
      };

      if (excludedRoomIds.length > 0) {
        whereRoom.id = { [Op.notIn]: excludedRoomIds };
      }

      const availableRoom = await Room.findOne({
        where: whereRoom,
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!availableRoom) {
        const error = new Error("No rooms available for selected dates");
        error.statusCode = 409;
        throw error;
      }

      // --- Step 3: Price snapshot ---
      const pricePerNight = parseFloat(roomType.base_price);
      const totalPrice = pricePerNight * nights;

      // --- Step 4: Set expiry (15 minutes from now) ---
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // --- Step 5: Create booking ---
      const booking = await Booking.create(
        {
          user_id: userId,
          hotel_id,
          room_id: availableRoom.id,
          room_type_id,
          check_in: checkInStr,
          check_out: checkOutStr,
          guests_count,
          total_price: totalPrice,
          price_per_night: pricePerNight,
          status: "pending",
          special_requests: special_requests || null,
          expires_at: expiresAt,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        id: booking.id,
        room_number: availableRoom.room_number,
        hotel_name: roomType.Hotel.name,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests_count: booking.guests_count,
        total_price: totalPrice,
        price_per_night: pricePerNight,
        nights,
        status: booking.status,
        expires_at: expiresAt,
        created_at: booking.created_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ────────────────────────────────────────
  //  GET BOOKING DETAIL
  // ────────────────────────────────────────

  /**
   * Get full booking detail.
   *
   * @param {string} bookingId - Booking ID
   * @param {Object} user - req.user (user_id, permissions)
   * @returns {Promise<Object>} Booking detail
   */
  async getBookingDetail(bookingId, user) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Hotel, attributes: ["id", "name", "address", "city", "country"] },
        { model: Room, attributes: ["id", "room_number", "floor", "status"] },
        { model: RoomType, attributes: ["id", "name", "max_occupancy", "base_price", "currency"] },
        { model: User, attributes: ["id", "name", "email", "phone"] },
        {
          model: Payment,
          attributes: ["id", "amount", "gateway", "status", "type", "paid_at"],
        },
      ],
    });

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    const perms = user.permissions || [];
    const canReadAll = perms.includes("booking.read_all");
    if (!canReadAll && booking.user_id !== user.user_id) {
      const error = new Error("You do not have permission to view this booking");
      error.statusCode = 403;
      throw error;
    }

    const plain = booking.get({ plain: true });

    // On-the-fly expiry
    let effectiveStatus = plain.status;
    if (
      effectiveStatus === "pending" &&
      plain.expires_at &&
      new Date(plain.expires_at) < new Date()
    ) {
      effectiveStatus = "expired";
    }

    return {
      id: plain.id,
      user: plain.User,
      hotel: plain.Hotel,
      room: plain.Room,
      room_type: plain.RoomType,
      check_in: plain.check_in,
      check_out: plain.check_out,
      guests_count: plain.guests_count,
      total_price: parseFloat(plain.total_price),
      price_per_night: parseFloat(plain.price_per_night),
      status: effectiveStatus,
      special_requests: plain.special_requests,
      expires_at: plain.expires_at,
      payments: plain.Payments || [],
      created_at: plain.created_at,
      updated_at: plain.updated_at,
    };
  }

  // ────────────────────────────────────────
  //  CANCEL BOOKING
  // ────────────────────────────────────────

  /**
   * Cancel a booking. If a successful payment exists, set status to
   * 'cancellation_pending' instead and trigger the refund flow.
   *
   * @param {string} bookingId - Booking ID
   * @param {Object} user - req.user
   * @returns {Promise<Object>} Updated booking info
   */
  async cancelBooking(bookingId, user) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Payment, attributes: ["id", "status", "amount", "gateway"] },
        { model: Hotel, attributes: ["id", "name"] },
        { model: Room, attributes: ["id", "room_number"] },
      ],
    });

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission: cancel_own requires ownership
    const perms = user.permissions || [];
    const canCancelAll = perms.includes("booking.cancel_all");
    if (!canCancelAll && booking.user_id !== user.user_id) {
      const error = new Error("You do not have permission to cancel this booking");
      error.statusCode = 403;
      throw error;
    }

    // Only cancel when pending or confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      const error = new Error(
        `Cannot cancel booking with status '${booking.status}'. Only pending or confirmed bookings can be cancelled`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check for successful payment → cancellation_pending + refund
    const successPayments = (booking.Payments || []).filter(
      (p) => p.status === "success"
    );

    let newStatus;
    let refundTriggered = false;

    if (successPayments.length > 0) {
      newStatus = "cancellation_pending";
      refundTriggered = true;

      // Trigger refund flow for each successful payment
      await Promise.all(
        successPayments.map(async (payment) => {
          await Payment.create({
            booking_id: bookingId,
            user_id: booking.user_id,
            amount: payment.amount,
            gateway: payment.gateway,
            status: "pending",
            type: "refund",
            note: `Refund for cancelled booking ${bookingId}`,
          });
        })
      );
    } else {
      newStatus = "cancelled";
    }

    await booking.update({ status: newStatus });

    return {
      id: booking.id,
      hotel_name: booking.Hotel?.name || null,
      room_number: booking.Room?.room_number || null,
      check_in: booking.check_in,
      check_out: booking.check_out,
      total_price: parseFloat(booking.total_price),
      status: newStatus,
      refund_triggered: refundTriggered,
    };
  }

  // ────────────────────────────────────────
  //  LIST MY BOOKINGS
  // ────────────────────────────────────────

  /**
   * List bookings belonging to the authenticated user.
   *
   * @param {string} userId - Authenticated user's ID
   * @param {Object} query - Filter/sort/pagination params
   * @returns {Promise<Object>} Bookings list + pagination meta
   */
  async listMyBookings(userId, query) {
    const {
      status,
      check_in_from,
      check_in_to,
      hotel_id,
      sort = "created_at",
      offset = 0,
      limit = 10,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));

    const where = { user_id: userId };

    if (status) where.status = status;
    if (hotel_id) where.hotel_id = hotel_id;

    if (check_in_from || check_in_to) {
      where.check_in = {};
      if (check_in_from) where.check_in[Op.gte] = check_in_from;
      if (check_in_to) where.check_in[Op.lte] = check_in_to;
    }

    // Auto-expire: treat pending bookings past expires_at as expired
    const now = new Date();

    const order =
      sort === "check_in"
        ? [["check_in", "asc"]]
        : [["created_at", "desc"]];

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Hotel, attributes: ["id", "name"] },
        { model: Room, attributes: ["id", "room_number"] },
        { model: RoomType, attributes: ["id", "name", "base_price"] },
      ],
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
    });

    // On-the-fly expiry check for pending bookings
    const bookings = rows.map((b) => {
      const plain = b.get({ plain: true });
      let effectiveStatus = plain.status;
      if (
        effectiveStatus === "pending" &&
        plain.expires_at &&
        new Date(plain.expires_at) < now
      ) {
        effectiveStatus = "expired";
      }
      return {
        id: plain.id,
        hotel_name: plain.Hotel?.name || null,
        room_number: plain.Room?.room_number || null,
        room_type_name: plain.RoomType?.name || null,
        check_in: plain.check_in,
        check_out: plain.check_out,
        guests_count: plain.guests_count,
        total_price: parseFloat(plain.total_price),
        price_per_night: parseFloat(plain.price_per_night),
        status: effectiveStatus,
        expires_at: plain.expires_at,
        special_requests: plain.special_requests,
        created_at: plain.created_at,
      };
    });

    return {
      bookings,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  // ────────────────────────────────────────
  //  ADMIN: LIST ALL BOOKINGS
  // ────────────────────────────────────────

  /**
   * List all bookings with advanced filtering for admin.
   *
   * @param {Object} query - Filters, search, sort, pagination
   * @returns {Promise<Object>} Bookings list + pagination meta
   */
  async listAllBookings(query) {
    const {
      status,
      hotel_id,
      room_id,
      user_id,
      check_in_from,
      check_in_to,
      check_out_from,
      check_out_to,
      created_at_from,
      created_at_to,
      total_price_min,
      total_price_max,
      q,
      sort = "created_at_desc",
      offset = 0,
      limit = 20,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const where = {};

    // Status filter (multi-select)
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.status = { [Op.in]: statuses };
    }

    if (hotel_id) where.hotel_id = hotel_id;
    if (room_id) where.room_id = room_id;
    if (user_id) where.user_id = user_id;

    // Date range filters
    if (check_in_from || check_in_to) {
      where.check_in = {};
      if (check_in_from) where.check_in[Op.gte] = check_in_from;
      if (check_in_to) where.check_in[Op.lte] = check_in_to;
    }

    if (check_out_from || check_out_to) {
      where.check_out = {};
      if (check_out_from) where.check_out[Op.gte] = check_out_from;
      if (check_out_to) where.check_out[Op.lte] = check_out_to;
    }

    if (created_at_from || created_at_to) {
      where.created_at = {};
      if (created_at_from) where.created_at[Op.gte] = new Date(created_at_from);
      if (created_at_to) where.created_at[Op.lte] = new Date(created_at_to);
    }

    // Price range filter
    if (total_price_min !== undefined || total_price_max !== undefined) {
      where.total_price = {};
      if (total_price_min !== undefined) where.total_price[Op.gte] = total_price_min;
      if (total_price_max !== undefined) where.total_price[Op.lte] = total_price_max;
    }

    // Search
    const includeOptions = [
      {
        model: Hotel,
        attributes: ["id", "name"],
        ...(q ? { where: {}, required: false } : {}),
      },
      {
        model: Room,
        attributes: ["id", "room_number"],
        ...(q ? { where: {}, required: false } : {}),
      },
      { model: RoomType, attributes: ["id", "name"] },
      { model: User, attributes: ["id", "name", "email"] },
    ];

    if (q) {
      where[Op.or] = [
        { "$User.name$": { [Op.like]: `%${q}%` } },
        { "$User.email$": { [Op.like]: `%${q}%` } },
        { "$Room.room_number$": { [Op.like]: `%${q}%` } },
        { "$Hotel.name$": { [Op.like]: `%${q}%` } },
      ];
    }

    // Sort
    let order = [];
    switch (sort) {
      case "created_at": order = [["created_at", "asc"]]; break;
      case "created_at_desc": order = [["created_at", "desc"]]; break;
      case "check_in": order = [["check_in", "asc"]]; break;
      case "check_in_desc": order = [["check_in", "desc"]]; break;
      case "total_price": order = [["total_price", "asc"]]; break;
      case "total_price_desc": order = [["total_price", "desc"]]; break;
      case "status": order = [["status", "asc"]]; break;
      case "status_desc": order = [["status", "desc"]]; break;
      default: order = [["created_at", "desc"]]; break;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: includeOptions,
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
      subQuery: false,
    });

    const bookings = rows.map((b) => {
      const plain = b.get({ plain: true });
      return {
        id: plain.id,
        user: plain.User || null,
        hotel: plain.Hotel || null,
        room: plain.Room || null,
        room_type: plain.RoomType || null,
        check_in: plain.check_in,
        check_out: plain.check_out,
        guests_count: plain.guests_count,
        total_price: parseFloat(plain.total_price),
        price_per_night: parseFloat(plain.price_per_night),
        status: plain.status,
        special_requests: plain.special_requests,
        expires_at: plain.expires_at,
        created_at: plain.created_at,
        updated_at: plain.updated_at,
      };
    });

    return {
      bookings,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  // ────────────────────────────────────────
  //  ADMIN: UPDATE BOOKING STATUS
  // ────────────────────────────────────────

  /**
   * Update booking status using a state-machine approach.
   *
   * @param {string} bookingId - Booking ID
   * @param {string} newStatus - Target status
   * @param {Object} user - req.user
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingStatus(bookingId, newStatus, user) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Hotel, attributes: ["id", "name", "owner_id"] },
        { model: Room, attributes: ["id", "room_number"] },
        { model: Payment, attributes: ["id", "status", "amount", "gateway"] },
      ],
    });

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission: update_status_own_hotel requires hotel ownership
    const perms = user.permissions || [];
    const canManageAll = perms.includes("booking.update_status_all");
    const canManageOwn = perms.includes("booking.update_status_own_hotel");

    if (!canManageAll) {
      if (canManageOwn) {
        if (booking.Hotel?.owner_id !== user.user_id) {
          const error = new Error(
            "You do not have permission to manage bookings for this hotel"
          );
          error.statusCode = 403;
          throw error;
        }
      } else {
        const error = new Error("Insufficient permissions");
        error.statusCode = 403;
        throw error;
      }
    }

    // --- State machine validation ---
    const currentStatus = booking.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Transition from '${currentStatus}' to '${newStatus}' is not allowed. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(", ") : "none (terminal state)"}`
      );
      error.statusCode = 400;
      throw error;
    }

    // --- Extra constraint: confirmed → checked_in only when check_in ≤ today ---
    if (newStatus === "checked_in") {
      const today = new Date().toISOString().split("T")[0];
      if (booking.check_in > today) {
        const error = new Error(
          `Cannot check in before the check-in date (${booking.check_in})`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // --- Edge: cancellation with payment → trigger refund ---
    let refundTriggered = false;
    if (newStatus === "cancelled") {
      const successPayments = (booking.Payments || []).filter(
        (p) => p.status === "success"
      );

      if (successPayments.length > 0) {
        // Override to cancellation_pending and create refund records
        newStatus = "cancellation_pending";
        refundTriggered = true;

        await Promise.all(
          successPayments.map(async (payment) => {
            await Payment.create({
              booking_id: bookingId,
              user_id: booking.user_id,
              amount: payment.amount,
              gateway: payment.gateway,
              status: "pending",
              type: "refund",
              note: `Refund for booking ${bookingId} status change`,
            });
          })
        );
      }
    }

    await booking.update({ status: newStatus });

    return {
      id: booking.id,
      hotel_name: booking.Hotel?.name || null,
      room_number: booking.Room?.room_number || null,
      check_in: booking.check_in,
      check_out: booking.check_out,
      total_price: parseFloat(booking.total_price),
      previous_status: currentStatus,
      status: newStatus,
      refund_triggered: refundTriggered,
      updated_at: booking.updated_at,
    };
  }
}

module.exports = new BookingService();
