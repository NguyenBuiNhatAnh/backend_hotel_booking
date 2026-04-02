import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    },

    amount: Number,

    method: {
        type: String,
        enum: ["vnpay", "momo", "cod"]
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"]
    },

    transactionId: String,
    createdAt: Date
});

const PaymentModel = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export default PaymentModel;