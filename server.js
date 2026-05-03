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
import { serviceRouter } from './routes/serviceRoute.js';
import bookingRouter from './routes/bookingRoute.js';
import paymentRouter from './routes/paymentRoute.js';

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
app.use(`${API_PREFIX}/services`, serviceRouter);
app.use(`${API_PREFIX}/bookings`, bookingRouter);
app.use(`${API_PREFIX}/payments`, paymentRouter);


app.get('/',(req,res)=>{
    res.send("API Working");
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }

  // Các lỗi khác
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});


// Connect to database
connectDatabase();

server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));

