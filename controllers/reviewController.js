// review.controller.js
import { createReviewService, getHotelReviewsService, getReviewByBookingService, updateReviewService } from "../services/reviewService.js";
import { createReviewSchema, updateReviewSchema } from "../validator/reviewValidator.js";

export const createReview = async (req, res) => {
    try {
        const { error } = createReviewSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const review = await createReviewService(req.user.id, req.body);
        res.status(201).json({ 
            success: true,
            message: "Đánh giá thành công", 
            review 
        });
    } catch (err) {
        res.status(400).json({ 
            success: false,
            message: err.message 
        });
    }
};

export const getHotelReviews = async (req, res) => {
    try {
        const data = await getHotelReviewsService(req.params.hotelId, req.query);
        res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        res.status(400).json({ 
            success: false,
            message: err.message
        });
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

export const getReviewByBooking = async (req, res) => {
    try {
        const review = await getReviewByBookingService(
            req.params.bookingId,
            req.user.id
        );

        res.status(200).json({
            success: true,
            review
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};