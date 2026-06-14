// src/layouts/StudentLayout.jsx
import React from 'react';

// 1. ⚠️ Make sure you catch the 'children' prop here!
const StudentLayout = ({ children }) => { 
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Your Existing Header */}
      <header className="bg-yellow-300 shadow p-4">
        <h2 className="text-xl font-bold text-black font-stretch-125% text-center">SkillSync</h2>
      </header>

      {/* 2. 🌟 THE FIX: Create a main slot and inject {children} right here */}
      <main className="flex-1 w-full relative">
        {children} 
      </main>

      {/* Your Existing Footer */}
      <footer className="bg-yellow-300 text-black p-4 text-center text-sm">
        © 2026 SkillSync. All rights reserved.
      </footer>

    </div>
  );
};

export default StudentLayout;