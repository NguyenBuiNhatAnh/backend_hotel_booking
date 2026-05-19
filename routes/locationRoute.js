import express from "express";
import { getCities, getWardsByCity } from "../controllers/locationController.js";

const router = express.Router();

router.get("/cities", getCities);
router.get("/cities/:cityCodeName/wards", getWardsByCity);

export default router;
