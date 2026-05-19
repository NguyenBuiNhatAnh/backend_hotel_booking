import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../ultils/jwt.js";
import { sendResetPasswordOtpEmail } from "../ultils/email.js";

const OTP_EXPIRES_IN_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


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
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role
        }
    }
}

export const forgotPassword = async ({ email }) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new Error("Email not found");
    }

    const now = Date.now();
    if (
        user.resetPasswordOtpLastSentAt &&
        now - user.resetPasswordOtpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
        const remainingSeconds = Math.ceil(
            (OTP_RESEND_COOLDOWN_MS - (now - user.resetPasswordOtpLastSentAt.getTime())) / 1000
        );
        throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP`);
    }

    const otp = generateOtp();

    user.resetPasswordOtp = hashOtp(otp);
    user.resetPasswordOtpExpires = new Date(now + OTP_EXPIRES_IN_MS);
    user.resetPasswordOtpLastSentAt = new Date(now);
    await user.save();

    await sendResetPasswordOtpEmail(user.email, otp);

    return {
        email: user.email,
        expiresInMinutes: 5,
        resendAfterSeconds: 60
    };
};

export const resetPassword = async ({ email, otp, password }) => {
    const user = await UserModel.findOne({
        email,
        resetPasswordOtp: hashOtp(otp),
        resetPasswordOtpExpires: { $gt: new Date() }
    });

    if (!user) {
        throw new Error("OTP is invalid or expired");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpLastSentAt = undefined;
    await user.save();

    return {
        id: user._id,
        email: user.email
    };
};
