import mongoose from "mongoose";
import CityModel from "../models/cityModel.js";

export const getListCitiesService = async () => {
    const cities = await CityModel.find().select('-wards');

    return cities;
}

export const getWardsByCityService = async (cityCodeName) => {
    const city = await CityModel.findOne({ codeName: cityCodeName });
    if (!city) {
        throw new Error("City not found");
    };

    return city.wards;
}
