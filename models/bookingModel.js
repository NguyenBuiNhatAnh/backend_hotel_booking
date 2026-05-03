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
    rooms: [{
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room"
        },
        pricePerNight: Number,
        quantity: Number,
        totalPrice: Number
    }],
    checkInDate: Date,
    checkOutDate: Date,
    guests: Number,
    services: [{
        service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        name: String,
        chargeType: {
            type: String,
            enum: ["one_time", "per_night"]
        },     // lưu lại để hiển thị sau
        unitPrice: Number,
        quantity: Number,
        numberOfDays: Number,
        totalPrice: Number
    }],
    roomPrice: Number,      // tổng tiền phòng
    servicePrice: Number,   // tổng tiền dịch vụ
    totalPrice: Number,     // roomPrice + servicePrice
    status: {
        type: String,
        enum: ["pending", "confirmed", "checked_in", "completed", "canceled"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid"
    },

    expiredAt: {
        type: Date,
        default: null
    },

    cancelReason: {
        type: String,
        default: null
    },

    canceledBy: {
        type: String,
        enum: ["user", "system"],
        default: null
    },

    paidAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default BookingModel;