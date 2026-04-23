// services/user.service.js
import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const updateProfileService = async (userId, data) => {
    const { firstName, lastName, phone } = data;

    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
            firstName,
            lastName,
            phone
        },
        {
            new: true,
            runValidators: true
        }
    ).select("-password"); // không trả password

    if (!updatedUser) {
        throw new Error("User not found");
    }

    return updatedUser;
};

export const changePasswordService = async (userId, oldPassword, newPassword) => {
    const user = await UserModel.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error("Old password is incorrect");
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return true;
};