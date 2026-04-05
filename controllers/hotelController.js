import * as hotelService from "../services/hotelService.js";

export const registerHotel = async (req, res) => {
    try {
        const hotel = await hotelService.registerHotel(
            req.body,
            req.user.id,
            req.files
        );

        res.status(201).json({
            message: "Hotel created. Waiting for admin approval.",
            data: hotel
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}