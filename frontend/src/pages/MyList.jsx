import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MyList() {
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
    { name: "cyan", bg: "bg-cyan-500", border: "border-cyan-500", light: "bg-cyan-50 dark:bg-cyan-500/10" },
    { name: "purple", bg: "bg-purple-500", border: "border-purple-500", light: "bg-purple-50 dark:bg-purple-500/10" },
    { name: "green", bg: "bg-green-500", border: "border-green-500", light: "bg-green-50 dark:bg-green-500/10" },
    { name: "orange", bg: "bg-orange-500", border: "border-orange-500", light: "bg-orange-50 dark:bg-orange-500/10" },
    { name: "blue", bg: "bg-blue-500", border: "border-blue-500", light: "bg-blue-50 dark:bg-blue-500/10" },
    { name: "pink", bg: "bg-rose-500", border: "border-rose-500", light: "bg-rose-50 dark:bg-rose-500/10" },
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
            ? { ...list, name: newListName, description: newListDescription, color: newListColor }
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
                solvedCount: l.solvedCount - (listProblems.find((p) => p.id === problemId && p.status === "solved") ? 1 : 0),
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Library
                </span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Lists
              </h1>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em] mt-1">
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
              className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2.5 hover:opacity-85 flex items-center justify-center gap-2"
            >
              CREATE LIST [+]
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col gap-2 shadow-sm">
              <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Total Lists
              </div>
              <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {lists.length}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col gap-2 shadow-sm">
              <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Total Problems
              </div>
              <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {lists.reduce((sum, list) => sum + Number(list.problemCount), 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col gap-2 shadow-sm">
              <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Problems Solved
              </div>
              <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {lists.reduce((sum, list) => sum + Number(list.solvedCount), 0)}
              </div>
            </div>
          </div>

          {/* Lists Grid */}
          {loading ? (
            <div className="py-24 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
              LOADING LISTS...
            </div>
          ) : lists.length === 0 ? (
            <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center gap-4">
              <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No lists yet
              </div>
              <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Create your first list to start organizing problems into targeted practice sets.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase mt-2"
              >
                CREATE YOUR FIRST LIST
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => {
                const progress = list.problemCount > 0 ? Math.round((list.solvedCount / list.problemCount) * 100) : 0;
                const colorClasses = getColorClasses(list.color);

                return (
                  <div
                    key={list.id}
                    onClick={() => openListProblems(list)}
                    className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col cursor-pointer group"
                  >
                    {/* Top Color Bar */}
                    <div className={`h-1.5 w-full ${colorClasses.bg}`}></div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {list.name}
                          </h3>
                          <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {list.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditList(list);
                            }}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-none p-1"
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
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-transparent border-none p-1"
                            title="Delete list"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-widest uppercase mb-2">
                          <span className="text-slate-500 dark:text-slate-400">Progress</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {list.solvedCount}/{list.problemCount}
                          </span>
                        </div>
                        <div className="w-full h-[3px] bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden">
                          <div
                            className={`h-full ${colorClasses.bg} transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Created {new Date(list.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        View List →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Create/Edit Modal ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {editingList ? "EDIT LIST" : "NEW LIST"}
              </div>
              <button 
                onClick={closeCreateModal}
                className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
              >
                CLOSE [X]
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 bg-white dark:bg-[#0d1117]">
              <div>
                <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Dynamic Programming Prep"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-[3px] font-sans text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-[3px] font-sans text-[13px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Theme Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewListColor(color.name)}
                      className={`w-full aspect-square rounded-[3px] ${color.bg} transition-all duration-200 border-2 ${
                        newListColor === color.name ? "border-slate-800 dark:border-white shadow-inner" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded-[3px] transition-colors bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={editingList ? handleUpdateList : handleCreateList}
                disabled={!newListName.trim()}
                className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingList ? "UPDATE LIST →" : "CREATE LIST →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.1em] mb-4">
                [WARNING] DELETE LIST
              </div>
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Are you absolutely sure?
              </h2>
              <p className="font-sans text-[14px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                You are about to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingList?.name}"</span>. This action cannot be undone and all tracked progress inside this list will be lost forever.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded-[3px] transition-colors bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteList}
                  className="flex-1 font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-red-600 text-white border-none px-4 py-2.5 hover:opacity-85"
                >
                  DELETE LIST
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== List Problems Modal ===== */}
      {showProblemsModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 w-full max-w-4xl max-h-[85vh] rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={`w-2 h-2 rounded-[2px] ${getColorClasses(activeList?.color).bg}`}></div>
                  <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {activeList?.name}
                  </h2>
                </div>
                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex flex-wrap items-center gap-3">
                  <span>
                    {listProblems.length} {listProblems.length === 1 ? "PROBLEM" : "PROBLEMS"}
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
                className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1 shrink-0"
              >
                CLOSE [X]
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0d1117] transition-colors">
              {problemsLoading ? (
                <div className="py-24 text-center font-mono text-[11px] text-slate-500 uppercase tracking-widest animate-pulse">
                  LOADING CONTENT...
                </div>
              ) : listProblems.length === 0 ? (
                <div className="py-24 text-center px-4 flex flex-col items-center gap-3">
                  <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Empty List
                  </div>
                  <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500">
                    Start adding problems from the Problem Set to track your progress.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto block custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-16 text-center">#</th>
                        <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">Title</th>
                        <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-32">Difficulty</th>
                        <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-24">Status</th>
                        <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {listProblems.map((p, index) => (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/problemset/${p.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-4 text-center font-mono text-[11px] font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-5 py-4 font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {p.id}. {p.title}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${getDifficultyColor(p.difficulty)}`}>
                              {p.difficulty || "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {p.status === "solved" ? (
                              <span className="inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                                Solved
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProblemFromList(p.id);
                              }}
                              className="font-mono text-[10px] font-bold bg-transparent text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-[3px] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:border-red-500/30 dark:hover:text-red-400 transition-colors"
                              title="Remove from list"
                            >
                              [X]
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <div className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                {listProblems.length > 0 ? (
                  <span>
                    <span className="text-slate-900 dark:text-white font-bold">{listProblems.filter((p) => p.status === "solved").length}</span> OF {listProblems.length} COMPLETED
                  </span>
                ) : (
                  "0 PROBLEMS"
                )}
              </div>
              <button
                onClick={() => setShowProblemsModal(false)}
                className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}