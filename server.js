import express from 'express'
import cors from 'cors'
import http from 'http';
import 'dotenv/config';
import connectDatabase from './config/mongodb.js';
import authRouter from './routes/authRoute.js';
import { hotelRouter } from './routes/hotelRoute.js';
import { adminHotelRoute } from './routes/adminHotelRoute.js';
import roomRouter from './routes/roomRoute.js';
import userRouter from './routes/userRoute.js';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(cors());


const API_PREFIX = process.env.API_PREFIX;

// API endpoints
app.use(`${API_PREFIX}/auth`, authRouter)
app.use(`${API_PREFIX}/hotels`, hotelRouter);
app.use(`${API_PREFIX}/admin/hotels`, adminHotelRoute);
app.use(`${API_PREFIX}/rooms`, roomRouter);
app.use(`${API_PREFIX}/users`, userRouter);


app.get('/',(req,res)=>{
    res.send("API Working");
});


// Connect to database
connectDatabase();

server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
