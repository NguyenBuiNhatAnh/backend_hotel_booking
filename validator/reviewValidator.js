// review.validator.js
import Joi from "joi";

export const createReviewSchema = Joi.object({
    bookingId: Joi.string().required(),
    rating:    Joi.number().integer().min(1).max(5).required(),
    comment:   Joi.string().max(1000).optional().allow("", null)
}).required();

export const updateReviewSchema = Joi.object({
    rating:  Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().max(1000).optional().allow("", null)
}).or("rating", "comment"); // phải có ít nhất 1 trong 2