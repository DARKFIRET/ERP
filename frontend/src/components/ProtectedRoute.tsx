import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

interface ProtectedRouteProps {
    roles?: string[];
}

const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
    const { token, role } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Manager has access to everything by default, or specific roles.
    // If roles are provided, check if user role is in the list or is manager.
    // Assuming 'manager' is a super-role or explicit role.
    // Waiter -> /waiter only
    // Admin -> /admin only
    // Cook -> /kitchen only
    // Manager -> /management, /admin, /waiter, /kitchen (everything)

    if (roles && !roles.includes(role!) && role !== 'manager') {
         // Redirect to their default page if unauthorized for this route
         switch (role) {
            case 'admin': return <Navigate to="/admin" replace />;
            case 'waiter': return <Navigate to="/waiter" replace />;
            case 'cook': return <Navigate to="/kitchen" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
