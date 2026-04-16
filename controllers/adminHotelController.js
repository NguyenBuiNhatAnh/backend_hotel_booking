import HotelModel from "../models/hotelModel.js";
import * as adminHotelService from "../services/adminHotelService.js";

// [GET] /api/admin/hotels
export const getAllHotelsForAdmin = async (req, res) => {
    try {
        const result = await adminHotelService.getHotelsForAdminService(req.query);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching hotel list",
            error: error.message
        });
    }
};

// [PATCH] /api/admin/hotels/:hotelId/approve
export const approveHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.approveHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel approved successfully! User has been granted manager privileges.",
            data: hotel
        });

    } catch (error) {
        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Hotel not found!" });
        }
        if (error.message === "HOTEL_ALREADY_APPROVED") {
            return res.status(409).json({ success: false, message: "This hotel is already approved!" });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// [PATCH] /api/admin/hotels/:hotelId/reject
export const rejectHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.rejectHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel rejected successfully!",
            data: hotel
        });

    } catch (error) {
        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Hotel not found!" });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const blockHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.blockHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel blocked successfully",
            data: hotel
        })
    }
    catch (error) {
        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Hotel not found!" });
        }
        if (error.message === "HOTEL_ALREADY_BLOCKED") {
            return res.status(409).json({ success: false, message: "This hotel is already blocked!" });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

export const unBlockHotel = async (req, res) => {
    try {
        const {hotelId} = req.params;
        const hotel = await adminHotelService.unBlockHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel unblocked successfully",
            data: hotel
        })
    } catch (error) {
        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Hotel not found!" });
        }
        if (error.message === "HOTEL_WAS_NOT_BLOCKED") {
            return res.status(409).json({ success: false, message: "This hotel was not blocked!" });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}