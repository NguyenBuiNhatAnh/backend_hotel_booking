// review.controller.js
import { createReviewService, getHotelReviewsService } from "../services/reviewService.js";
import { createReviewSchema } from "../validator/reviewValidator.js";

export const createReview = async (req, res) => {
    try {
        const { error } = createReviewSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const review = await createReviewService(req.user._id, req.body);
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