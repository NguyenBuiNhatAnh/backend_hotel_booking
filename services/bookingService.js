import BookingModel from "../models/bookingModel.js";
import RoomModel from "../models/roomModel.js";
import HotelModel from "../models/hotelModel.js";
import ServiceModel from "../models/serviceModel.js";
import mongoose from "mongoose";

// ============================================================
// Tính số phòng đã được đặt trong khoảng thời gian
// ============================================================
const getBookedQuantity = async (roomId, checkInDate, checkOutDate, session = null) => {
    const query = BookingModel.find({
        status: { $nin: ["canceled"] },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
        "rooms.room": roomId
    });

    if (session) query.session(session);

    const bookings = await query;

    return bookings.reduce((total, booking) => {
        const roomEntry = booking.rooms.find(r => r.room.toString() === roomId.toString());
        return total + (roomEntry?.quantity || 0);
    }, 0);
};

// ============================================================
// Check số phòng còn trống (dùng cho trang xem phòng)
// ============================================================
export const getRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error("Room not found");

    const bookedQuantity = await getBookedQuantity(roomId, checkInDate, checkOutDate);
    const availableQuantity = room.quantity - bookedQuantity;

    return {
        roomId,
        totalQuantity: room.quantity,
        bookedQuantity,
        availableQuantity,
        checkInDate,
        checkOutDate,
        isAvailable: availableQuantity > 0
    };
};

// ============================================================
// Tạo booking
// ============================================================
export const createBookingService = async (data, retries = 3) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, hotelId, rooms, checkInDate, checkOutDate, guests, services = [] } = data;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (checkIn >= checkOut) throw new Error("Check-out phải sau check-in");

        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const roomDetails = [];
        let roomPrice = 0;
        let totalCapacity = 0;

        for (const { roomId, quantity } of rooms) {
            const room = await RoomModel.findById(roomId).session(session);
            if (!room) throw new Error(`Phòng ${roomId} không tồn tại`);
            if (room.hotel.toString() !== hotelId) throw new Error(`Phòng ${roomId} không thuộc khách sạn này`);

            totalCapacity += room.capacity * quantity;

            const bookedQuantity = await getBookedQuantity(roomId, checkIn, checkOut, session);
            const availableQuantity = room.quantity - bookedQuantity;

            if (quantity > availableQuantity) {
                throw new Error(
                    availableQuantity === 0
                        ? `Phòng "${room.name}" đã hết trong khoảng thời gian này`
                        : `Phòng "${room.name}" chỉ còn ${availableQuantity} phòng trống`
                );
            }

            const totalRoomPrice = room.price * quantity * nights;
            roomPrice += totalRoomPrice;

            roomDetails.push({
                room: roomId,
                pricePerNight: room.price,
                quantity,
                totalPrice: totalRoomPrice
            });
        }

        // Check sau khi đã lấy được totalCapacity
        if (guests > totalCapacity) {
            throw new Error(`Số khách (${guests}) vượt quá sức chứa phòng (${totalCapacity} người)`);
        }

        const serviceDetails = [];
        let servicePrice = 0;

        for (const item of services) {
            const service = await ServiceModel.findById(item.serviceId).session(session);
            if (!service) throw new Error(`Dịch vụ ${item.serviceId} không tồn tại`);
            if (service.hotel.toString() !== hotelId) throw new Error(`Dịch vụ không thuộc khách sạn này`);

            let quantity, totalServicePrice;

            switch (service.chargeType) {
                case "one_time":
                    quantity = item.quantity ?? 1;
                    totalServicePrice = service.price * quantity;
                    break;

                case "per_night":
                    quantity = item.quantity ?? 1;
                    const numberOfDays = item.numberOfDays ?? nights;
                    if (numberOfDays > nights) {
                        throw new Error(`"${service.name}" tối đa ${nights} ngày`);
                    }

                    totalServicePrice = service.price * quantity * numberOfDays;
                    break;
                default:
                    throw new Error(`Loại dịch vụ "${service.chargeType}" không hợp lệ`);
            }

            servicePrice += totalServicePrice;

            serviceDetails.push({
                service: item.serviceId,
                name: service.name,
                chargeType: service.chargeType,
                unitPrice: service.price,
                quantity,
                ...(service.chargeType === "per_night" && {
                    numberOfDays: item.numberOfDays ?? nights  // ← dùng trực tiếp
                }),
                totalPrice: totalServicePrice
            });
        }

        const [booking] = await BookingModel.create([{
            user: userId,
            hotel: hotelId,
            rooms: roomDetails,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guests,
            services: serviceDetails,
            roomPrice,
            servicePrice,
            totalPrice: roomPrice + servicePrice,
            expiredAt: new Date(Date.now() + 10 * 60 * 1000)
        }], { session });

        await session.commitTransaction();
        return booking;

    } catch (error) {
        await session.abortTransaction();

        // WriteConflict → retry
        if (error.code === 112 && retries > 0) {
            session.endSession();
            console.log(`WriteConflict, thử lại... còn ${retries} lần`);
            await new Promise(r => setTimeout(r, 100)); // chờ 100ms trước khi retry
            return createBookingService(data, retries - 1);
        }

        throw error;

    } finally {
            session.endSession();
    }
};

// ============================================================
// Lấy danh sách booking của user
// ============================================================
export const getMyBookingsService = async (userId, query) => {
    const { status, page = 1, limit = 10 } = query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        BookingModel.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate("hotel", "name address image")
            .populate("rooms.room", "name images")
            .populate("services.service", "name"),
        BookingModel.countDocuments(filter)
    ]);

    return {
        bookings,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

// ============================================================
// Lấy chi tiết 1 booking
// ============================================================
export const getBookingByIdService = async (bookingId, userId) => {
    const booking = await BookingModel.findById(bookingId)
        .populate("hotel", "name address image checkInTime checkOutTime")
        .populate("rooms.room", "name images amenities")
        .populate("services.service", "name unit");

    if (!booking) throw new Error("Booking không tồn tại");

    // Chỉ cho xem booking của chính mình
    if (booking.user.toString() !== userId.toString()) {
        throw new Error("Bạn không có quyền xem booking này");
    }

    return booking;
};

// ============================================================
// Hủy booking
// ============================================================
export const cancelBookingService = async (bookingId, userId) => {
    const booking = await BookingModel.findById(bookingId);

    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.user.toString() !== userId.toString()) {
        throw new Error("Bạn không có quyền hủy booking này");
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
        throw new Error(`Không thể hủy booking ở trạng thái "${booking.status}"`);
    }

    // Không cho hủy nếu còn ít hơn 24h đến check-in
    const hoursUntilCheckIn = (new Date(booking.checkInDate) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilCheckIn < 24) {
        throw new Error("Không thể hủy booking trong vòng 24h trước check-in");
    }

    booking.status = "canceled";
    await booking.save();

    return booking;
};


export const getHotelBookingsService = async (userId, query) => {
    const { status, page = 1, limit = 10 } = query;

    // Lấy hotel từ userId
    const hotel = await HotelModel.findOne({ owner: userId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    const filter = { hotel: hotel._id };
    if (status) filter.status = status;

    const skip = (page - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        BookingModel.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate("user", "name email phone")
            .populate("rooms.room", "name")
            .populate("services.service", "name"),
        BookingModel.countDocuments(filter)
    ]);

    return {
        bookings,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

export const confirmBookingService = async (bookingId, userId) => {
    const hotel = await HotelModel.findOne({ owner: userId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    const booking = await BookingModel.findOne({ _id: bookingId, hotel: hotel._id });
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.status !== "pending") {
        throw new Error("Chỉ có thể xác nhận booking ở trạng thái pending");
    }

    booking.status = "confirmed";
    await booking.save();

    return booking;
};