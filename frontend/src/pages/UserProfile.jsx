import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

// ==========================================
// 1. REMASTERED RATING GRAPH COMPONENT
// ==========================================
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold">
        No rated contests
      </div>
    );
  }

  // Internal SVG coordinate system
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 30;
  const paddingY = 30;
  
  // Dynamically calculate view boundaries based on user rating history
  const minVal = Math.min(1000, ...history.map(x => x.rating_after)) - 50;
  const maxVal = Math.max(2000, ...history.map(x => x.rating_after)) + 50;
  const yRange = maxVal - minVal;

  const getY = (val) => svgHeight - paddingY - ((val - minVal) / yRange) * (svgHeight - 2 * paddingY);
  const getX = (idx) => history.length === 1 
    ? svgWidth / 2 
    : paddingX + (idx / (history.length - 1)) * (svgWidth - 2 * paddingX);

  // Modernized Rank Color Bands
  const CF_BANDS = [
    { min: 0, max: 1199, color: "#94a3b8" }, // Gray
    { min: 1200, max: 1399, color: "#4ade80" }, // Green
    { min: 1400, max: 1599, color: "#2dd4bf" }, // Cyan
    { min: 1600, max: 1899, color: "#818cf8" }, // Blue
    { min: 1900, max: 2099, color: "#d946ef" }, // Violet
    { min: 2100, max: 2399, color: "#fb923c" }, // Orange
    { min: 2400, max: 4000, color: "#f87171" }, // Red
  ];

  // Generate SVG Paths
  const linePath = history.length === 1 
    ? `M0,${getY(history[0].rating_after)} L${svgWidth},${getY(history[0].rating_after)}` 
    : `M${history.map((hData, i) => `${getX(i)},${getY(hData.rating_after)}`).join(" L")}`;

  const areaPath = history.length === 1
    ? `${linePath} L${svgWidth},${svgHeight} L0,${svgHeight} Z`
    : `${linePath} L${getX(history.length - 1)},${svgHeight} L${getX(0)},${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full block font-['verdana','arial','sans-serif']">
      <defs>
        <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Draw Background Bands */}
      {CF_BANDS.map((band, i) => {
        const topY = Math.max(0, getY(band.max));
        const bottomY = Math.min(svgHeight, getY(band.min));
        if (bottomY <= 0 || topY >= svgHeight || bottomY - topY <= 0) return null;
        return (
          <rect key={i} x="0" y={topY} width={svgWidth} height={bottomY - topY} fill={band.color} opacity="0.08" className="dark:opacity-[0.12]" />
        );
      })}

      {/* Draw Horizontal Grid Lines & Y-Axis Labels */}
      {[1200, 1400, 1600, 1900, 2100, 2400].map((val) => {
        const y = getY(val);
        if (y < 12 || y > svgHeight - 12) return null;
        return (
          <g key={val}>
            <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" opacity="0.4" strokeDasharray="4 4" />
            <text x="8" y={y - 6} fontSize="12" fill="currentColor" className="text-slate-400 dark:text-slate-500 font-bold tracking-tight">
              {val}
            </text>
          </g>
        );
      })}

      {/* Area Under Line */}
      <path d={areaPath} fill="url(#ratingArea)" />

      {/* The Golden Trend Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#eab308"
        strokeWidth="3"
        filter="url(#glow)"
      />

      {/* Data Points with Hover Tooltips */}
      {history.map((entry, idx) => (
        <circle 
          key={idx} 
          cx={getX(idx)} 
          cy={getY(entry.rating_after)} 
          r="4.5" 
          fill="var(--bg-point, #fff)" 
          stroke="#eab308" 
          strokeWidth="2.5" 
          className="dark:[--bg-point:#0f172a] hover:r-[6px] hover:stroke-2 hover:fill-[#eab308] transition-all duration-200 cursor-pointer"
        >
          <title>{`Rating: ${entry.rating_after} (${entry.rating_change > 0 ? '+' : ''}${entry.rating_change})\nRank: ${entry.final_rank}`}</title>
        </circle>
      ))}
    </svg>
  );
};

// ==========================================
// 2. MAIN PROFILE COMPONENT
// ==========================================
export default function UserProfile() {
  const { username } = useParams();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/profile/${username}`);
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  // Modernized Tailwind Colors Based on Codeforces Rating
  const getRatingStyle = (rating) => {
    if (!rating || rating < 1200) return { color: "text-slate-500 dark:text-slate-400", title: "Newbie" };
    if (rating >= 1200 && rating < 1400) return { color: "text-green-600 dark:text-green-500", title: "Pupil" };
    if (rating >= 1400 && rating < 1600) return { color: "text-teal-600 dark:text-teal-500", title: "Specialist" };
    if (rating >= 1600 && rating < 1900) return { color: "text-blue-600 dark:text-blue-500", title: "Expert" };
    if (rating >= 1900 && rating < 2100) return { color: "text-fuchsia-600 dark:text-fuchsia-500", title: "Candidate Master" };
    if (rating >= 2100 && rating < 2400) return { color: "text-orange-500 dark:text-orange-400", title: "Master" };
    return { color: "text-red-600 dark:text-red-500", title: "Grandmaster" };
  };

  // Inline Heatmap Generator (Modernized)
  const renderHeatmap = () => {
    if (!profile?.heatmap) return null;
    
    // Map dates to counts for O(1) lookup
    const activityMap = {};
    profile.heatmap.forEach(d => {
      activityMap[d.day.slice(0, 10)] = d.count;
    });

    const days = [];
    const today = new Date();
    const start = new Date();
    start.setMonth(today.getMonth() - 6); // Look back exactly 6 months

    const cur = new Date(start);
    while (cur <= today) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const getColor = (count) => {
      if (count === 0) return "bg-slate-200 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700/50";
      if (count <= 2) return "bg-[#9be9a8] dark:bg-[#0e4429] border-[#79c386] dark:border-[#135434]";
      if (count <= 5) return "bg-[#40c463] dark:bg-[#006d32] border-[#319e4d] dark:border-[#02823d]";
      if (count <= 8) return "bg-[#30a14e] dark:bg-[#26a641] border-[#25823c] dark:border-[#30c24e]";
      return "bg-[#216e39] dark:bg-[#39d353] border-[#18542a] dark:border-[#4be866]";
    };

    return (
      <div className="flex flex-wrap gap-[3px] mt-2 max-h-[120px] flex-col overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {days.map(day => {
          const count = activityMap[day] || 0;
          return (
            <div 
              key={day} 
              title={`${day}: ${count} submissions`}
              className={`w-[13px] h-[13px] rounded-[2px] border ${getColor(count)} cursor-pointer hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-['verdana','arial','sans-serif'] text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading User Profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-['verdana','arial','sans-serif'] text-sm">
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-center shadow-sm">
          <div className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</div>
          <Link to="/contests" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors">
            &larr; Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Destructure Data
  const { user_info, general_stats, contest_stats, rating_history } = profile;
  const rating = contest_stats?.contest_rating || 0;
  const { color: ratingColor, title: rankTitle } = getRatingStyle(rating);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['verdana','arial','sans-serif'] pb-16">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-6">
        
        {/* --- LEFT COLUMN (Profile Cards) --- */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Identity Box */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
            <h1 className={`text-2xl font-bold ${ratingColor} mb-1 tracking-tight`}>
              {user_info.username}
            </h1>
            <p className={`font-bold text-sm ${ratingColor}`}>
              {rankTitle}
            </p>
            {user_info.is_banned && (
              <div className="mt-3 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xs rounded-md border border-red-200 dark:border-red-800/30 inline-flex items-center gap-1.5 uppercase tracking-wide">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Account Banned
              </div>
            )}
            <div className="text-slate-500 dark:text-slate-400 text-xs mt-4 font-bold">
              Joined {new Date(user_info.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Platform Stats
              </h3>
            </div>
            <div className="p-5 text-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Problems Solved:</span>
                <span className="font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded border border-green-100 dark:border-green-800/30">
                  {general_stats?.total_solved || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Global Rank:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {general_stats?.global_rank ? `#${general_stats.global_rank}` : "Unranked"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Acceptance Rate:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {general_stats?.acceptance_rate || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Arena Stats */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Arena Stats
              </h3>
            </div>
            <div className="p-5 text-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Contest Rating:</span>
                <span className={`font-bold ${ratingColor} bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700`}>
                  {rating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Arena Rank:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {contest_stats?.contest_global_rank ? `#${contest_stats.contest_global_rank}` : "Unranked"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Participated:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {contest_stats?.contests_participated || 0}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN (Visualizations) --- */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Rating Graph */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                Contest Rating History
              </h3>
            </div>
            <div className="p-5 h-[340px] w-full bg-[#f8fafc] dark:bg-[#0f172a]">
              {rating_history.length > 0 ? (
                <RatingGraph history={rating_history} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-bold gap-3">
                  <svg className="w-12 h-12 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  No rated contests found for this user.
                </div>
              )}
            </div>
          </div>

          {/* Submission Heatmap */}
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Activity Heatmap (6 Months)
              </h3>
            </div>
            <div className="p-6 bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden">
              {renderHeatmap()}
              <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 pr-2">
                <span>Less</span>
                <div className="flex gap-[3px]">
                  <div className="w-3 h-3 rounded-[2px] bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/50"></div>
                  <div className="w-3 h-3 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429] border border-[#79c386] dark:border-[#135434]"></div>
                  <div className="w-3 h-3 rounded-[2px] bg-[#40c463] dark:bg-[#006d32] border border-[#319e4d] dark:border-[#02823d]"></div>
                  <div className="w-3 h-3 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641] border border-[#25823c] dark:border-[#30c24e]"></div>
                  <div className="w-3 h-3 rounded-[2px] bg-[#216e39] dark:bg-[#39d353] border border-[#18542a] dark:border-[#4be866]"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}