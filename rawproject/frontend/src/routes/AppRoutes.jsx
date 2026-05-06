
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import HomePage from "../pages/HomePage"
import ChatbotPage from "../pages/ChatbotPage"
import LawExplorerPage from "../pages/LawExplorer"
import DocumentsPage from "../pages/DocumentPage"  
import AdminDashboard from "../pages/AdminDashboard"
import AdminProtectedRoute from "../components/routes/AdminProtectedRoute"


const AppRoutes = () => {
  const location = useLocation(); // Forces re-render on navigation
  
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const isAdmin = isLoggedIn && user && user.role && user.role.toLowerCase() === "admin";

  console.log("AppRoutes auth state:", { isLoggedIn, role: user?.role, isAdmin, path: location.pathname });


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


