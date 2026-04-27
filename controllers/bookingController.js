import * as bookingService from "../services/bookingService.js";

export const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBookingService({
            userId: req.user._id,
            hotelId: req.params.hotelId,
            ...req.body
        });

        return res.status(201).json({ success: true, data: booking });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const checkRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { checkInDate, checkOutDate } = req.query;

        const result = await bookingService.getRoomAvailability(roomId, checkInDate, checkOutDate);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const result = await bookingService.getMyBookingsService(req.user._id, req.query);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingByIdService(
            req.params.bookingId,
            req.user._id
        );
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        const status = error.message.includes("quyền") ? 403 : 404;
        return res.status(status).json({ success: false, message: error.message });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const booking = await bookingService.cancelBookingService(
            req.params.bookingId,
            req.user._id
        );
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};