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
  
  // New Loading State
  const [loading, setLoading] = useState(true);

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

    try {
      const res = await api.get("/lists");
      setUserLists(res.data);
    } catch (err) {
      console.error("FETCH LISTS ERROR", err);
      setUserLists([]);
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
        return "text-emerald-700 bg-emerald-100 border-emerald-200 shadow-sm shadow-emerald-100";
      case "medium":
        return "text-amber-700 bg-amber-100 border-amber-200 shadow-sm shadow-amber-100";
      case "hard":
        return "text-rose-700 bg-rose-100 border-rose-200 shadow-sm shadow-rose-100";
      default:
        return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ===== VIBRANT TOP CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Premium Card */}
          <div
            onClick={() => navigate("/premium")}
            className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-violet-600 to-indigo-700"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-white tracking-tight">Premium</h3>
                  <span className="px-2 py-0.5 bg-white/20 text-white backdrop-blur-md text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">Pro</span>
                </div>
                <p className="text-indigo-100 text-sm font-medium">Unlock exclusive editorials & fast servers.</p>
              </div>
            </div>
          </div>

          {/* Leaderboards Card */}
          <div
            onClick={() => navigate("/leaderboard")}
            className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-cyan-500 to-blue-600"
          >
            <div className="absolute bottom-0 right-0 -mb-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-white tracking-tight mb-1">Leaderboards</h3>
                <p className="text-cyan-50 text-sm font-medium">See global rankings & compete.</p>
              </div>
            </div>
          </div>

          {/* My Lists Card */}
          <div
            onClick={() => navigate("/my-lists")}
            className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-rose-500 to-orange-500"
          >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-white tracking-tight mb-1">My Lists</h3>
                <p className="text-orange-50 text-sm font-medium">Track your custom problem sets.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header & Search */}
            <div className="p-5 border-b border-slate-200 bg-white">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                 
                  <h2 className="ml-2 text-xl font-bold text-slate-800">Problem Set</h2>
                  {!loading && (
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                      {total}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto relative">
                  <div className="relative w-full md:w-80 group">
                    <input
                      type="text"
                      placeholder="Search problems..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-5 py-2.5 pl-11 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400 font-medium text-slate-700"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-2.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 transition-colors flex items-center gap-2 shadow-sm">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Sort
                    </button>
                    <button
                      ref={filterButtonRef}
                      onClick={() => setShowFilter((v) => !v)}
                      className={`px-5 py-2.5 border rounded-full text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
                        showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <svg className={`w-4 h-4 ${showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0 ? "text-indigo-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                      {(selectedDifficulties.length > 0 || selectedTags.length > 0) && (
                         <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-2 right-2 border-2 border-white box-content"></span>
                      )}
                    </button>
                  </div>

                  {/* Filter Dropdown Modal */}
                  {showFilter && (
                    <div
                      ref={filterRef}
                      className="absolute z-20 top-full right-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-xl w-[320px] md:w-[420px] p-6 backdrop-blur-xl bg-white/95"
                    >
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">Difficulty</p>
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
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                  active
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">Topics</p>
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
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                  active
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                                    : "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 font-medium"
                                }`}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedTags([]);
                            setSelectedDifficulties([]);
                            setPage(1);
                          }}
                          className="text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            setShowFilter(false);
                            setPage(1);
                          }}
                          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:shadow-lg"
                        >
                          Show Results
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Table */}
            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 w-20">No.</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4 text-center w-32">Acceptance</th>
                    <th className="px-6 py-4 text-center w-32">Difficulty</th>
                    <th className="px-6 py-4 text-right w-24">List</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    /* Skeleton Loaders */
                    Array.from({ length: limit }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-5 bg-slate-200 rounded w-3/4 max-w-[300px]"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 rounded w-10 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5 flex justify-end">
                          <div className="h-8 bg-slate-200 rounded-full w-8"></div>
                        </td>
                      </tr>
                    ))
                  ) : problems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 mb-1">No matches found</h3>
                          <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search query.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem) => (
                      <tr
                        key={problem.id}
                        onClick={() => navigate(`/problemset/${problem.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-5 text-sm font-medium text-slate-400">
                          {problem.id}
                        </td>
                        <td className="px-6 py-5 text-[15px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {problem.title}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-500 text-center">
                          {problem.acceptance_rate !== null ? `${problem.acceptance_rate}%` : "—"}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold border inline-block ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddToList(problem);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm hover:shadow"
                            title="Add to List"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 px-6 py-4 bg-white flex items-center justify-between">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                Previous
              </button>
              
              <div className="flex gap-1.5 items-center">
                {page > 2 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition"
                    >
                      1
                    </button>
                    {page > 3 && <span className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">...</span>}
                  </>
                )}

                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition"
                  >
                    {page - 1}
                  </button>
                )}

                <button className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white shadow-md rounded-lg text-sm font-bold transform hover:scale-105 transition">
                  {page}
                </button>

                {page < totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition"
                  >
                    {page + 1}
                  </button>
                )}

                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && <span className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">...</span>}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                disabled={page * limit >= total || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Add to List Modal ===== */}
      {showAddToList && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100 opacity-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Save to List</h3>
                <p className="text-sm font-medium text-slate-500 line-clamp-1">
                  <span className="text-slate-400 mr-1">#{activeProblem?.id}</span> 
                  {activeProblem?.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50">
              {userLists.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-bold mb-1">No lists found</p>
                  <p className="text-sm font-medium text-slate-500">Create a new list to save your favorite problems.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userLists.map((list) => (
                    <button
                      key={list.id}
                      disabled={adding}
                      onClick={() => addProblemToList(list.id)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition">
                            {list.name}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {list.total_problems} {list.total_problems === 1 ? "problem" : "problems"}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-indigo-100 transition">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-100 bg-white flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/my-lists")}
                className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Manage Lists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}