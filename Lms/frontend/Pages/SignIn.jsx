import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../src/redux/authSlice";
import { InteractiveCard } from "../src/Components/lightswind/interactive-card";

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
    <InteractiveCard className="p-6">
      <form onSubmit={(e) => { e.preventDefault(); dispatch(login({ email: e.target.email.value, password: e.target.password.value })); }}>
        <input name="email" type="email" placeholder="Email" required className="border p-2 w-full" />
        <input name="password" type="password" placeholder="Password" required className="border p-2 w-full mt-2" />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="mt-4 bg-blue-600 text-white w-full py-2">Login</button>
      </form>
    </InteractiveCard>
  );
};
export default SignIn;