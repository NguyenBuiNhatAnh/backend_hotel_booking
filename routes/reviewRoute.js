import express from "express";
import { createReview, getHotelReviews, getReviewByBooking, updateReview } from "../controllers/reviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createReviewSchema } from "../validator/reviewValidator.js";

const reviewRouter = express.Router();

reviewRouter.post("/", authMiddleware, authorizeRoles("customer"), validate(createReviewSchema), createReview);
reviewRouter.get("/hotel/:hotelId", getHotelReviews);
reviewRouter.patch("/:reviewId", authMiddleware, updateReview);
reviewRouter.get(
    "/booking/:bookingId",
    authMiddleware,
    authorizeRoles("customer"),
    getReviewByBooking
);

export default reviewRouter;