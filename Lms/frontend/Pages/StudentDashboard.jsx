import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { logout } from '../src/redux/authSlice';
import StudentLayout from '../src/layouts/StudentLayout';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('Learner');

  useEffect(() => {
    const runSecurityCheck = async () => {
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        
        if (parsedUser.role !== 'student') {
          navigate('/login', { replace: true });
          return;
        }

        setStudentName(parsedUser.name || 'Learner');

        // Fetch courses only after successful security check
        const { data } = await axios.get('http://localhost:5001/api/courses');
        setCourses(data);
      } catch (e) {
        console.error("Dashboard Load Error:", e);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    runSecurityCheck();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    // Using window.location.href forces a hard reload, clearing all memory
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="p-8 text-center font-bold">Loading SkillSync...</div>;
  }

  return (
    <StudentLayout>
      <div className="p-8">
        {/* SkillSync Header Design */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <h1 className="text-3xl font-black tracking-tight">SkillSync Student Dashboard</h1>
          <p className="text-slate-400 mt-2">Welcome back, {studentName}. Track your progress below.</p>
          <button 
            onClick={handleLogout} 
            className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-sm font-bold transition-all"
          >
            Logout
          </button>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">My Courses</h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white border-2 border-yellow-400 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg text-slate-900">{course.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{course.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">No courses currently available.</p>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;