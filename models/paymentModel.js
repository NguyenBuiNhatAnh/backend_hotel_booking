import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    },

    amount: Number,

    method: {
        type: String,
        enum: ["vnpay"]
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"],  // ← thêm "pending" vào đây
        default: "pending"
    },

    transactionId: String,
    createdAt: Date
});

const PaymentModel = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export default PaymentModel;