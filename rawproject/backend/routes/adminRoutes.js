import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected admin routes
router.get("/stats", verifyToken, isAdmin, getDashboardStats);

export default router;
