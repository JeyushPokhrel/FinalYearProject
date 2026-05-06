
import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "../pages/HomePage"
import ChatbotPage from "../pages/ChatbotPage"
import LawExplorerPage from "../pages/LawExplorer"
import DocumentsPage from "../pages/DocumentPage"  
import AdminDashboard from "../pages/AdminDashboard"
import AdminProtectedRoute from "../components/routes/AdminProtectedRoute"


const AppRoutes = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = localStorage.getItem("isLoggedIn") === "true" && user.role === "admin";

  return (
    <div>
      <Routes>
        <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/law-explorer" element={<LawExplorerPage/>} />
        <Route path="/lawexplorer" element={<LawExplorerPage/>} /> {/* Alias for convenience */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route path="*" element={<HomePage />} /> {/* Catch-all redirect to home */}

      </Routes>
    </div>
  )
}

export default AppRoutes


