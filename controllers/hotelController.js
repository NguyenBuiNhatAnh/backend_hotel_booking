import * as hotelService from "../services/hotelService.js";
import { updateHotelSchema } from "../validator/hotelValidator.js";
import { getTotalRoomsByHotel, getTotalAvailableRoomsByHotel, getTotalBookedRoomsByHotel } from "../services/roomService.js";

export const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;

        const hotel = await hotelService.getHotelById(id);

        return res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllHotels = async (req, res) => {
    try {
        const result = await hotelService.getAllHotel(req.query);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyHotel = async (req, res) => {
    try {
        const userId = req.user.id;

        const hotel = await hotelService.getHotelByUserId(userId);

        return res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

export const registerHotel = async (req, res) => {
    try {
        const hotel = await hotelService.registerHotel(
            req.body,
            req.user.id,
            req.files
        );

        res.status(201).json({
            success: true,
            message: "Hotel created. Waiting for admin approval.",
            data: hotel
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const updateHotel = async (req, res) => {
    try {
        const userId = req.user.id;

        const updatedHotel = await hotelService.updateHotel(userId, req.body);

        return res.status(200).json({
            success: true,
            data: updatedHotel
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// controllers/hotelController.js

export const addHotelImages = async (req, res) => {
    try {
        const userId = req.user.id; // cần auth middleware
        const files = req.files;

        const hotel = await hotelService.addHotelImages(userId, files);

        return res.status(200).json({
            success: true,
            message: "Images added successfully",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

export const deleteHotelImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { public_id } = req.query;

        const hotel = await hotelService.deleteHotelImage(userId, public_id);

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

export const updateHotelAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { city, ward, street } = req.body;

        if (!city) return res.status(400).json({ success: false, message: "city is required" });

        const updated = await hotelService.updateHotelAddress(userId, { city, ward, street });

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        if (error.message === "Invalid city or ward") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getHotelStats = async (req, res) => {
    try {
        const { hotelId } = req.params;

        // Chạy song song cả 3 hàm để tối ưu tốc độ phản hồi
        const [totalRooms, totalAvailable, totalBooked] = await Promise.all([
            getTotalRoomsByHotel(hotelId),
            getTotalAvailableRoomsByHotel(hotelId),
            getTotalBookedRoomsByHotel(hotelId)
        ]);

        // Trả về dữ liệu cho Frontend
        res.status(200).json({
        success: true,
        data: {
            hotelId,
            totalRooms,      // Tổng số phòng khách sạn có
            totalAvailable, // Số phòng hiện đang trống
            totalBooked,    // Số phòng hiện đang có khách
            // Tính % công suất phòng (Occupancy Rate) để Manager xem cho "xịn"
            occupancyRate: totalRooms > 0 ? ((totalBooked / totalRooms) * 100).toFixed(2) + "%" : "0%"
        }
        }); 
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy thống kê khách sạn"
        });
    }
};


