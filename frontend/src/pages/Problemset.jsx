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
  const [listsLoading, setListsLoading] = useState(false); // <-- New loading state for lists

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
    setListsLoading(true); // <-- Start loading

    try {
      const res = await api.get("/lists");
      setUserLists(res.data);
    } catch (err) {
      console.error("FETCH LISTS ERROR", err);
      setUserLists([]);
    } finally {
      setListsLoading(false); // <-- Stop loading
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
        return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
      case "medium":
        return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
      case "hard":
        return "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* ===== VIBRANT TOP CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:mb-10">
          
          {/* Premium Card */}
          <div
            onClick={() => navigate("/premium")}
            className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl shadow-indigo-500/20 dark:shadow-none bg-gradient-to-br from-violet-600 to-indigo-700"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-white tracking-tight">Premium</h3>
                  <span className="px-2 py-0.5 bg-white/20 text-white backdrop-blur-md text-[10px] font-black rounded-md uppercase tracking-widest shadow-sm">Pro</span>
                </div>
                <p className="text-indigo-100 text-sm font-medium">Unlock exclusive editorials & fast servers.</p>
              </div>
            </div>
          </div>

          {/* Leaderboards Card */}
          <div
            onClick={() => navigate("/leaderboard")}
            className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl shadow-blue-500/20 dark:shadow-none bg-gradient-to-br from-cyan-500 to-blue-600"
          >
            <div className="absolute bottom-0 right-0 -mb-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10">
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
            className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl shadow-rose-500/20 dark:shadow-none bg-gradient-to-br from-rose-500 to-orange-500"
          >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            
            {/* Header & Search */}
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Problem Set</h2>
                  {!loading && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
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
                      className="w-full px-5 py-2.5 pl-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 font-medium text-slate-900 dark:text-white shadow-sm shadow-slate-100/50 dark:shadow-none"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-sm active:scale-95">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Sort
                    </button>
                    <button
                      ref={filterButtonRef}
                      onClick={() => setShowFilter((v) => !v)}
                      className={`px-5 py-2.5 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                        showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <svg className={`w-4 h-4 ${showFilter || selectedDifficulties.length > 0 || selectedTags.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                      {(selectedDifficulties.length > 0 || selectedTags.length > 0) && (
                         <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 absolute top-2 right-2 border-2 border-white dark:border-slate-900 box-content"></span>
                      )}
                    </button>
                  </div>

                  {/* Filter Dropdown Modal */}
                  {showFilter && (
                    <div
                      ref={filterRef}
                      className="absolute z-20 top-full right-0 mt-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none w-[320px] md:w-[420px] p-6 md:p-8 backdrop-blur-xl transition-colors"
                    >
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-3">Difficulty</p>
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
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                                  active
                                    ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md shadow-blue-500/20"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-3">Topics</p>
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
                                className={`px-3 py-1.5 rounded-lg text-[13px] border transition-all active:scale-95 ${
                                  active
                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 font-bold"
                                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                                }`}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedTags([]);
                            setSelectedDifficulties([]);
                            setPage(1);
                          }}
                          className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            setShowFilter(false);
                            setPage(1);
                          }}
                          className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
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
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
                    <th className="px-6 py-4 w-20">No.</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4 text-center w-32">Acceptance</th>
                    <th className="px-6 py-4 text-center w-32">Difficulty</th>
                    <th className="px-6 py-4 text-right w-24">List</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {loading ? (
                    /* Skeleton Loaders */
                    Array.from({ length: limit }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-white dark:bg-slate-900 transition-colors">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 max-w-[300px]"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-10 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5 flex justify-end">
                          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-8"></div>
                        </td>
                      </tr>
                    ))
                  ) : problems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-24 text-center bg-white dark:bg-slate-900 transition-colors">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                            <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">No matches found</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Try adjusting your filters or search query.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem) => (
                      <tr
                        key={problem.id}
                        onClick={() => navigate(`/problemset/${problem.id}`)}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-5 text-sm font-medium text-slate-400 dark:text-slate-500">
                          {problem.id}
                        </td>
                        <td className="px-6 py-5 text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {problem.title}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
                          {problem.acceptance_rate !== null ? `${problem.acceptance_rate}%` : "—"}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider inline-block ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty ? problem.difficulty : "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddToList(problem);
                            }}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all shadow-sm hover:shadow border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 active:scale-95"
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
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-5 bg-white dark:bg-slate-900 flex items-center justify-between transition-colors">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
              >
                Previous
              </button>
              
              <div className="hidden sm:flex gap-1.5 items-center">
                {page > 2 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                    >
                      1
                    </button>
                    {page > 3 && <span className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">...</span>}
                  </>
                )}

                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                  >
                    {page - 1}
                  </button>
                )}

                <button className="w-10 h-10 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white shadow-md rounded-xl text-sm font-bold transform hover:scale-105 transition-all">
                  {page}
                </button>

                {page < totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                  >
                    {page + 1}
                  </button>
                )}

                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && <span className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">...</span>}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                disabled={page * limit >= total || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Add to List Modal ===== */}
      {showAddToList && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-900 transition-colors">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Save to List</h3>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                  <span className="text-slate-400 dark:text-slate-500 mr-1">#{activeProblem?.id}</span> 
                  {activeProblem?.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar transition-colors">
              {listsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="relative w-10 h-10 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading your lists...</p>
                </div>
              ) : userLists.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold mb-1 tracking-tight">No lists found</p>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 px-4">Create a new list to save your favorite problems.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userLists.map((list) => (
                    <button
                      key={list.id}
                      disabled={adding}
                      onClick={() => addProblemToList(list.id)}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors border border-slate-100 dark:border-slate-800 group-hover:border-blue-100 dark:group-hover:border-blue-500/20">
                          <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                            {list.name}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {list.total_problems} {list.total_problems === 1 ? "problem" : "problems"}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors border border-slate-100 dark:border-slate-700 group-hover:border-blue-100 dark:group-hover:border-blue-500/20">
                        <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 justify-end transition-colors">
              <button
                onClick={() => {
                  setShowAddToList(false);
                  setActiveProblem(null);
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/my-lists")}
                className="px-5 py-2.5 text-sm font-bold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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