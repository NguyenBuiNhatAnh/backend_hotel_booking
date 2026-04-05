import HotelModel from "../models/hotelModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "hotels" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export const registerHotel = async (data, userId, files) => {

    // Check xem user đã tạo Hotel chưa
    const existingHotel = await HotelModel.findOne({ owner: userId });

    if (existingHotel) {
        if (existingHotel.status === "pending") {
            throw new Error("Your hotel is waiting for approval");
        }

        if (existingHotel.status === "approved") {
            throw new Error("You already have a hotel");
        }

        if (existingHotel.status === "blocked") {
            throw new Error("Your hotel is blocked");
        }

        if (existingHotel.status === "rejected") {
            // Cho tạo lại → xóa hotel cũ hoặc update
            await HotelModel.deleteOne({ _id: existingHotel._id });
        }
    }

    if (existingHotel) {
        throw new Error("You already registered a hotel");
    }

    let imageUrls = [];

    if (files && files.length > 0) {
        const uploadPromises = files.map(file =>
            uploadToCloudinary(file.buffer)
        );

        const results = await Promise.all(uploadPromises);

        imageUrls = results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const newHotel = await HotelModel.create({
        ...data,
        image: imageUrls,
        owner: userId,
        status: "pending"
    });

    return newHotel;
};