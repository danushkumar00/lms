import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../src/redux/authSlice"; 
import { InteractiveCard } from "../src/Components/lightswind/interactive-card";

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserRegistration = async (e) => {
    e.preventDefault();
    // Dispatch the registration action
    const resultAction = await dispatch(register(formData));
    
    // If successful, navigate to login
    if (register.fulfilled.match(resultAction)) {
      alert("Registration successful! Please log in.");
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <InteractiveCard
        InteractiveColor="#4285F4"
        tailwindBgClass="bg-white"
        className="text-center w-full max-w-md"
      >
        <form onSubmit={handleUserRegistration} className="flex flex-col gap-4 p-6">
          <h2 className="text-3xl font-bold text-black">Create Account</h2>
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 py-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <input
            name="name"
            type="text"
            placeholder="Full Name"
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
          
          <select 
            name="role" 
            onChange={handleChange} 
            className="border p-2 rounded w-full bg-white"
          >
            <option value="student">Student</option>
            <option value="trainer">Trainer</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>

          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 underline">Login here</Link>
          </p>
        </form>
      </InteractiveCard>
    </div>
  );
};

export default SignUp;