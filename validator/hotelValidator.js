import Joi from "joi";

export const registerHotelSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    description: Joi.string().allow(""),
    amenities: Joi.array().items(Joi.string()),
    checkInTime: Joi.string().required(),
    checkOutTime: Joi.string().required()
});