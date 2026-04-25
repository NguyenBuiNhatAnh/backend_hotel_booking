import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    name: String,
    price: Number,
    description: String,        // fix typo: decscription → description
    hasQuantity: {              // true = cho nhập số lượng, false = chỉ chọn có/không
        type: Boolean,
        default: true
    },
    unit: {                     // "người", "đêm", "lượt", "cái"
        type: String,
        default: "lượt"
    }
});

const ServiceModel = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
export default ServiceModel;