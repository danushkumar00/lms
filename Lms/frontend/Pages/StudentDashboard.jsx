import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

// Reads the same key that StudentCourseView writes to
const getCompletedChapters = (userId, courseId) => {
  const store = JSON.parse(localStorage.getItem('lms_progress') || '{}');
  return new Set(store[`${userId}:${courseId}`] || []);
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [userId, setUserId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user._id || user.id || null);

    axios.get('http://localhost:5001/api/courses')
      .then(({ data }) => setCourses(data))
      .catch(err => console.error(err));
  }, []);

  const calculateProgress = (course) => {
    if (!userId || !course.chapters?.length) return 0;
    const completed = getCompletedChapters(userId, course._id);
    return Math.round((completed.size / course.chapters.length) * 100);
  };

  return (
    <StudentLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const progress = calculateProgress(course);
            const completedCount = userId
              ? getCompletedChapters(userId, course._id).size
              : 0;
            const totalChapters = course.chapters?.length || 0;

            return (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                <p className="text-gray-600 mb-4 text-sm flex-grow">{course.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-500">
                      {completedCount}/{totalChapters} chapters
                    </span>
                    <span className={progress === 100 ? 'text-green-600' : 'text-blue-600'}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  to={`/course/${course._id}`}
                  className={`block text-center py-2 rounded-lg font-bold transition-colors ${
                    progress === 100
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {progress === 100 ? '✓ Completed' : progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;