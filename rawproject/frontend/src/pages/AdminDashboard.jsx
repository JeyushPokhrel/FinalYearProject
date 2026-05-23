import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faUsers, 
    faChartLine, 
    faShieldHalved, 
    faClock, 
    faSearch, 
    faFilter, 
    faEye, 
    faTerminal, 
    faSync, 
    faCheckCircle, 
    faExclamationTriangle,
    faScaleBalanced,
    faDatabase,
    faXmark
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import API_BASE_URL from "../api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        aiStats: {
            total_queries: 0,
            successful: 0,
            failed: 0,
            average_response_time_sec: 0.0,
            average_confidence: 0.0
        }
    });
    const [logs, setLogs] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filtering states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else {
            setLoadingStats(true);
            setLoadingLogs(true);
        }

        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found in localStorage");
            toast.error("You must be logged in as admin");
            setLoadingStats(false);
            setLoadingLogs(false);
            setRefreshing(false);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Stats
        try {
            console.log("Fetching admin stats...");
            const response = await axios.get(`${API_BASE_URL}/admin/stats`, { headers });
            console.log("Stats received:", response.data);
            if (response.data.success) {
                setStats({
                    totalUsers: response.data.totalUsers || 0,
                    activeUsers: response.data.activeUsers || 0,
                    aiStats: response.data.aiStats || {
                        total_queries: 0,
                        successful: 0,
                        failed: 0,
                        average_response_time_sec: 0.0,
                        average_confidence: 0.0
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error.response?.data || error.message);
            toast.error("Failed to load dashboard stats");
        } finally {
            setLoadingStats(false);
        }

        // Fetch Logs
        try {
            console.log("Fetching admin logs...");
            const response = await axios.get(`${API_BASE_URL}/admin/logs`, { headers });
            console.log("Logs received:", response.data);
            if (response.data.success) {
                // Reverse logs to show the most recent queries first
                setLogs(response.data.logs ? [...response.data.logs].reverse() : []);
            }
        } catch (error) {
            console.error("Error fetching logs:", error.response?.data || error.message);
            toast.error("Failed to load query logs");
        } finally {
            setLoadingLogs(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
        toast.success("Dashboard data refreshed!");
    };

    // Calculate dynamic values
    const totalQueries = stats.aiStats?.total_queries || 0;
    const successRate = totalQueries > 0 
        ? ((stats.aiStats?.successful || 0) / totalQueries * 100).toFixed(1)
        : "100.0";
    const avgResponseTime = (stats.aiStats?.average_response_time_sec || 0).toFixed(3);
    const avgConfidence = ((stats.aiStats?.average_confidence || 0) * 100).toFixed(1);

    // Filtered logs
    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            (log.question || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.answer || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
            statusFilter === "all" ||
            (statusFilter === "success" && log.success) ||
            (statusFilter === "failed" && !log.success);
            
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] p-6 md:p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-blue-600 dark:text-[#c2a878]" />
                            Admin Console
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Welcome back, Administrator. Real-time platform state and audit logs.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-[#c2a878] dark:hover:bg-[#b09462] text-white dark:text-[#121212] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                        <FontAwesomeIcon icon={faSync} className={`${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? "Refreshing..." : "Sync Dashboard"}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    
                    {/* Total Users Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">Database</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Registered Users</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : stats.totalUsers}
                        </p>
                    </div>

                    {/* Active Users Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faChartLine} className="text-purple-600 dark:text-purple-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">24 Hours</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : stats.activeUsers}
                        </p>
                    </div>

                    {/* Total AI Queries Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faTerminal} className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">AI Service</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total AI Queries</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : totalQueries}
                        </p>
                    </div>

                    {/* AI Success Rate Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">Stability</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Query Success Rate</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : `${successRate}%`}
                        </p>
                    </div>

                    {/* Avg Response Time Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faClock} className="text-amber-600 dark:text-amber-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">Speed</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Response Time</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : `${avgResponseTime} s`}
                        </p>
                    </div>

                    {/* Avg AI Confidence Card */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] hover:transform hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                <FontAwesomeIcon icon={faScaleBalanced} className="text-teal-600 dark:text-teal-400 text-2xl" />
                            </div>
                            <span className="text-xs font-semibold text-teal-500 bg-teal-500/10 px-2 py-1 rounded-full">Accuracy</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Retrieval Match Accuracy</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {loadingStats ? "..." : `${avgConfidence}%`}
                        </p>
                    </div>

                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    
                    {/* User Growth Chart */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a]">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Base Distribution</h2>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {[20, 35, 50, 65, 80, 90, 100].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-blue-600/20 dark:bg-[#c2a878]/20 hover:bg-blue-600/40 dark:hover:bg-[#c2a878]/40 transition-all rounded-t-lg relative group"
                                        style={{ height: `${height}%` }}
                                    >
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                            {loadingStats ? "..." : Math.ceil(height * (stats.totalUsers / 100))} Users
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a]">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">RAG Service Performance</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Response Stability Rate</span>
                                    <span className="text-blue-600 dark:text-[#c2a878] font-bold">{successRate}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-blue-600 dark:bg-[#c2a878] h-2 rounded-full transition-all duration-500" style={{ width: `${successRate}%` }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">RAG Document Matches Confidence</span>
                                    <span className="text-green-500 font-bold">{avgConfidence}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${avgConfidence}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Server Time Optimization</span>
                                    <span className="text-orange-500 font-bold">
                                        {totalQueries > 0 && stats.aiStats.average_response_time_sec < 0.5 ? "98%" : "89%"}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: totalQueries > 0 && stats.aiStats.average_response_time_sec < 0.5 ? "98%" : "89%" }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Logs Area */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2a2a] p-6 md:p-8">
                    
                    {/* Header of Audit logs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FontAwesomeIcon icon={faTerminal} className="text-blue-600 dark:text-[#c2a878]" />
                                AI Audit Trail & Queries
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Audit log records of legal queries sent by users to FastAPI search pipeline.</p>
                        </div>
                    </div>

                    {/* Filter and Search Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        
                        {/* Search Bar */}
                        <div className="md:col-span-2 relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search queries or answers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#c2a878] transition"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <FontAwesomeIcon icon={faFilter} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#c2a878] transition appearance-none cursor-pointer"
                            >
                                <option value="all">All Query Statuses</option>
                                <option value="success">Success Only</option>
                                <option value="failed">Failures Only</option>
                            </select>
                        </div>

                    </div>

                    {/* Query Log List */}
                    {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <FontAwesomeIcon icon={faSync} className="text-3xl animate-spin text-blue-600 dark:text-[#c2a878] mb-4" />
                            <p>Loading AI logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 dark:border-[#333] rounded-xl">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-gray-400 mb-4" />
                            <p>No queries found matching the criteria.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredLogs.map((log, index) => (
                                <div 
                                    key={index} 
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333] hover:border-blue-500/20 dark:hover:border-[#c2a878]/20 transition-all duration-300 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {/* Status Badge */}
                                            {log.success ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                                                    Failed
                                                </span>
                                            )}

                                            {/* Time badge */}
                                            <span className="text-xs text-gray-400 font-mono">{log.timestamp}</span>
                                            
                                            {/* Speed Badge */}
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                                {log.response_time_sec ? `${log.response_time_sec.toFixed(3)}s` : "0.0s"}
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-[#c2a878] transition">
                                            {log.question || <span className="italic text-gray-400">Empty query</span>}
                                        </h4>
                                        
                                        {/* Snippet of answer */}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                            {log.answer || <span className="italic text-rose-400">No response generated / Error occurred</span>}
                                        </p>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        onClick={() => setSelectedLog(log)}
                                        className="self-start md:self-auto flex items-center gap-1 text-xs px-3.5 py-1.5 border border-gray-200 dark:border-[#444] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-[#c2a878] hover:border-blue-500/30 dark:hover:border-[#c2a878]/30 transition font-medium cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        Audit Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audit Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in transition-all">
                        <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                            
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-[#c2a878]">
                                        <FontAwesomeIcon icon={faTerminal} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Query Audit Log Detail</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{selectedLog.timestamp}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-xl" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                
                                {/* Status info bar */}
                                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333]">
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Status</p>
                                        <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
                                            {selectedLog.success ? (
                                                <span className="text-emerald-600 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faCheckCircle} /> Success
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} /> Failed
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Response Time</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                            {selectedLog.response_time_sec ? `${selectedLog.response_time_sec.toFixed(4)} s` : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Errors</p>
                                        <p className="text-xs font-medium text-gray-900 dark:text-white mt-1 truncate">
                                            {selectedLog.error ? (
                                                <span className="text-rose-500 font-semibold">{selectedLog.error}</span>
                                            ) : (
                                                <span className="text-emerald-600 font-semibold">None</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Question Section */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Question Submitted</h4>
                                    <div className="p-4 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 italic shadow-inner">
                                        "{selectedLog.question}"
                                    </div>
                                </div>

                                {/* Answer Section */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">RAG AI Response Content</h4>
                                    <div className="p-5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2f2f2f] rounded-xl text-sm leading-relaxed text-gray-800 dark:text-gray-100 shadow-inner overflow-x-auto">
                                        {selectedLog.answer ? (
                                            <div className="markdown-content max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {selectedLog.answer}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="italic text-rose-500 font-semibold flex items-center gap-2">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                No answer was generated. AI Service experienced an error or returned a blank response.
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616] flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#444] text-gray-800 dark:text-white font-semibold rounded-xl transition cursor-pointer"
                                >
                                    Close Auditor
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
