import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";

    console.log("AdminProtectedRoute check:", { isLoggedIn, role: user.role, isAdmin });

    if (!isLoggedIn || !isAdmin) {
        console.warn("AdminProtectedRoute: Access denied, redirecting to home");
        return <Navigate to="/" replace />;
    }

    return children;
};


export default AdminProtectedRoute;
