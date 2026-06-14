// src/pages/TrainerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all historical blueprints registered on the server
  const fetchDashboardCatalog = () => {
    setLoading(true);
    axios.get('http://localhost:5001/api/courses')
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error connecting to backend program registries:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardCatalog();
  }, []);

  // Handle clearing user session details and routing to login screen
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of the session?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      sessionStorage.clear();
      navigate('/login');
    }
  };

  // NEW: Handle wiping out an entire course track and all media associations
  const handleDeleteCourseTrack = async (courseId, courseTitle) => {
    const primaryConfirm = window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete "${courseTitle}"?\nThis wipes all video files from Cloudinary storage and drops all matching challenge checks.`);
    if (!primaryConfirm) return;

    const safetyVerification = window.confirm("Final check: This action is irreversible. Proceed?");
    if (!safetyVerification) return;

    try {
      await axios.delete(`http://localhost:5001/api/courses/${courseId}`);
      alert("Success: Entire course timeline and media records purged from system clusters.");
      // Synchronize dashboard catalog array matrix locally
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch (err) {
      alert(`Purge pipeline termination failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* Dashboard Control Header Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trainer Control Hub</h1>
              <p className="text-sm text-gray-500">Design structural program materials, append modules, and audit check exercises.</p>
            </div>
            
            {/* Action Navigation Controls & Session Managers */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <button 
                onClick={() => navigate('/trainer/upload-course')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-150"
              >
                + Upload New Course
              </button>
              
              <button 
                onClick={() => navigate('/trainer/add-chapter')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-150"
              >
                + Add Chapter Module
              </button>

              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg shadow-sm transition-all duration-150"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Historical Program Track Catalogs Row */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900">Historical Programs Grid Directory ({courses.length})</h2>
            
            {loading ? (
              /* Skeleton Loader Workspace Nodes */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((cardId) => (
                  <div key={cardId} className="bg-white border rounded-xl p-5 h-48 animate-pulse flex flex-col justify-between">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                      <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                    </div>
                    <div className="h-8 bg-gray-50 rounded w-full mt-4"></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              /* Empty Array Edge State */
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                <p className="font-medium text-base mb-1">No operational schemas mapped inside the repository tables yet.</p>
                <p className="text-xs">Click your navigation utility buttons above to assemble and mount your first active classroom path.</p>
              </div>
            ) : (
              /* Active Catalog Collection Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div 
                    key={course._id} 
                    className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{course.title}</h3>
                        
                        {/* TRASH DISPOSAL DELETION TRIGGER */}
                        <button 
                          type="button"
                          title="Delete Course Track"
                          onClick={() => handleDeleteCourseTrack(course._id, course.title)}
                          className="text-gray-300 hover:text-red-600 transition-colors duration-150 p-1 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-5">{course.description}</p>
                    </div>
                    
                    {/* Footnote Data Row Metrics */}
                    <div className="border-t border-gray-50 pt-4 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                        {course.chapters?.length || 0} Modules Attached
                      </span>
                      <button 
                        onClick={() => navigate(`/trainer/course/${course._id}`)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Edit Layouts &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default TrainerDashboard;