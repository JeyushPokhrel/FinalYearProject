import dotenv from 'dotenv';
import express from "express";
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from "./routes/chatRoutes.js";

// Production Config v1.0.2 - Enhanced CORS
dotenv.config();

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://finalyearproject-legal-ai-frontend.onrender.com",
  "https://finalyearproject-legal-ai-frontend.onrender.com/"
];

app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
}))

connectDB();
    
app.use('/api/auth', authRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})  
