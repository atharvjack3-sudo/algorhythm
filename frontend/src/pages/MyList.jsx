import React, { useState } from "react";
import { api } from "../api/client";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Trash2, ListX } from "lucide-react";
import { useNavigate } from "react-router-dom";

function MyList() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [deletingList, setDeletedList] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListColor, setNewListColor] = useState("cyan");
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
  }, [authLoading]);

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
      light: "bg-cyan-50",
      text: "text-cyan-600",
    },
    {
      name: "purple",
      bg: "bg-purple-500",
      light: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      name: "green",
      bg: "bg-green-500",
      light: "bg-green-50",
      text: "text-green-600",
    },
    {
      name: "orange",
      bg: "bg-orange-500",
      light: "bg-orange-50",
      text: "text-orange-600",
    },
    {
      name: "blue",
      bg: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      name: "pink",
      bg: "bg-pink-500",
      light: "bg-pink-50",
      text: "text-pink-600",
    },
  ];

  const getColorClasses = (colorName) => {
    return colors.find((c) => c.name === colorName) || colors[0];
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
    setNewListColor("cyan");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Lists</h1>
            <p className="text-gray-600">
              Organize and track your problem-solving journey
            </p>
          </div>
          <button
            onClick={() => {
              setEditingList(null);
              setNewListName("");
              setNewListDescription("");
              setNewListColor("cyan");
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New List
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Lists</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-cyan-600"
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
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Problems</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.reduce((sum, list) => sum + list.problemCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Problems Solved</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.reduce((sum, list) => sum + list.solvedCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading your lists...
          </div>
        ) : lists.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No lists yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first list to start organizing problems
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition inline-flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition group cursor-pointer"
                >
                  {/* Color Header */}
                  <div className={`h-2 ${colorClasses.bg}`}></div>

                  <div className="p-6">
                    {/* List Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-cyan-500 transition">
                          {list.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {list.description || "No description"}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleEditList(list)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit list"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(list)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete list"
                        >
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {list.solvedCount}/{list.problemCount} solved
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClasses.bg} transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right mt-1">
                        <span
                          className={`text-sm font-semibold ${colorClasses.text}`}
                        >
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <span>
                        Created {new Date(list.createdAt).toLocaleDateString()}
                      </span>
                      <button className="text-cyan-500 hover:text-cyan-600 font-medium transition">
                        View Problems →
                      </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingList ? "Edit List" : "Create New List"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Name *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Interview Prep"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewListColor(color.name)}
                      className={`w-full aspect-square rounded-lg ${
                        color.bg
                      } transition ${
                        newListColor === color.name
                          ? "ring-4 ring-offset-2 ring-gray-400"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeCreateModal}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={editingList ? handleUpdateList : handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingList ? "Update List" : "Create List"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Delete List?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingList?.name}"? This
              action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showProblemsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden transform transition-all">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {activeList?.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {listProblems.length}{" "}
                      {listProblems.length === 1 ? "problem" : "problems"}
                    </span>
                    {activeList?.description && (
                      <span className="text-gray-500">
                        • {activeList.description}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowProblemsModal(false)}
                  className="ml-4 p-2 hover:bg-white/80 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
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
            <div className="max-h-[60vh] overflow-y-auto">
              {problemsLoading ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading problems...</p>
                </div>
              ) : listProblems.length === 0 ? (
                <div className="py-20 text-center">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium mb-2">
                    No problems in this list
                  </p>
                  <p className="text-sm text-gray-400">
                    Start adding problems to track your progress
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {listProblems.map((p, index) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/problemset/${p.id}`)}
                      className="group cursor-pointer flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                    >
                      {/* Problem Number Badge */}
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-600 group-hover:bg-cyan-100 group-hover:text-cyan-600 transition">
                        {index + 1}
                      </div>

                      {/* Problem Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900 group-hover:text-cyan-600 transition truncate">
                            {p.id}. {p.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              p.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : p.difficulty === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.difficulty?.charAt(0).toUpperCase() +
                              p.difficulty?.slice(1)}
                          </span>
                          {p.status === "solved" && (
                            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Solved
                            </span>
                          )}
                          {p.acceptance_rate && (
                            <span className="text-xs text-gray-500">
                              {p.acceptance_rate}% acceptance
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProblemFromList(p.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 transition group/btn"
                          title="Remove from list"
                        >
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover/btn:text-red-600 transition"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                        <svg
                          className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 transition"
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {listProblems.length > 0 && (
                    <span>
                      {listProblems.filter((p) => p.status === "solved").length}{" "}
                      of {listProblems.length} completed
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowProblemsModal(false)}
                    className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyList;
