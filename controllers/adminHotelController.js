import * as adminHotelService from "../services/adminHotelService.js";

const handleHotelError = (res, error) => {
    const errorMap = {
        HOTEL_NOT_FOUND: {
            status: 404,
            message: "Hotel not found"
        },
        HOTEL_IS_NOT_PENDING: {
            status: 409,
            message: "Hotel must be in pending status"
        },
        HOTEL_ALREADY_BLOCKED: {
            status: 409,
            message: "Hotel is already blocked"
        },
        HOTEL_WAS_NOT_BLOCKED: {
            status: 409,
            message: "Hotel is not blocked"
        }
    };

    const err = errorMap[error.message];

    if (err) {
        return res.status(err.status).json({
            success: false,
            message: err.message
        });
    }

    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

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
            message: "Failed to fetch hotels"
        });
    }
};

export const approveHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.approveHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel approved successfully",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

export const rejectHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.rejectHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel rejected successfully",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

export const blockHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.blockHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel has been blocked",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

export const unBlockHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotel = await adminHotelService.unBlockHotelService(hotelId);

        return res.status(200).json({
            success: true,
            message: "Hotel has been unblocked",
            data: hotel
        });

    } catch (error) {
        return handleHotelError(res, error);
    }
};

