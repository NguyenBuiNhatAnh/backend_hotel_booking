import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phone: String,
    
    role: {
        type: String,
        enum: ["admin", "hotel_manager", "customer"],
        default: "customer"
    },

    status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default UserModel;