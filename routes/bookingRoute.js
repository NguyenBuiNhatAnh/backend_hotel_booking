// booking.route.js
import express from "express";
import {
    createBooking,
    checkRoomAvailability,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getHotelBookings,
    confirmBooking,
    createManagerBooking,
    searchBooking,
    getTodayBookings,
    getBookingDetailManager,
    updateBookingStatus
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createBookingSchema, createManagerBookingSchema } from "../validator/bookingValidator.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const bookingRouter = express.Router();

// Hotel manager
bookingRouter.get(
    "/manage",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    getHotelBookings
);

bookingRouter.patch(
    "/:bookingId/confirm",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    confirmBooking
);

bookingRouter.post(
    "/manage/create",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(createManagerBookingSchema),
    createManagerBooking
);

// Luồng 1: Danh sách theo ngày
bookingRouter.get("/manager/today",  authMiddleware, authorizeRoles("hotel_manager"), getTodayBookings);

// Luồng 2: Search theo keyword
bookingRouter.get("/manager/search", authMiddleware, authorizeRoles("hotel_manager"), searchBooking);

bookingRouter.get("/manager/:bookingId", authMiddleware, authorizeRoles("hotel_manager"), getBookingDetailManager);

bookingRouter.patch("/manager/:bookingId/status", authMiddleware, authorizeRoles("hotel_manager"), updateBookingStatus);


// User
bookingRouter.post("/hotel/:hotelId", authMiddleware, validate(createBookingSchema), createBooking);
bookingRouter.get("/room/:roomId/availability", checkRoomAvailability);
bookingRouter.get("/my-bookings", authMiddleware, getMyBookings);
bookingRouter.get("/:bookingId", authMiddleware, getBookingById);
bookingRouter.patch("/:bookingId/cancel", authMiddleware, cancelBooking);
export default bookingRouter;


// # Luồng 1 - Mặc định hôm nay, chưa check-in
// GET /bookings/manager/today?status=confirmed

// # Luồng 1 - Chọn ngày cụ thể
// GET /bookings/manager/today?date=2025-05-10&status=confirmed

// # Luồng 1 - Xem ai đang ở (đã check-in chưa check-out)
// GET /bookings/manager/today?status=checked_in

// # Luồng 2 - Tìm theo SĐT
// GET /bookings/manager/search?keyword=0901234567

// # Luồng 2 - Tìm theo mã booking
// GET /bookings/manager/search?keyword=664f1a2b3c4d5e6f7a8b9c0d

// # Luồng 2 - Tìm theo tên + lọc status
// GET /bookings/manager/search?keyword=Nguyễn&status=confirmed