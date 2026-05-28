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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "medium":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "hard":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";
    }
  };

  const totalPages = Math.ceil(total / limit);

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

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* ===== VIBRANT TOP CARDS (Refactored to Minimal) ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Premium Card */}
            <div
              onClick={() => navigate("/premium")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-colors shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Upgrade
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                Premium Pro
              </h3>
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.05em] leading-relaxed">
                Unlock exclusive editorials & fast servers.
              </p>
            </div>

            {/* Leaderboards Card */}
            <div
              onClick={() => navigate("/leaderboard")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Compete
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Leaderboards
              </h3>
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.05em] leading-relaxed">
                See global rankings & challenge peers.
              </p>
            </div>

            {/* My Lists Card */}
            <div
              onClick={() => navigate("/my-lists")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 transition-colors shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Organize
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                My Lists
              </h3>
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.05em] leading-relaxed">
                Track your custom problem sets.
              </p>
            </div>

          </div>

          {/* ===== MAIN CONTENT AREA ===== */}
          <div className="w-full flex flex-col gap-6">
            
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6 relative z-20">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    Archive
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Problem Set
                  </h2>
                  {!loading && (
                    <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {total} PROBLEMS
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full md:w-64 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-[3px] text-[11px] font-mono focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-white shadow-sm"
                />
                
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilter((v) => !v)}
                  className={`font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] transition-all flex items-center justify-center gap-2 px-4 py-1.5 uppercase shadow-sm ${
                    showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0
                      ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                      : "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {(selectedDifficulties.length > 0 || selectedTags.length > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></span>
                  )}
                </button>

                {/* Filter Dropdown Modal */}
                {showFilter && (
                  <div
                    ref={filterRef}
                    className="absolute z-50 top-full mt-2 right-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-xl w-[320px] md:w-[400px] flex flex-col overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/60">
                      <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Difficulty</p>
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
                              className={`px-3 py-1 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase border transition-colors ${
                                active
                                  ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
                                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/60">
                      <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Topics</p>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
                              className={`px-2 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-wide border transition-colors ${
                                active
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-bold"
                                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900">
                      <button
                        onClick={() => {
                          setSelectedTags([]);
                          setSelectedDifficulties([]);
                          setPage(1);
                        }}
                        className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-widest transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => {
                          setShowFilter(false);
                          setPage(1);
                        }}
                        className="font-mono text-[11px] font-bold tracking-[0.1em] rounded-[3px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 uppercase hover:opacity-85 transition-opacity shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Problem Table Wrapper */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="w-full overflow-x-auto block custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-20 text-center">#</th>
                      <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">Title</th>
                      <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-32">Acceptance</th>
                      <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-32">Difficulty</th>
                      <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-24">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                      /* Skeleton Loaders */
                      Array.from({ length: limit }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-5 py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-8 mx-auto"></div></td>
                          <td className="px-5 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 max-w-[250px]"></div></td>
                          <td className="px-5 py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10 mx-auto"></div></td>
                          <td className="px-5 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-[3px] w-16 mx-auto"></div></td>
                          <td className="px-5 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-[3px] w-8 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : problems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            No matches found. Adjust filters or search query.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      problems.map((problem) => (
                        <tr
                          key={problem.id}
                          onClick={() => navigate(`/problemset/${problem.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-4 text-center font-mono text-[11px] font-medium text-slate-500 dark:text-slate-500">
                            {problem.id}
                          </td>
                          <td className="px-5 py-4 font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {problem.title}
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {problem.acceptance_rate !== null ? `${problem.acceptance_rate}%` : "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${getDifficultyColor(
                                problem.difficulty
                              )}`}
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
                              className="font-mono text-[10px] font-bold bg-transparent text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-[3px] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors"
                              title="Add to List"
                            >
                              [+]
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-colors"
                >
                  Prev
                </button>
                
                <div className="hidden sm:flex gap-1.5 items-center font-mono text-[11px] font-semibold">
                  {page > 2 && (
                    <>
                      <button onClick={() => setPage(1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">1</button>
                      {page > 3 && <span className="w-7 h-7 flex items-center justify-center text-slate-400">...</span>}
                    </>
                  )}

                  {page > 1 && (
                    <button onClick={() => setPage(page - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
                      {page - 1}
                    </button>
                  )}

                  <button className="w-7 h-7 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-[3px]">
                    {page}
                  </button>

                  {page < totalPages && (
                    <button onClick={() => setPage(page + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
                      {page + 1}
                    </button>
                  )}

                  {page < totalPages - 1 && (
                    <>
                      {page < totalPages - 2 && <span className="w-7 h-7 flex items-center justify-center text-slate-400">...</span>}
                      <button onClick={() => setPage(totalPages)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[3px] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  disabled={page * limit >= total || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ===== Add to List Modal ===== */}
      {showAddToList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0d1117]">
              <p className="font-sans text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                <span className="font-mono text-slate-500 dark:text-slate-500 mr-2">#{activeProblem?.id}</span> 
                {activeProblem?.title}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30 custom-scrollbar flex flex-col gap-3">
              {listsLoading ? (
                <div className="py-8 text-center font-mono text-[11px] text-slate-500 uppercase tracking-widest animate-pulse">
                  LOADING LISTS...
                </div>
              ) : userLists.length === 0 ? (
                <div className="py-8 text-center flex flex-col gap-2">
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">No lists found</span>
                  <span className="font-sans text-xs text-slate-400 dark:text-slate-500">Create a new list to save your favorite problems.</span>
                </div>
              ) : (
                userLists.map((list) => (
                  <button
                    key={list.id}
                    disabled={adding}
                    onClick={() => addProblemToList(list.id)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {list.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {list.total_problems} {list.total_problems === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors border border-slate-200 dark:border-slate-800 group-hover:border-blue-500 rounded-[3px] px-2 py-1">
                      ADD +
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => navigate("/my-lists")}
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded-[3px] transition-colors bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2"
              >
                Manage Lists →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}