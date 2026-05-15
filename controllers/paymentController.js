// payment.controller.js
import {
    createVNPayPaymentService,
    handleVNPayCallbackService,
    getPaymentByBookingService
} from "../services/paymentService.js";

// Tạo URL thanh toán
export const createPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;
        // ✅ Thay đoạn ipAddr cũ bằng cái này
        const rawIp =
            (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
            req.socket.remoteAddress ||
            "1.1.1.1";

        const ipAddr = rawIp === "::1" || rawIp.startsWith("::ffff:")
            ? rawIp.replace("::ffff:", "") || "1.1.1.1"
            : rawIp;

        console.log("IP gửi lên VNPay:", ipAddr); // log kiểm tra

        const result = await createVNPayPaymentService(bookingId, userId, ipAddr);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// VNPay callback
export const vnpayReturn = async (req, res) => {
    try {

        // ✅ THÊM LOG VÀO ĐÂY
        console.log("=== VNPay Callback ===");
        console.log("Query:", JSON.stringify(req.query, null, 2));
        // ✅ HẾT LOG

        const { io, onlineUsers } = req.app.locals; // truyền io qua app.locals
        const result = await handleVNPayCallbackService(req.query, io, onlineUsers);

        if (result.success) {
            // Redirect về frontend trang thành công
            return res.redirect(`${process.env.CLIENT_URL}/payment/success?bookingId=${result.booking._id}`);
        } else {
            return res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
        }
    } catch (error) {
        res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
    }
};

// Lấy thông tin payment của booking
export const getPaymentByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;
        const payment = await getPaymentByBookingService(bookingId, userId);
        res.json(payment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};