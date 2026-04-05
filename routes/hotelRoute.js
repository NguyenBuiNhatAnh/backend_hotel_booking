import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerHotelSchema } from "../validator/hotelValidator.js";
import { registerHotel } from "../controllers/hotelController.js";
import { upload } from "../middlewares/multerMiddleware.js";

export const hotelRouter = express.Router();

hotelRouter.post(
    "/",
    authMiddleware,
    upload.array("images", 5),   // multer trước
    validate(registerHotelSchema), // validate sau
    registerHotel
);