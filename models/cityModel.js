import mongoose from "mongoose";

// 1. Schema cho các Phường/Xã
const WardSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  codeName: { type: String, required: true, index: true},
  provinceCode: { type: String, required: true }
}, { _id: false }); // _id: false không tạo ID riêng cho từng Phường

// 2. Schema cho Tỉnh/Thành phố
const CitySchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
    },
    name: { 
        type: String, 
        required: true 
    },
    fullName: { 
        type: String, 
        required: true 
    },
    codeName: { 
        type: String, 
        required: true,
        index: true
    },
    
    wards: [WardSchema] 
});

const CityModel = mongoose.models.City || mongoose.model('City', CitySchema);
export default CityModel;