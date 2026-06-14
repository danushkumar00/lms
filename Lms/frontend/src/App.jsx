import Layout from './layouts/Layout'
import './App.css'
import AuthLayout from '../src/layouts/authLayout';
import { Route, Routes } from "react-router-dom";
import SignIn from '../Pages/SignIn';
import SignUp from '../Pages/SignUp'; // Imported the SignUp component
import StudentDashboard from '../Pages/StudentDashboard'
import TrainerDashboard from '../Pages/TrainerDashboard';

// Temporary placeholder components for dashboards. 
// You can replace these with your actual page components later!




function App() {
  return (
    <Routes>
      {/* Home Route */}
      <Route path="/" element={
        <Layout></Layout>
      }/>
    <Route element={<AuthLayout />}>
     {/* Authentication Routes */}
      <Route path="/SignIn" element={
        <SignIn/>
      }/>
      
      <Route path="/SignUp" element={
        <SignUp/>
      }/></Route>
     

      {/* Role-Based Dashboard Routes */}
      <Route path="/student-dashboard" element={
        <StudentDashboard/>
      }/>x
      
      <Route path="/trainer-dashboard" element={
        <TrainerDashboard />
      }/>
    </Routes>
  )
};

export default App;