// booking.route.js
import express from "express";
import {
    createBooking,
    checkRoomAvailability,
    getMyBookings,
    getBookingById,
    cancelBooking
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createBookingSchema } from "../validator/bookingValidator.js";
import { validate } from "../middlewares/validateMiddleware.js";

const bookingRouter = express.Router();

bookingRouter.post(
    "/hotel/:hotelId",
    authMiddleware,
    validate(createBookingSchema),
    createBooking
);

bookingRouter.get(
    "/room/:roomId/availability",
    checkRoomAvailability
);

bookingRouter.get("/my-bookings", authMiddleware, getMyBookings);
bookingRouter.get("/:bookingId", authMiddleware, getBookingById);
bookingRouter.patch("/:bookingId/cancel", authMiddleware, cancelBooking);

export default bookingRouter;