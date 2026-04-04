import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import QuesCountCircle from "../components/QuesCountCircle";

export default function Dashboard() {
  const { user, loading } = useAuth();

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

  // New State for Contest Ratings
  const [contestStats, setContestStats] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [ratingLoading, setRatingLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        const res = await api.get("/userdetails", {
          params: { userId: user.id },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch Contest Rating Data
  useEffect(() => {
    if (!user?.id) return;

    const fetchContestData = async () => {
      try {
        const [statsRes, histRes] = await Promise.all([
          api.get(`/users/${user.id}/contest-stats`),
          api.get(`/users/${user.id}/contest-rating-history`),
        ]);
        setContestStats(statsRes.data);
        setRatingHistory(histRes.data.history || []);
      } catch (err) {
        console.error("Error fetching contest data:", err);
      } finally {
        setRatingLoading(false);
      }
    };

    fetchContestData();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBadges = async () => {
      try {
        const res = await api.get("/userbadges");
        setBadgeList(res.data);
      } catch (err) {
        console.error("Error fetching user badges:", err);
        setBadgeList([]);
      } finally {
        setBadgesLoading(false);
      }
    };

    fetchBadges();
  }, [user?.id]);

  useEffect(() => {
    if (!user || loading) return;
    const fetchHeatmap = async () => {
      const res = await api.get("/activity-heatmap");
      setHeatmap(res.data);
    };

    fetchHeatmap();
  }, [user, loading]);

  const activityMap = {};
  heatmap.forEach((d) => {
    activityMap[d.day.slice(0, 10)] = d.count;
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchRecentAC = async () => {
      try {
        const res = await api.get("/recent-accepted");
        setRecentAC(res.data);
      } catch (err) {
        console.error("Error fetching recent AC:", err);
        setRecentAC([]);
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecentAC();
  }, [user]);

  useEffect(() => {
    const fetchProblemStats = async () => {
      const res = await api.get("/get-platform-stats");
      setEasyProblems(res.data[0].easy_problems);
      setMediumProblems(res.data[0].medium_problems);
      setHardProblems(res.data[0].hard_problems);
    };
    fetchProblemStats();
  }, []);

  // Contest Rating Graph Calculation
  const altitudePath = useMemo(() => {
    if (ratingHistory.length === 0) return "M0,55 L120,55";
    if (ratingHistory.length === 1) {
      const y = 60 - ((ratingHistory[0].rating_after / 3000) * 50 + 5);
      return `M0,${y} L120,${y}`;
    }

    const widthPerPoint = 120 / Math.max(1, ratingHistory.length - 1);
    const points = ratingHistory.map((entry, i) => {
      const x = i * widthPerPoint;
      const y = 60 - ((entry.rating_after / 3000) * 50 + 5);
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  }, [ratingHistory]);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5f6368] font-medium">Loading your dashboard...</p>
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

  function getColor(count) {
    if (count === 0) return "bg-[#ebedf0]";
    if (count === 1) return "bg-[#9be9a8]";
    if (count <= 3) return "bg-[#40c463]";
    if (count <= 6) return "bg-[#30a14e]";
    return "bg-[#216e39]";
  }

  function getLast3MonthsDays() {
    const days = [];
    const today = new Date();
    const start = new Date();
    start.setMonth(today.getMonth() - 3);

    const cur = new Date(start);
    while (cur <= today) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    return days;
  }

  const days = getLast3MonthsDays();

  function groupDaysByMonth(days) {
    const map = {};
    days.forEach((day) => {
      const d = new Date(day);
      const monthKey = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!map[monthKey]) map[monthKey] = [];
      map[monthKey].push(day);
    });
    return map;
  }

  const daysByMonth = groupDaysByMonth(days);

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] font-sans text-[#202124]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ===== PROFILE HEADER ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dadce0] p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            
            {/* Avatar */}
            <div
              className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-sm flex-shrink-0 bg-gradient-to-br ${
                status === "Premium"
                  ? "from-amber-400 to-orange-500"
                  : "from-[#4285f4] to-[#1a73e8]"
              }`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* User Info & Primary Stats */}
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#202124]">
                      {user.username}
                    </h1>
                    {status === "Premium" && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider rounded-md">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-[#5f6368] text-[14px] mt-1">
                    Member since {joinedYear}
                  </p>
                </div>
                <button className="px-5 py-2 text-[14px] font-medium text-[#1a73e8] bg-white border border-[#dadce0] hover:bg-[#f8f9fa] hover:text-[#1557b0] rounded-md transition-colors shadow-sm">
                  Edit Profile
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1">Global Rank</p>
                  <p className="text-2xl font-bold text-[#202124]">#{rank}</p>
                </div>
                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1">Solved</p>
                  <p className="text-2xl font-bold text-[#202124]">
                    {statsLoading ? "—" : solvedCount}
                  </p>
                </div>
                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1">Acceptance</p>
                  <p className="text-2xl font-bold text-[#202124]">
                    {acceptanceRate}%
                  </p>
                </div>
                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1">Current Streak</p>
                  <div className="flex items-center gap-1.5 justify-center md:justify-start">
                    <span className="text-2xl font-bold text-[#202124]">
                      {stats?.current_streak || 0}
                    </span>
                    <span className="text-orange-500 text-lg">🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MIDDLE TIER: STATS & GRAPH ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Problem Statistics */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#dadce0] p-6 md:p-8 flex flex-col">
            <h2 className="text-[18px] font-medium text-[#202124] mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              Problem Overview
            </h2>
            <div className="flex-1 flex justify-center items-center">
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
          <div className="bg-white rounded-2xl shadow-sm border border-[#dadce0] p-6 md:p-8 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-[18px] font-medium text-[#202124] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Contest Rating
              </h2>
              {contestStats?.is_banned && (
                <span className="px-2.5 py-1 bg-[#fce8e6] text-[#d93025] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#fad2cf]">
                  Banned
                </span>
              )}
            </div>
            
            <div className="flex items-baseline gap-3 mb-6 relative z-20">
              <span className="text-4xl md:text-5xl font-bold text-[#202124]">
                {ratingLoading ? "..." : contestStats?.contest_rating || 0}
              </span>
              {ratingHistory.length > 0 && (
                <span className={`text-sm font-medium ${ratingHistory[ratingHistory.length - 1].rating_change >= 0 ? "text-[#1e8e3e]" : "text-[#d93025]"}`}>
                  {ratingHistory[ratingHistory.length - 1].rating_change >= 0 ? "▲" : "▼"} {Math.abs(ratingHistory[ratingHistory.length - 1].rating_change) + " Change"}
                </span>
              )}
            </div>

            {/* SVG Graph Layer */}
            <div className="relative flex-1 min-h-[140px] w-full mt-auto">
              <svg
                viewBox="0 0 120 60"
                className="w-full h-full absolute inset-0 z-10"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${altitudePath} L120,60 L0,60 Z`}
                  fill="url(#ratingGradient)"
                  className="transition-all duration-1000 ease-out"
                />
                <path
                  d={altitudePath}
                  fill="none"
                  stroke="#1a73e8"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>

        </div>

        {/* ===== ACTIVITY / BADGES ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dadce0] p-6 md:p-8 flex flex-col mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-medium text-[#202124] flex items-center gap-2">
              {showBadges ? (
                <><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 01.832.545l2.42 4.912 5.424.788a1 1 0 01.554 1.705l-3.926 3.826.926 5.402a1 1 0 01-1.45 1.054L10 17.143l-4.85 2.55a1 1 0 01-1.45-1.054l.926-5.402-3.926-3.826a1 1 0 01.554-1.705l5.424-.788 2.42-4.912A1 1 0 0110 2z" clipRule="evenodd" /></svg> Achievements</>
              ) : (
                <><svg className="w-5 h-5 text-[#34a853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Activity Heatmap</>
              )}
            </h2>
            <button
              onClick={() => setShowBadges(!showBadges)}
              className="px-4 py-1.5 text-[13px] font-medium bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#3c4043] rounded-full transition-colors"
            >
              {showBadges ? "View Activity" : "View Badges"}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center overflow-hidden">
            {showBadges ? (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {badgesLoading ? (
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : badgeList?.length ? (
                  badgeList.map((badge) => (
                    <div
                      key={badge.badge_id}
                      title={`${badge.name} • Earned on ${new Date(badge.earned_at).toLocaleDateString()}`}
                      className="p-3 border border-[#dadce0] rounded-xl hover:shadow-md transition-shadow bg-[#f8f9fa] cursor-help"
                    >
                      <img
                        src={`/badges/${badge.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                        alt={badge.name}
                        className="h-16 md:h-20 w-auto object-contain"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=Badge' }} 
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center w-full py-6">
                    <p className="text-[#5f6368] font-medium">No badges earned yet.</p>
                    <p className="text-[13px] text-[#80868b]">Keep solving problems to unlock achievements!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                <div className="flex gap-3 justify-center min-w-max px-2">
                  {Object.entries(daysByMonth).map(([month, monthDays]) => (
                    <div key={month} className="flex flex-col gap-1.5">
                      <div className="text-[11px] font-medium text-[#5f6368]">
                        {month}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {monthDays.map((day) => {
                          const count = activityMap[day] || 0;
                          return (
                            <div
                              key={day}
                              title={`${day}: ${count} submissions`}
                              className={`w-[13px] h-[13px] rounded-[3px] ${getColor(count)} hover:ring-2 hover:ring-offset-1 hover:ring-[#34a853] transition-all cursor-pointer`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-[#5f6368] font-medium pr-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#ebedf0]"></div>
                    <div className="w-3 h-3 rounded-sm bg-[#9be9a8]"></div>
                    <div className="w-3 h-3 rounded-sm bg-[#40c463]"></div>
                    <div className="w-3 h-3 rounded-sm bg-[#30a14e]"></div>
                    <div className="w-3 h-3 rounded-sm bg-[#216e39]"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RECENT ACCEPTED SUBMISSIONS ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dadce0] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-[#202124] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#34a853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Submissions
            </h2>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {recentLoading ? (
              <div className="divide-y divide-[#dadce0]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
                    <div className="space-y-3 w-1/2">
                      <div className="h-4 bg-[#e8eaed] rounded w-3/4"></div>
                      <div className="flex gap-2">
                        <div className="h-3 bg-[#e8eaed] rounded w-16"></div>
                        <div className="h-3 bg-[#e8eaed] rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-[#e8eaed] rounded-full w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentAC.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#dadce0]">
                  <svg className="w-8 h-8 text-[#dadce0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <p className="text-[#202124] font-medium">No accepted submissions yet.</p>
                <p className="text-[13px] text-[#5f6368] mt-1">Head over to the Problem Set to start solving!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#dadce0]">
                {recentAC.map((s) => (
                  <div
                    key={s.id}
                    className="px-6 py-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#202124] mb-1.5 group-hover:text-[#1a73e8] transition-colors">
                          {s.problem_title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#5f6368]">
                          <span className="px-2 py-0.5 bg-[#f1f3f4] border border-[#dadce0] rounded-md font-mono font-medium text-[#3c4043]">
                            {s.language}
                          </span>
                          <span className="flex items-center gap-1" title="Runtime">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {s.runtime_ms || 0} ms
                          </span>
                          <span className="flex items-center gap-1" title="Memory">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                            {s.memory_kb || 0} KB
                          </span>
                          <span className="text-[#80868b]">
                            • {new Date(s.submitted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6] rounded-md text-[12px] font-bold">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Accepted
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}