import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import QuesCountCircle from "../components/QuesCountCircle";
import EditProfileModal from "../components/EditProfileModal";
import AdminControlPanel from "../components/AdminControlPanel";

// ==========================================
// 1. RATING GRAPH COMPONENT
// ==========================================
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 font-mono text-[11px] tracking-[0.08em] uppercase">
        [ NO RATED CONTESTS FOUND ]
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
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
        </linearGradient>
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
              className="stroke-slate-200 dark:stroke-slate-800/80"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="8"
              y={y - 6}
              fontSize="9"
              className="fill-slate-400 dark:fill-slate-500 font-mono tracking-widest"
            >
              {val}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#ratingArea)" />
      {/* Removed glow filter for a sharper, utilitarian look */}
      <path
        d={linePath}
        fill="none"
        stroke="#f97316"
        strokeWidth="1.5"
      />

      {history.map((entry, idx) => (
        <circle
          key={idx}
          cx={getX(idx)}
          cy={getY(entry.rating_after)}
          r="3.5"
          className="fill-white dark:fill-[#0d1117] stroke-orange-500 hover:r-[5px] hover:fill-orange-500 transition-all duration-200 cursor-pointer"
          strokeWidth="1.5"
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    start.setMonth(today.getMonth() - 3);

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

        const dayOfWeek = cur.getDay();
        for (let i = 0; i < dayOfWeek; i++) {
          currentGroup.days.push(null);
        }
      }
      currentGroup.days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const getColor = (count) => {
      if (count === 0) return "bg-slate-200 dark:bg-slate-800";
      if (count <= 2) return "bg-[#9be9a8] dark:bg-[#0e4429]";
      if (count <= 5) return "bg-[#40c463] dark:bg-[#006d32]";
      if (count <= 8) return "bg-[#30a14e] dark:bg-[#26a641]";
      return "bg-[#216e39] dark:bg-[#39d353]";
    };

    return (
      <div className="flex flex-col w-full overflow-hidden">
        <div className="flex gap-1.5 justify-center items-center overflow-x-auto pb-4 custom-scrollbar">
          {monthGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-2 min-w-max">
              <span className="font-mono text-[9px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                {group.label}
              </span>
              <div className="grid grid-rows-7 grid-flow-col gap-1">
                {group.days.map((day, dIdx) => {
                  if (!day)
                    return (
                      <div
                        key={`pad-${idx}-${dIdx}`}
                        className="w-[11px] h-[11px] rounded-[1px] bg-transparent"
                      />
                    );
                  const count = activityMap[day] || 0;
                  return (
                    <div
                      key={day}
                      title={`${day}: ${count} submissions`}
                      className={`w-[11px] h-[11px] rounded-[2px] ${getColor(count)} hover:ring-1 hover:ring-orange-500 transition-all cursor-pointer`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 w-full flex items-center justify-end gap-1.5 font-mono text-[9px] text-slate-500 uppercase">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-[11px] h-[11px] rounded-[2px] bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]"></div>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#40c463] dark:bg-[#006d32]"></div>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]"></div>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#216e39] dark:bg-[#39d353]"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    );
  };

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (statsLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING DASHBOARD...
        </span>
      </div>
    );
  }

  const joinedYear = user.created_at ? new Date(user.created_at).getFullYear() : "—";
  const solvedCount = stats?.total_solved ?? 0;
  const rank = stats?.global_rank ?? "—";
  const acceptanceRate = stats?.acceptance_rate ?? "—";
  const status = user?.is_premium == true ? "Premium" : "Regular";
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="min-h-[calc(100vh-56px)] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 font-sans transition-colors duration-300">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
          
          {/* TWO COLUMN GRID LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* ================= LEFT COLUMN: PROFILE & SUMMARY ================= */}
            <div className="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0">
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="w-24 h-24 rounded-[3px] flex items-center justify-center font-sans text-4xl font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-sm mb-4 overflow-hidden">
                    {!(user?.profile) ? user.username.charAt(0).toUpperCase() : <img className="w-full h-full object-cover" src={user?.profile} alt={user.username} />}
                  </div>
                  <h1 
                    className="font-sans text-2xl font-bold tracking-tight text-center"
                    style={{ color: getContestColor(contestStats?.contest_rating || 1200) }}
                  >
                    {user.username}
                  </h1>
                  <p 
                    className="font-mono text-[11px] font-bold tracking-widest uppercase mt-1 text-center"
                    style={{ color: getContestColor(contestStats?.contest_rating) }}
                  >
                    {getContestRank(contestStats?.contest_rating)}
                  </p>
                  
                  {status === "Premium" && (
                    <div className="mt-3 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-500 font-mono text-[9px] font-bold uppercase tracking-widest rounded-[3px]">
                      PRO ACCESS
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-[#0d1117] flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Joined {joinedYear}
                  </span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="font-mono text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-[3px] hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    EDIT PROFILE
                  </button>
                </div>
              </div>

              {/* 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-[#0d1117] p-5 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Rank</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">#{rank}</p>
                </div>
                <div className="bg-white dark:bg-[#0d1117] p-5 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Solved</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{solvedCount}</p>
                </div>
                <div className="bg-white dark:bg-[#0d1117] p-5 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Acceptance</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{acceptanceRate}%</p>
                </div>
                <div className="bg-white dark:bg-[#0d1117] p-5 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Streak</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{stats?.current_streak || 0}</p>
                </div>
              </div>

              {/* Problem Overview Card */}
              <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Problem Overview
                  </span>
                </div>
                <div className="p-6 flex justify-center items-center">
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
            </div>

            {/* ================= RIGHT COLUMN: DATA & DETAILS ================= */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              
              {/* Contest Rating Graph */}
              <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      Contest Rating History
                    </span>
                  </div>
                  {contestStats?.is_banned && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-mono text-[9px] font-bold rounded-[3px] uppercase tracking-widest border border-red-200 dark:border-red-800/30">
                      BANNED
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-baseline gap-3 px-2">
                    <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                      {ratingLoading ? "..." : contestStats?.contest_rating || 0}
                    </span>
                    {ratingHistory.length > 0 && (
                      <span className={`font-mono text-[12px] font-bold tracking-widest ${ratingHistory[ratingHistory.length - 1].rating_change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {ratingHistory[ratingHistory.length - 1].rating_change >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(ratingHistory[ratingHistory.length - 1].rating_change)}
                      </span>
                    )}
                  </div>
                  
                  <div className="h-[220px] w-full">
                    {ratingLoading ? (
                      <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                        [ Loading Graph Data ]
                      </div>
                    ) : (
                      <RatingGraph history={ratingHistory} />
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Heatmap / Badges */}
              <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${showBadges ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      {showBadges ? "Acquired Badges" : "Activity Tracker (3 Months)"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBadges(!showBadges)}
                    className="font-mono text-[9px] font-bold tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-[3px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors uppercase cursor-pointer"
                  >
                    {showBadges ? "VIEW HEATMAP" : "VIEW BADGES"}
                  </button>
                </div>

                <div className="p-6 flex flex-col items-center justify-center sm:items-start min-h-[180px] overflow-hidden">
                  {showBadges ? (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 w-full">
                      {badgesLoading ? (
                        <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest w-full text-center">
                          LOADING BADGES...
                        </div>
                      ) : badgeList?.length ? (
                        badgeList.map((badge) => (
                          <div
                            key={badge.badge_id}
                            title={`${badge.name} • Earned on ${new Date(badge.earned_at).toLocaleDateString()}`}
                            className="p-3 border border-slate-200 dark:border-slate-800 rounded-[3px] bg-slate-50 dark:bg-slate-900 cursor-help transition-colors hover:border-amber-500/50"
                          >
                            <img
                              src={`/badges/${badge.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                              alt={badge.name}
                              className="h-12 w-auto object-contain drop-shadow-sm"
                              onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=Badge"; }}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-center w-full py-6">
                          <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-500 tracking-widest uppercase mb-1.5">
                            [ NO BADGES ACQUIRED ]
                          </p>
                          <p className="font-sans text-[13px] text-slate-400">
                            Participate in events and solve problems to earn badges.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    renderHeatmap()
                  )}
                </div>
              </div>

              {/* Recent AC Submissions */}
              <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col flex-1">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Recent Verified Submissions
                  </span>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[350px] custom-scrollbar">
                  {recentLoading ? (
                    <div className="p-8 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      LOADING SUBMISSIONS...
                    </div>
                  ) : recentAC.length === 0 ? (
                    <div className="p-10 text-center font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      [ NO VERIFIED SUBMISSIONS FOUND ]
                    </div>
                  ) : (
                    <table className="w-full border-collapse whitespace-nowrap text-left">
                      <thead className="bg-slate-100/50 dark:bg-slate-900/30 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
                        <tr>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase">Problem</th>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase text-center">Lang</th>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase text-center">Verdict</th>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase text-right">Time</th>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase text-right">Mem</th>
                          <th className="px-4 py-2.5 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentAC.map((s) => (
                          <tr
                            key={s.id}
                            onClick={() => navigate(`/problemset/${s.problem_id}`)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3">
                              <span className="font-sans text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                                {s.problem_title}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {s.language}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex font-mono text-[9px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-500">
                                AC
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              {s.runtime_ms || 0} ms
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              {s.memory_kb || 0} KB
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-500 dark:text-slate-500">
                              {new Date(s.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
        </div>
      </div>

      <AdminControlPanel user={user}/>
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user}
        onUpdate={() => window.location.reload()} 
      />
    </>
  );
}