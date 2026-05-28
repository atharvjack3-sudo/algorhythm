import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import QuesCountCircle from "../components/QuesCountCircle";
import EditProfileModal from "../components/EditProfileModal";

// ==========================================
// 1. RATING GRAPH COMPONENT
// ==========================================
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-mono text-[11px] tracking-[0.08em] uppercase gap-3">
        NO RATED CONTESTS FOUND
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 30;
  const paddingY = 30;

  const minVal = Math.min(1000, ...history.map((x) => x.rating_after)) - 50;
  const maxVal = Math.max(2000, ...history.map((x) => x.rating_after)) + 50;
  const yRange = maxVal - minVal;

  const getY = (val) =>
    svgHeight -
    paddingY -
    ((val - minVal) / yRange) * (svgHeight - 2 * paddingY);
  const getX = (idx) =>
    history.length === 1
      ? svgWidth / 2
      : paddingX + (idx / (history.length - 1)) * (svgWidth - 2 * paddingX);

  const CF_BANDS = [
    { min: 0, max: 1199, color: "#94a3b8" },
    { min: 1200, max: 1399, color: "#4ade80" },
    { min: 1400, max: 1599, color: "#2dd4bf" },
    { min: 1600, max: 1899, color: "#818cf8" },
    { min: 1900, max: 2099, color: "#d946ef" },
    { min: 2100, max: 2399, color: "#fb923c" },
    { min: 2400, max: 4000, color: "#f87171" },
  ];

  const linePath =
    history.length === 1
      ? `M0,${getY(history[0].rating_after)} L${svgWidth},${getY(history[0].rating_after)}`
      : `M${history.map((hData, i) => `${getX(i)},${getY(hData.rating_after)}`).join(" L")}`;

  const areaPath =
    history.length === 1
      ? `${linePath} L${svgWidth},${svgHeight} L0,${svgHeight} Z`
      : `${linePath} L${getX(history.length - 1)},${svgHeight} L${getX(0)},${svgHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full block font-mono"
    >
      <defs>
        <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {CF_BANDS.map((band, i) => {
        const topY = Math.max(0, getY(band.max));
        const bottomY = Math.min(svgHeight, getY(band.min));
        if (bottomY <= 0 || topY >= svgHeight || bottomY - topY <= 0)
          return null;
        return (
          <rect
            key={i}
            x="0"
            y={topY}
            width={svgWidth}
            height={bottomY - topY}
            fill={band.color}
            opacity="0.08"
            className="dark:opacity-[0.12]"
          />
        );
      })}

      {[1200, 1400, 1600, 1900, 2100, 2400].map((val) => {
        const y = getY(val);
        if (y < 12 || y > svgHeight - 12) return null;
        return (
          <g key={val}>
            <line
              x1="0"
              y1={y}
              x2={svgWidth}
              y2={y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="8"
              y={y - 6}
              fontSize="10"
              className="fill-slate-500 dark:fill-slate-400 font-mono tracking-widest"
            >
              {val}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#ratingArea)" />
      <path
        d={linePath}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {history.map((entry, idx) => (
        <circle
          key={idx}
          cx={getX(idx)}
          cy={getY(entry.rating_after)}
          r="4"
          className="fill-white dark:fill-slate-900 stroke-amber-500 hover:r-[5px] hover:stroke-[2.5px] hover:fill-amber-500 transition-all duration-200 cursor-pointer"
          strokeWidth="2"
        >
          <title>{`Rating: ${entry.rating_after} (${entry.rating_change > 0 ? "+" : ""}${entry.rating_change})\nRank: ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};

const getContestColor = (r) => {
  if (!r || r < 1200) return "#94a3b8";
  if (r <= 1399) return "#22c55e";
  if (r <= 1599) return "#14b8a6";
  if (r <= 1899) return "#3b82f6";
  if (r <= 2099) return "#d946ef";
  if (r <= 2399) return "#f97316";
  return "#ef4444";
};

const getContestRank = (r) => {
  if (!r || r < 1200) return "Newbie";
  if (r <= 1399) return "Pupil";
  if (r <= 1599) return "Specialist";
  if (r <= 1899) return "Expert";
  if (r <= 2099) return "Candidate Master";
  if (r <= 2399) return "Master";
  return "Grandmaster";
};

// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [showBadges, setShowBadges] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentAC, setRecentAC] = useState([]);
  const [badgeList, setBadgeList] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [heatmap, setHeatmap] = useState([]);
  const [easyProblems, setEasyProblems] = useState(0);
  const [mediumProblems, setMediumProblems] = useState(0);
  const [hardProblems, setHardProblems] = useState(0);
  const [contestStats, setContestStats] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [ratingLoading, setRatingLoading] = useState(true);

  // admin panel

  const [fetchedUser, setFetchedUser] = useState(null);
  const [fetchUsername, setFetchUsername] = useState("");
  const [fetchedUserNewRole, setFetchedUserNewRole] = useState("user");
  const [updateBanStatus, setUpdateBanStatus] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [detailUpdateLoading, setDetailUpdateLoading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // The Unified Profile Hook
  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/user-dashboard");
        const data = res.data;

        setStats(data.details);
        setContestStats(data.contestStats);
        setRatingHistory(data.ratingHistory);
        setBadgeList(data.badges);
        setRecentAC(data.recentAC);
        setHeatmap(data.heatmap);

        if (data.platformStats) {
          setEasyProblems(data.platformStats.easy_problems);
          setMediumProblems(data.platformStats.medium_problems);
          setHardProblems(data.platformStats.hard_problems);
        }
      } catch (err) {
        console.error("Error fetching unified dashboard:", err);
      } finally {
        setStatsLoading(false);
        setRatingLoading(false);
        setBadgesLoading(false);
        setRecentLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const renderHeatmap = () => {
    if (!heatmap) return null;

    const activityMap = {};
    heatmap.forEach((d) => {
      activityMap[d.day.slice(0, 10)] = d.count;
    });

    const monthGroups = [];
    let currentMonth = null;
    let currentGroup = null;

    const today = new Date();
    const start = new Date();
    start.setMonth(today.getMonth() - 3); // 3 months history for dashboard

    const cur = new Date(start);
    while (cur <= today) {
      const m = cur.getMonth();
      if (m !== currentMonth) {
        currentMonth = m;
        currentGroup = {
          label: cur.toLocaleString("en-US", { month: "short" }),
          days: [],
        };
        monthGroups.push(currentGroup);

        // Pad the first column so the days of the week align vertically
        const dayOfWeek = cur.getDay();
        for (let i = 0; i < dayOfWeek; i++) {
          currentGroup.days.push(null);
        }
      }
      currentGroup.days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const getColor = (count) => {
      if (count === 0) return "bg-slate-300 dark:bg-slate-800/60";
      if (count <= 2) return "bg-[#9be9a8] dark:bg-[#0e4429]";
      if (count <= 5) return "bg-[#40c463] dark:bg-[#006d32]";
      if (count <= 8) return "bg-[#30a14e] dark:bg-[#26a641]";
      return "bg-[#216e39] dark:bg-[#39d353]";
    };

    return (
      <div className="flex items-center justify-center flex-col w-full">
        <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
          {monthGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {group.label}
              </span>
              <div className="flex flex-col flex-wrap gap-[3px] h-[116px]">
                {group.days.map((day, dIdx) => {
                  if (!day)
                    return (
                      <div
                        key={`pad-${idx}-${dIdx}`}
                        className="w-[14px] h-[14px]"
                      />
                    );
                  const count = activityMap[day] || 0;
                  return (
                    <div
                      key={day}
                      title={`${day}: ${count} submissions`}
                      className={`w-[14px] h-[14px] ${getColor(count)} cursor-pointer hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500 transition-all`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 w-full flex items-center justify-end gap-2 font-mono text-[10px] font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase pr-2">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[14px] h-[14px] bg-slate-300 dark:bg-slate-800/60"></div>
            <div className="w-[14px] h-[14px] bg-[#9be9a8] dark:bg-[#0e4429]"></div>
            <div className="w-[14px] h-[14px] bg-[#40c463] dark:bg-[#006d32]"></div>
            <div className="w-[14px] h-[14px] bg-[#30a14e] dark:bg-[#26a641]"></div>
            <div className="w-[14px] h-[14px] bg-[#216e39] dark:bg-[#39d353]"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING DASHBOARD...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const joinedYear = user.created_at
    ? new Date(user.created_at).getFullYear()
    : "—";
  const solvedCount = stats?.total_solved ?? 0;
  const rank = stats?.global_rank ?? "—";
  const acceptanceRate = stats?.acceptance_rate ?? "—";
  const status = user?.is_premium == true ? "Premium" : "Regular";
  

  
  async function fetchExternal() {
    try {
      setFetchLoading(true);
      const res = await api.get(`/user-information/${fetchUsername}`);
      setFetchedUser(res.data);
      setFetchedUserNewRole(res.data.role);
      setUpdateBanStatus(res.data.is_banned); // Sync ban status from fetch
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  }

  async function updateUserDetails() {
    try {
      setDetailUpdateLoading(true);
      
      const payload = {
        role: fetchedUserNewRole,
        is_banned: updateBanStatus,
      };

      await api.post(`/update-user-information/${fetchedUser.id}`, payload);
      
      // Update local state without needing to re-fetch
      setFetchedUser(prev => ({
        ...prev,
        role: fetchedUserNewRole,
        is_banned: updateBanStatus
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setDetailUpdateLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-6xl mx-auto py-10 px-6 flex flex-col gap-8">
          {/* ===== PROFILE HEADER ===== */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden transition-colors">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {/* Avatar */}
              <div
                className={`w-28 h-28 rounded-md flex items-center justify-center font-sans text-5xl font-bold text-slate-900 dark:text-white shadow-sm flex-shrink-0 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800`}
              >
                {
                  (!(user?.profile)) ? user.username.charAt(0).toUpperCase() : <img className="rounded-lg" src={user?.profile}></img>
                }
                
              </div>

              {/* User Info & Primary Stats */}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                      <h1
                        className={`font-sans text-3xl font-bold tracking-tight`}
                        style={{
                          color: getContestColor(
                            contestStats?.contest_rating || 1200,
                          ),
                        }}
                      >
                        {user.username}
                      </h1>
                      {status === "Premium" && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500 font-mono text-[10px] font-bold uppercase tracking-widest rounded-[3px]">
                          Premium
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-2 font-mono text-sm font-bold"
                      style={{
                        color: getContestColor(contestStats?.contest_rating),
                      }}
                    >
                      {getContestRank(contestStats?.contest_rating)}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase mt-2">
                      Joined {joinedYear}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="font-mono disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col gap-1.5">
                    <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Global Rank
                    </p>
                    <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                      #{rank}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col gap-1.5">
                    <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Solved
                    </p>
                    <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                      {statsLoading ? "..." : solvedCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col gap-1.5">
                    <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Acceptance
                    </p>
                    <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                      {acceptanceRate}%
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col gap-1.5">
                    <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Last Streak
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-1.5 font-mono text-xl font-bold text-slate-900 dark:text-white">
                      {stats?.current_streak || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== MIDDLE TIER: STATS & GRAPH ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problem Statistics */}
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Problem Overview
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center p-8 bg-slate-50 dark:bg-slate-950/50">
                <QuesCountCircle
                  easyTotal={easyProblems || 0}
                  medTotal={mediumProblems || 0}
                  hardTotal={hardProblems || 0}
                  easySolved={stats?.easy_solved}
                  medSolved={stats?.medium_solved}
                  hardSolved={stats?.hard_solved}
                  attempts={stats?.total_submissions}
                  ac_attempts={stats?.successful_submissions}
                />
              </div>
            </div>

            {/* Contest Rating Graph */}
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    Contest Rating
                  </span>
                </div>
                {contestStats?.is_banned ? (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-mono text-[10px] font-bold rounded-[3px] uppercase tracking-widest border border-red-200 dark:border-red-800/30">
                    Banned
                  </span>
                ) : (
                  <></>
                )}
              </div>

              <div className="p-5 pb-0">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-4xl font-bold text-slate-900 dark:text-white">
                    {ratingLoading ? "..." : contestStats?.contest_rating || 0}
                  </span>
                  {ratingHistory.length > 0 && (
                    <span
                      className={`font-mono text-sm font-bold tracking-wider ${ratingHistory[ratingHistory.length - 1].rating_change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {ratingHistory[ratingHistory.length - 1].rating_change >=
                      0
                        ? "▲"
                        : "▼"}{" "}
                      {Math.abs(
                        ratingHistory[ratingHistory.length - 1].rating_change,
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 h-[260px] w-full mt-auto bg-white dark:bg-slate-900">
                {ratingLoading ? (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-slate-400 uppercase">
                    Loading Graph...
                  </div>
                ) : (
                  <RatingGraph history={ratingHistory} />
                )}
              </div>
            </div>
          </div>

          {/* ===== ACTIVITY / BADGES ===== */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-block w-[3px] h-[14px] rounded-sm ${showBadges ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`}
                />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  {showBadges ? "Your Badges" : "Activity Heatmap (3 Months)"}
                </span>
              </div>
              <button
                onClick={() => setShowBadges(!showBadges)}
                className="font-mono text-[10px] font-semibold tracking-[0.06em] bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-[3px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase"
              >
                {showBadges ? "View Activity" : "View Badges"}
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center sm:items-start overflow-hidden">
              {showBadges ? (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 min-h-[160px] w-full">
                  {badgesLoading ? (
                    <div className="font-mono text-[11px] text-slate-400 uppercase tracking-widest w-full text-center">
                      Loading Badges...
                    </div>
                  ) : badgeList?.length ? (
                    badgeList.map((badge) => (
                      <div
                        key={badge.badge_id}
                        title={`${badge.name} • Earned on ${new Date(badge.earned_at).toLocaleDateString()}`}
                        className="p-4 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 cursor-help"
                      >
                        <img
                          src={`/badges/${badge.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                          alt={badge.name}
                          className="h-16 w-auto object-contain"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/80?text=Badge";
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center w-full">
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase">
                        No badges earned yet.
                      </p>
                      <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500 mt-2">
                        Keep solving problems to unlock them!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                renderHeatmap()
              )}
            </div>
          </div>

          {/* ===== RECENT ACCEPTED SUBMISSIONS ===== */}
          <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Recently Accepted Submissions
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {recentLoading ? (
                <div className="p-8 text-center font-mono text-[11px] text-slate-400 uppercase tracking-widest">
                  Loading...
                </div>
              ) : recentAC.length === 0 ? (
                <div className="p-10 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  No accepted submissions yet.
                </div>
              ) : (
                <table className="w-full border-collapse whitespace-nowrap text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                        Problem
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                        Lang
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                        Verdict
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                        Time
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                        Memory
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {recentAC.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/problemset/${s.problem_id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3">
                          <span className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {s.problem_title}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {s.language}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Accepted
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {s.runtime_ms || 0} ms
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {s.memory_kb || 0} KB
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-500">
                          {new Date(s.submitted_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {user?.role === "owner" ? (
        <div className="w-full flex flex-col bg-slate-50 dark:bg-slate-950 justify-center items-center pb-16">
          <div className="w-[73%] max-w-6xl bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col mb-6">
            {/* Panel Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-t-md">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Control Panel ({user?.role})
              </span>
            </div>

            <div className="p-5 flex flex-col gap-6">
              {/* Fetch Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchExternal();
                }}
                className="flex flex-col sm:flex-row items-start sm:items-end gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Fetch User
                  </label>
                  <input
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-1.5 text-[11px] font-mono outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors w-full sm:w-64"
                    value={fetchUsername}
                    onChange={(e) => setFetchUsername(e.target.value)}
                    required
                    type="text"
                    placeholder="Enter username..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={fetchLoading}
                  className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-slate-950 border-none px-6 py-1.5 hover:opacity-85 h-[30px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchLoading ? "FETCHING..." : "FETCH →"}
                </button>
              </form>

              {/* Fetched User Results */}
              {fetchedUser != null && (
                <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col mt-2">
                  {/* Result Header & Clear Action */}
                  <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-md">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                        User Details
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFetchedUser(null);
                        setFetchUsername("");
                        setFetchedUserNewRole("user");
                      }}
                      className="font-mono text-[10px] font-semibold tracking-[0.06em] bg-transparent text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-[3px] hover:border-red-500 dark:hover:border-red-500 transition-colors uppercase cursor-pointer"
                    >
                      Clear [X]
                    </button>
                  </div>

                  {/* Information Grid */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        ID
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {fetchedUser.id}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Username
                      </span>
                      <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">
                        {fetchedUser.username}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Email
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {fetchedUser.email}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Role
                      </span>
                      <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {fetchedUser.role}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Contest Rating
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {fetchedUser.contest_rating || 1200}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Contest Global Rank
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {fetchedUser.contest_global_rank || "--"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Banned Status
                      </span>
                      {fetchedUser.is_banned ? (
                        <span className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold rounded-[3px] border border-red-200 dark:border-red-800/30 uppercase tracking-[0.1em]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
                          Yes
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                          No
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        Created At
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {new Date(fetchedUser.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Form */}
                  <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-md">
                    <div className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-4">
                      Administrative Actions
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateUserDetails();
                      }}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
                    >
                      {/* Custom Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={updateBanStatus}
                            onChange={(e) =>
                              setUpdateBanStatus(e.target.checked)
                            }
                          />
                          <div className="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded-[3px] bg-slate-50 dark:bg-slate-950 peer-checked:bg-red-500 peer-checked:border-red-500 transition-colors" />
                          <svg
                            className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                          Ban User
                        </span>
                      </label>

                      {/* Styled Select Dropdown */}
                      <div className="flex items-center gap-3">
                        <label className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                          Update Role
                        </label>
                        <select
                          value={fetchedUserNewRole}
                          onChange={(e) =>
                            setFetchedUserNewRole(e.target.value)
                          }
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-1 text-[11px] font-mono outline-none focus:border-orange-500 transition-colors cursor-pointer uppercase tracking-widest"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option disabled value="owner">
                            Owner
                          </option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={detailUpdateLoading}
                        className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-red-500 text-slate-950 border-none px-6 py-1.5 hover:opacity-85 h-[30px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {detailUpdateLoading ? "UPDATING..." : "UPDATE →"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user}
        onUpdate={() => window.location.reload()} // Easy way to refresh the newly uploaded image
      />
  
    </>
  );
}