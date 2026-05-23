import User from "../models/userModel.js";
import axios from "axios";

const CLEAN_BASE_URL = (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000")
  .replace(/\/$/, "")
  .replace(/\/chat$/, "");

const getDashboardStats = async (req, res) => {
    console.log("Admin stats request received");
    try {
        const totalUsers = await User.countDocuments();
        console.log("Total users counted:", totalUsers);
        
        // Define active users as those who logged in/updated in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({ updatedAt: { $gte: twentyFourHoursAgo } });
        console.log("Active users counted:", activeUsers);

        // Fetch stats from AI Service
        let aiStats = {
            total_queries: 0,
            successful: 0,
            failed: 0,
            average_response_time_sec: 0.0,
            average_confidence: 0.0
        };

        try {
            console.log("Fetching stats from AI Service:", `${CLEAN_BASE_URL}/stats`);
            const aiRes = await axios.get(`${CLEAN_BASE_URL}/stats`, { timeout: 5000 });
            aiStats = aiRes.data;
        } catch (err) {
            console.error("Failed to fetch stats from AI service:", err.message);
        }

        res.status(200).json({
            success: true,
            totalUsers,
            activeUsers,
            aiStats
        });
    } catch (error) {
        console.error("Dashboard stats error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats"
        });
    }
};

const getDashboardLogs = async (req, res) => {
    console.log("Admin logs request received");
    try {
        // Fetch logs from AI Service
        let logs = [];

        try {
            console.log("Fetching logs from AI Service:", `${CLEAN_BASE_URL}/logs`);
            const aiRes = await axios.get(`${CLEAN_BASE_URL}/logs`, { timeout: 5000 });
            logs = aiRes.data;
        } catch (err) {
            console.error("Failed to fetch logs from AI service:", err.message);
        }

        res.status(200).json({
            success: true,
            logs
        });
    } catch (error) {
        console.error("Dashboard logs error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard logs"
        });
    }
};

export { getDashboardStats, getDashboardLogs };
