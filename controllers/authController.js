import { loginUser, registerUser } from "../services/authService.js";

export const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);

        res.status(201).json({
            message: "Register successful",
            data: user
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

export const login = async (req, res) => {
    try {
        const result = await loginUser(req.body)

        res.status(201).json({
            message: "Login successfully",
            data: result
        })
    } catch (error) {
        message: error.message
    }
}