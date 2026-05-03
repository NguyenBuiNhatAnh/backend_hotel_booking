import express from "express";
import { createPayment, vnpayReturn, getPaymentByBooking } from "../controllers/paymentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/create", authMiddleware, createPayment);
paymentRouter.get("/vnpay-return", vnpayReturn);
paymentRouter.get("/booking/:bookingId", authMiddleware, getPaymentByBooking);

export default paymentRouter;