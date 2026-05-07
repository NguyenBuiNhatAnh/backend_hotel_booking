import express from "express";
import { createReview, getHotelReviews } from "../controllers/reviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createReviewSchema } from "../validator/reviewValidator.js";
import { updateReview } from "../controllers/bookingController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", authMiddleware, authorizeRoles("hotel_manager"), validate(createReviewSchema), createReview);
reviewRouter.get("/hotel/:hotelId", getHotelReviews);
reviewRouter.patch("/:reviewId", authMiddleware, updateReview);

export default reviewRouter;