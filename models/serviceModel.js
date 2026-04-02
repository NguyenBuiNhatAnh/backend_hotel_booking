import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel"
    },

    name: String, //Breakfast, Spa
    price: Number,
    decscription: String
});

const ServiceModel = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
export default ServiceModel;