import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ProblemSet() {
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [problems, setProblems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [showAddToList, setShowAddToList] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);
  const [userLists, setUserLists] = useState([]);
  const [adding, setAdding] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(false);

  const difficultyOptions = [
    { id: "easy", label: "Easy" },
    { id: "medium", label: "Medium" },
    { id: "hard", label: "Hard" },
  ];

  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    api.get("/topics").then((res) => {
      setAllTags(res.data);
    });
  }, []);

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

  useEffect(() => {
    if (!showFilter) return;

    const handleClickOutside = (e) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(e.target)
      ) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  const openAddToList = async (problem) => {
    setActiveProblem(problem);
    setShowAddToList(true);
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
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
      case "medium":
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
      case "hard":
        return "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.1)]";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-300";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* Dot pattern background */
        .bg-dots {
          background-image: radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .bg-dots {
          background-image: radial-gradient(rgba(71, 85, 105, 0.2) 1px, transparent 1px);
        }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 pb-16 relative overflow-hidden">
        
        {/* Ambient Background Glows */}
        {/* <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" /> */}
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
        
        <div className="absolute inset-0 bg-dots pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10 relative z-10">
          
          {/* ===== TOP CARDS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Premium Card */}
            <div
              onClick={() => navigate("/premium")}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 flex flex-col cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>
                </div>
                <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-amber-500 transition-colors">
                  Upgrade
                </span>
              </div>
              <h3 className="font-sans text-xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Premium
              </h3>
              <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                Unlock exclusive editorials & multi-thread judge servers.
              </p>
            </div>

            {/* Leaderboards Card */}
            <div
              onClick={() => navigate("/leaderboard")}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 flex flex-col cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-500 transition-colors">
                  Compete
                </span>
              </div>
              <h3 className="font-sans text-xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Leaderboards
              </h3>
              <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                See global algorithms rankings & challenge peers.
              </p>
            </div>

            {/* My Lists Card */}
            <div
              onClick={() => navigate("/my-lists")}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 flex flex-col cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </div>
                <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-rose-500 transition-colors">
                  Organize
                </span>
              </div>
              <h3 className="font-sans text-xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                My Lists
              </h3>
              <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                Track and curate your custom problem sheets.
              </p>
            </div>

          </div>

          {/* ===== MAIN CONTENT AREA ===== */}
          <div className="w-full flex flex-col gap-6">
            
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-6 relative z-20">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="font-sans text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                    Problem Set
                  </h2>
                  {!loading && (
                    <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-sm border border-blue-200 dark:border-orange-500/20">
                      {total} PROBLEMS
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full md:w-72 pl-9 pr-3 py-2.5 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700/80 rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white shadow-sm"
                  />
                </div>
                
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilter((v) => !v)}
                  className={`font-mono text-[12px] font-bold tracking-wide rounded-lg transition-all flex items-center justify-center gap-2 px-5 py-2.5 uppercase shadow-sm ${
                    showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0
                      ? "bg-orange-500 dark:bg-orange-600 border border-orange-600 dark:border-orange-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {(selectedDifficulties.length > 0 || selectedTags.length > 0) && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white ml-1 text-[10px]">
                      {selectedDifficulties.length + selectedTags.length}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown Modal */}
                {showFilter && (
                  <div
                    ref={filterRef}
                    className="absolute z-50 top-full mt-3 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-[320px] md:w-[420px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Difficulty</p>
                      <div className="flex gap-2">
                        {difficultyOptions.map((d) => {
                          const active = selectedDifficulties.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              onClick={() =>
                                setSelectedDifficulties((prev) =>
                                  active ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                                )
                              }
                              className={`px-4 py-1.5 rounded-md font-mono text-[11px] font-bold tracking-wide uppercase border transition-all ${
                                active
                                  ? "bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                  : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4">Topics</p>
                      <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                        {allTags.map((tag) => {
                          const active = selectedTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() =>
                                setSelectedTags((prev) =>
                                  active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wide border transition-all ${
                                active
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold shadow-[0_0_8px_rgba(168,85,247,0.15)]"
                                  : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 font-medium"
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/50">
                      <button
                        onClick={() => {
                          setSelectedTags([]);
                          setSelectedDifficulties([]);
                          setPage(1);
                        }}
                        className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 uppercase tracking-widest transition-colors"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => {
                          setShowFilter(false);
                          setPage(1);
                        }}
                        className="font-mono text-[12px] font-extrabold tracking-wide rounded-md bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 uppercase transition-colors shadow-md shadow-orange-500/20"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Problem Table Wrapper */}
            <div className="w-full bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="w-full overflow-x-auto block custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50">
                      <th className="px-6 py-4 font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase w-20 text-center">ID</th>
                      <th className="px-6 py-4 font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">Problem Title</th>
                      <th className="px-6 py-4 font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-40">Acceptance</th>
                      <th className="px-6 py-4 font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-32">Difficulty</th>
                      <th className="px-6 py-4 font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center w-24">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                      /* Skeleton Loaders */
                      Array.from({ length: limit }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8 mx-auto"></div></td>
                          <td className="px-6 py-5">
                            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 max-w-[250px] mb-2"></div>
                          </td>
                          <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto"></div></td>
                          <td className="px-6 py-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-16 mx-auto"></div></td>
                          <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-8 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : problems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="font-mono text-[13px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                              No Matches Found
                            </div>
                            <p className="font-sans text-sm text-slate-500 dark:text-slate-400">
                              Try adjusting your filters or search query.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      problems.map((problem) => (
                        <tr
                          key={problem.id}
                          onClick={() => navigate(`/problemset/${problem.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 cursor-pointer group relative"
                        >
                          <td className="px-6 py-5 text-center relative">
                             {/* Border line indicator */}
                             <div className="absolute inset-y-0 left-0 w-1 bg-orange-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                             
                             <div className="font-mono text-[13px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-orange-500 transition-colors">
                              {problem.id}
                             </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-sans text-[15px] text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-semibold">
                              {problem.title}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center gap-1.5 w-full max-w-[100px] mx-auto">
                              <span className="font-mono text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                                {problem.acceptance_rate !== null ? `${problem.acceptance_rate}%` : "—"}
                              </span>
                              {problem.acceptance_rate !== null && (
                                <div className="w-full h-[5px] bg-slate-200 dark:bg-slate-700 rounded-xs overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-500 dark:bg-orange-400 transition-all duration-1000 ease-out"
                                    style={{ width: `${problem.acceptance_rate}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 rounded-sm border-2 font-mono text-[10px] font-semibold tracking-widest uppercase ${getDifficultyColor(
                                problem.difficulty
                              )}`}
                            >
                              {problem.difficulty ? problem.difficulty : "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddToList(problem);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md font-mono text-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
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
              <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="font-mono text-[11px] font-bold tracking-[0.1em] rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-all shadow-sm"
                >
                  &larr; Prev
                </button>
                
                <div className="hidden sm:flex gap-2 items-center font-mono text-[12px] font-bold">
                  {page > 2 && (
                    <>
                      <button onClick={() => setPage(1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">1</button>
                      {page > 3 && <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>}
                    </>
                  )}

                  {page > 1 && (
                    <button onClick={() => setPage(page - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                      {page - 1}
                    </button>
                  )}

                  <button className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-md">
                    {page}
                  </button>

                  {page < totalPages && (
                    <button onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                      {page + 1}
                    </button>
                  )}

                  {page < totalPages - 1 && (
                    <>
                      {page < totalPages - 2 && <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>}
                      <button onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  disabled={page * limit >= total || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="font-mono text-[11px] font-bold tracking-[0.1em] rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-all shadow-sm"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ===== Add to List Modal ===== */}
      {showAddToList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                Save to List
              </div>
              <button 
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Subheader */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1120]">
              <p className="font-sans text-[16px] font-bold text-slate-800 dark:text-slate-200">
                <span className="font-mono text-blue-500 mr-2">#{activeProblem?.id}</span> 
                {activeProblem?.title}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar flex flex-col gap-3">
              {listsLoading ? (
                <div className="py-10 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : userLists.length === 0 ? (
                <div className="py-8 text-center flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <span className="font-mono text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">No Lists Found</span>
                  <span className="font-sans text-sm text-slate-500 dark:text-slate-400">Create a new list from your dashboard.</span>
                </div>
              ) : (
                userLists.map((list) => (
                  <button
                    key={list.id}
                    disabled={adding}
                    onClick={() => addProblemToList(list.id)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col gap-1.5 relative z-10">
                      <span className="font-sans text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {list.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {list.total_problems} {list.total_problems === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <span className="relative z-10 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-all border border-slate-200 dark:border-slate-700 group-hover:border-blue-600 rounded-md px-3 py-1.5 shadow-sm">
                      ADD +
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => navigate("/my-lists")}
                className="font-mono text-[12px] font-bold tracking-[0.08em] uppercase rounded-md transition-all bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-5 py-2.5 shadow-sm hover:shadow-md"
              >
                Manage Lists &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}