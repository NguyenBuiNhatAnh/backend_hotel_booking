import BookingModel from "../models/bookingModel.js";
import RoomModel from "../models/roomModel.js";
import HotelModel from "../models/hotelModel.js";
import ServiceModel from "../models/serviceModel.js";
import UserModel from "../models/userModel.js";
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
export const createBookingService = async (data) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const {
            userId,
            hotelId,
            rooms,
            checkInDate,
            checkOutDate,
            guests,
            services = []
        } = data;

        // GET USER
        const user = await UserModel.findById(userId)
            .session(session);

        if (!user) {
            throw new Error("User không tồn tại");
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (checkIn >= checkOut) {
            throw new Error("Check-out phải sau check-in");
        }

        const nights = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        );

        let roomPrice = 0;
        let totalCapacity = 0;

        const roomDetails = [];

        for (const { roomId, quantity } of rooms) {

            const room = await RoomModel.findById(roomId)
                .session(session);

            if (!room) {
                throw new Error(`Phòng ${roomId} không tồn tại`);
            }

            const bookedQuantity = await getBookedQuantity(
                roomId,
                checkIn,
                checkOut,
                session
            );

            const availableQuantity =
                room.quantity - bookedQuantity;

            if (quantity > availableQuantity) {
                throw new Error(
                    `Phòng "${room.name}" chỉ còn ${availableQuantity}`
                );
            }

            totalCapacity += room.capacity * quantity;

            const totalRoomPrice =
                room.price * quantity * nights;

            roomPrice += totalRoomPrice;

            roomDetails.push({
                room: room._id,
                roomTypeName: room.name,
                pricePerNight: room.price,
                quantity,
                totalPrice: totalRoomPrice
            });
        }

        if (guests > totalCapacity) {
            throw new Error("Số khách vượt quá sức chứa");
        }

        // SERVICES
        let servicePrice = 0;

        const serviceDetails = [];

        for (const item of services) {

            const service =
                await ServiceModel.findById(item.serviceId)
                    .session(session);

            if (!service) {
                throw new Error("Dịch vụ không tồn tại");
            }

            const quantity = item.quantity || 1;

            let totalServicePrice = 0;

            if (service.chargeType === "one_time") {

                totalServicePrice =
                    service.price * quantity;

            } else {

                const numberOfDays =
                    item.numberOfDays || nights;

                totalServicePrice =
                    service.price *
                    quantity *
                    numberOfDays;
            }

            servicePrice += totalServicePrice;

            serviceDetails.push({
                service: service._id,
                name: service.name,
                chargeType: service.chargeType,
                unitPrice: service.price,
                quantity,
                numberOfDays: item.numberOfDays,
                totalPrice: totalServicePrice,
                status: "pending"
            });
        }

        const [booking] = await BookingModel.create([{

            user: user._id,

            guestInfo: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone
            },

            hotel: hotelId,

            rooms: roomDetails,

            checkInDate: checkIn,
            checkOutDate: checkOut,

            guests,

            services: serviceDetails,

            roomPrice,
            servicePrice,

            totalPrice: roomPrice + servicePrice,

            bookingSource: "customer",

            status: "pending",

            paymentMethod: "vnpay",

            paymentStatus: "unpaid",

            expiredAt:
                new Date(Date.now() + 10 * 60 * 1000)

        }], { session });

        await session.commitTransaction();

        return booking;

    } catch (error) {

        await session.abortTransaction();
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

export const createManagerBookingService = async (data) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const {
            userId = null,
            guestInfo,

            managerId,

            rooms,

            checkInDate,
            checkOutDate,

            guests,

            services = [],

            paymentMethod = "cash",

            isPaid = false
        } = data;

        const hotel = await HotelModel.findOne({
            owner: managerId
        }).session(session);

        if (!hotel) {
            throw new Error("Bạn chưa có khách sạn");
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const nights = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        );

        let roomPrice = 0;
        let totalCapacity = 0;

        const roomDetails = [];

        for (const { roomId, quantity } of rooms) {

            const room = await RoomModel.findById(roomId)
                .session(session);

            if (!room) {
                throw new Error("Phòng không tồn tại");
            }

            const bookedQuantity = await getBookedQuantity(
                roomId,
                checkIn,
                checkOut,
                session
            );

            const availableQuantity =
                room.quantity - bookedQuantity;

            if (quantity > availableQuantity) {
                throw new Error(
                    `Phòng "${room.name}" chỉ còn ${availableQuantity}`
                );
            }

            totalCapacity += room.capacity * quantity;

            const totalRoomPrice =
                room.price * quantity * nights;

            roomPrice += totalRoomPrice;

            roomDetails.push({
                room: room._id,
                roomTypeName: room.name,
                pricePerNight: room.price,
                quantity,
                totalPrice: totalRoomPrice
            });
        }

        if (guests > totalCapacity) {
            throw new Error("Số khách vượt quá sức chứa");
        }

        const booking = await BookingModel.create([{

            user: userId,

            guestInfo,

            hotel: hotel._id,

            rooms: roomDetails,

            checkInDate: checkIn,
            checkOutDate: checkOut,

            guests,

            services: [],

            roomPrice,
            servicePrice: 0,

            totalPrice: roomPrice,

            bookingSource: "manager",

            status: "confirmed",

            paymentMethod,

            paymentStatus:
                isPaid ? "paid" : "unpaid",

            paidAt:
                isPaid ? new Date() : null

        }], { session });

        await session.commitTransaction();

        return booking[0];

    } catch (error) {

        await session.abortTransaction();
        throw error;

    } finally {

        session.endSession();

    }
};

// Luồng 1: Danh sách theo ngày + status
export const getTodayBookingsService = async (managerId, query) => {
    const { status, date, page = 1, limit = 20 } = query;

    const hotel = await HotelModel.findOne({ owner: managerId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    // Mặc định là hôm nay nếu không truyền date
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end   = new Date(targetDate.setHours(23, 59, 59, 999));

    const filter = {
        hotel: hotel._id,
        checkInDate: { $gte: start, $lte: end }
    };

    if (status) filter.status = status;

    const skip = (page - 1) * Number(limit);

    const fields = "_id guestInfo checkInDate checkOutDate status paymentStatus rooms.roomTypeName rooms.quantity";

    const [bookings, total] = await Promise.all([
        BookingModel.find(filter)
            .select(fields)
            .skip(skip)
            .limit(Number(limit))
            .sort({ checkInDate: 1 })
            .populate("rooms.room", "name")
            .populate("user", "name email phone"),
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

// Luồng 2: Search theo SĐT / tên / mã booking
export const searchBookingService = async (managerId, query) => {
    const { keyword, status, page = 1, limit = 10 } = query;

    if (!keyword) throw new Error("Vui lòng nhập từ khóa tìm kiếm");

    const hotel = await HotelModel.findOne({ owner: managerId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    const filter = { hotel: hotel._id };

    if (status) filter.status = status;

    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);

    if (isObjectId) {
        filter._id = keyword;
    } else {
        filter.$or = [
            { "guestInfo.phone":     { $regex: keyword, $options: "i" } },
            { "guestInfo.firstName": { $regex: keyword, $options: "i" } },
            { "guestInfo.lastName":  { $regex: keyword, $options: "i" } },
            { "guestInfo.email":     { $regex: keyword, $options: "i" } }
        ];
    }

    const skip = (page - 1) * Number(limit);

    const fields = "_id guestInfo checkInDate checkOutDate status paymentStatus rooms.roomTypeName rooms.quantity";

    const [bookings, total] = await Promise.all([
        BookingModel.find(filter)
            .select(fields)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate("rooms.room", "name")
            .populate("user", "name email phone"),
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


export const getBookingDetailManagerService = async (bookingId, managerId) => {
    const hotel = await HotelModel.findOne({ owner: managerId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    const booking = await BookingModel.findOne({ _id: bookingId, hotel: hotel._id })
        .populate("rooms.room", "name images")
        .populate("services.service", "name")
        .populate("user", "name email phone");

    if (!booking) throw new Error("Booking không tồn tại");

    return booking;
};

// Status hợp lệ và flow chuyển trạng thái
const ALLOWED_TRANSITIONS = {
    pending:    ["confirmed", "canceled"],
    confirmed:  ["checked_in", "canceled"],
    checked_in: ["checked_out"],
    checked_out: ["completed"],
};

export const updateBookingStatusService = async (bookingId, managerId, status) => {
    const hotel = await HotelModel.findOne({ owner: managerId });
    if (!hotel) throw new Error("Bạn chưa có khách sạn");

    const booking = await BookingModel.findOne({ _id: bookingId, hotel: hotel._id });
    if (!booking) throw new Error("Booking không tồn tại");

    const allowed = ALLOWED_TRANSITIONS[booking.status];
    if (!allowed) throw new Error(`Booking ở trạng thái "${booking.status}" không thể cập nhật`);

    if (!allowed.includes(status)) {
        throw new Error(
            `Không thể chuyển từ "${booking.status}" sang "${status}". Chỉ được chuyển sang: ${allowed.join(", ")}`
        );
    }

    // Gán timestamp tương ứng
    booking.status = status;

    if (status === "checked_in")  booking.checkedInAt  = new Date();
    if (status === "checked_out") booking.checkedOutAt = new Date();

    await booking.save();

    return booking;
};
