import HotelModel from "../models/hotelModel.js";
import UserModel from "../models/userModel.js";


const HOTEL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  BLOCKED: "blocked",
};

const ALLOWED_TRANSITIONS = {
  [HOTEL_STATUS.PENDING]: [
    HOTEL_STATUS.APPROVED,
    HOTEL_STATUS.REJECTED,
  ],
  [HOTEL_STATUS.APPROVED]: [
    HOTEL_STATUS.BLOCKED,
  ],
  [HOTEL_STATUS.BLOCKED]: [
    HOTEL_STATUS.APPROVED,
  ],
  [HOTEL_STATUS.REJECTED]: [],
};

export const getHotelsForAdminService = async (query) => {
    const { city, status, page = 1, limit = 10 } = query;

    const filter = {};

    if (city) {
        filter["address.city"] = { $regex: city, $options: "i" };
    }

    // Lọc theo status, nếu không truyền thì lấy tất cả
    if (status) {
        filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
        HotelModel.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 })
            .populate("owner", "name email"), // admin cần biết chủ khách sạn
        HotelModel.countDocuments(filter)
    ]);

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

const canTransition = (from, to) => {
  return ALLOWED_TRANSITIONS[from]?.includes(to);
};

export const approveHotelService = async (hotelId) => {
  const hotel = await HotelModel.findById(hotelId);

  if (!hotel) throw new Error("HOTEL_NOT_FOUND");

  if (!canTransition(hotel.status, "approved")) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  hotel.status = "approved";
  await hotel.save();

  if (hotel.owner) {
    await UserModel.findByIdAndUpdate(
      hotel.owner,
      { $addToSet: { role: "hotel_manager" } }
    );
  }

  return hotel;
};

export const rejectHotelService = async (hotelId) => {
  const hotel = await HotelModel.findById(hotelId);

  if (!hotel) throw new Error("HOTEL_NOT_FOUND");

  if (!canTransition(hotel.status, "rejected")) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  hotel.status = "rejected";
  await hotel.save();

  return hotel;
};

export const blockHotelService = async (hotelId) => {
  const hotel = await HotelModel.findById(hotelId);

  if (!hotel) throw new Error("HOTEL_NOT_FOUND");

  if (!canTransition(hotel.status, "blocked")) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  hotel.status = "blocked";
  await hotel.save();

  return hotel;
};

export const unBlockHotelService = async (hotelId) => {
  const hotel = await HotelModel.findById(hotelId);

  if (!hotel) throw new Error("HOTEL_NOT_FOUND");

  if (!canTransition(hotel.status, "approved")) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  hotel.status = "approved";
  await hotel.save();

  return hotel;
};
