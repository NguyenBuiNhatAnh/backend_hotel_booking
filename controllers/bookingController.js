import * as bookingService from "../services/bookingService.js";

export const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBookingService({
            userId: req.user.id,
            hotelId: req.params.hotelId,
            ...req.body
        });

        return res.status(201).json({ success: true, data: booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const checkRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { checkInDate, checkOutDate } = req.query;

        const result = await bookingService.getRoomAvailability(roomId, checkInDate, checkOutDate);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const result = await bookingService.getMyBookingsService(req.user.id, req.query);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingByIdService(
            req.params.bookingId,
            req.user.id
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
            req.user.id
        );
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getHotelBookings = async (req, res) => {
    try {
        const result = await bookingService.getHotelBookingsService(req.user.id, req.query);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const confirmBooking = async (req, res) => {
    try {
        const booking = await bookingService.confirmBookingService(
            req.params.bookingId,
            req.user.id
        );
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const createManagerBooking = async (req, res) => {
    try {

        const booking =
            await bookingService.createManagerBookingService({
                ...req.body,
                managerId: req.user.id
            });

        res.status(201).json({
            success: true,
            message: "Tạo booking thành công",
            booking
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

export const getTodayBookings = async (req, res) => {
    try {
        const data = await bookingService.getTodayBookingsService(req.user.id, req.query);
        res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        res.status(400).json({
            sucess: false,
            message: err.message
        });
    }
};

export const searchBooking = async (req, res) => {
    try {
        const data = await bookingService.searchBookingService(req.user.id, req.query);
        res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        res.status(400).json({
            sucess: false,
            message: err.message
        });
    }
};


export const getBookingDetailManager = async (req, res) => {
    try {
        const data = await bookingService.getBookingDetailManagerService(req.params.bookingId, req.user.id);
        res.status(200).json({ success: true, data: {status: data.status} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.query;
        if (!status) return res.status(400).json({ message: "Thiếu status" });

        const data = await bookingService.updateBookingStatusService(req.params.bookingId, req.user.id, status);
        res.status(200).json({ success: true, data: {status: data.status} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { error } = updateReviewSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const data = await updateReviewService(req.params.reviewId, req.user.id, req.body);
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};