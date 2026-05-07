import ServiceModel from "../models/serviceModel.js";
import HotelModel from "../models/hotelModel.js";
import mongoose from "mongoose";

const getHotelByOwner = async (userId) => {
    const hotel = await HotelModel.findOne({ owner: userId });
    if (!hotel) throw new Error("Hotel not found");
    if (hotel.status !== "approved") throw new Error("Hotel is not approved yet");
    return hotel;
};

export const addService = async (userId, data) => {
    const hotel = await getHotelByOwner(userId);

    const service = await ServiceModel.create({
        hotel: hotel._id,
        name: data.name,
        price: data.price,
        description: data.description,
        unit: data.unit,
        chargeType: data.chargeType  // thay hasQuantity bằng chargeType
    });

    return service;
};

export const getServicesByHotel = async (hotelId) => {

    // 🔥 validate ObjectId trước (nên có)
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        throw new Error("INVALID_HOTEL_ID");
    }

    // 🔥 check hotel tồn tại
    const hotel = await HotelModel.findById(hotelId);

    if (!hotel) {
        throw new Error("HOTEL_NOT_FOUND");
    }

    const services = await ServiceModel.find({ hotel: hotelId });

    return services;
};

export const getMyServices = async (userId) => {
    const hotel = await getHotelByOwner(userId);
    const services = await ServiceModel.find({ hotel: hotel._id });
    return services;
};

export const updateService = async (userId, serviceId, data) => {
    const hotel = await getHotelByOwner(userId);

    const service = await ServiceModel.findOne({
        _id: serviceId,
        hotel: hotel._id
    });

    if (!service) throw new Error("Service not found or unauthorized");

    Object.assign(service, data);
    await service.save();

    return service;
};

export const deleteService = async (userId, serviceId) => {
    const hotel = await getHotelByOwner(userId);

    const service = await ServiceModel.findOneAndDelete({
        _id: serviceId,
        hotel: hotel._id
    });

    if (!service) throw new Error("Service not found or unauthorized");

    return service;
};