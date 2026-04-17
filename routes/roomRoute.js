import express from "express";
import { addRoomImages, createRoom, deleteRoom, deleteRoomImage, getRoomById, getRoomsByHotel, updateRoom } from "../controllers/roomController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createRoomSchema, updateRoomSchema } from "../validator/roomValidator.js";
import { upload } from "../middlewares/multerMiddleware.js";

const roomRouter = express.Router();

roomRouter.get(
    "/hotel/:hotelId",
    getRoomsByHotel
);

roomRouter.patch(
    "/:roomId/images",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    upload.array("images", 10),
    addRoomImages
);

roomRouter.delete(
    "/:roomId/images",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    deleteRoomImage
);

roomRouter.get(
    "/:roomId",
    getRoomById
);

roomRouter.patch(
    "/:roomId",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(updateRoomSchema),
    updateRoom
);

roomRouter.delete(
    "/:roomId",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    deleteRoom
);

roomRouter.post(
    "/",
    authMiddleware,
    authorizeRoles("hotel_manager"),
    validate(createRoomSchema),
    createRoom
);

export default roomRouter;