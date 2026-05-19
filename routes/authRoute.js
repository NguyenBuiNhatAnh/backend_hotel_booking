import express from 'express'
import { forgotPassword, login, register, resetPassword } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validator/authValidator.js';

const authRouter = express.Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login)
authRouter.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default authRouter;
