import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerHotelSchema } from "../validator/hotelValidator.js";
import { addHotelImages, deleteHotelImage, getHotelByUserId, registerHotel, updateHotel } from "../controllers/hotelController.js";
import { upload } from "../middlewares/multerMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { getAllHotel } from "../controllers/hotelController.js";
import { getHotelById } from "../controllers/hotelController.js";

export const hotelRouter = express.Router();

hotelRouter.get("/", authMiddleware,getAllHotel);

hotelRouter.get(
    "/me",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    getHotelByUserId
)

hotelRouter.get("/:id", authMiddleware,getHotelById);

hotelRouter.post(
    "/",
    authMiddleware,
    upload.array("images", 5),   // multer trước
    validate(registerHotelSchema), // validate sau
    registerHotel
);

hotelRouter.patch(
    "/me",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    updateHotel
)

hotelRouter.patch(
    "/me/images",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    upload.array("images", 10), // multer
    addHotelImages
);

hotelRouter.delete(
    "/me/images",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    deleteHotelImage
);






