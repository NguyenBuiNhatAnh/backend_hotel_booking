import Joi from "joi";

export const createRoomSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),

    description: Joi.string().allow("").optional(),

    price: Joi.number().positive().required(),

    capacity: Joi.number().integer().min(1).required(),

    quantity: Joi.number().integer().min(0).required(),

    amenities: Joi.array().items(Joi.string().trim()).optional()
});

export const updateRoomSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),

    description: Joi.string().allow(""),

    price: Joi.number().positive(),

    capacity: Joi.number().integer().min(1),

    quantity: Joi.number().integer().min(0),

    amenities: Joi.array().items(Joi.string().trim())
}).min(1);