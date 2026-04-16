import * as hotelService from "../services/hotelService.js";


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

export const getAllHotel = async (req, res) => {
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

export const getHotelByUserId = async (req, res) => {
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