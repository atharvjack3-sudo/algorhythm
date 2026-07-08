import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Loader2, Copy, Check, LogOut, XOctagon, Users } from "lucide-react";

function CollabTab({
  collabActive,
  setCollabActive,
  problemId,
  setCollabData,
  isOwner,
  setIsOwner,
  collabTeam,
}) {
  const { user, loading: authLoading } = useAuth();
  const [roomCode, setRoomCode] = useState("Fetching...");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleRoomCreation() {
    if (authLoading || !user) return;
    setError("");
    try {
      const res = await api.post("/collab/create-room", {
        problemId: problemId,
      });
      const obj = res.data;
      if (obj.errorPresent && obj.roomCode == null) {
        setCollabActive(false);
        setError(obj.errorMsg);
        return;
      } else if (obj.errorPresent && obj.roomCode != null) {
        setError(obj.errorMsg);
      }
      setCollabData({
        roomCode: obj.roomCode,
        wsRoomId: obj.wsRoomId,
      });
      setRoomCode(obj.roomCode);
      setIsOwner(true);
      setCollabActive(true);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.errorMsg);
      } else {
        setError("Network Error");
      }
      setCollabActive(false);
    }
  }

  async function handleRoomJoin(roomCode, problemId) {
    if (authLoading || !user) return;
    if (!roomCode) return;
    if (!problemId) return;
    setError("");
    try {
      const res = await api.post("/collab/join-room", {
        roomCode: roomCode,
        problemId: problemId,
      });
      const obj = res.data;
      setCollabData({
        roomCode: obj.roomCode,
        wsRoomId: obj.wsRoomId,
      });
      setRoomCode(obj.roomCode);
      setIsOwner(false);
      setCollabActive(true);
    } catch (err) {
      if (err.response) setError(err.response.data.errorMsg);
      else setError("Network Error");

      setCollabActive(false);
    }
  }

  function exitRoom() {
    if (authLoading || !user) return;
    setRoomCode("Fetching...");
    setCollabActive(false);
  }

  if (collabActive) {
    return (
      <div className="flex flex-col gap-5">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
          
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-sans text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                {roomCode === "Fetching..." ? "Connecting..." : "Session Active"}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {isOwner ? "Host" : "Participant"}
            </span>
          </div>

          <div className="p-5 flex flex-col gap-6">
            
            {/* Description */}
            <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isOwner
                ? "You are hosting a live session. Share this code with peers so they can view and edit your code in real-time."
                : "You are connected to a peer's session. Edits made here will sync instantly."}
            </p>

            {/* Room Code - Owner Only */}
            {isOwner && (
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Room Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomCode}
                    className={`flex-1 h-9 px-3 rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[13px] tracking-widest outline-none ${roomCode === "Fetching..." ? "animate-pulse" : ""}`}
                  />
                  <button
                    onClick={handleCopy}
                    disabled={roomCode === "Fetching..."}
                    className="h-9 px-4 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors rounded-[3px] text-slate-700 dark:text-slate-300 font-sans text-[12px] font-bold tracking-wide flex items-center gap-2"
                  >
                    {copied ? <Check size={14} className="text-green-600 dark:text-green-500" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              {isOwner ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!window.confirm("Terminate this session? All peers will be disconnected.")) return;
                    exitRoom();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50 transition-colors rounded-[3px] font-sans text-[12px] font-semibold tracking-wide"
                >
                  <XOctagon size={14} /> Terminate Session
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!window.confirm("Leave this session?")) return;
                    exitRoom();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors rounded-[3px] font-mono text-[11px] font-bold uppercase tracking-widest"
                >
                  <LogOut size={14} /> Leave Session
                </button>
              )}
            </div>
          </div>

          {/* Connected Peers */}
          {collabTeam && collabTeam.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800">
              <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-sans text-[12px] font-semibold text-slate-500 flex items-center gap-2">
                <Users size={12} /> Connected Peers ({collabTeam.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto custom-scrollbar">
                {collabTeam.map((user) => (
                  <div key={user.id || user.name} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-[3px] text-white font-mono font-bold text-[10px] uppercase shrink-0"
                      style={{ backgroundColor: user.color || "#475569" }}
                    >
                      {user.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <span className="font-sans font-medium text-[13px] text-slate-700 dark:text-slate-300 truncate">
                        {user.name}
                      </span>
                      <span className="font-sans text-[9px] text-slate-400 tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        SYNCED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- INACTIVE STATE ---
  return (
    <div className="flex flex-col gap-6">
      
      {/* Create Room */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <span className="font-sans text-[12px] tracking-wide font-semibold text-slate-600 dark:text-slate-300">
            Host Collab Room
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Initialize a live session to collaborate on this problem with peers. You will be assigned a unique room code.
          </p>
          <button
            onClick={async (e) => {
              e.preventDefault();
              if (!window.confirm("Initialize a new live session?")) return;
              setIsCreating(true);
              await handleRoomCreation();
              setIsCreating(false);
            }}
            disabled={isCreating}
            className="w-full flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 py-2.5 bg-orange-500 text-white border-none rounded-[3px] text-[13px] font-sans font-semibold hover:opacity-85 transition-opacity"
          >
            {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Initialize Session"}
          </button>
        </div>
      </div>

      {/* Join Room */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <span className="font-sans text-[12px] tracking-wide font-semibold text-slate-600 dark:text-slate-300">
            Join Collab Room
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Enter a room code provided by a peer to join their active session.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsJoining(true);
              await handleRoomJoin(joinCode, problemId);
              setIsJoining(false);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              required
              onChange={(e) => setJoinCode(e.target.value)}
              value={joinCode}
              placeholder="Enter Room Code..."
              className="flex-1 h-9 px-3 rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-[13px] tracking-wide outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="px-6 cursor-pointer disabled:cursor-not-allowed flex justify-center items-center gap-2 disabled:opacity-50 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 transition-colors h-9 rounded-[3px] font-sans text-[12px] font-bold tracking-wide"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
            </button>
          </form>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest border border-red-200 dark:border-red-900/50 rounded-[3px]">
          [ERROR] {error}
        </div>
      )}
    </div>
  );
}

export default CollabTab;