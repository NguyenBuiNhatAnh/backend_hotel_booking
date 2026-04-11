import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import UserModel from "./models/userModel.js";
import "dotenv/config";

const MONGO_URI = `${process.env.MONGODB_URL}/hotel_booking`;

async function createAdmin() {
    try {
        // 🔌 connect DB
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // 🔍 check tồn tại
        const existing = await UserModel.findOne({ email: "admin@gmail.com" });
        if (existing) {
            console.log("Admin đã tồn tại");
            return process.exit(0);
        }

        // 🔐 hash password
        const hashedPassword = await bcrypt.hash("123456", 10);

        // 👤 tạo admin
        const admin = new UserModel({
            firstName: "Admin",
            lastName: "System",
            email: "admin@gmail.com",
            password: hashedPassword,
            role: ["admin"],
            status: "active"
        });

        await admin.save();

        console.log("✅ Tạo admin thành công");
        process.exit(0);

    } catch (error) {
        console.error("❌ Lỗi khi tạo admin:");
        console.error(error.message);
        // nếu muốn debug sâu hơn:
        // console.error(error);

        process.exit(1);

    } finally {
        // 🧹 đóng connection (tránh treo process)
        await mongoose.connection.close();
    }
}

createAdmin();