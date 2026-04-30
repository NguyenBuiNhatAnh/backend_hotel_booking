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