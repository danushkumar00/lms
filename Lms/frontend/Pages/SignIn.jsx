import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../src/redux/authSlice";
import { InteractiveCard } from "../src/Components/lightswind/interactive-card";

import StudentLayout from "../src/layouts/StudentLayout";

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector((state) => state.auth);
  

  useEffect(() => {
    if (userInfo) {
      navigate(userInfo.role === 'trainer' ? '/trainer-dashboard' : '/student-dashboard', { replace: true });
    }
  }, [userInfo, navigate]);

  return (
    <StudentLayout>
      
       <div className="flex h-screen items-center justify-center">
     
         <InteractiveCard className="p-6">
        <p className="font-stretch-125% font-bold">Sign In</p>
      <form onSubmit={(e) => { e.preventDefault(); dispatch(login({ email: e.target.email.value, password: e.target.password.value })); }}>
        <input name="email" type="email" placeholder="Email" required className="border p-2 w-full" />
        <input name="password" type="password" placeholder="Password" required className="border p-2 w-full mt-2" />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="mt-4 bg-blue-600 text-white w-full py-2">Login</button>
      </form>
    </InteractiveCard>
      
      
    </div>
    </StudentLayout>
      
   
 
   
  );
};
export default SignIn;