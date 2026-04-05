import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const { login, signup, user, loading: authLoading } = useAuth();
  
  // 'login' or 'signup'
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/problemset");
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (actionType === "login") {
        await login(form.email, form.password);
      } else {
        await signup(form.username, form.email, form.password);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError("");
    setForm((prev) => ({ ...prev, password: "" })); // Clear password on switch
  };

  if (authLoading || user) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- REUSABLE FORM JSX ---
  // Stored as variables instead of internal components to prevent input focus loss on re-render

  const loginFormContent = (
    <form onSubmit={(e) => handleSubmit(e, "login")} className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Welcome back</h2>
        <p className="text-sm text-slate-500">Enter your credentials to access your account.</p>
      </div>
      
      {error && mode === "login" && (
        <div className="mb-6 p-3 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm text-center transition-all">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100/50"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-medium text-slate-700">Password</label>
            <a href="#" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors" onClick={(e) => e.preventDefault()}>Forgot?</a>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-800 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 shadow-md shadow-slate-900/10"
      >
        {isSubmitting && mode === "login" ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : "Sign In"}
      </button>
    </form>
  );

  const signupFormContent = (
    <form onSubmit={(e) => handleSubmit(e, "signup")} className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Create account</h2>
        <p className="text-sm text-slate-500">Join Algorhythm and start coding today.</p>
      </div>

      {error && mode === "signup" && (
        <div className="mb-6 p-3 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm text-center transition-all">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Username</label>
          <input
            type="text"
            required
            placeholder="coder123"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100/50"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100/50"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-800 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 shadow-md shadow-slate-900/10"
      >
        {isSubmitting && mode === "signup" ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : "Create Account"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f5f7] p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* ========================================================
        MOBILE VIEW (Sleek, Minimal Card)
        ======================================================== */}
      <div className="md:hidden w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100 transition-all">
        {mode === "login" ? loginFormContent : signupFormContent}
        
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-slate-500 text-sm">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 font-medium text-slate-900 hover:underline transition-all focus:outline-none"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* ========================================================
        DESKTOP VIEW (Refined Sliding Panel)
        ======================================================== */}
      <div className="hidden md:flex relative w-full max-w-[1040px] h-[640px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        
        {/* Left Fixed Container: Sign Up Form */}
        <div className="absolute top-0 left-0 w-1/2 h-full p-12 bg-white">
          {signupFormContent}
        </div>

        {/* Right Fixed Container: Login Form */}
        <div className="absolute top-0 right-0 w-1/2 h-full p-12 bg-white">
          {loginFormContent}
        </div>

        {/* ================= SLIDING OVERLAY PANEL ================= */}
        {/* Logic:
          If mode === "signup", the panel moves to the RIGHT (translate-x-full), exposing the LEFT side (Signup Form).
          If mode === "login", the panel moves to the LEFT (translate-x-0), exposing the RIGHT side (Login Form).
        */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full z-50 transform transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] overflow-hidden bg-slate-900 shadow-2xl ${
            mode === "signup" ? "translate-x-full rounded-[2.5rem]" : "translate-x-0 rounded-[2.5rem]"
          }`}
        >
          {/* Inner container translating inversely to keep content visually centered during the slide */}
          <div className={`relative w-[200%] h-full flex transform transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            mode === "signup" ? "-translate-x-1/2" : "translate-x-0"
          }`}>
            
            {/* Panel Content 1: Shown when panel is on the LEFT (User is Logging In) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center p-16 text-center transition-opacity duration-500 ease-in-out ${
              mode === "login" ? "opacity-100 delay-200" : "opacity-0 pointer-events-none"
            }`}>
              <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">New to Algorhythm?</h2>
              <p className="text-slate-300 text-[15px] leading-relaxed mb-10 font-light">
                Sign up today to start practicing algorithms, joining contests, and tracking your progress.
              </p>
              <button 
                type="button"
                onClick={toggleMode}
                className="px-10 py-3 rounded-xl border border-slate-600 text-white font-medium hover:bg-white hover:text-slate-900 transition-all duration-300 active:scale-95"
              >
                Create an account
              </button>
            </div>

            {/* Panel Content 2: Shown when panel is on the RIGHT (User is Signing Up) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center p-16 text-center transition-opacity duration-500 ease-in-out ${
              mode === "signup" ? "opacity-100 delay-200" : "opacity-0 pointer-events-none"
            }`}>
              <h2 className="text-3xl font-semibold text-white mb-4 tracking-tight">Already a member?</h2>
              <p className="text-slate-300 text-[15px] leading-relaxed mb-10 font-light">
                Log in to access your dashboard, continue your streaks, and manage your lists.
              </p>
              <button 
                type="button"
                onClick={toggleMode}
                className="px-10 py-3 rounded-xl border border-slate-600 text-white font-medium hover:bg-white hover:text-slate-900 transition-all duration-300 active:scale-95"
              >
                Sign in to account
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}