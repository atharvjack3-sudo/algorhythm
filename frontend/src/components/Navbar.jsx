import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/navico/main_logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to check active routes for styling
  const isActive = (path) => location.pathname.startsWith(path);

  if (loading) return null;

  return (
    <nav className="w-full h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* Left: Logo */}
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <img src={logo} alt="Algorhythm" className="h-11 w-auto invert-100 transition-opacity group-hover:opacity-80" />
       
        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {[
            { name: "Problems", path: "/problemset" },
            { name: "Contests", path: "/contests" },
            { name: "Premium", path: "/premium" },
            { name: "Blogs", path: "/blogs" },
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right: User / Auth */}
        <div className="relative flex items-center" ref={dropdownRef}>
          {user ? (
            <>
              {/* Profile Toggle Button */}
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full border border-transparent hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                aria-expanded={open}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                    user?.is_premium ? "bg-amber-500" : "bg-blue-600"
                  }`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.username}
                </span>
              </button>

              {/* Dropdown Popover */}
              <div
                className={`
                  absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] 
                  border border-gray-100 origin-top-right transform transition-all duration-200
                  ${open ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}
                `}
              >
                {/* Header Profile Info */}
                <div className="px-6 py-5 flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium text-white shadow-sm ${
                      user?.is_premium ? "bg-amber-500" : "bg-blue-600"
                    }`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.is_premium ? "Premium Member" : "Standard User"}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-200 mx-4"></div>

                {/* Main Links */}
                <div className="py-2 px-2">
                  {[
                    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                    { name: "My Lists", path: "/my-lists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                    { name: "My Blogs", path: "/blogs/mine", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                    { name: "Playground", path: "/playground", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                  ].map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors group"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                      </svg>
                      {link.name}
                    </Link>
                  ))}
                  
                  {/* Custom SVG for Performance */}
                  <Link
                    to="/performance/mine"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors group"
                    onClick={() => setOpen(false)}
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="10" width="4" height="11" rx="1" />
                      <rect x="10" y="6" width="4" height="15" rx="1" />
                      <rect x="17" y="3" width="4" height="18" rx="1" />
                    </svg>
                    <span>My Performance</span>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full tracking-wide">BETA</span>
                  </Link>
                </div>

                {/* Mobile-Only Main Nav Links (Shown only on small screens inside the menu) */}
                <div className="md:hidden py-2 px-2 border-t border-gray-100">
                  <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
                  {[
                    { name: "Problems", path: "/problemset" },
                    { name: "Contests", path: "/contests" },
                    { name: "Premium", path: "/premium" },
                    { name: "Blogs", path: "/blogs" },
                  ].map((link) => (
                    <Link
                      key={`mobile-${link.name}`}
                      to={link.path}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-gray-200 mx-4"></div>

                {/* Logout */}
                <div className="py-2 px-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors group"
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}