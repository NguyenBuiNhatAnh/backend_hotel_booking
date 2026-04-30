import Joi from "joi";

export const addServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().max(500).optional(),
    unit: Joi.string().max(20).optional(),
    chargeType: Joi.string()
        .valid("one_time", "per_night", "per_person_per_night")
        .required()
});

export const updateServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    price: Joi.number().min(0).optional(),
    description: Joi.string().max(500).optional(),
    unit: Joi.string().max(20).optional(),
    chargeType: Joi.string()
        .valid("one_time", "per_night", "per_person_per_night")
        .optional()
}).min(1);