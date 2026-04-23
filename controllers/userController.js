// controllers/user.controller.js
import * as userService from "../services/userService.js";

export const updateProfileController = async (req, res) => {
    try {
        // userId lấy từ middleware (token)
        const userId = req.user.id;

        const updatedUser = await userService.updateProfileService(userId, req.body);

        return res.status(200).json({
            message: "Update profile success",
            data: updatedUser
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const changePasswordController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        await userService.changePasswordService(userId, oldPassword, newPassword);

        return res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};