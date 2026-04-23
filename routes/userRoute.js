import express from "express";
import { changePasswordController, updateProfileController } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { changePasswordSchema, updateUserSchema } from "../validator/userValidator.js";

const userRouter = express.Router();


userRouter.patch(
    "/profile", 
    authMiddleware, 
    validate(updateUserSchema), 
    updateProfileController
);

userRouter.put(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    changePasswordController
);

export default userRouter;