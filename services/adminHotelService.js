import HotelModel from "../models/hotelModel.js";
import UserModel from "../models/userModel.js";


// Service to handle hotel approval
export const approveHotelService = async (hotelId) => {
    const hotel = await HotelModel.findById(hotelId);

    if (!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }
    if (hotel.status === "approved") {
        throw new Error("HOTEL_ALREADY_APPROVED");
    }

    // 1. Update hotel status
    hotel.status = "approved";
    await hotel.save();

    // 2. Add 'hotel_manager' role to the User's roles array
    if (hotel.owner) {
        await UserModel.findByIdAndUpdate(
            hotel.owner,
            { $addToSet: { role: "hotel_manager" } },
            { new: true }
        );
    }

    return hotel;
};

// Service to handle hotel rejection
export const rejectHotelService = async (hotelId) => {
    const hotel = await HotelModel.findByIdAndUpdate(
        hotelId,
        { status: "rejected" },
        { new: true }
    );

    if (!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }

    return hotel;
};

// Service to handle blocked hotel
export const blockHotelService = async (hotelId) => {
    const hotel = await HotelModel.findById(hotelId);

    if (!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }

    if (hotel.status === "blocked") {
        throw new Error("HOTEL_ALREADY_BLOCKED")
    }

    // Update hotel status
    hotel.status = "blocked";
    await hotel.save();

    return hotel;
}

export const unBlockHotelService = async (hotelId) => {
    const hotel = await HotelModel.findById(hotelId);

    if(!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }

    if(hotel.status === "blocked") {
        hotel.status = "approved";
        await hotel.save();
    }
    else {
        throw new Error("HOTEL_WAS_NOT_BLOCKED");
    }

    return hotel;
}

// Service to fetch all hotels for Admin (with filters and pagination)
export const getHotelsForAdminService = async (query) => {
    const { status, search, page = 1, limit = 10 } = query;
    const filter = {};

    // 1. Filter by status (e.g., ?status=pending)
    if (status && status !== "all") {
        filter.status = status;
    }

    // 2. Filter by search keyword (name or city)
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // 3. Query the database
    const hotels = await HotelModel.find(filter)
        .populate("owner", "firstName lastName email phone")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

    // 4. Count total documents for pagination calculations
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