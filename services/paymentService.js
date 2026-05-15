import crypto from "crypto";
import querystring from "querystring";
import qs from "qs";                    // ✅ thêm
import moment from "moment";
import PaymentModel from "../models/paymentModel.js";
import BookingModel from "../models/bookingModel.js";

const sortObject = (obj) => {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
};

export const createVNPayPaymentService = async (bookingId, userId, ipAddr) => {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");
    if (booking.user.toString() !== userId.toString()) throw new Error("Bạn không có quyền thanh toán booking này");
    if (booking.status !== "pending") throw new Error("Booking không ở trạng thái chờ thanh toán");
    if (booking.paymentStatus === "paid") throw new Error("Booking này đã được thanh toán");
    if (new Date() > new Date(booking.expiredAt)) {
        booking.status = "canceled";
        booking.cancelReason = "Hết thời gian thanh toán";
        booking.canceledBy = "system";
        await booking.save();
        throw new Error("Booking đã hết hạn thanh toán");
    }

    const payment = await PaymentModel.create({
        booking: bookingId,
        amount: booking.totalPrice,
        method: "vnpay",
        status: "pending"
    });

    const date = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: process.env.VNP_TMN_CODE,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: payment._id.toString(),
        vnp_OrderInfo: `Thanh-toan-booking-${bookingId}`,
        vnp_OrderType: "other",
        vnp_Amount: booking.totalPrice * 100,
        vnp_ReturnUrl: process.env.VNP_RETURN_URL,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: date,
    };

    vnp_Params = sortObject(vnp_Params);

    // ✅ encode: false — không encode URL, nhất quán với verify
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    // querystring.stringify vẫn dùng để build URL (encode bình thường)
    const paymentUrl = process.env.VNP_URL + "?" + querystring.stringify(vnp_Params);

    return { paymentUrl };
};

export const handleVNPayCallbackService = async (vnp_Params, io, onlineUsers) => {
    const secureHash = vnp_Params["vnp_SecureHash"];

    const params = { ...vnp_Params };
    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    const sortedParams = sortObject(params);

    // ✅ encode: false — nhất quán với lúc tạo chữ ký
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash !== signed) {
        throw new Error("Chữ ký không hợp lệ");
    }

    const paymentId = vnp_Params["vnp_TxnRef"];
    const payment = await PaymentModel.findById(paymentId).populate("booking");
    if (!payment) throw new Error("Không tìm thấy thông tin thanh toán");

    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionId = vnp_Params["vnp_TransactionNo"];

    payment.vnpayResponse = vnp_Params;
    payment.transactionId = transactionId;

    if (responseCode === "00") {
        payment.status = "success";
        await payment.save();

        const booking = await BookingModel.findById(payment.booking._id).populate("hotel", "owner");
        booking.status = "confirmed";
        booking.paymentStatus = "paid";
        booking.paidAt = new Date();
        await booking.save();

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
        payment.status = "failed";
        await payment.save();
        return { success: false, payment };
    }
};

export const getPaymentByBookingService = async (bookingId, userId) => {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throw new Error("Booking không tồn tại");
    if (booking.user.toString() !== userId.toString()) throw new Error("Bạn không có quyền xem thanh toán này");

    const payment = await PaymentModel.findOne({ booking: bookingId }).sort({ createdAt: -1 });
    return payment;
};