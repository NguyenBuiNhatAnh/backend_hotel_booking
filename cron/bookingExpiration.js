import cron from "node-cron";
import BookingModel from "../models/bookingModel.js";

cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        const expiredBookings = await BookingModel.find({
            status: "pending",
            paymentStatus: "unpaid",
            expiredAt: { $lte: now }
        });

        for (const booking of expiredBookings) {
            booking.status = "canceled";
            booking.canceledBy = "system";
            booking.cancelReason = "Payment timeout";

            await booking.save();

            console.log(`Booking ${booking._id} expired`);
        }

    } catch (error) {
        console.error("Cron job error:", error);
    }
});