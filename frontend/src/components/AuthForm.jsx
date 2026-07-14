import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// Reusable spinner component for the buttons
const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function AuthForm() {
  // Assuming forgotPassword is added to your AuthContext
  const { login, signup, forgotPassword, user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const [err, setErr] = useState(searchParams.get("error")?.replaceAll("_", " ") || null);

  // 'login' | 'signup' | 'forgot-password'
  const [mode, setMode] = useState("login");
  
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
      } else if (actionType === "signup") {
        await signup(form.username, form.email, form.password);
        setSignupSuccess(true);
      } else if (actionType === "forgot-password") {
        // Fallback delay if forgotPassword isn't wired up in Context yet
        if (forgotPassword) {
          await forgotPassword(form.email);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        setForgotSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = (newMode) => {
    // If no explicit mode is passed, toggle between login and signup
    if (typeof newMode === "string") {
      setMode(newMode);
    } else {
      setMode((prev) => (prev === "login" || prev === "forgot-password" ? "signup" : "login"));
    }
    setError("");
    setSignupSuccess(false);
    setForgotSuccess(false);
    setForm((prev) => ({ ...prev, password: "" }));
  };

  if (authLoading || user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          AUTHENTICATING...
        </span>
      </div>
    );
  }

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] shadow-sm text-left">
        <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-1">
          [ERROR] Request Failed
        </div>
        <p className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
          {error}
        </p>
      </div>
    );
  };

  /* =========================
     FORGOT PASSWORD FORM
  ========================= */
  const forgotPasswordContent = forgotSuccess ? (
    <div className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-left border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Link Dispatched
        </h2>
        <p className="font-sans text-[12px] tracking-wide font-semibold text-green-600 dark:text-green-500">
          Check your inbox
        </p>
      </div>

      <div className="space-y-4 text-left">
        <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
          We have sent a secure password recovery link to:
          <br />
          <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-[2px]">
            {form.email}
          </span>
        </p>
        <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Follow the instructions in the email to update your credentials. The link will expire shortly.
        </p>
      </div>

      <button
        type="button"
        onClick={() => toggleMode("login")}
        className="mt-8 w-full py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-none rounded-[3px] text-[13px] font-sans font-semibold hover:opacity-85 transition-opacity flex justify-center items-center cursor-pointer"
      >
        Return to Login
      </button>
    </div>
  ) : (
    <form
      onSubmit={(e) => handleSubmit(e, "forgot-password")}
      className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full"
    >
      <div className="mb-8 text-left border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Reset Password
        </h2>
        <p className="font-sans text-[13px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Recover your account
        </p>
      </div>

      {mode === "forgot-password" && renderError()}

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full py-2.5 bg-orange-500 text-white border-none rounded-[3px] text-[14px] font-sans hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold tracking-wide flex justify-center items-center cursor-pointer"
      >
        {isSubmitting && mode === "forgot-password" ? (
          <>
            <LoadingSpinner />
            Sending...
          </>
        ) : (
          "Send Verification Link"
        )}
      </button>

      <p className="mt-5 text-center dark:text-slate-400 text-slate-700 font-sans text-xs font-semibold tracking-wide">
        Remembered your password?{" "}
        <span
          onClick={() => toggleMode("login")}
          className="text-orange-500 cursor-pointer hover:brightness-125 hover:underline"
        >
          Back to Login
        </span>
      </p>
    </form>
  );

  /* =========================
     LOGIN FORM
  ========================= */
  const loginFormContent = (
    <form
      onSubmit={(e) => handleSubmit(e, "login")}
      className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full"
    >
      <div className="mb-8 text-left border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Sign In
        </h2>
        <p className="font-sans text-[13px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Access your profile
        </p>
      </div>

      {mode === "login" && renderError()}

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full py-2.5 bg-orange-500 text-white border-none rounded-[3px] text-[14px] font-sans hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold tracking-wide flex justify-center items-center cursor-pointer"
      >
        {isSubmitting && mode === "login" ? (
          <>
            <LoadingSpinner />
            Logging In...
          </>
        ) : (
          "Login"
        )}
      </button>
      
      <p className="mt-5 text-center dark:text-slate-400 text-slate-700 font-sans text-xs font-semibold tracking-wide">
        Forgot Password?{" "}
        <span
          onClick={() => toggleMode("forgot-password")}
          className="text-orange-500 cursor-pointer hover:brightness-125 hover:underline"
        >
          Reset Here.
        </span>{" "}
      </p>
    </form>
  );

  /* =========================
     SIGNUP FORM
  ========================= */
  const signupFormContent = signupSuccess ? (
    <div className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-left border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Verification Required
        </h2>
        <p className="font-sans text-[12px] tracking-wide font-semibold text-green-600 dark:text-green-500">
          Account staged successfully
        </p>
      </div>

      <div className="space-y-4 text-left">
        <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
          A secure verification link has been dispatched to:
          <br />
          <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-[2px]">
            {form.email}
          </span>
        </p>
        <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Please check your inbox (and spam folder) to activate your account before attempting to authenticate.
        </p>
      </div>

      <button
        type="button"
        onClick={() => toggleMode("login")}
        className="mt-8 w-full py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-none rounded-[3px] text-[13px] font-sans font-semibold hover:opacity-85 transition-opacity flex justify-center items-center cursor-pointer"
      >
        Return to Login
      </button>
    </div>
  ) : (
    <form
      onSubmit={(e) => handleSubmit(e, "signup")}
      className="w-full max-w-[340px] mx-auto flex flex-col justify-center h-full"
    >
      <div className="mb-8 text-left border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Register
        </h2>
        <p className="font-sans text-[12px] tracking-wide font-semibold text-slate-500 dark:text-slate-400">
          Setup new account
        </p>
      </div>

      {mode === "signup" && renderError()}

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Username
          </label>
          <input
            type="text"
            required
            placeholder="coder123"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full py-2.5 bg-orange-500 text-white border-none rounded-[3px] text-[13px] font-sans font-semibold hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex justify-center items-center cursor-pointer"
      >
        {isSubmitting && mode === "signup" ? (
          <>
            <LoadingSpinner />
            Registering...
          </>
        ) : (
          "Register"
        )}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 font-sans transition-colors">
      {/* MOBILE VIEW */}
      {err && <p className="w-[60%] rounded-md bg-red-600/10 border border-red-500/20 text-center mb-3 text-sm font-semibold dark:text-red-500 p-2">{err}</p>}
      <div className="md:hidden w-full max-w-md bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-colors">
        {mode === "login"
          ? loginFormContent
          : mode === "forgot-password"
          ? forgotPasswordContent
          : signupFormContent}

        {mode !== "forgot-password" && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {mode === "login" ? "New User?" : "Account Exists?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 font-semibold font-sans text-orange-600 dark:text-orange-500 hover:underline transition-all focus:outline-none"
              >
                {mode === "login" ? "Register" : "Login"}
              </button>
            </p>
          </div>
        )}
      </div>
      

      {/* DESKTOP SPLIT VIEW */}
      <div className="hidden md:flex relative w-full max-w-[900px] h-[550px] bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Left Side Base (Signup Form) */}
        <div className="absolute top-0 left-0 w-1/2 h-full p-12 bg-white dark:bg-slate-900 flex items-center">
          {signupFormContent}
        </div>

        {/* Right Side Base (Login / Forgot Password) */}
        <div className="absolute top-0 right-0 w-1/2 h-full p-12 bg-white dark:bg-slate-900 flex items-center">
          {mode === "forgot-password" ? forgotPasswordContent : loginFormContent}
        </div>

        {/* The Sliding Overlay Pane */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full z-50 transform transition-transform duration-500 ease-in-out bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,0,0,0.2)] overflow-hidden ${
            mode === "signup"
              ? "translate-x-full border-l"
              : "translate-x-0 border-r"
          }`}
        >
          <div
            className={`relative w-[200%] h-full flex transform transition-transform duration-500 ease-in-out ${
              mode === "signup" ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* Overlay Content when Login/Forgot is active (covers Left side, prompts to Register) */}
            <div
              className={`w-1/2 h-full flex flex-col items-center justify-center p-14 text-center transition-opacity duration-300 ${
                mode === "login" || mode === "forgot-password"
                  ? "opacity-100 delay-150"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3">
                New User?
              </h2>
              <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Initialize an account to save code snippets, execute algorithms,
                and access collaborative workspaces.
              </p>
              <button
                type="button"
                onClick={() => toggleMode("signup")}
                className="font-sans text-[13px] font-semibold bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-8 py-2.5 rounded-[3px] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Goto Register
              </button>
            </div>

            {/* Overlay Content when Signup is active (covers Right side, prompts to Login) */}
            <div
              className={`w-1/2 h-full flex flex-col items-center justify-center p-14 text-center transition-opacity duration-300 ${
                mode === "signup"
                  ? "opacity-100 delay-150"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Existing User?
              </h2>
              <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Authenticate to resume your session, review past submissions,
                and manage cloud saves.
              </p>
              <button
                type="button"
                onClick={() => toggleMode("login")}
                className="font-sans text-[12px] font-semibold bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-8 py-2.5 rounded-[3px] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Goto Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}