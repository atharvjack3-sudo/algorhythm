import React, { useState, useEffect } from "react";
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
    console.log(d.day.slice(0, 10));
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

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
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
  console.log(stats);

  const status = user?.is_premium == true ? "Premium" : "Regular";

  function getColor(count) {
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-cyan-200";
    if (count <= 3) return "bg-cyan-400";
    if (count <= 6) return "bg-cyan-500";
    return "bg-cyan-600";
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
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div
              className={`w-24 h-24 rounded-full bg-linear-to-br ${
                status === "Premium"
                  ? "from-yellow-200 to-yellow-500"
                  : "from-cyan-400 to-blue-500"
              } flex items-center justify-center text-4xl font-bold text-white shadow-lg`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-left text-center font-bold text-gray-900">
                    {user.username}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Member since {joinedYear}
                  </p>
                  {status === "Premium" ? (
                    <p className="mt-1 font-semibold text-xs w-full flex justify-center items-center h-7">
                      <p className="w-30 text-yellow-700 bg-yellow-100 border-3 py-1 text-center border-yellow-400 rounded-lg">{status || 0}</p>
                    </p>
                  ) : (
                    <p></p>
                  )}
                </div>
                <button className="px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition">
                  Profile Settings
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Global Rank</p>
                  <p className="text-2xl font-bold text-gray-900">#{rank}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Problems Solved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "—" : solvedCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Acceptance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {acceptanceRate}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Ongoing Streak</p>
                  <p className="text-2xl font-bold capitalize">
                    {stats?.current_streak || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Problem Statistics */}
          <div className="rounded-2xl shadow-sm border w-[88vw] md:w-auto border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Problem Statistics
            </h2>
            <div className="flex justify-center">
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

          {/* Activity Section */}
          <div className="w-[88vw] md:w-auto rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {showBadges ? "Your Badges" : "Your Activity"}
              </h2>
              <button
                onClick={() => setShowBadges(!showBadges)}
                className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition"
              >
                {showBadges ? "Show Activity" : "Show Badges"}
              </button>
            </div>

            <div className="min-h-50 flex overflow-x-auto items-center justify-center">
              {showBadges ? (
                <div className="text-center text-gray-400">
                  {badgeList?.length ? (
                    badgeList.map((badge) => (
                      <div
                        key={badge.badge_id}
                        title={`${badge.name} • Earned on ${new Date(
                          badge.earned_at
                        ).toLocaleDateString()}`}
                      >
                        <img
                          src={`/badges/${badge.name
                            .toLowerCase()
                            .replace(/\s+/g, "-")}.png`}
                          alt={badge.name}
                          className="h-35"
                        />
                      </div>
                    ))
                  ) : (
                    <p>No badges yet</p>
                  )}
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="flex gap-6 justify-center min-w-max px-4">
                    {Object.entries(daysByMonth).map(([month, monthDays]) => (
                      <div
                        key={month}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="text-xs font-medium text-gray-500">
                          {month}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {monthDays.map((day) => {
                            const count = activityMap[day] || 0;
                            return (
                              <div
                                key={day}
                                title={`${day}: ${count} submissions`}
                                className={`w-3 h-3 rounded-sm ${getColor(
                                  count
                                )} transition-all hover:ring-2 hover:ring-cyan-400 cursor-pointer`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                      <div className="w-3 h-3 rounded-sm bg-cyan-200"></div>
                      <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>
                      <div className="w-3 h-3 rounded-sm bg-cyan-500"></div>
                      <div className="w-3 h-3 rounded-sm bg-cyan-600"></div>
                    </div>
                    <span>More</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Accepted Submissions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Recently <span className="text-green-600">Accepted</span>
            </h2>
          </div>

          {recentLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-400">Loading submissions...</p>
            </div>
          ) : recentAC.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">
                No accepted submissions yet.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Start solving problems to see your progress here!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recentAC.map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {s.problem_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {s.language.toUpperCase()}
                        </span>
                        <span>{new Date(s.submitted_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>⚡ {s.runtime_ms || 0} ms</span>
                        <span>💾 {s.memory_kb || 0} KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-semibold">
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
  );
}
