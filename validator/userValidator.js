// validators/user.validator.js
import Joi from "joi";

export const updateUserSchema = Joi.object({
    firstName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .optional(),

    lastName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .optional(),

    phone: Joi.string()
        .pattern(/^[0-9]{9,11}$/)
        .optional()
})
.min(1); // bắt buộc phải có ít nhất 1 field để update

export const changePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .min(6)
        .required(),

    newPassword: Joi.string()
        .min(6)
        .not(Joi.ref("oldPassword")) // không cho trùng mật khẩu cũ
        .required()
});