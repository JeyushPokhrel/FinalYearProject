import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";

    if (!isLoggedIn || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
