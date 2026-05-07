import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel"
    },

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    },

    rating: {
        type: Number,
        min: 0,
        max: 5
    }, // 1-5 sao
    comment: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export default ReviewModel;