import ReviewModel from "../models/reviewModel.js";
import BookingModel from "../models/bookingModel.js";
import HotelModel from "../models/hotelModel.js";
import mongoose from "mongoose";

// Helper: tính lại avgRating và lưu vào Hotel
const updateHotelRating = async (hotelId) => {
    const result = await ReviewModel.aggregate([
        { $match: {
                hotel: new mongoose.Types.ObjectId(hotelId)
            } 
        },
        {
            $group: {
                _id: "$hotel",
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    console.log(result);

    const avgRating = result[0]?.avgRating
        ? Math.round(result[0].avgRating * 2) / 2  // làm tròn theo 0,5
        : 0;

    const totalReviews = result[0]?.totalReviews ?? 0;

    await HotelModel.findByIdAndUpdate(hotelId, { avgRating, totalReviews });
};

export const createReviewService = async (userId, data) => {
    const { bookingId, rating, comment } = data;

    // Kiểm tra booking tồn tại và thuộc về user
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.user?.toString() !== userId.toString())
        throw new Error("Bạn không có quyền review booking này");

    if (booking.status !== "checked_out" && booking.status !== "completed")
        throw new Error("Chỉ được review sau khi đã check-out");

    // Mỗi booking chỉ được review 1 lần
    const existed = await ReviewModel.findOne({ booking: bookingId });
    if (existed) throw new Error("Booking này đã được đánh giá");

    const review = await ReviewModel.create({
        user: userId,
        hotel: booking.hotel,
        booking: bookingId,
        rating,
        comment
    });

    // Cập nhật lại avgRating cho hotel
    await updateHotelRating(booking.hotel);

    return review;
};

export const getHotelReviewsService = async (hotelId, query) => {
    const { page = 1, limit = 10, from, to, date } = query;
    const skip = (page - 1) * Number(limit);

    const filter = { hotel: hotelId };

    // support date filtering: either date=YYYY-MM-DD or from/to iso strings
    if (date) {
        const dayStart = new Date(date);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23,59,59,999);
        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    } else if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
    }

    const [reviews, total] = await Promise.all([
        ReviewModel.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate("user", "firstName lastName"),
        ReviewModel.countDocuments({ hotel: hotelId })
    ]);

    // also return hotel's avgRating and totalReviews if present
    updateHotelRating(hotelId);
    const hotel = await HotelModel.findById(hotelId).select("avgRating totalReviews");

    return {
        reviews,
        avgRating: hotel?.avgRating ?? 0,
        totalReviews: hotel?.totalReviews ?? total,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

export const updateReviewService = async (reviewId, userId, data) => {
    const { rating, comment } = data;

    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new Error("Review không tồn tại");

    if (review.user.toString() !== userId.toString())
        throw new Error("Bạn không có quyền chỉnh sửa review này");

    if (rating)  review.rating  = rating;
    if (comment) review.comment = comment;

    await review.save();

    // Tính lại avgRating nếu đổi rating
    if (rating) await updateHotelRating(review.hotel);

    return review;
};
