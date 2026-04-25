import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
    addService,
    getMyServices,
    getServicesByHotel,
    updateService,
    deleteService
} from "../controllers/serviceController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { addServiceSchema, updateServiceSchema } from "../validator/serviceValidator.js";

export const serviceRouter = express.Router();

// Public - khách xem dịch vụ của 1 khách sạn
serviceRouter.get("/hotel/:hotelId", getServicesByHotel);

// Hotel manager
serviceRouter.get(
    "/me",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    getMyServices
);

serviceRouter.post(
    "/",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(addServiceSchema),
    addService
);

serviceRouter.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(updateServiceSchema),
    updateService
);

serviceRouter.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    deleteService
);