import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyAccount } = useAuth(); 
  
  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the URL.");
      return;
    }

    const processVerification = async () => {
      try {
        await verifyAccount(token);
        setStatus("success");
        navigate("/problemset");
      

      } catch (err) {
        console.error("Verification Error:", err);
        setStatus("error");
        
        setErrorMessage(
          err.response?.data?.error || 
          err.message || 
          "Verification failed. The link may be invalid or expired."
        );
      }
    };

    processVerification();
  }, [token, verifyAccount, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center transition-colors">
        
        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-6">
            <svg
              className="animate-spin h-10 w-10 text-orange-500 mb-6"
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
            <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Hold Tight, we're setting your account up.
            </h2>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 animate-pulse">
              [PROCESSING TOKEN]
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
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
              Account Verified
            </h2>
            <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 mb-6">
              Your email has been successfully verified. Initializing your workspace...
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-orange-500 h-1.5 rounded-full animate-[progress_2s_ease-in-out_forwards]"></div>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-5 border border-red-200 dark:border-red-900/50">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              Verification Failed
            </h2>
            <div className="w-full p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] mb-6">
              <p className="font-mono text-[11px] text-red-500 whitespace-pre-wrap text-center">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-none rounded-[3px] text-[13px] font-sans font-semibold hover:opacity-85 transition-opacity flex justify-center items-center cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}