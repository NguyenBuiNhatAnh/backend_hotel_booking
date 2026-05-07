import express from "express";
import { changePasswordController, getUsersController, updateProfileController, updateUserStatusController } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { changePasswordSchema, updateUserSchema } from "../validator/userValidator.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const userRouter = express.Router();

// GET danh sách user (customer + hotel_manager)
userRouter.get("/", authMiddleware, authorizeRoles("admin"), getUsersController);

// PATCH khóa / mở khóa user
userRouter.patch("/:id/status", authMiddleware, authorizeRoles("admin"), updateUserStatusController);

userRouter.patch(
    "/profile", 
    authMiddleware, 
    validate(updateUserSchema), 
    updateProfileController
);

userRouter.patch(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    changePasswordController
);

export default userRouter;