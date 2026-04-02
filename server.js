import express from 'express'
import cors from 'cors'
import http from 'http';
import 'dotenv/config'
import connectDatabase from './config/mongodb.js';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;




app.get('/',(req,res)=>{
    res.send("API Working");
});


// Connect to database
connectDatabase();

server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
