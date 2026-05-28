import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/navico/main_logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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

  const isActive = (path) => location.pathname.startsWith(path);

  if (loading) return null;

  const NAV_LINKS = [
    { name: "Problems",  path: "/problemset" },
    { name: "Contests",  path: "/contests" },
    { name: "Premium",   path: "/premium" },
    { name: "Blogs",     path: "/blogs" },
  ];

  const DROPDOWN_LINKS = [
    { name: "Dashboard",      path: "/dashboard",       icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "My Lists",       path: "/my-lists",        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { name: "My Blogs",       path: "/blogs/mine",      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { name: "Playground",     path: "/playground",      icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
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
          --nb-accent: #f59e0b;
          --nb-btn-hover-bg: #f8fafc;
          --nb-btn-hover-border: #e2e8f0;
          --nb-avatar-text: #070e17;
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
          --nb-logo-filter: invert(1);
          --nb-logout-hover-bg: rgba(239,68,68,0.06);
          --nb-logout-hover-border: rgba(239,68,68,0.15);
          --nb-logout-hover-color: #ef4444;
          --nb-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        .dark {
          --nb-bg: #020617;
          --nb-border: #192a3a;
          --nb-text-muted: #3d5268;
          --nb-text-hover: #8facc0;
          --nb-accent: #f59e0b;
          --nb-btn-hover-bg: #0e1e2e;
          --nb-btn-hover-border: #233245;
          --nb-avatar-text: #070e17;
          --nb-dropdown-bg: #020617;
          --nb-dropdown-border: #233245;
          --nb-dd-header-bg: #0f172a;
          --nb-dd-header-border: #192a3a;
          --nb-dd-name: #c8d6e5;
          --nb-theme-track: #0a1420;
          --nb-theme-track-border: #192a3a;
          --nb-theme-btn-text: #2d4055;
          --nb-theme-btn-active-bg: #152030;
          --nb-theme-btn-active-border: #233245;
          --nb-dd-link-text: #4a6070;
          --nb-dd-link-hover-bg: #0a1420;
          --nb-dd-link-hover-border: #192a3a;
          --nb-dd-link-icon: #2d4055;
          --nb-mobile-label: #233245;
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
          gap: 2px;
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
          font-size: 13px;
          font-weight: 600;
          color: var(--nb-text-muted);
          text-decoration: none;
          transition: color .15s;
          letter-spacing: 0.01em;
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
          border-radius: 5px;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .nb-avatar-btn:hover,
        .nb-avatar-btn.open {
          background: var(--nb-btn-hover-bg);
          border-color: var(--nb-btn-hover-border);
        }
        .nb-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--nb-avatar-text);
          flex-shrink: 0;
        }
        .nb-avatar.premium { background: var(--nb-accent); }
        .nb-avatar.standard { background: #60a5fa; }
        .nb-username {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--nb-text-hover);
          letter-spacing: 0.04em;
        }
        .nb-chevron {
          width: 12px;
          height: 12px;
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
          border-radius: 6px;
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
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700;
          color: var(--nb-avatar-text); flex-shrink: 0;
        }
        /* ADDED: Background colors for dropdown avatars */
        .nb-dd-avatar.premium { background: var(--nb-accent); }
        .nb-dd-avatar.standard { background: #60a5fa; }
        
        .nb-dd-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 700; color: var(--nb-dd-name);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-dd-tier {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
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
          border-radius: 4px;
          padding: 3px;
          gap: 2px;
        }
        .nb-theme-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 0;
          border-radius: 3px;
          border: 1px solid transparent;
          background: transparent;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
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
        .nb-theme-btn svg { width: 10px; height: 10px; }

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
          border-radius: 4px;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
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
          width: 15px; height: 15px;
          color: var(--nb-dd-link-icon);
          flex-shrink: 0;
          transition: color .12s;
        }
        .nb-dd-link:hover svg { color: var(--nb-accent); }

        /* Performance badge */
        .nb-alpha {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.1em;
          padding: 2px 5px;
          border-radius: 2px;
          background: rgba(239,68,68,0.08);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
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
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          color: var(--nb-mobile-label);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .nb-mobile-link {
          display: block;
          padding: 7px 10px;
          text-decoration: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: var(--nb-text-muted);
          letter-spacing: 0.06em;
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
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nb-text-muted);
          cursor: pointer;
          transition: all .15s;
        }
        .nb-logout:hover {
          background: var(--nb-logout-hover-bg);
          border-color: var(--nb-logout-hover-border);
          color: var(--nb-logout-hover-color);
        }
        .nb-logout svg { width: 14px; height: 14px; flex-shrink: 0; }

        /* Sign in button */
        .nb-signin {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 7px 16px;
          background: var(--nb-accent);
          color: var(--nb-avatar-text);
          border: none;
          border-radius: 4px;
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
            {NAV_LINKS.map(item => (
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
          <div className="nb-right" ref={dropdownRef} style={{ position: "relative" }}>
            {user ? (
              <>
                <button
                  className={`nb-avatar-btn${open ? " open" : ""}`}
                  onClick={() => setOpen(v => !v)}
                  aria-expanded={open}
                >
                  <div className={`nb-avatar ${user?.is_premium ? "premium" : "standard"}`}>
                    {
                  (!(user?.profile)) ? user.username.charAt(0).toUpperCase() : <img className="rounded-lg" src={user?.profile}></img>
                }
                  </div>
                  <span className="nb-username">{user.username}</span>
                  <svg className="nb-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                <div className={`nb-dropdown ${open ? "open-d" : "closed"}`}>

                  {/* Header */}
                  <div className="nb-dd-header">
                    <div className={`nb-dd-avatar ${user?.is_premium ? "premium" : "standard"}`}>
                      {
                  (!(user?.profile)) ? user.username.charAt(0).toUpperCase() : <img className="rounded-lg" src={user?.profile}></img>
                }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nb-dd-name">{user.username}</div>
                      <div className={`nb-dd-tier ${user?.is_premium ? "premium" : "standard"}`}>
                        {user?.is_premium ? "Premium Member" : "Standard User"}
                      </div>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="nb-theme-row">
                    <div className="nb-theme-track">
                      {[
                        { key: "light", label: "Light", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> },
                        { key: "dark",  label: "Dark",  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /> },
                        { key: "system",label: "Auto",  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
                      ].map(t => (
                        <button
                          key={t.key}
                          className={`nb-theme-btn${theme === t.key ? " active" : ""}`}
                          onClick={() => setTheme(t.key)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.icon}</svg>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="nb-dd-links">
                    {DROPDOWN_LINKS.map(link => (
                      <Link key={link.name} to={link.path} className="nb-dd-link" onClick={() => setOpen(false)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                        </svg>
                        {link.name}
                      </Link>
                    ))}

                    {/* Performance */}
                    <Link to="/performance/mine" className="nb-dd-link" onClick={() => setOpen(false)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width:15, height:15, color:"var(--nb-dd-link-icon)", flexShrink:0, transition:"color .12s" }}
                        onMouseEnter={e => e.currentTarget.style.color="var(--nb-accent)"}
                        onMouseLeave={e => e.currentTarget.style.color="var(--nb-dd-link-icon)"}>
                        <rect x="3" y="10" width="4" height="11" rx="1" />
                        <rect x="10" y="6" width="4" height="15" rx="1" />
                        <rect x="17" y="3" width="4" height="18" rx="1" />
                      </svg>
                      My Performance
                      <span className="nb-alpha">Alpha</span>
                    </Link>
                  </div>

                  {/* Mobile nav links */}
                  <div className="nb-mobile-links">
                    <div className="nb-mobile-label">Navigation</div>
                    {NAV_LINKS.map(link => (
                      <Link key={`m-${link.name}`} to={link.path} className="nb-mobile-link" onClick={() => setOpen(false)}>
                        {link.name}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="nb-dd-footer">
                    <button className="nb-logout" onClick={() => { logout(); setOpen(false); }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/auth" className="nb-signin">Sign In →</Link>
            )}
          </div>

        </div>
      </nav>
    </>
  );
}