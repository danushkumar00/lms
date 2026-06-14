
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your existing components
import SignIn from '../Pages/SignIn'; 
import StudentDashboard from '../Pages/StudentDashboard';
import TrainerDashboard from '../Pages/TrainerDashboard';
import SignUp from '../Pages/SignUp';


import UploadCourse from '../Pages/UploadCourse';
import AddChapter from '../Pages/AddChapter';
import CourseDetails from '../Pages/CourseDetails';
import AuthLayout from "./layouts/authLayout"

function App() {
  return (
  
      <Routes>
        {/* Your Existing Routes */}
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* 🌟 Hook Up Your New Course Management Pages */}
        <Route path="/trainer/upload-course" element={<UploadCourse />} />
        <Route path="/trainer/add-chapter" element={<AddChapter />} />
        <Route path="/trainer/course/:id" element={<CourseDetails />} />
        
      </Routes>
    
  );
}

export default App;