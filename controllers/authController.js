import * as authService from "../services/authService.js";

export const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            success: true,
            message: "Register successful",
            data: user
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const login = async (req, res) => {
    try {
        const result = await authService.loginUser(req.body)

        res.status(200).json({
            success: true,
            message: "Login successfully",
            data: result
        })
    } catch (error) {
        return res.status(400).json({   // 🔥 thiếu dòng này
            success: false,
            message: error.message
        });
    }
}