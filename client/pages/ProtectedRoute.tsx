import { Navigate } from "react-router-dom";
import { getRole, getRoleHome, getToken, hasAllowedRole, type UserRole } from "@/lib/auth";

interface Props {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!hasAllowedRole(role, allowedRoles)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
