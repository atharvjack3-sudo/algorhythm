import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/navico/main_logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

  return (
    <nav className="w-full h-14 bg-white border-b border-gray-200 shadow-s sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left Logo (desktop) */}
        <div
          onClick={() => navigate("/")}
          className="hidden md:flex items-center cursor-pointer"
        >
          <img src={logo} alt="Algorhythm" className="h-10 w-auto invert-100" />
        </div>

        {/* Center Logo (mobile) */}
        <div
          onClick={() => navigate("/")}
          className="absolute left-1/2 -translate-x-1/2 md:flex md:hidden items-center cursor-pointer"
        >
          <img src={logo} alt="Algorhythm" className="h-10 w-auto invert-100" />
        </div>

        {/* Center Navigation (desktop) */}
        <div
          className="hidden md:flex gap-8 text-gray-600 font-medium
                absolute left-1/2 -translate-x-1/2"
        >
          <Link to="/problemset" className="hover:text-sky-500 transition">
            Problems
          </Link>
          <Link to="/contests" className="hover:text-sky-500 transition">
            Contests
          </Link>
          <Link to="/premium" className="hover:text-sky-500 transition">
            Premium
          </Link>
          <Link to="/blogs" className="hover:text-sky-500 transition">
            Blogs
          </Link>
        </div>

        {/* Right: User / Auth */}
        <div className="relative ml-auto" ref={dropdownRef}>
          {user ? (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="h-9 flex items-center gap-2 px-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <span className="hidden sm:block text-gray-700 font-medium">
                  {user.username}
                </span>
              </button>

              {/* Dropdown */}
              <div
                className={`
                  absolute right-0 mt-3 w-64 bg-white border border-gray-200
                  rounded-2xl shadow-xl origin-top-right transform transition-all duration-200
                  ${
                    open
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }
                `}
              >
                {/* User info */}
                <div className="px-5 py-4 border-b rounded-t-2xl border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${user?.is_premium == true ? "from-yellow-200 to-yellow-500" : "from-cyan-400 to-blue-500"}  flex items-center justify-center text-white font-bold text-lg shadow-md`}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">
                        Signed in as
                      </p>
                      <p className="font-bold text-gray-900 truncate">
                        {user.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop nav links */}
                <div className="hidden md:block py-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/my-lists"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="font-medium">My Lists</span>
                  </Link>
                  <Link
                    to="/blogs/mine"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="font-medium">My Blogs</span>
                  </Link>
                  <Link
                    to="/playground"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Playground</span>
                  </Link>
                  <Link
                    to="/performance/mine"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="3" y="10" width="4" height="11" rx="1" />
                      <rect x="10" y="6" width="4" height="15" rx="1" />
                      <rect x="17" y="3" width="4" height="18" rx="1" />
                    </svg>

                    <span className="font-medium">
                      My Performance{" "}
                      <span className="text-xs text-gray-400">[BETA]</span>
                    </span>
                  </Link>
                </div>

                {/* Mobile nav links */}
                <div className="md:hidden py-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/problemset"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    <span className="font-medium">Problems</span>
                  </Link>
                  <Link
                    to="/contests"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>
                    <span className="font-medium">Contests</span>
                  </Link>
                  <Link
                    to="/premium"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    <span className="font-medium">Premium</span>
                  </Link>
                  <Link
                    to="/blogs"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span className="font-medium">Blogs</span>
                  </Link>
                  <Link
                    to="/my-lists"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="font-medium">My Lists</span>
                  </Link>
                  <Link
                    to="/blogs/mine"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="font-medium">My Blogs</span>
                  </Link>
                  <Link
                    to="/playground"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Playground</span>
                  </Link>
                  <Link
                    to="/performance/mine"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition group rounded-xl"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="3" y="10" width="4" height="11" rx="1" />
                      <rect x="10" y="6" width="4" height="15" rx="1" />
                      <rect x="17" y="3" width="4" height="18" rx="1" />
                    </svg>

                    <span className="font-medium">
                      My Performance{" "}
                      <span className="text-xs text-gray-400">[BETA]</span>
                    </span>
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 p-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition rounded-xl font-medium group"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="h-9 px-4 flex items-center rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
