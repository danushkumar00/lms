import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../src/layouts/StudentLayout';

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/courses')
      .then(({ data }) => setCourses(data))
      .catch(err => console.error(err));
  }, []);

  // Helper to calculate progress
  const calculateProgress = (course) => {
    const completed = course.chapters.filter(ch => ch.isCompleted).length;
    return Math.round((completed / course.chapters.length) * 100);
  };

  return (
    <StudentLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Learning Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const progress = calculateProgress(course);
            return (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                <p className="text-gray-600 mb-4 text-sm flex-grow">{course.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link 
                  to={`/course/${course._id}`}
                  className="block text-center bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800"
                >
                  Continue Learning
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