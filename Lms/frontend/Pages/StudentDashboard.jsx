// src/pages/StudentDashboard.jsx (or wherever your dashboards live)
import React from "react";
import StudentLayout from "../src/layouts/StudentLayout"; // Cleaned up the redundant /src/ pathing
import LogoutButton from "../src/Components/LogoutButton";

const StudentDashboard = () => {
  return (
    <StudentLayout>
      {/* 1. We make this wrapper 'relative' so the button can anchor to it.
        2. We move 'min-h-screen' and 'bg-gray-100' to the main parent wrapper 
           so the entire viewport behaves as a single cohesive unit.
      */}
      <div className="relative min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        
        {/* Absolute containment wrapper pins the button to the top right corner */}
        <div className="absolute top-6 right-6 z-50">
          <LogoutButton />
        </div>

        {/* Core Dashboard Content */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Welcome to your Student Dashboard!
          </h1>
          <p className="text-slate-500 text-sm">
            Your full-stack application workspace is ready.
          </p>
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;