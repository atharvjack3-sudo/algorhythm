import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client"; // Adjust this import based on your actual structure

// Reusable spinner component to match the AuthForm
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

export default function ResetPass() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // 'idle' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid or missing reset token.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      
      await api.post("/auth/reset-password", { 
        token, 
        newPassword: form.password 
      });
      
      setStatus("success");
      
      setTimeout(() => {
        navigate("/auth");
      }, 2500);

    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.error || 
        err.message || 
        "Failed to reset password. The link may have expired."
      );
    }
  };

  const renderError = () => {
    if (status !== "error" || !errorMessage) return null;
    return (
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] shadow-sm text-left">
        <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-1">
          [ERROR] Reset Failed
        </div>
        <p className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
          {errorMessage}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center transition-colors">
        
        {/* SUCCESS STATE */}
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5 border border-green-200 dark:border-green-800">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Password Updated
            </h2>
            <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 mb-6">
              Your password has been successfully reset. Redirecting you to the login page...
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-orange-500 h-1.5 rounded-full animate-[progress_2.5s_ease-in-out_forwards]"></div>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleSubmit} className="w-full mx-auto flex flex-col text-left">
            <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                Create New Password
              </h2>
              <p className="font-sans text-[13px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Secure your workspace
              </p>
            </div>

            {renderError()}

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  New Password
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
              <div>
                <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-2.5 text-[13px] font-sans outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-8 w-full py-2.5 bg-orange-500 text-white border-none rounded-[3px] text-[14px] font-sans hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold tracking-wide flex justify-center items-center cursor-pointer"
            >
              {status === "loading" ? (
                <>
                  <LoadingSpinner />
                  Updating...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
              <Link
                to="/auth"
                className="font-sans text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 hover:underline transition-colors focus:outline-none"
              >
                Cancel and return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}