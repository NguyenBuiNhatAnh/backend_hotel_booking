import Joi from "joi";

export const registerHotelSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
        street: Joi.string().required(),
        ward: Joi.string().optional(),
        city: Joi.string().required()
    }).required(),
    description: Joi.string().allow("").optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    checkInTime: Joi.string().required(),
    checkOutTime: Joi.string().required()
});

export const updateHotelSchema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.object({
        street: Joi.string().optional(),
        ward: Joi.string().optional(),
        city: Joi.string().optional()
    }).optional(),
    description: Joi.string().allow("").optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    checkInTime: Joi.string().optional(),
    checkOutTime: Joi.string().optional()
}).min(1);