// src/Components/LogoutButton.jsx

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice'; // Adjust path if needed

const LogoutButton = ({ className = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear Redux state & localStorage
    dispatch(logout()); 
    
    // 2. Boot them back to the sign-in screen
    navigate('/SignIn'); 
  };

  return (
    <button
      onClick={handleLogout}
      // Combines standard functional styles with any custom layout styles you pass in
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-medium rounded-4xl transition-all duration-200 shadow-sm ${className}`}
    >
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;