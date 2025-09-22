const {
  Booking,
  Room,
  RoomType,
  Hotel,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

class BookingService {
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
      // A room is available if it has no overlapping active bookings:
      //   NOT (existing.check_in < new.check_out AND existing.check_out > new.check_in)
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
}

module.exports = new BookingService();
