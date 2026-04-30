// booking.route.js
import express from "express";
import {
    createBooking,
    checkRoomAvailability,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getHotelBookings,
    confirmBooking
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createBookingSchema } from "../validator/bookingValidator.js";
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


// User
bookingRouter.post("/hotel/:hotelId", authMiddleware, validate(createBookingSchema), createBooking);
bookingRouter.get("/room/:roomId/availability", checkRoomAvailability);
bookingRouter.get("/my-bookings", authMiddleware, getMyBookings);
bookingRouter.get("/:bookingId", authMiddleware, getBookingById);
bookingRouter.patch("/:bookingId/cancel", authMiddleware, cancelBooking);
export default bookingRouter;