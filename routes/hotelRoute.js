import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerHotelSchema, updateHotelSchema, updateHotelAddressSchema } from "../validator/hotelValidator.js";
import { addHotelImages, deleteHotelImage, getHotelById, registerHotel, updateHotel, updateHotelAddress, getAllHotels, getMyHotel, getHotelStats } from "../controllers/hotelController.js";
import { upload } from "../middlewares/multerMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
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
    validate(updateHotelSchema),
    updateHotel
)

// PATCH /hotels/me/address - update address (city -> ward -> street)
hotelRouter.patch(
    "/me/address",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(updateHotelAddressSchema),
    updateHotelAddress
);

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

hotelRouter.get(
    "/:hotelId/stats",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    getHotelStats
);

export default hotelRouter




