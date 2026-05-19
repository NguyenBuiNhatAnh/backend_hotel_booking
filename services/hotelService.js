import HotelModel from "../models/hotelModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import mongoose from "mongoose";
import RoomModel from "../models/roomModel.js";
import { getBookedQuantity } from "./bookingService.js";

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

const removeDiacritics = (str) => {
    return str
        .normalize("NFD")                         // tách ký tự + dấu
        .replace(/[\u0300-\u036f]/g, "")          // xóa dấu
        .replace(/đ/g, "d").replace(/Đ/g, "D")   // xử lý đặc biệt chữ đ
        .toLowerCase()
        .trim();
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
        rating,
        page = 1,
        limit = 12
    } = query;

    // ─── 1. BUILD HOTEL FILTER ───────────────────────────────────────
    const matchHotel = { status: "approved" };

    if (city) {
        const normalized = removeDiacritics(city); // normalize input người dùng
        matchHotel["address.normalizedCity"] = {
            $regex: normalized,
            $options: "i"   // vẫn giữ để an toàn
        };
    }

    if (amenities) {
        const amenityList = amenities.split(",").map((a) =>
            new RegExp(`^${a.trim()}$`, "i")
        );
        matchHotel.amenities = { $all: amenityList };
    }

    // ✅ Lọc theo số sao (avgRating >= rating)
    if (rating) {
        matchHotel.avgRating = { $gte: Number(rating) };
    }

    // Overlap: hotel.maxPrice >= userMin  &&  hotel.minPrice <= userMax
    // Chỉ filter nếu hotel đã có giá (không null)
    if (minPrice || maxPrice) {
        const priceConditions = [
            { minPrice: { $ne: null } },
            { maxPrice: { $ne: null } }
        ];

        if (minPrice) {
            priceConditions.push({ maxPrice: { $gte: Number(minPrice) } });
        }

        if (maxPrice) {
            priceConditions.push({ minPrice: { $lte: Number(maxPrice) } });
        }

        matchHotel.$and = priceConditions;
    }

    // ─── 2. QUERY HOTELS ─────────────────────────────────────────────
    const hotels = await HotelModel.find(matchHotel)
        .sort({ createdAt: -1 })
        .lean();

    if (hotels.length === 0) {
        return {
            hotels: [],
            pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 }
        };
    }

    // ─── 3. QUERY ROOMS (1 lần, tránh N+1) ───────────────────────────
    const hotelIds = hotels.map((h) => h._id);

    const roomQuery = { hotel: { $in: hotelIds } };
    if (guests) roomQuery.capacity = { $gte: Number(guests) };

    const allRooms = await RoomModel.find(roomQuery).lean();

    // Group rooms theo hotelId
    const roomsByHotel = {};
    for (const room of allRooms) {
        const key = room.hotel.toString();
        if (!roomsByHotel[key]) roomsByHotel[key] = [];
        roomsByHotel[key].push(room);
    }

    // ─── 4. CHECK AVAILABILITY ────────────────────────────────────────
    const hasDateFilter = checkInDate && checkOutDate;
    const checkIn = hasDateFilter ? new Date(checkInDate) : null;
    const checkOut = hasDateFilter ? new Date(checkOutDate) : null;

    const result = [];

    for (const hotel of hotels) {
        const rooms = roomsByHotel[hotel._id.toString()] || [];

        if (rooms.length === 0) continue;

        if (hasDateFilter) {
            // Kiểm tra availability song song (Promise.all)
            const availability = await Promise.all(
                rooms.map(async (room) => {
                    const bookedQty = await getBookedQuantity(room._id, checkIn, checkOut);
                    const availableQty = room.quantity - bookedQty;
                    return { room, availableQty };
                })
            );

            const availableRooms = availability
                .filter(({ availableQty }) => availableQty > 0)
                .map(({ room, availableQty }) => ({
                    _id: room._id,
                    name: room.name,
                    price: room.price,
                    capacity: room.capacity,
                    availableQuantity: availableQty
                }));

            if (availableRooms.length === 0) continue;

            result.push({ ...hotel, availableRooms });
        } else {
            result.push(hotel);
        }
    }

    // ─── 5. PAGINATION ────────────────────────────────────────────────
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
        amenities: data.amenities?.map(a => a.trim().toLowerCase()) ?? [],
        image: imageUrls,
        owner: userId,
        status: "pending",
        "address.normalizedCity": data.address?.city ? removeDiacritics(data.address.city) : ""
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
        if (data.address.city !== undefined) {
            updateData["address.city"] = data.address.city;
            // ✅ Thêm dòng này — city thay đổi thì normalizedCity phải đổi theo
            updateData["address.normalizedCity"] = removeDiacritics(data.address.city);
        }

    }

    if (data.amenities !== undefined) {
        updateData.amenities = data.amenities.map(a => a.trim().toLowerCase());
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

    return {
        name: hotel.name,
        description: hotel.description,
        images: hotel.image
    };
};

export const deleteHotelImage = async (userId, publicId) => {
    const hotel = await HotelModel.findOne({ owner: userId });

    if (!hotel) throw new Error("HOTEL_NOT_FOUND");

    const imageExists = hotel.image.some(img => img.public_id === publicId);
    if (!imageExists) throw new Error("IMAGE_NOT_FOUND");

    await cloudinary.uploader.destroy(publicId);

    hotel.image = hotel.image.filter(img => img.public_id !== publicId);
    await hotel.save();

    return {
        name: hotel.name,
        description: hotel.description,
        images: hotel.image
    };;
};