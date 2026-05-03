// payment.service.js
import crypto from "crypto";
import querystring from "querystring";
import moment from "moment";
import PaymentModel from "../models/paymentModel.js";
import BookingModel from "../models/bookingModel.js";

// ============================================================
// Helper: Sắp xếp object theo alphabet (VNPay yêu cầu)
// ============================================================
const sortObject = (obj) => {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
};

// ============================================================
// Tạo VNPay URL + Payment record
// ============================================================
export const createVNPayPaymentService = async (bookingId, userId, ipAddr) => {
    // 1. Kiểm tra booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.user.toString() !== userId.toString()) {
        throw new Error("Bạn không có quyền thanh toán booking này");
    }

    if (booking.status !== "pending") {
        throw new Error("Booking không ở trạng thái chờ thanh toán");
    }

    if (booking.paymentStatus === "paid") {
        throw new Error("Booking này đã được thanh toán");
    }

    // Kiểm tra booking có hết hạn chưa
    if (new Date() > new Date(booking.expiredAt)) {
        booking.status = "canceled";
        booking.cancelReason = "Hết thời gian thanh toán";
        booking.canceledBy = "system";
        await booking.save();
        throw new Error("Booking đã hết hạn thanh toán");
    }

    // 2. Tạo Payment record với status pending
    const payment = await PaymentModel.create({
        booking: bookingId,
        amount: booking.totalPrice,
        method: "vnpay",
        status: "pending"
    });

    // 3. Tạo VNPay URL
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: payment._id.toString(),   // dùng paymentId để tra cứu sau
        vnp_OrderInfo: `Thanh-toan-booking-${bookingId}`,
        vnp_OrderType: "other",
        vnp_Amount: booking.totalPrice * 100,  // VNPay nhân 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: date,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params);

    return { paymentUrl };
};

// ============================================================
// Xử lý callback từ VNPay (return URL)
// ============================================================
export const handleVNPayCallbackService = async (vnp_Params, io, onlineUsers) => {
    // 1. Verify chữ ký
    const secureHash = vnp_Params["vnp_SecureHash"];
    const params = Object.keys(vnp_Params)
        .filter(key => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
        .sort()
        .reduce((result, key) => {
            result[key] = vnp_Params[key];
            return result;
        }, {});

    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    const sortedParams = sortObject(params);
    const signData = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join("&");
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
        throw new Error("Chữ ký không hợp lệ");
    }

    // 2. Tìm Payment theo vnp_TxnRef (chính là paymentId)
    const paymentId = vnp_Params["vnp_TxnRef"];
    const payment = await PaymentModel.findById(paymentId).populate("booking");
    if (!payment) throw new Error("Không tìm thấy thông tin thanh toán");

    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionId = vnp_Params["vnp_TransactionNo"];

    // 3. Lưu raw response để debug
    payment.vnpayResponse = vnp_Params;
    payment.transactionId = transactionId;

    if (responseCode === "00") {
        // ✅ Thanh toán thành công
        payment.status = "success";
        await payment.save();

        const booking = await BookingModel.findById(payment.booking._id).populate("hotel", "owner");
        booking.status = "confirmed";
        booking.paymentStatus = "paid";
        booking.paidAt = new Date();
        await booking.save();

        // 4. Socket notify chủ KS nếu đang online
        if (io && onlineUsers) {
            const ownerId = booking.hotel.owner.toString();
            const socketId = onlineUsers.get(ownerId);
            if (socketId) {
                io.to(socketId).emit("new_booking", {
                    bookingId: booking._id,
                    message: `Có đơn đặt phòng mới vừa thanh toán thành công`,
                    totalPrice: booking.totalPrice,
                    checkInDate: booking.checkInDate,
                    checkOutDate: booking.checkOutDate,
                });
            }
        }

        return { success: true, booking, payment };

    } else {
        // ❌ Thanh toán thất bại
        payment.status = "failed";
        await payment.save();

        return { success: false, payment };
    }
};

// ============================================================
// Lấy lịch sử thanh toán theo bookingId
// ============================================================
export const getPaymentByBookingService = async (bookingId, userId) => {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");

    if (booking.user.toString() !== userId.toString()) {
        throw new Error("Bạn không có quyền xem thanh toán này");
    }

    const payment = await PaymentModel.findOne({ booking: bookingId })
        .sort({ createdAt: -1 });

    return payment;
};