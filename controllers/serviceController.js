import * as serviceService from "../services/serviceService.js";

export const addService = async (req, res) => {
    try {
        const service = await serviceService.addService(req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Service added successfully",
            data: service
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyServices = async (req, res) => {
    try {
        const services = await serviceService.getMyServices(req.user.id);
        return res.status(200).json({ success: true, data: services });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

export const getServicesByHotel = async (req, res) => {
    try {
        const services = await serviceService.getServicesByHotel(req.params.hotelId);
        return res.status(200).json({ success: true, data: services });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

export const updateService = async (req, res) => {
    try {
        const service = await serviceService.updateService(
            req.user.id,
            req.params.id,
            req.body
        );
        return res.status(200).json({ success: true, data: service });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteService = async (req, res) => {
    try {
        await serviceService.deleteService(req.user.id, req.params.id);
        return res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};