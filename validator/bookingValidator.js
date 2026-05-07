import Joi from "joi";

export const createBookingSchema = Joi.object({
    rooms: Joi.array().items(
        Joi.object({
            roomId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),

    checkInDate: Joi.date().greater("now").required(),
    checkOutDate: Joi.date().greater(Joi.ref("checkInDate")).required(),

    guests: Joi.number().integer().min(1).required(),

    services: Joi.array().items(
        Joi.object({
            serviceId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).optional(),      // one_time, per_night
            numberOfDays: Joi.number().integer().min(1).optional()   // per_person_per_night
        })
    ).optional()
}).required();

export const createManagerBookingSchema = Joi.object({
    userId: Joi.string().optional().allow(null),

    guestInfo: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().optional().allow(null, ""),
        phone: Joi.string().optional().allow(null, "")
    }).when("userId", {
        is: Joi.valid(null, ""),
        then: Joi.required(),
        otherwise: Joi.optional()
    }),

    rooms: Joi.array().items(
        Joi.object({
            roomId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),

    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().greater(Joi.ref("checkInDate")).required(),

    guests: Joi.number().integer().min(1).required(),

    services: Joi.array().items(
        Joi.object({
            serviceId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).optional(),
            numberOfDays: Joi.number().integer().min(1).optional()
        })
    ).optional().default([]),

    paymentMethod: Joi.string()
        .valid("cash", "card", "transfer")
        .optional()
        .default("cash"),

    isPaid: Joi.boolean().optional().default(false)
}).required();