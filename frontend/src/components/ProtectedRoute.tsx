import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    moduleId?: string; // Optional: if string, check specific module. If undefined, just check auth (if we had it here, but auth is usually handled by Layout or separate wrapper)
    // Actually, this component is for Module Permissions specifically.
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ moduleId }) => {
    const userString = localStorage.getItem('user');
    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
        // Fallback to null (redirect to login)
    }

    // If no user, maybe redirect to login? 
    // But Layout usually handles basic auth. 
    // Let's assume this is strictly for PERMISSIONS over fully authenticated sessions.

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const permisos = (user && Array.isArray(user.permisos)) ? user.permisos : [];

    // If moduleId is provided and user has it in their "restricted" list (blacklisted)
    if (moduleId && permisos.includes(moduleId)) {
        // Redirect to home or unauthorized page
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
