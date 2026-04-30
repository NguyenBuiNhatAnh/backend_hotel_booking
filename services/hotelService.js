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
    const {
        city,
        checkInDate,
        checkOutDate,
        guests,
        minPrice,
        maxPrice,
        amenities,
        page = 1,
        limit = 10
    } = query;

    const matchHotel = { status: "approved" };

    // 📍 Lọc địa điểm
    if (city) {
        matchHotel["address.city"] = { $regex: city, $options: "i" };
    }

    // 🏨 Lọc tiện ích
    if (amenities) {
        const amenityList = amenities.split(",").map(a => a.trim());
        matchHotel.amenities = { $all: amenityList };
    }

    // 💰 Lọc giá (dùng trực tiếp hotel.minPrice / maxPrice)
    if (minPrice || maxPrice) {
        const priceConditions = [];

        if (minPrice) {
            priceConditions.push({ maxPrice: { $gte: Number(minPrice) } });
        }

        if (maxPrice) {
            priceConditions.push({ minPrice: { $lte: Number(maxPrice) } });
        }

        matchHotel.$and = priceConditions;
    }

    const hasDateFilter = checkInDate && checkOutDate;
    const checkIn = hasDateFilter ? new Date(checkInDate) : null;
    const checkOut = hasDateFilter ? new Date(checkOutDate) : null;

    // 🔥 Lọc hotel trước → giảm dataset
    const hotels = await HotelModel.find(matchHotel)
        .sort({ createdAt: -1 });

    const result = [];

    for (const hotel of hotels) {

        // 🎯 chỉ filter room theo guests (không filter price nữa)
        const roomQuery = { hotel: hotel._id };

        if (guests) {
            roomQuery.capacity = { $gte: Number(guests) };
        }

        const rooms = await RoomModel.find(roomQuery);

        if (rooms.length === 0) continue;

        if (hasDateFilter) {
            const availableRooms = [];

            for (const room of rooms) {
                const bookedQty = await getBookedQuantity(
                    room._id,
                    checkIn,
                    checkOut
                );

                const availableQty = room.quantity - bookedQty;

                if (availableQty > 0) {
                    availableRooms.push({
                        _id: room._id,
                        name: room.name,
                        price: room.price,
                        capacity: room.capacity,
                        availableQuantity: availableQty
                    });
                }
            }

            if (availableRooms.length === 0) continue;

            result.push({
                ...hotel.toObject(),
                availableRooms
            });

        } else {
            result.push({
                ...hotel.toObject()
            });
        }
    }

    // 📄 Pagination
    const total = result.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = result.slice(skip, skip + Number(limit));

    return {
        hotels: paginated,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

export const getHotelById = async (hotelId) => {
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        throw new Error("Invalid hotelId");
    }

    const hotel = await HotelModel.findOne({
        _id: hotelId,
        status: "approved"
    });

    if (!hotel) {
        throw new Error("Hotel not found");
    }

    return hotel;
};

export const getHotelByUserId = async (userId) => {
    const hotel = await HotelModel.findOne({ owner: userId });

    if (!hotel) {
        throw new Error("Hotel not found for this user");
    }

    return hotel;
};

export const registerHotel = async (data, userId, files) => {
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
            await HotelModel.deleteOne({ _id: existingHotel._id });
        }
    }

    let imageUrls = [];

    if (files && files.length > 0) {
        const results = await Promise.all(
            files.map(file => uploadToCloudinary(file.buffer))
        );
        imageUrls = results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const newHotel = await HotelModel.create({
        ...data,
        // address đã là object { street, ward, city } từ body
        image: imageUrls,
        owner: userId,
        status: "pending"
    });

    return newHotel;
};

export const updateHotel = async (userId, data) => {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime;

    // fix: update từng field của address riêng tránh ghi đè cả object
    if (data.address) {
        if (data.address.street !== undefined) updateData["address.street"] = data.address.street;
        if (data.address.ward !== undefined) updateData["address.ward"] = data.address.ward;
        if (data.address.city !== undefined) updateData["address.city"] = data.address.city;
    }

    const hotel = await HotelModel.findOneAndUpdate(
        { owner: userId },
        { $set: updateData },
        { new: true }
    );

    if (!hotel) {
        throw new Error("Hotel not found");
    }

    return hotel;
};

export const addHotelImages = async (userId, files) => {
    const hotel = await HotelModel.findOne({ owner: userId });

    if (!hotel) throw new Error("HOTEL_NOT_FOUND");
    if (!files || files.length === 0) throw new Error("NO_FILES_UPLOADED");

    const results = await Promise.all(
        files.map(file => uploadToCloudinary(file.buffer))
    );

    const newImages = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id
    }));

    hotel.image.push(...newImages);
    await hotel.save();

    return hotel;
};

export const deleteHotelImage = async (userId, publicId) => {
    const hotel = await HotelModel.findOne({ owner: userId });

    if (!hotel) throw new Error("HOTEL_NOT_FOUND");

    const imageExists = hotel.image.some(img => img.public_id === publicId);
    if (!imageExists) throw new Error("IMAGE_NOT_FOUND");

    await cloudinary.uploader.destroy(publicId);

    hotel.image = hotel.image.filter(img => img.public_id !== publicId);
    await hotel.save();

    return hotel;
};