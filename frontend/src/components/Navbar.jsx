import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/navico/light_mode_logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw,
  LayoutDashboard,
  Bookmark,
  FileText,
  Terminal,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  LogOut,
  Activity
} from "lucide-react";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [playStopwatch, setPlayStopwatch] = useState(false); // 0 = stop, 1 = play
  const [clock, setClock] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);

  if (loading) return null;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const NAV_LINKS = [
    { name: "Problems", path: "/problemset" },
    { name: "Contests", path: "/contests" },
    { name: "Premium", path: "/premium" },
    { name: "Blogs", path: "/blogs" },
    { name: "Learn", path: "/learn" }
  ];

  const DROPDOWN_LINKS = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Lists", path: "/my-lists", icon: Bookmark },
    { name: "My Blogs", path: "/blogs/mine", icon: FileText },
    { name: "Playground", path: "/playground", icon: Terminal },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --nb-bg: #ffffff;
          --nb-border: #e2e8f0;
          --nb-text-muted: #64748b;
          --nb-text-hover: #0f172a;
          --nb-accent: #ea580c;
          --nb-btn-hover-bg: #f8fafc;
          --nb-btn-hover-border: #e2e8f0;
          --nb-avatar-text: #ffffff;
          --nb-dropdown-bg: #ffffff;
          --nb-dropdown-border: #e2e8f0;
          --nb-dd-header-bg: #f8fafc;
          --nb-dd-header-border: #f1f5f9;
          --nb-dd-name: #0f172a;
          --nb-theme-track: #f8fafc;
          --nb-theme-track-border: #e2e8f0;
          --nb-theme-btn-text: #64748b;
          --nb-theme-btn-active-bg: #ffffff;
          --nb-theme-btn-active-border: #cbd5e1;
          --nb-dd-link-text: #475569;
          --nb-dd-link-hover-bg: #f8fafc;
          --nb-dd-link-hover-border: #f1f5f9;
          --nb-dd-link-icon: #94a3b8;
          --nb-mobile-label: #cbd5e1;
          --nb-logo-filter: invert(0);
          --nb-logout-hover-bg: rgba(239,68,68,0.06);
          --nb-logout-hover-border: rgba(239,68,68,0.15);
          --nb-logout-hover-color: #ef4444;
          --nb-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        .dark {
          --nb-bg: #050608;
          --nb-border: #1F1F1F;
          --nb-text-muted: #475569;
          --nb-text-hover: #e2e8f0;
          --nb-accent: #f97316;
          --nb-btn-hover-bg: #0d1117;
          --nb-btn-hover-border: #1e293b;
          --nb-avatar-text: #ffffff;
          --nb-dropdown-bg: #0d1117;
          --nb-dropdown-border: #1e293b;
          --nb-dd-header-bg: #161b22;
          --nb-dd-header-border: #1e293b;
          --nb-dd-name: #c8d6e5;
          --nb-theme-track: #050608;
          --nb-theme-track-border: #1e293b;
          --nb-theme-btn-text: #475569;
          --nb-theme-btn-active-bg: #161b22;
          --nb-theme-btn-active-border: #334155;
          --nb-dd-link-text: #64748b;
          --nb-dd-link-hover-bg: #050608;
          --nb-dd-link-hover-border: #1e293b;
          --nb-dd-link-icon: #475569;
          --nb-mobile-label: #1e293b;
          --nb-logo-filter: brightness(0) invert(1);
          --nb-logout-hover-bg: rgba(239,68,68,0.06);
          --nb-logout-hover-border: rgba(239,68,68,0.15);
          --nb-logout-hover-color: #ef4444;
          --nb-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }

        .nb-root {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          height: 52px;
          background: var(--nb-bg);
          border-bottom: 1px solid var(--nb-border);
          display: flex;
          align-items: center;
          transition: background 0.2s, border-color 0.2s;
        }

        .nb-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        /* Logo */
        .nb-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
          opacity: 1;
          transition: opacity .15s;
        }
        .nb-logo:hover { opacity: 0.7; }
        .nb-logo img { height: 28px; width: auto; filter: var(--nb-logo-filter); transition: filter 0.2s; }

        /* Center nav */
        .nb-links {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 100%;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .nb-link {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--nb-text-muted);
          text-decoration: none;
          transition: color .15s;
        }
        .nb-link::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--nb-accent);
          border-radius: 2px 2px 0 0;
          transform: scaleX(0);
          transition: transform .2s;
        }
        .nb-link:hover { color: var(--nb-text-hover); }
        .nb-link.active { color: var(--nb-accent); }
        .nb-link.active::after { transform: scaleX(1); }

        /* Right side */
        .nb-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        /* Avatar button */
        .nb-avatar-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 10px 5px 6px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .nb-avatar-btn:hover,
        .nb-avatar-btn.open {
          background: var(--nb-btn-hover-bg);
          border-color: var(--nb-btn-hover-border);
        }
        .nb-avatar {
          width: 26px;
          height: 26px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--nb-avatar-text);
          flex-shrink: 0;
          overflow: hidden;
        }
        .nb-avatar.premium { background: var(--nb-accent); }
        .nb-avatar.standard { background: #64748b; }
        .nb-username {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--nb-text-hover);
          letter-spacing: 0.02em;
        }
        .nb-chevron {
          color: var(--nb-text-muted);
          transition: transform .2s, color .15s;
          flex-shrink: 0;
        }
        .nb-avatar-btn.open .nb-chevron,
        .nb-avatar-btn:hover .nb-chevron { color: var(--nb-text-hover); }
        .nb-avatar-btn.open .nb-chevron { transform: rotate(180deg); }

        /* Dropdown */
        .nb-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 264px;
          background: var(--nb-dropdown-bg);
          border: 1px solid var(--nb-dropdown-border);
          border-radius: 3px;
          overflow: hidden;
          transform-origin: top right;
          transition: opacity .18s, transform .18s;
          box-shadow: var(--nb-shadow);
        }
        .nb-dropdown.closed {
          opacity: 0;
          transform: scale(0.95) translateY(-4px);
          pointer-events: none;
        }
        .nb-dropdown.open-d {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        /* Dropdown header */
        .nb-dd-header {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--nb-dd-header-bg);
          border-bottom: 1px solid var(--nb-dd-header-border);
        }
        .nb-dd-avatar {
          width: 32px; height: 32px; border-radius: 3px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          color: var(--nb-avatar-text); flex-shrink: 0; overflow: hidden;
        }
        .nb-dd-avatar.premium { background: var(--nb-accent); }
        .nb-dd-avatar.standard { background: #64748b; }
        
        .nb-dd-name {
          font-family: 'JetBrains Mono', monospace; /* Heading exception */
          text-transform: letter-spacing: 0.05em;
          font-size: 13px; font-weight: 700; color: var(--nb-dd-name);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-dd-tier {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.03em;
          margin-top: 2px;
        }
        .nb-dd-tier.premium { color: var(--nb-accent); }
        .nb-dd-tier.standard { color: var(--nb-text-muted); }

        /* Theme switcher */
        .nb-theme-row {
          padding: 10px 12px;
          border-bottom: 1px solid var(--nb-dd-header-border);
          background: var(--nb-dropdown-bg);
        }
        .nb-theme-track {
          display: flex;
          background: var(--nb-theme-track);
          border: 1px solid var(--nb-theme-track-border);
          border-radius: 3px;
          padding: 3px;
          gap: 2px;
        }
        .nb-theme-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 0;
          border-radius: 3px;
          border: 1px solid transparent;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--nb-theme-btn-text);
          cursor: pointer;
          transition: all .15s;
        }
        .nb-theme-btn:hover { color: var(--nb-text-hover); }
        .nb-theme-btn.active {
          background: var(--nb-theme-btn-active-bg);
          border-color: var(--nb-theme-btn-active-border);
          color: var(--nb-accent);
        }

        /* Dropdown links */
        .nb-dd-links {
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--nb-dropdown-bg);
        }
        .nb-dd-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 3px;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--nb-dd-link-text);
          transition: background .12s, color .12s, border-color .12s;
          border: 1px solid transparent;
        }
        .nb-dd-link:hover {
          background: var(--nb-dd-link-hover-bg);
          border-color: var(--nb-dd-link-hover-border);
          color: var(--nb-text-hover);
        }
        .nb-dd-link svg {
          color: var(--nb-dd-link-icon);
          flex-shrink: 0;
          transition: color .12s;
        }
        .nb-dd-link:hover svg { color: var(--nb-accent); }

        /* Performance badge */
        .nb-alpha {
          margin-left: auto;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 6px;
          border-radius: 2px;
          background: rgba(249,115,22,0.1);
          color: var(--nb-accent);
          border: 1px solid rgba(249,115,22,0.2);
          text-transform: uppercase;
        }

        /* Mobile nav (in dropdown) */
        .nb-mobile-links {
          padding: 6px;
          border-top: 1px solid var(--nb-dd-header-border);
          background: var(--nb-dd-header-bg);
          display: none;
        }
        .nb-mobile-label {
          padding: 4px 10px 6px;
          font-family: 'JetBrains Mono', monospace; /* Heading exception */
          font-size: 10px; font-weight: 700;
          color: var(--nb-mobile-label);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .nb-mobile-link {
          display: block;
          padding: 7px 10px;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--nb-text-muted);
          letter-spacing: 0.02em;
          border-radius: 3px;
          transition: background .12s, color .12s;
        }
        .nb-mobile-link:hover { background: var(--nb-theme-btn-active-bg); color: var(--nb-text-hover); }

        /* Logout */
        .nb-dd-footer {
          padding: 6px;
          border-top: 1px solid var(--nb-dd-header-border);
          background: var(--nb-dd-header-bg);
        }
        .nb-logout {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--nb-text-muted);
          cursor: pointer;
          transition: all .15s;
        }
        .nb-logout:hover {
          background: var(--nb-logout-hover-bg);
          border-color: var(--nb-logout-hover-border);
          color: var(--nb-logout-hover-color);
        }
        .nb-logout svg { flex-shrink: 0; }

        /* Sign in button */
        .nb-signin {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.02em;
          padding: 6px 15px;
          background: var(--nb-accent);
          color: black;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          text-decoration: none;
          transition: opacity .15s;
          display: inline-block;
        }
        .nb-signin:hover { opacity: 0.8; }

        @media (max-width: 768px) {
          .nb-links { display: none; }
          .nb-mobile-links { display: block; }
          .nb-username { display: none; }
        }
      `}</style>

      <nav className="nb-root">
        <div className="nb-inner">
          {/* Logo */}
          <div className="nb-logo" onClick={() => navigate("/")}>
            <img src={logo} alt="Algorhythm" />
          </div>

          {/* Center Links */}
          <div className="nb-links">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nb-link${isActive(item.path) ? " active" : ""}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div
            className="nb-right"
            ref={dropdownRef}
            style={{ position: "relative" }}
          >
            {user ? (
              <>
                <button
                  className={`nb-avatar-btn${open ? " open" : ""}`}
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                >
                  <div
                    className={`nb-avatar ${user?.is_premium ? "premium" : "standard"}`}
                  >
                    {!user?.profile ? (
                      user.username.charAt(0).toUpperCase()
                    ) : (
                      <img className="w-full h-full object-cover" src={user?.profile} alt="Avatar" />
                    )}
                  </div>
                  <span className="nb-username">
                    {user.username}
                  </span>
                  <ChevronDown size={14} className="nb-chevron" />
                </button>

                {/* Dropdown */}
                <div className={`nb-dropdown ${open ? "open-d" : "closed"}`}>
                  {/* Header */}
                  <div className="nb-dd-header">
                    <div
                      className={`nb-dd-avatar ${user?.is_premium ? "premium" : "standard"}`}
                    >
                      {!user?.profile ? (
                        user.username.charAt(0).toUpperCase()
                      ) : (
                        <img className="w-full h-full object-cover" src={user?.profile} alt="Avatar" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nb-dd-name">{user.username}</div>
                      <div
                        className={`nb-dd-tier ${user?.is_premium ? "premium" : "standard"}`}
                      >
                        {user?.is_premium ? "Premium Access" : "Standard Key"}
                      </div>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="nb-theme-row">
                    <div className="nb-theme-track">
                      {[
                        { key: "light", label: "Light", icon: <Sun size={12} /> },
                        { key: "dark", label: "Dark", icon: <Moon size={12} /> },
                        { key: "system", label: "Auto", icon: <Monitor size={12} /> },
                      ].map((t) => (
                        <button
                          key={t.key}
                          className={`nb-theme-btn${theme === t.key ? " active" : ""}`}
                          onClick={() => setTheme(t.key)}
                        >
                          {t.icon}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="nb-dd-links">
                    {DROPDOWN_LINKS.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="nb-dd-link"
                        onClick={() => setOpen(false)}
                      >
                        <link.icon size={15} />
                        {link.name}
                      </Link>
                    ))}

                    {/* Performance */}
                    <Link
                      to="/performance/mine"
                      className="nb-dd-link"
                      onClick={() => setOpen(false)}
                    >
                      <Activity size={15} />
                      Performance
                      <span className="nb-alpha">BETA</span>
                    </Link>
                  </div>

                  {/* Mobile nav links */}
                  <div className="nb-mobile-links">
                    <div className="nb-mobile-label">Global Navigation</div>
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={`m-${link.name}`}
                        to={link.path}
                        className="nb-mobile-link"
                        onClick={() => setOpen(false)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="nb-dd-footer">
                    <button
                      className="nb-logout"
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                    
                    <div className="w-full flex h-8 mt-2 items-center justify-between rounded-[3px] bg-slate-100 dark:bg-slate-900/50 px-3 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <History className="text-slate-500" size={13} />
                        <span className="font-sans font-bold text-[12px] tabular-nums tracking-widest text-slate-600 dark:text-slate-400">
                          {formatTime(clock)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (playStopwatch) {
                              clearInterval(intervalRef.current);
                              setPlayStopwatch(false);
                              return;
                            }
                            intervalRef.current = setInterval(() => {
                              setClock((prev) => prev + 1);
                            }, 1000);
                            setPlayStopwatch(true);
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[3px] transition-colors duration-150 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                          title={playStopwatch ? "Pause" : "Start"}
                        >
                          {playStopwatch ? (
                            <Pause size={13} />
                          ) : (
                            <Play size={13} fill="currentColor" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            clearInterval(intervalRef.current);
                            setPlayStopwatch(false);
                            setClock(0);
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[3px] transition-colors duration-150 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                          title="Reset"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/auth" className="nb-signin">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}