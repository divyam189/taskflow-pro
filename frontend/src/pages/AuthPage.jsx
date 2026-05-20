import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const AuthPage = ({ mode }) => {
  const isLogin = mode === "login";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await signup(form);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 ${isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" : "bg-gradient-to-br from-slate-100 via-white to-indigo-100"}`}>
      <form onSubmit={handleSubmit} className={`w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl ${isDark ? "border-slate-700 bg-slate-900/80 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Sign up"} to TaskFlow Pro</h2>
          <button type="button" onClick={toggleTheme} className={`rounded-lg px-2 py-1 text-xs ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
        {!isLogin && <input className={`w-full rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} name="name" placeholder="Name" onChange={onChange} required />}
        <input className={`w-full rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} type="email" name="email" placeholder="Email" onChange={onChange} required />
        <input className={`w-full rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} type="password" name="password" placeholder="Password" onChange={onChange} minLength={6} required />
        {!isLogin && (
          <select className={`w-full rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} name="role" onChange={onChange} value={form.role}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        )}
        <button disabled={submitting} className="w-full rounded-lg bg-indigo-600 p-3 font-semibold hover:bg-indigo-500 disabled:opacity-60">
          {submitting ? "Please wait..." : isLogin ? "Login" : "Create Account"}
        </button>
        <p className={`text-center text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {isLogin ? "New to TaskFlow Pro?" : "Already have an account?"}{" "}
          <Link to={isLogin ? "/signup" : "/login"} className="font-semibold text-indigo-500 hover:text-indigo-400">
            {isLogin ? "Create account" : "Login"}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default AuthPage;
