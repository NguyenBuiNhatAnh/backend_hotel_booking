// controllers/user.controller.js
import * as userService from "../services/userService.js";

export const getUsersController = async (req, res) => {
    try {
        const users = await userService.getUsers();

        return res.status(200).json({
            message: "Get users successfully",
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const updateUserStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "blocked"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const user = await userService.updateUserStatus(id, status);

        return res.status(200).json({
            message: "Update status successfully",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const updateProfileController = async (req, res) => {
    try {
        // userId lấy từ middleware (token)
        const userId = req.user.id;

        const updatedUser = await userService.updateProfileService(userId, req.body);

        return res.status(200).json({
            success: true,
            message: "Update profile success",
            data: updatedUser
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
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
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};