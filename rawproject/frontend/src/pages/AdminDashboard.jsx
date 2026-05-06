import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faChartLine, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import API_BASE_URL from "../api";

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                toast.error("Failed to load dashboard stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-blue-600 dark:text-[#c2a878]" />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Welcome back, Administrator. Here's what's happening today.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Total Users Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Registered Users</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loading ? "..." : stats.totalUsers}
                        </p>
                    </div>

                    {/* Placeholder Card 1 */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faChartLine} className="text-purple-600 dark:text-purple-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">Live</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users (24h)</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loading ? "..." : stats.activeUsers}
                        </p>
                    </div>

                    {/* Placeholder Card 2 */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faShieldHalved} className="text-orange-600 dark:text-orange-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">Secure</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Platform Stability</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">99.9%</p>
                    </div>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* User Growth Chart (Simulated) */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a]">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Growth (Last 7 Days)</h2>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-blue-600/20 dark:bg-[#c2a878]/20 hover:bg-blue-600/40 dark:hover:bg-[#c2a878]/40 transition-all rounded-t-lg relative group"
                                        style={{ height: `${height}%` }}
                                    >
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">
                                            {Math.floor(height * (stats.totalUsers / 100))}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a]">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Platform Engagement</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Retention Rate</span>
                                    <span className="text-blue-600 dark:text-[#c2a878] font-bold">84%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-blue-600 dark:bg-[#c2a878] h-2 rounded-full" style={{ width: '84%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Response Accuracy</span>
                                    <span className="text-green-500 font-bold">92%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Server Load</span>
                                    <span className="text-orange-500 font-bold">12%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333]">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                    U{item}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">New user registered</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">user{item}@example.com • 2 hours ago</p>
                                </div>
                                <span className="text-xs text-blue-600 dark:text-[#c2a878] font-medium">View Profile</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
