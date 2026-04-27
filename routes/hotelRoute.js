import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerHotelSchema } from "../validator/hotelValidator.js";
import { addHotelImages, deleteHotelImage, getHotelById, registerHotel, updateHotel } from "../controllers/hotelController.js";
import { upload } from "../middlewares/multerMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { getAllHotels, getMyHotel } from "../controllers/hotelController.js";

export const hotelRouter = express.Router();

hotelRouter.get("/", getAllHotels);

hotelRouter.get(
    "/me",
    authMiddleware,
    getMyHotel
)

hotelRouter.get("/:id", getHotelById);

hotelRouter.post(
    "/",
    authMiddleware,
    upload.array("images", 5),   // multer trước
    validate(registerHotelSchema), // validate sau
    registerHotel
);

hotelRouter.patch(
    "/",
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






