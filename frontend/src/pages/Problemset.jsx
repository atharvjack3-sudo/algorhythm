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

  const difficultyOptions = [
    { id: "easy", label: "Easy", color: "bg-green-100 text-green-700" },
    { id: "medium", label: "Medium", color: "bg-orange-100 text-orange-700" },
    { id: "hard", label: "Hard", color: "bg-red-100 text-red-700" },
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
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-42 flex justify-center items-center gap-6 overflow-y-hidden overflow-x-auto mb-5 ">
          {/* Get Premium Card */}
          <div onClick={()=>navigate("/premium")} className="h-37 min-w-70 rounded-2xl shadow-md bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 p-6 cursor-pointer hover:shadow-xl hover:scale-101 transition-all duration-300 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="px-2 py-1 bg-white/30 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                PRO
              </span>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Get Premium</h3>
              <p className="text-orange-100 text-sm">
                Unlock exclusive features
              </p>
            </div>
          </div>

          {/* See Leaderboards Card */}
          <div onClick={()=>navigate("/leaderboard")} className="h-37 min-w-70 rounded-2xl shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 p-6 cursor-pointer hover:shadow-xl hover:scale-101 transition-all duration-300 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="px-2 py-1 bg-white/30 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                TOP
              </span>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">
                Leaderboards
              </h3>
              <p className="text-cyan-100 text-sm">See global rankings</p>
            </div>
          </div>

          {/* My Lists Card */}
          <div onClick={()=>navigate("/my-lists")} className="h-37 min-w-70 rounded-2xl shadow-md bg-gradient-to-br from-purple-500 to-indigo-600 p-6 cursor-pointer hover:shadow-xl hover:scale-101 transition-all duration-300 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">My Lists</h3>
              <p className="text-purple-100 text-sm">
                Your problem collections
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Topics Filter */}
              <div className="border-gray-200 pt-4">
                <div>
                  <p className="font-semibold text-gray-700 text-sm text-center">
                    The Problem List
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Questions..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
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
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition">
                      <svg
                        className="w-4 h-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                        />
                      </svg>
                      Sort
                    </button>
                    <button
                      ref={filterButtonRef}
                      onClick={() => setShowFilter((v) => !v)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition"
                    >
                      Filter
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Total:{" "}
                    <span className="font-semibold text-cyan-600">{total}</span>{" "}
                    problems
                  </span>
                  <button className="text-gray-500 hover:text-cyan-500 transition">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {showFilter && (
                <div className="absolute z-20 mt-2">
                  <div
                    ref={filterRef}
                    className="bg-white border border-gray-200 rounded-xl shadow-lg w-96 p-4"
                  >
                    {/* Difficulty Filter */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Difficulty
                      </p>
                      <div className="flex gap-2">
                        {difficultyOptions.map((d) => {
                          const active = selectedDifficulties.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              onClick={() =>
                                setSelectedDifficulties((prev) =>
                                  active
                                    ? prev.filter((x) => x !== d.id)
                                    : [...prev, d.id]
                                )
                              }
                              className={`px-3 py-1 rounded-full text-sm border transition ${
                                active
                                  ? `${d.cls} border-transparent bg-cyan-500 text-white`
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {allTags.map((tag) => {
                        const active = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() =>
                              setSelectedTags((prev) =>
                                active
                                  ? prev.filter((t) => t !== tag.id)
                                  : [...prev, tag.id]
                              )
                            }
                            className={`px-3 py-1 rounded-full text-sm border transition ${
                              active
                                ? "bg-cyan-500 text-white border-cyan-500"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => {
                          setSelectedTags([]);
                          setSelectedDifficulties([]);
                          setPage(1);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Reset
                      </button>

                      <button
                        onClick={() => {
                          setShowFilter(false);
                          setPage(1);
                        }}
                        className="px-4 py-1.5 bg-cyan-500 text-white rounded-lg text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Problems List */}
              <div className="divide-y divide-gray-100 min-w-85">
                {problems.length === 0 ? (
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
                    <p className="text-sm text-gray-400">No problems found.</p>
                  </div>
                ) : (
                  problems.map((problem) => (
                    <div
                      key={problem.id}
                      onClick={() => navigate(`/problemset/${problem.id}`)}
                      className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4">

                        {/* Problem Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm font-medium">
                              {problem.id}.
                            </span>
                            <h3 className="font-medium text-sm md:text-base text-gray-900 hover:text-cyan-500 transition">
                              {problem.title}
                            </h3>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-1 md:gap-6">
                          <span className="hidden md:block text-sm text-gray-500 min-w-[60px] text-right">
                            {problem.acceptance_rate !== null
                              ? `${problem.acceptance_rate}%`
                              : "-"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold min-w-[80px] text-center capitalize ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty || "N/A"}
                          </span>
                          <div className="flex items-center gap-2">

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddToList(problem);
                              }}
                              className="text-gray-400 hover:text-yellow-500 transition"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {page > 2 && (
                      <>
                        <button
                          onClick={() => setPage(1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 rounded text-sm font-medium"
                        >
                          1
                        </button>
                        {page > 3 && (
                          <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                            ...
                          </span>
                        )}
                      </>
                    )}

                    {page > 1 && (
                      <button
                        onClick={() => setPage(page - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 rounded text-sm font-medium"
                      >
                        {page - 1}
                      </button>
                    )}

                    <button className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-white rounded text-sm font-medium">
                      {page}
                    </button>

                    {page < totalPages && (
                      <button
                        onClick={() => setPage(page + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 rounded text-sm font-medium"
                      >
                        {page + 1}
                      </button>
                    )}

                    {page < totalPages - 1 && (
                      <>
                        {page < totalPages - 2 && (
                          <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setPage(totalPages)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 rounded text-sm font-medium"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            {/* Calendar Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Day 3</h3>
                <span className="text-xs text-gray-500">12:34:17 left</span>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="text-xs text-center text-gray-500 font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                      day <= 3
                        ? "bg-cyan-500 text-white font-semibold"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Widget */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Weekly Premium
                  </h3>
                  <p className="text-xs text-gray-600">4 days left</p>
                </div>
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                  W
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {["W2", "W3", "W4", "W5"].map((week) => (
                  <div
                    key={week}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xs font-medium text-gray-600"
                  >
                    {week}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <span className="text-xl">●</span>
                  <span className="font-semibold">0</span>
                  <span className="text-gray-600">Redeem</span>
                </div>
                <button className="text-gray-500 hover:text-gray-700 text-xs">
                  Rules
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {showAddToList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Add to List
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {activeProblem?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddToList(false);
                    setActiveProblem(null);
                  }}
                  className="ml-4 p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {userLists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium mb-2">
                    No lists available
                  </p>
                  <p className="text-sm text-gray-400">
                    Create a list to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userLists.map((list) => (
                    <button
                      key={list.id}
                      disabled={adding}
                      onClick={() => addProblemToList(list.id)}
                      className="w-full group flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-cyan-200 group-hover:to-blue-200 transition">
                          <svg
                            className="w-5 h-5 text-cyan-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 group-hover:text-cyan-600 transition">
                            {list.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {list.total_problems}{" "}
                            {list.total_problems === 1 ? "problem" : "problems"}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddToList(false);
                    setActiveProblem(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate("/my-lists")}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition flex items-center justify-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  View my Lists
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
