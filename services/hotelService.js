import HotelModel from "../models/hotelModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import mongoose from "mongoose";

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

export const getAllHotel = async (query) => {
    const { city, page = 1, limit = 10 } = query;

    const filter = {
        status: "pending" // chỉ lấy hotel đã duyệt
    };

    // filter theo city nếu có
    if (city) {
        filter.city = { $regex: city, $options: "i" }; // không phân biệt hoa thường
    }

    const skip = (page - 1) * limit;

    const hotels = await HotelModel.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

    const total = await HotelModel.countDocuments(filter);

    return {
        hotels,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getHotelById = async (hotelId) => {
    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        throw new Error("Invalid hotelId");
    }

    const hotel = await HotelModel.findOne({
        _id: hotelId,
        status: "aprroved" // chỉ cho public xem hotel đã duyệt
    });

    if (!hotel) {
        throw new Error("Hotel not found");
    }

    return hotel;
};

export const getHotelByUserId = async (userId) => {
    // Check xem có tìm thấy hotel với userID không
    const hotel = await HotelModel.findOne({ owner: userId });

    if(!hotel) {
        throw new Error("Hotel not found for this user");
    }

    return hotel;

}

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

export const updateHotel = async (userId, data) => {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime;

    const hotel = await HotelModel.findOneAndUpdate(
        { owner: userId },
        { $set: updateData }, // 🔥 luôn dùng $set
        { new: true }
    );

    if (!hotel) {
        throw new Error("Hotel not found");
    }

    return hotel;
};