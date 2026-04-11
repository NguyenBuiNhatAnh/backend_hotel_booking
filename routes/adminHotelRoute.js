import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { approveHotel, getAllHotelsForAdmin, rejectHotel } from "../controllers/adminHotelController.js";

export const adminHotelRoute = express.Router();

adminHotelRoute.get(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    getAllHotelsForAdmin
);

adminHotelRoute.patch(
    "/:hotelId/approve",
    authMiddleware,
    authorizeRoles("admin"),
    approveHotel
)

adminHotelRoute.patch(
    "/:hotelId/reject",
    authMiddleware,
    authorizeRoles("admin"),
    rejectHotel
)