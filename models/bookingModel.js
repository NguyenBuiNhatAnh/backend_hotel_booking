import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel"
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },

    checkInDate: Date,
    checkOutDate: Date,

    guests: Number,

    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
    }],

    totalPrice: Number,

    status: {
        type: String,
        enum : [
            "pending",
            "confirmed",
            "checked_in",
            "completed",
            "canceled"
        ],
        default: "pending"
    },

    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default BookingModel;