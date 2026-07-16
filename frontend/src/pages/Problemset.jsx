import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function ProblemSet() {
  const [problems, setProblems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);

  const [showAddToList, setShowAddToList] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);
  const [userLists, setUserLists] = useState([]);
  const [adding, setAdding] = useState(false);

  const [loading, setLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(false);
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [potdList, setPotdList] = useState([]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const potdMap = new Map();

  for (const potd of potdList) {
    const d = new Date(potd.date);
    potdMap.set(d.getDate(), potd);
  }

  const difficultyOptions = [
    { id: "easy", label: "Easy" },
    { id: "medium", label: "Medium" },
    { id: "hard", label: "Hard" },
  ];

  const navigate = useNavigate();
  const limit = 12;

  useEffect(() => {
    api.get("/topics").then((res) => {
      setAllTags(res.data);
    });
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchPOTDList = async () => {
      try {
        const res = await api.get("/potd-list");
        setPotdList(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPOTDList();
  }, [authLoading, user]);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await api.get("/problem-list", {
          params: {
            page,
            searchQuery,
            tags: selectedTags.join(","),
            difficulty: selectedDifficulties.join(","),
          },
        });

        setProblems(res.data.problems);
        setTotal(res.data.total);
      } catch (err) {
        console.error("Failed to fetch problems", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [page, searchQuery, selectedTags, selectedDifficulties]);

  const openAddToList = async (problem) => {
    setActiveProblem(problem);
    setShowAddToList(true);
    if (userLists.length > 0) {
      // setUserLists(userLists);
      return;
    }
    setListsLoading(true);

    try {
      const res = await api.get("/lists");
      setUserLists(res.data);
    } catch (err) {
      console.error("FETCH LISTS ERROR", err);
      setUserLists([]);
    } finally {
      setListsLoading(false);
    }
  };

  const addProblemToList = async (listId) => {
    if (!activeProblem) return;

    try {
      setAdding(true);
      await api.post(`/lists/${listId}/problems`, {
        problemId: activeProblem.id,
      });
      setShowAddToList(false);
      setActiveProblem(null);
    } catch (err) {
      console.error("ADD TO LIST ERROR", err);
    } finally {
      setAdding(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 bg-emerald-500/20";
      case "medium":
        return "text-amber-600 dark:text-amber-500 bg-amber-500/10 bg-amber-500/20";
      case "hard":
        return "text-red-600 dark:text-red-500 dark:bg-red-500/10 bg-red-500/20";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const totalPages = Math.ceil(total / limit);

  const SidebarContent = () => (
    <div className="flex flex-col gap-6 w-full">
      {/* Quick Navigation */}
      <div className="flex flex-col gap-2">
        <div className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">
          Workspace
        </div>
        <button
          onClick={() => navigate("/premium")}
          className="relative overflow-hidden flex items-center px-3 py-2 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#14171a] hover:border-orange-400 dark:hover:border-orange-500 rounded-[3px] transition-colors group text-left cursor-pointer"
        >
          <div className="absolute inset-y-0 -left-6 w-[55%] bg-orange-100 dark:bg-orange-500/20 -skew-x-12 group-hover:w-[85%] transition-all duration-600 ease-out z-0" />

          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="text-orange-500 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition-colors leading-tight">
                Pro Access
              </span>
              <span className="font-sans text-[9px] text-slate-500 mt-1">
                Upgrade
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/leaderboard")}
          className="relative overflow-hidden flex items-center px-3 py-2 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#14171a] hover:border-blue-400 dark:hover:border-blue-500 rounded-[3px] transition-colors group text-left cursor-pointer"
        >
          {/* Slanted Accent Background */}
          <div className="absolute inset-y-0 -left-6 w-[55%] bg-blue-100 dark:bg-blue-500/20 -skew-x-12 group-hover:w-[85%] transition-all duration-600 ease-out z-0" />

          {/* Content (Z-10 to stay above background) */}
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="text-blue-500 group-hover:scale-110 transition-transform">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors leading-tight">
                Leaderboards
              </span>
              <span className="font-sans text-[9px] text-slate-500 mt-1">
                Global Ranks
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/my-lists")}
          className="relative overflow-hidden flex items-center px-3 py-2 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#14171a] hover:border-emerald-400 dark:hover:border-emerald-500 rounded-[3px] transition-colors group text-left cursor-pointer"
        >
          {/* Slanted Accent Background */}
          <div className="absolute inset-y-0 -left-6 w-[55%] bg-emerald-100 dark:bg-emerald-500/20 -skew-x-12 group-hover:w-[85%] transition-all duration-600 ease-out z-0" />

          {/* Content (Z-10 to stay above background) */}
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="text-emerald-500 group-hover:scale-110 transition-transform">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors leading-tight">
                My Lists
              </span>
              <span className="font-sans text-[9px] text-slate-500 mt-1">
                Bookmarks
              </span>
            </div>
          </div>
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-col gap-4 border-slate-400 rounded-xs dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
            Filter Settings
          </div>
          {(selectedDifficulties.length > 0 || selectedTags.length > 0) && (
            <button
              onClick={() => {
                setSelectedTags([]);
                setSelectedDifficulties([]);
                setPage(1);
              }}
              className="font-mono text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
            >
              [ RESET ]
            </button>
          )}
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[12px] font-semibold text-slate-700 dark:text-slate-300">
            Difficulty
          </span>
          <div className="flex flex-wrap gap-2">
            {difficultyOptions.map((d) => {
              const active = selectedDifficulties.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() =>
                    setSelectedDifficulties((prev) =>
                      active ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                    )
                  }
                  className={`px-3 py-1 rounded-[3px] font-sans text-[10px] font-semibold tracking-wide border transition-colors cursor-pointer ${
                    active
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-slate-50 dark:bg-[#121417] text-slate-600 dark:text-slate-400 dark:hover:text-orange-400 hover:text-orange-500 border-slate-300 dark:border-[#14171a] hover:bg-orange-500/20 hover:border-orange-400 dark:hover:border-orange-500"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics */}
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[12px] font-semibold text-slate-700 dark:text-slate-300">
            Topics
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {allTags.length > 0 ? (
              allTags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        active
                          ? prev.filter((t) => t !== tag.id)
                          : [...prev, tag.id],
                      )
                    }
                    className={`px-2 py-1 cursor-pointer rounded-[3px] font-sans text-[10px] tracking-wide border transition-colors ${
                      active
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/50"
                        : "bg-slate-50 dark:bg-[#181c21] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#101316] hover:border-orange-400 dark:hover:border-orange-600"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })
            ) : (
              <p className="text-xs font-semibold font-sans text-slate-700 dark:text-slate-400">
                Fetching Tags...
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Calendar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] mb-1 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
            POTD Calendar
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <button
              onClick={handlePrevMonth}
              disabled={true}
              className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[3px] transition-colors cursor-pointer"
            >
              &lt;
            </button>
            <span className="w-16 font-sans text-[10px] font-medium text-center ">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={true}
              className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[3px] transition-colors cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#0f1114] border border-slate-200 dark:border-[#101215] rounded-[3px] p-3 shadow-sm">
          {/* Days of week */}
          <div className="grid grid-cols-7 mb-2 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-mono text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full aspect-square" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const potd = potdMap.get(day);

              const isToday =
                new Date().getUTCDate() === day &&
                new Date().getUTCMonth() === currentMonth.getUTCMonth() &&
                new Date().getUTCFullYear() === currentMonth.getUTCFullYear();

              let buttonClasses =
                "w-full aspect-square flex items-center justify-center font-sans text-[11px] rounded-[3px] transition-all border relative ";

               if (isToday) {
                buttonClasses +=
                  "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/40 font-bold cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/20";
              } else if (potd) {
                buttonClasses +=
                  "bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-500 cursor-pointer";
              } else {
                buttonClasses +=
                  "bg-transparent text-slate-300 dark:text-slate-700 border-transparent opacity-25 cursor-not-allowed select-none";
              }

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (potd) {
                      navigate(`/problemset/${potd.problem_id}`);
                    }
                  }}
                  disabled={!potd}
                  className={buttonClasses}
                >
                  {/* Day Number */}
                  <span className="relative z-10">{day}</span>

                  {potd?.solved && (
                    <div className="absolute top-0.5 right-0.5 text-orange-500 dark:text-orange-500 z-20">
                      <svg
                        className="w-2.5 h-2.5 stroke-[3.5]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] relative w-full bg-slate-100 dark:bg-[#050608] text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 font-sans transition-colors duration-300">
      {theme === "light" ? (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.300/40%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.300/40%)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.slate.800/40%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800/40%)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col">
          <SidebarContent />
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Problem Set
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0d1117] border font-semibold border-slate-200 dark:border-slate-800 rounded-[3px] text-[11px] font-sans focus:outline-none focus:border-orange-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden flex items-center justify-center px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-[3px] cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {showMobileFilters && (
            <div className="md:hidden mb-6 p-5 bg-slate-100 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px]">
              <SidebarContent />
            </div>
          )}

          {/* Problem Table */}
          <div className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#14171a] rounded-md shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="w-full overflow-x-auto block custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#0b0e12]">
                    <th className="px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase w-16 text-center">
                      ID
                    </th>
                    <th className="px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                      Title
                    </th>
                    <th className="px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase text-center w-32">
                      Acceptance
                    </th>
                    <th className="px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase text-center w-32">
                      Difficulty
                    </th>
                    <th className="px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase text-center w-20">
                      Add
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0b0e12]">
                  {loading ? (
                    Array.from({ length: limit }).map((_, idx) => (
                      <tr
                        key={idx}
                        className="animate-pulse bg-white dark:bg-[#0d1117]"
                      >
                        <td className="px-5 py-4">
                          <div className="h-3 bg-slate-100 dark:bg-[#181c21] rounded-[2px] w-6 mx-auto"></div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 bg-slate-100 dark:bg-[#181c21] rounded-[2px] w-48 mb-1.5"></div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-3 bg-slate-100 dark:bg-[#181c21] rounded-[2px] w-12 mx-auto"></div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 bg-slate-100 dark:bg-[#181c21] rounded-[2px] w-14 mx-auto"></div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-6 bg-slate-100 dark:bg-[#181c21] rounded-[3px] w-6 mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : problems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-24 text-center">
                        <div className="font-mono text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          [ NO MATCHES FOUND ]
                        </div>
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem) => (
                      <tr
                        key={problem.id}
                        onClick={() => navigate(`/problemset/${problem.id}`)}
                        className="odd:bg-white even:bg-slate-100
    dark:odd:bg-[#080b0f] dark:even:bg-[#0e131a]
    hover:!bg-orange-50 dark:hover:!bg-[#1c2129]
    transition-colors duration-200
    cursor-pointer group relative "
                      >
                        <td className="px-5 py-4 text-center relative">
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="font-mono text-[12px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-orange-500 transition-colors">
                            {problem.id}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                            {problem.title}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center gap-1 w-full max-w-[80px] mx-auto">
                            <span className="font-mono font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                              {problem.acceptance_rate !== null
                                ? `${problem.acceptance_rate}%`
                                : "N/A"}
                            </span>
                            {problem.acceptance_rate !== null && (
                              <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-slate-400 dark:bg-slate-500 dark:group-hover:bg-white group-hover:bg-black transition-colors`}
                                  style={{
                                    width: `${problem.acceptance_rate}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-sans text-[11px] border px-2 rounded-xs py-1 font-semibold tracking-wide capitalize ${getDifficultyColor(problem.difficulty)}`}
                          >
                            {problem.difficulty ? problem.difficulty : "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddToList(problem);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center w-7 h-7 rounded-[3px] font-mono text-[14px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                            title="Add to List"
                          >
                            +
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 bg-slate-50 dark:bg-[#0d1117] flex items-center justify-between mt-auto">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="font-sans text-[10px] font-semibold tracking-wide rounded-[3px] bg-white dark:bg-[#0a0c10] cursor-pointer text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Prev
              </button>

              <div className="hidden sm:flex gap-1.5 items-center font-mono text-[11px] font-bold">
                {page > 2 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      1
                    </button>
                    {page > 3 && (
                      <span className="w-7 h-7 flex items-center justify-center text-slate-400">
                        ...
                      </span>
                    )}
                  </>
                )}

                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {page - 1}
                  </button>
                )}

                <button className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-[3px] border border-orange-500 cursor-default">
                  {page}
                </button>

                {page < totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {page + 1}
                  </button>
                )}

                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && (
                      <span className="w-7 h-7 flex items-center justify-center text-slate-400">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                disabled={page * limit >= total || loading}
                onClick={() => setPage((p) => p + 1)}
                className="font-sans text-[10px] cursor-pointer font-semibold tracking-wide rounded-[3px] bg-white dark:bg-[#0a0c10] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ===== ADD TO LIST MODAL ===== */}
      {showAddToList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                SAVE TO LIST
              </div>
              <button
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
              >
                CLOSE [X]
              </button>
            </div>

            {/* Modal Subheader */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <p className="font-sans text-[15px] font-bold text-slate-900 dark:text-white">
                <span className="font-mono text-orange-500 mr-2">
                  #{activeProblem?.id}
                </span>
                {activeProblem?.title}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto bg-slate-50 dark:bg-[#0d1117] custom-scrollbar flex flex-col gap-2">
              {listsLoading ? (
                <div className="py-10 flex justify-center items-center">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                    FETCHING...
                  </span>
                </div>
              ) : userLists.length === 0 ? (
                <div className="py-8 text-center flex flex-col gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    [ NO LISTS FOUND ]
                  </span>
                  <span className="font-sans text-[13px] text-slate-400">
                    Initialize a new list from your workspace.
                  </span>
                </div>
              ) : (
                userLists.map((list) => (
                  <button
                    key={list.id}
                    disabled={adding}
                    onClick={() => addProblemToList(list.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3px] hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {list.name}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        {list.total_problems}{" "}
                        {list.total_problems === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-orange-500 transition-colors border border-slate-200 dark:border-slate-700 group-hover:border-orange-500 bg-slate-50 dark:bg-slate-950 rounded-[3px] px-3 py-1">
                      ADD
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white dark:bg-slate-950 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => navigate("/my-lists")}
                className="font-mono text-[11px] font-bold tracking-widest uppercase rounded-[3px] transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-5 py-2 cursor-pointer"
              >
                MANAGE LISTS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
