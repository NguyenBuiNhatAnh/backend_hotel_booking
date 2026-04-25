import Joi from "joi";

export const addServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().max(500).optional(),
    hasQuantity: Joi.boolean().optional(),
    unit: Joi.string().max(20).optional()
});

export const updateServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    price: Joi.number().min(0).optional(),
    description: Joi.string().max(500).optional(),
    hasQuantity: Joi.boolean().optional(),
    unit: Joi.string().max(20).optional()
}).min(1); // bắt buộc phải có ít nhất 1 field