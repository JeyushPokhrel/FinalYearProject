import express from "express";
import { getDashboardStats, getDashboardLogs } from "../controllers/adminController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected admin routes
router.get("/stats", verifyToken, isAdmin, getDashboardStats);
router.get("/logs", verifyToken, isAdmin, getDashboardLogs);

export default router;
