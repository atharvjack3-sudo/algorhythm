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
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f5f5f7] dark:bg-[#0a0c10] transition-colors duration-300">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
        </div>
      </div>
    );
  }

  // --- REUSABLE FORM JSX ---
  // Stored as variables instead of internal components to prevent input focus loss on re-render

  const loginFormContent = (
    <form onSubmit={(e) => handleSubmit(e, "login")} className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Welcome back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Enter your credentials to access your account.</p>
      </div>
      
      {error && mode === "login" && (
        <div className="mb-6 p-3 bg-red-50/50 dark:bg-rose-500/10 border border-red-100 dark:border-rose-500/20 text-red-600 dark:text-rose-400 rounded-xl text-sm font-medium text-center transition-all">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5 transition-colors">Email address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 transition-colors">Password</label>
            <a href="#" className="text-[12px] font-medium text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-blue-400 transition-colors" onClick={(e) => e.preventDefault()}>Forgot?</a>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full py-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 shadow-md shadow-slate-900/10 dark:shadow-blue-600/20"
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Create account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Join Algorhythm and start coding today.</p>
      </div>

      {error && mode === "signup" && (
        <div className="mb-6 p-3 bg-red-50/50 dark:bg-rose-500/10 border border-red-100 dark:border-rose-500/20 text-red-600 dark:text-rose-400 rounded-xl text-sm font-medium text-center transition-all">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5 transition-colors">Username</label>
          <input
            type="text"
            required
            placeholder="coder123"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5 transition-colors">Email address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5 transition-colors">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm shadow-slate-100/50 dark:shadow-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full py-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 shadow-md shadow-slate-900/10 dark:shadow-blue-600/20"
      >
        {isSubmitting && mode === "signup" ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : "Create Account"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f5f7] dark:bg-[#0a0c10] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      
      {/* ========================================================
        MOBILE VIEW (Sleek, Minimal Card)
        ======================================================== */}
      <div className="md:hidden w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        {mode === "login" ? loginFormContent : signupFormContent}
        
        <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all focus:outline-none"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* ========================================================
        DESKTOP VIEW (Refined Sliding Panel)
        ======================================================== */}
      <div className="hidden md:flex relative w-full max-w-[1040px] h-[640px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        
        {/* Left Fixed Container: Sign Up Form */}
        <div className="absolute top-0 left-0 w-1/2 h-full p-12 bg-white dark:bg-slate-900 transition-colors duration-300">
          {signupFormContent}
        </div>

        {/* Right Fixed Container: Login Form */}
        <div className="absolute top-0 right-0 w-1/2 h-full p-12 bg-white dark:bg-slate-900 transition-colors duration-300">
          {loginFormContent}
        </div>

        {/* ================= SLIDING OVERLAY PANEL ================= */}
        {/* Logic:
          If mode === "signup", the panel moves to the RIGHT (translate-x-full), exposing the LEFT side (Signup Form).
          If mode === "login", the panel moves to the LEFT (translate-x-0), exposing the RIGHT side (Login Form).
        */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full z-50 transform transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] overflow-hidden bg-slate-900 dark:bg-blue-600 shadow-2xl dark:shadow-none ${
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
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">New to Algorhythm?</h2>
              <p className="text-slate-300 dark:text-blue-100 text-[15px] leading-relaxed mb-10 font-medium transition-colors">
                Sign up today to start practicing algorithms, joining contests, and tracking your progress.
              </p>
              <button 
                type="button"
                onClick={toggleMode}
                className="px-10 py-3.5 rounded-xl border-2 border-slate-600 dark:border-blue-400 text-white font-bold hover:bg-white hover:text-slate-900 dark:hover:text-blue-700 transition-all duration-300 active:scale-95"
              >
                Create an account
              </button>
            </div>

            {/* Panel Content 2: Shown when panel is on the RIGHT (User is Signing Up) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center p-16 text-center transition-opacity duration-500 ease-in-out ${
              mode === "signup" ? "opacity-100 delay-200" : "opacity-0 pointer-events-none"
            }`}>
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Already a member?</h2>
              <p className="text-slate-300 dark:text-blue-100 text-[15px] leading-relaxed mb-10 font-medium transition-colors">
                Log in to access your dashboard, continue your streaks, and manage your lists.
              </p>
              <button 
                type="button"
                onClick={toggleMode}
                className="px-10 py-3.5 rounded-xl border-2 border-slate-600 dark:border-blue-400 text-white font-bold hover:bg-white hover:text-slate-900 dark:hover:text-blue-700 transition-all duration-300 active:scale-95"
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