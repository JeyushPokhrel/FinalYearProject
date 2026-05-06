import dotenv from 'dotenv';
import express from "express";
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// UNLOCK CORS for debugging - Allow all origins
app.use(cors({
    origin: true, 
    credentials: true
}))

connectDB();
    
app.use('/api/auth', authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})  
