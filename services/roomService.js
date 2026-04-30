import HotelModel from "../models/hotelModel.js"
import RoomModel from "../models/roomModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import mongoose from "mongoose";
import { getRoomAvailability } from "./bookingService.js";

export const updateHotelPriceRange = async (hotelId) => {
    const result = await RoomModel.aggregate([
        {
            $match: {
                hotel: hotelId,
            }
        },
        {
            $group: {
                _id: "$hotel",
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
            }
        }
    ]);

    const data = result.length > 0
        ? {
            minPrice: result[0].minPrice,
            maxPrice: result[0].maxPrice
        }
        : {
            minPrice: null,
            maxPrice: null
        };

    await HotelModel.findByIdAndUpdate(hotelId, data);

    return data;
};

export const createRoom = async (userId, data) => {

    const hotel = await HotelModel.findOne({owner: userId});

    if(!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }

    if(hotel.status !== "approved") {
        throw new Error("HOTEL_NOT_APPROVED");
    }

    const room = await RoomModel.create({
        ...data,
        hotel: hotel._id,
        images: []
    });

    await updateHotelPriceRange(hotel._id);

    return room;

}

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "rooms" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export const addRoomImages = async (userId, roomId, files) => {

    const room = await RoomModel.findById(roomId).populate("hotel");

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }

    // check quyền (owner hotel)
    if (room.hotel.owner.toString() !== userId) {
        throw new Error("FORBIDDEN");
    }

    if (!files || files.length === 0) {
        throw new Error("NO_FILES_UPLOADED");
    }

    const uploadPromises = files.map(file =>
        uploadToCloudinary(file.buffer)
    );

    const results = await Promise.all(uploadPromises);

    const newImages = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id
    }));

    room.images.push(...newImages);

    await room.save();

    return room;
};

export const deleteRoomImage = async (userId, roomId, public_id) => {

    const room = await RoomModel.findById(roomId).populate("hotel");

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }

    // check quyền owner hotel
    if (room.hotel.owner.toString() !== userId) {
        throw new Error("FORBIDDEN");
    }

    if (!public_id) {
        throw new Error("PUBLIC_ID_REQUIRED");
    }

    // check ảnh có tồn tại trong room không
    const imageExists = room.images.find(img => img.public_id === public_id);

    if (!imageExists) {
        throw new Error("IMAGE_NOT_FOUND");
    }

    // 1. Xóa trên cloudinary
    await cloudinary.uploader.destroy(public_id);

    // 2. Xóa trong DB
    room.images = room.images.filter(img => img.public_id !== public_id);

    await room.save();

    return room;
};

export const getRoomsByHotel = async (hotelId, checkIn, checkOut) => {

    const rooms = await RoomModel.find({ hotel: hotelId });

    const result = await Promise.all(
        rooms.map(async (room) => {
            const availability = await getRoomAvailability(
                room._id,
                checkIn,
                checkOut
            );

            return {
                _id: room._id,
                name: room.name,
                price: room.price,
                capacity: room.capacity,
                totalQuantity: room.quantity,
                availableQuantity: availability.availableQuantity,
                isAvailable: availability.isAvailable
            };
        })
    );

    return result;
};

export const getRoomById = async (roomId) => {

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new Error("INVALID_ID");
    }

    const room = await RoomModel.findById(roomId);

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }

    return room;
};


export const updateRoom = async (userId, roomId, data) => {

    const room = await RoomModel.findById(roomId).populate("hotel");

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }

    // check quyền owner
    if (room.hotel.owner.toString() !== userId) {
        throw new Error("FORBIDDEN");
    }

    const oldPrice = room.price;

    // 🔥 whitelist field
    const allowedFields = [
        "name",
        "description",
        "price",
        "capacity",
        "quantity",
        "amenities"
    ];

    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            room[field] = data[field];
        }
    });

    await room.save();

    if (data.price !== undefined && data.price !== oldPrice) {
        await updateHotelPriceRange(room.hotel._id);
    }


    return room;
};

export const deleteRoom = async (userId, roomId) => {

    const room = await RoomModel.findById(roomId).populate("hotel");

    if (!room) {
        throw new Error("ROOM_NOT_FOUND");
    }

    // check quyền owner
    if (room.hotel.owner.toString() !== userId) {
        throw new Error("FORBIDDEN");
    }

    if (room.images && room.images.length > 0) {
        const publicIds = room.images.map(img => img.public_id);

        await Promise.all(
            publicIds.map(id => cloudinary.uploader.destroy(id))
        );
    }

    await RoomModel.findByIdAndDelete(roomId);

    await updateHotelPriceRange(room.hotel._id);

    return true;
};