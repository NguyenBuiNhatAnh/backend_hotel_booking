import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema({
    name: String,
    address: {
        street: String,     // Số nhà, tên đường
        ward: String,       // Phường/Quận/Xã tùy nơi
        city: {
            type: String,
            required: true,
            index: true     // Tỉnh/Thành phố
        }
    },
    description: String,
    image: [
        {
            url: String,
            public_id: String
        }
    ],

    amenities: [String], // wifi, pool, parking...

    checkInTime: String,
    checkOutTime: String,

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "blocked"],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    minPrice: {
        type: Number,
        default: null
    },

    maxPrice: {
        type: Number,
        default: null
    }
});

const HotelModel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);
export default HotelModel;