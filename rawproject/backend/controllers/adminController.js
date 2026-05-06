import User from "../models/userModel.js";

const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        // Define active users as those who logged in/updated in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({ updatedAt: { $gte: twentyFourHoursAgo } });

        res.status(200).json({
            success: true,
            totalUsers,
            activeUsers
        });
    } catch (error) {
        console.error("Dashboard stats error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats"
        });
    }
};

export { getDashboardStats };
