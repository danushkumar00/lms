import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) return <Navigate to="/login" replace />;
  if (allowedRole && userInfo.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;