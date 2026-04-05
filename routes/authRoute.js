import express from 'express'
import { login, register } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { loginSchema, registerSchema } from '../validator/authValidator.js';

const authRouter = express.Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login)

export default authRouter;