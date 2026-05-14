import express from "express";
import { createReview, getHotelReviews, getHotelReviewsByDate } from "../controllers/reviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createReviewSchema } from "../validator/reviewValidator.js";
import { updateReview } from "../controllers/bookingController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", authMiddleware, authorizeRoles("hotel_manager"), validate(createReviewSchema), createReview);
// GET /reviews/hotel/:hotelId?date=YYYY-MM-DD  or ?from=ISO&to=ISO
reviewRouter.get("/hotel/:hotelId", authMiddleware,getHotelReviews);
// separate route to query by date explicitly
reviewRouter.get("/hotel/:hotelId/by-date", authMiddleware, getHotelReviewsByDate);
reviewRouter.patch("/:reviewId", authMiddleware, updateReview);

export default reviewRouter;
