import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

// ==========================================
// 1. REMASTERED RATING GRAPH COMPONENT
// ==========================================
const RatingGraph = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-[11px] font-mono tracking-wider uppercase">
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
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full block font-mono">
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
            <line x1="0" y1={y} x2={svgWidth} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="4 4" />
            <text x="8" y={y - 6} fontSize="10" className="fill-slate-500 dark:fill-slate-400 font-mono tracking-widest">
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
        stroke="#f59e0b"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Data Points with Hover Tooltips */}
      {history.map((entry, idx) => (
        <circle 
          key={idx} 
          cx={getX(idx)} 
          cy={getY(entry.rating_after)} 
          r="4" 
          className="fill-white dark:fill-slate-900 stroke-amber-500 hover:r-[5px] hover:stroke-[2.5px] hover:fill-amber-500 transition-all duration-200 cursor-pointer"
          strokeWidth="2" 
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
    if (rating >= 1600 && rating < 1900) return { color: "text-blue-600 dark:text-blue-400", title: "Expert" };
    if (rating >= 1900 && rating < 2100) return { color: "text-fuchsia-600 dark:text-fuchsia-400", title: "Candidate Master" };
    if (rating >= 2100 && rating < 2400) return { color: "text-orange-500 dark:text-orange-400", title: "Master" };
    return { color: "text-red-600 dark:text-red-500", title: "Grandmaster" };
  };

  // Grouped and Solid Heatmap Generator
  const renderHeatmap = () => {
    if (!profile?.heatmap) return null;
    
    // Map dates to counts for O(1) lookup
    const activityMap = {};
    profile.heatmap.forEach(d => {
      activityMap[d.day.slice(0, 10)] = d.count;
    });

    const monthGroups = [];
    let currentMonth = null;
    let currentGroup = null;

    const today = new Date();
    const start = new Date();
    start.setMonth(today.getMonth() - 6); // Look back exactly 6 months

    const cur = new Date(start);
    while (cur <= today) {
      const m = cur.getMonth();
      if (m !== currentMonth) {
        currentMonth = m;
        currentGroup = {
          label: cur.toLocaleString('en-US', { month: 'short' }),
          days: []
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
      if (count === 0) return "bg-slate-200 dark:bg-slate-800/60";
      if (count <= 2) return "bg-[#9be9a8] dark:bg-[#0e4429]";
      if (count <= 5) return "bg-[#40c463] dark:bg-[#006d32]";
      if (count <= 8) return "bg-[#30a14e] dark:bg-[#26a641]";
      return "bg-[#216e39] dark:bg-[#39d353]";
    };

    return (
      <div className="flex flex-col w-full">
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {monthGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {group.label}
              </span>
              {/* h-[116px] perfectly accommodates 7 rows of 14px blocks with 3px gaps */}
              <div className="flex flex-col flex-wrap gap-[3px] h-[116px]">
                {group.days.map((day, dIdx) => {
                  if (!day) return <div key={`pad-${idx}-${dIdx}`} className="w-[14px] h-[14px]" />;
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
            <div className="w-[14px] h-[14px] bg-slate-100 dark:bg-slate-800/60"></div>
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
          LOADING USER PROFILE...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="px-6 py-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md text-center shadow-sm">
          <div className="font-mono text-[11px] text-red-600 dark:text-red-400 tracking-[0.1em] uppercase font-bold">{error}</div>
        </div>
        <Link 
          to="/contests" 
          className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded transition-colors bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-6 py-2 shadow-sm"
        >
          ← RETURN TO HOME
        </Link>
      </div>
    );
  }

  // Destructure Data
  const { user_info, general_stats, contest_stats, rating_history } = profile;
  const rating = contest_stats?.contest_rating || 0;
  const { color: ratingColor, title: rankTitle } = getRatingStyle(rating);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-6xl mx-auto py-10 px-6 flex flex-col md:flex-row gap-8">
          
          {/* --- LEFT COLUMN (Profile Cards) --- */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-5">
            
            {/* Identity Box */}
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
              
              <h1 className={`font-sans text-2xl font-bold ${ratingColor} mb-1.5`}>
                {user_info.username}
              </h1>
              <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${ratingColor}`}>
                {rankTitle}
              </p>
              
              {user_info.is_banned && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold rounded-sm border border-red-200 dark:border-red-800/30 uppercase tracking-[0.1em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
                  BANNED
                </div>
              )}
              
              <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em] mt-5">
                Joined {new Date(user_info.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Platform Stats</span>
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Solved</span>
                  <span className="font-mono text-[12px] font-bold text-green-600 dark:text-green-500">
                    {general_stats?.total_solved || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Global Rank</span>
                  <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    {general_stats?.global_rank ? `#${general_stats.global_rank}` : "Unranked"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Acceptance</span>
                  <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    {general_stats?.acceptance_rate || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Arena Stats */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Contest Stats</span>
              </div>
              <div className="p-4 flex flex-col gap-1.5">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Rating</span>
                  <span className={`font-mono text-[12px] font-bold ${ratingColor}`}>
                    {rating}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Arena Rank</span>
                  <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    {contest_stats?.contest_global_rank ? `#${contest_stats.contest_global_rank}` : "Unranked"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">Participated</span>
                  <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    {contest_stats?.contests_participated || 0}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (Visualizations) --- */}
          <div className="flex-1 flex flex-col gap-8">
            
            {/* Rating Graph */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Contest Rating Graph</span>
              </div>
              <div className="p-5 h-[340px] w-full bg-slate-50 dark:bg-slate-950">
                {rating_history.length > 0 ? (
                  <RatingGraph history={rating_history} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-mono text-[11px] tracking-[0.08em] uppercase gap-3">
                    NO RATED CONTESTS FOUND.
                  </div>
                )}
              </div>
            </div>

            {/* Submission Heatmap */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">Activity Heatmap (6 Months)</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col items-center sm:items-start">
                {renderHeatmap()}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}