import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../ultils/jwt.js";


export const registerUser = async (data) => {
    const {firstName, lastName, email, password, phone} = data;

    // Check email exists
    const existingUser = await UserModel.findOne({email});
    if(existingUser) {
        throw new Error("Email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await UserModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone
    });

    return {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
    };
}

export const loginUser = async (data) => {
    console.log("0")
    const {email, password} = data;

    // Check email
    const user = await UserModel.findOne({email});
    if(!user) {
        throw new Error("Email not found");
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error("Invalid password");
    }

    // Generate token
    const token = generateToken(user);
    return {
        token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role
        }
    }
}