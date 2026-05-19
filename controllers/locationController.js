import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { getListCitiesService, getWardsByCityService } from '../services/locationService.js';

export const getCities = async (req, res) => {
  try {
    const data = await getListCitiesService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load locations' });
  }
};


export const getWardsByCity = async (req, res) => {
  try {
    const { cityCodeName } = req.params;
    const data = await getWardsByCityService(cityCodeName);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load locations' });
  }
};
