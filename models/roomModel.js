import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel"
    },

    name: String, // Deluxe Room
    description: String,
    price: Number,
    capacity: Number, // số người

    images: [
        {
            url: String,
            public_id: String
        }
    ],

    quantity: Number, // sô phòng loại này

    amenities: [String]
});

const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export default RoomModel;