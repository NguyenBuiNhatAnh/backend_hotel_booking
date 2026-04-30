import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    name: String,           // "Bữa sáng", "Thuê xe máy"
    price: Number,          // giá 1 đơn vị
    description: String,
    unit: String,           // "lượt", "xe/ngày", "người/ngày"
    chargeType: {
        type: String,
        enum: ["one_time", "per_night", "per_person_per_night"],
        required: true
    }
});

const ServiceModel = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
export default ServiceModel;