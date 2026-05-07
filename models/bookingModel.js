import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({

    // nullable
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // snapshot thông tin khách
    guestInfo: {
        firstName: {
            type: String,
            required: true
        },

        lastName: {
            type: String,
            default: ""
        },

        email: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        }
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

        roomTypeName: String,

        pricePerNight: Number,

        quantity: Number,

        totalPrice: Number
    }],

    checkInDate: Date,

    checkOutDate: Date,

    guests: Number,

    services: [{
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service"
        },

        name: String,

        chargeType: {
            type: String,
            enum: ["one_time", "per_night"]
        },

        status: {
            type: String,
            enum: ["pending", "completed", "canceled"],
            default: "pending"
        },

        unitPrice: Number,

        quantity: Number,

        numberOfDays: Number,

        totalPrice: Number
    }],

    roomPrice: Number,

    servicePrice: Number,

    totalPrice: Number,

    bookingSource: {
        type: String,
        enum: ["customer", "manager"],
        default: "customer"
    },

    status: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "checked_in",
            "checked_out",
            "completed",
            "canceled"
        ],
        default: "pending"
    },

    paymentMethod: {
        type: String,
        enum: ["vnpay", "cash", "bank_transfer"],
        default: "vnpay"
    },

    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "failed"],
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
        enum: ["user", "system", "manager"],
        default: null
    },

    paidAt: {
        type: Date,
        default: null
    },

    checkedInAt: {
        type: Date,
        default: null
    },

    checkedOutAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

BookingSchema.index({
    hotel: 1,
    checkInDate: 1,
    checkOutDate: 1,
    status: 1
});

const BookingModel =
    mongoose.models.Booking ||
    mongoose.model("Booking", BookingSchema);

export default BookingModel;