import React, { useState } from "react";
import { api } from "../api/client";
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function MyList() {
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [deletingList, setDeletedList] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListColor, setNewListColor] = useState("blue");
  const [showProblemsModal, setShowProblemsModal] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const [listProblems, setListProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchLists = async () => {
      try {
        setLoading(true);
        const res = await api.get("/lists");
        setLists(
          res.data.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description,
            color: l.color,
            problemCount: l.total_problems,
            solvedCount: l.solved_problems,
            createdAt: l.created_at,
          }))
        );
      } catch (err) {
        console.error("FETCH LISTS ERROR", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [authLoading, user]);

  const handleEditList = (list) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || "");
    setNewListColor(list.color);
    setShowCreateModal(true);
  };

  const colors = [
    {
      name: "cyan",
      bg: "bg-cyan-500",
      light: "bg-cyan-50 dark:bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
    },
    {
      name: "purple",
      bg: "bg-purple-500",
      light: "bg-purple-50 dark:bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
    },
    {
      name: "green",
      bg: "bg-emerald-500",
      light: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      name: "orange",
      bg: "bg-amber-500",
      light: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      name: "blue",
      bg: "bg-blue-500",
      light: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "pink",
      bg: "bg-rose-500",
      light: "bg-rose-50 dark:bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
    },
  ];

  const getColorClasses = (colorName) => {
    return colors.find((c) => c.name === colorName) || colors[4]; // Default to blue
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const res = await api.post("/lists", {
        name: newListName,
        description: newListDescription,
        color: newListColor,
      });

      setLists((prev) => [
        {
          id: res.data.id,
          name: res.data.name,
          description: res.data.description,
          color: res.data.color,
          problemCount: 0,
          solvedCount: 0,
          createdAt: res.data.created_at || new Date().toISOString(),
        },
        ...prev,
      ]);

      closeCreateModal();
    } catch (err) {
      console.error("CREATE LIST ERROR", err);
    }
  };

  const handleUpdateList = async () => {
    if (!editingList || !newListName.trim()) return;

    try {
      await api.put(`/lists/${editingList.id}`, {
        name: newListName,
        description: newListDescription,
        color: newListColor,
      });

      setLists((prev) =>
        prev.map((list) =>
          list.id === editingList.id
            ? {
                ...list,
                name: newListName,
                description: newListDescription,
                color: newListColor,
              }
            : list
        )
      );

      closeCreateModal();
    } catch (err) {
      console.error("UPDATE LIST ERROR", err);
    }
  };

  const openListProblems = async (list) => {
    setActiveList(list);
    setShowProblemsModal(true);
    setProblemsLoading(true);

    try {
      const res = await api.get(`/lists/${list.id}/problems`);
      setListProblems(res.data);
    } catch (err) {
      console.error("FETCH LIST PROBLEMS ERROR", err);
      setListProblems([]);
    } finally {
      setProblemsLoading(false);
    }
  };

  const removeProblemFromList = async (problemId) => {
    if (!activeList) return;

    try {
      await api.delete(`/lists/${activeList.id}/problems/${problemId}`);

      setListProblems((prev) => prev.filter((p) => p.id !== problemId));

      // update counts optimistically
      setLists((prev) =>
        prev.map((l) =>
          l.id === activeList.id
            ? {
                ...l,
                problemCount: l.problemCount - 1,
                solvedCount:
                  l.solvedCount -
                  (listProblems.find(
                    (p) => p.id === problemId && p.status === "solved"
                  )
                    ? 1
                    : 0),
              }
            : l
        )
      );
    } catch (err) {
      console.error("REMOVE PROBLEM ERROR", err);
    }
  };

  const handleDeleteList = async () => {
    try {
      await api.delete(`/lists/${deletingList.id}`);
      setLists((prev) => prev.filter((l) => l.id !== deletingList.id));
      setShowDeleteModal(false);
      setDeletedList(null);
    } catch (err) {
      console.error("DELETE LIST ERROR", err);
    }
  };

  const openDeleteModal = (list) => {
    setDeletedList(list);
    setShowDeleteModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setEditingList(null);
    setNewListName("");
    setNewListDescription("");
    setNewListColor("blue");
  };

  // RESTORED: This function was missing in the previous iteration
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">My Lists</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Organize and track your problem-solving journey
            </p>
          </div>
          <button
            onClick={() => {
              setEditingList(null);
              setNewListName("");
              setNewListDescription("");
              setNewListColor("blue");
              setShowCreateModal(true);
            }}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center justify-center md:justify-start gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New List
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:-translate-y-0.5 transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Lists</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {lists.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:-translate-y-0.5 transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Problems</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {lists.reduce((sum, list) => sum + Number(list.problemCount), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:-translate-y-0.5 transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Problems Solved</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {lists.reduce((sum, list) => sum + Number(list.solvedCount), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading your lists...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-700">
              <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              No lists yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
              Create your first list to start organizing problems into targeted practice sets.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lists.map((list) => {
              const progress =
                list.problemCount > 0
                  ? Math.round((list.solvedCount / list.problemCount) * 100)
                  : 0;
              const colorClasses = getColorClasses(list.color);

              return (
                <div
                  key={list.id}
                  onClick={() => openListProblems(list)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group cursor-pointer"
                >
                  {/* Color Header */}
                  <div className={`h-1.5 w-full ${colorClasses.bg}`}></div>

                  <div className="p-6">
                    {/* List Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 pr-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                          {list.name}
                        </h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {list.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditList(list);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Edit list"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(list);
                          }}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete list"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-[12px] font-bold mb-2">
                        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {list.solvedCount}/{list.problemCount}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClasses.bg} transition-all duration-500 ease-out`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-[12px] font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        Created {new Date(list.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`font-bold transition-colors ${colorClasses.text} group-hover:underline`}>
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
            
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {editingList ? "Edit List" : "Create New List"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Interview Prep"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[14px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Description
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[14px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Theme Color
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewListColor(color.name)}
                      className={`w-full aspect-square rounded-xl ${color.bg} transition-all duration-200 active:scale-95 relative flex items-center justify-center`}
                    >
                      {newListColor === color.name && (
                        <div className="absolute inset-0 border-[3px] border-white dark:border-slate-900 rounded-xl shadow-[0_0_0_2px_currentColor]" style={{ color: `var(--tw-colors-${color.name}-500)` }}></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 justify-end">
              <button
                onClick={closeCreateModal}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingList ? handleUpdateList : handleCreateList}
                disabled={!newListName.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md shadow-blue-600/20 disabled:shadow-none"
              >
                {editingList ? "Update List" : "Create List"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center transform transition-all">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Delete List?
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{deletingList?.name}"</span>? This action cannot be undone and all tracked progress will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all active:scale-95 shadow-md shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Problems Modal */}
      {showProblemsModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transform transition-all">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex-shrink-0 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-3 h-3 rounded-full ${getColorClasses(activeList?.color).bg}`}></div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      {activeList?.name}
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 pl-6">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {listProblems.length} {listProblems.length === 1 ? "problem" : "problems"}
                    </span>
                    {activeList?.description && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{activeList.description}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowProblemsModal(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
              {problemsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading list content...</p>
                </div>
              ) : listProblems.length === 0 ? (
                <div className="py-24 text-center px-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                    No problems in this list
                  </p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Start adding problems from the Problem Set to track your progress.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {listProblems.map((p, index) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/problemset/${p.id}`)}
                      className="group cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Problem Number & Title */}
                      <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[13px] font-bold text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors border border-transparent dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-500/30 mt-0.5 sm:mt-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate tracking-tight mb-1.5">
                            {p.id}. {p.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${getDifficultyColor(p.difficulty)}`}>
                              {p.difficulty ? p.difficulty : "N/A"}
                            </span>
                            
                            {p.status === "solved" && (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Solved
                              </span>
                            )}
                            
                            {p.acceptance_rate !== null && (
                              <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                                {p.acceptance_rate}% Acc.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Action */}
                      <div className="flex items-center justify-end shrink-0 pl-12 sm:pl-0 mt-2 sm:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProblemFromList(p.id);
                          }}
                          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group/btn border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                          title="Remove from list"
                        >
                          <svg
                            className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover/btn:text-rose-600 dark:group-hover/btn:text-rose-400 transition-colors"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex-shrink-0 transition-colors">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                  {listProblems.length > 0 ? (
                    <span>
                      <span className="text-slate-900 dark:text-white">{listProblems.filter((p) => p.status === "solved").length}</span> of {listProblems.length} completed
                    </span>
                  ) : "0 problems"}
                </div>
                <button
                  onClick={() => setShowProblemsModal(false)}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyList;