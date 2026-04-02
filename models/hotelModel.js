import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    description: String,
    image: [String],

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
    }
});

const HotelModel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);
export default HotelModel;