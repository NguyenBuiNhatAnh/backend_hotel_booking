import * as roomService from "../services/roomService.js";

export const createRoom = async (req, res) => {
    try {
        const userId = req.user.id;

        const room = await roomService.createRoom(userId, req.body);

        return res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: room
        });

    } catch (error) {

        if (error.message === "HOTEL_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Hotel not found"
            });
        }

        if (error.message === "HOTEL_NOT_APPROVED") {
            return res.status(409).json({
                success: false,
                message: "Hotel must be approved before adding rooms"
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const addRoomImages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const files = req.files;

        const room = await roomService.addRoomImages(userId, roomId, files);

        return res.status(200).json({
            success: true,
            message: "Room images added successfully",
            data: room
        });

    } catch (error) {

        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });
        }

        if (error.message === "NO_FILES_UPLOADED") {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getRoomsByHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;

        const rooms = await roomService.getRoomsByHotel(hotelId);

        return res.status(200).json({
            success: true,
            data: rooms
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await roomService.getRoomById(roomId);

        return res.status(200).json({
            success: true,
            data: room
        });

    } catch (error) {

        if (error.message === "INVALID_ID") {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteRoomImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const { public_id } = req.query;

        const room = await roomService.deleteRoomImage(
            userId,
            roomId,
            public_id
        );

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
            data: room
        });

    } catch (error) {

        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });
        }

        if (error.message === "PUBLIC_ID_REQUIRED") {
            return res.status(400).json({
                success: false,
                message: "public_id is required"
            });
        }

        if (error.message === "IMAGE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Image not found in this room"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;

        const room = await roomService.updateRoom(userId, roomId, req.body);

        return res.status(200).json({
            success: true,
            message: "Room updated successfully",
            data: room
        });

    } catch (error) {

        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this room"
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;

        await roomService.deleteRoom(userId, roomId);

        return res.status(200).json({
            success: true,
            message: "Room deleted successfully"
        });

    } catch (error) {

        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        if (error.message === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this room"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};