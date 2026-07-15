import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { 
  Loader2, 
  Copy, 
  CheckSquare, 
  LogOut, 
  Unplug, 
  Users, 
  Network, 
  Terminal, 
  Plug 
} from "lucide-react";

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
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
          
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex justify-between items-center transition-colors">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em]">
                {roomCode === "Fetching..." ? "Connecting..." : "Live Session"}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-[3px] font-mono text-[9px] font-bold tracking-widest uppercase bg-white dark:bg-[#050608] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              {isOwner ? "HOST" : "PARTICIPANT"}
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
                <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <Terminal size={12} className="text-blue-500" />
                  Room Signature
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomCode}
                    className={`flex-1 h-9 px-3 rounded-[3px] bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-500 font-mono text-[13px] font-bold tracking-widest outline-none shadow-inner ${roomCode === "Fetching..." ? "animate-pulse" : ""}`}
                  />
                  <button
                    onClick={handleCopy}
                    disabled={roomCode === "Fetching..."}
                    className="h-9 px-4 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors rounded-[3px] text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"
                  >
                    {copied ? <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-500" /> : <Copy size={14} />}
                    {copied ? "COPIED" : "COPY"}
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
                  className="w-full flex items-center justify-center gap-2 h-10 cursor-pointer bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/30 transition-colors rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.15em]"
                >
                  <Unplug size={14} /> TERMINATE SESSION
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!window.confirm("Leave this session?")) return;
                    exitRoom();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-[#050608] dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-colors rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.15em]"
                >
                  <LogOut size={14} /> LEAVE SESSION
                </button>
              )}
            </div>
          </div>

          {/* Connected Peers */}
          {collabTeam && collabTeam.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0c10] flex flex-col">
              <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                <Users size={12} /> Connected Peers [{collabTeam.length}]
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0d1117]">
                {collabTeam.map((user) => (
                  <div key={user.id || user.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-[3px] text-white font-mono font-bold text-[10px] uppercase shrink-0"
                      style={{ backgroundColor: user.color || "#475569" }}
                    >
                      {user.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <span className="font-mono font-bold text-[12px] text-slate-700 dark:text-slate-300 truncate">
                        {user.name}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-500 tracking-widest flex items-center gap-1.5 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-[3px] border border-emerald-200 dark:border-emerald-500/30">
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
    <div className="flex flex-col gap-6 w-full">
      
      {/* Create Room */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center gap-2">
          <Network size={14} className="text-blue-500" />
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em]">
            Host Collab Session
          </span>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Initialize a live session to collaborate on this problem with peers. You will be assigned a unique room code.
          </p>
          <button
            disabled={isCreating || authLoading || !user}
            onClick={async (e) => {
              e.preventDefault();
              if (!window.confirm("Initialize a new live session?")) return;
              setIsCreating(true);
              await handleRoomCreation();
              setIsCreating(false);
            }}
            className="w-full flex justify-center items-center gap-2 h-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-[3px] text-[12px] font-sans font-semibold tracking-wide transition-colors shadow-sm"
          >
            {isCreating ? <><Loader2 size={14} className="animate-spin" /> Initializing...</> : <><Network size={14} /> initialize Session</>}
          </button>
        </div>
      </div>

      {/* Join Room */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center gap-2">
          <Plug size={14} className="text-blue-500" />
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em]">
            Join a Collab
          </span>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <p className="font-sans text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Enter a room signature provided by a peer to join their active session.
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
              className="flex-1 h-10 px-3 rounded-[3px] bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-[12px] font-semibold tracking-wide outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
            />
            <button
              type="submit"
              disabled={isJoining || authLoading || !user}
              className="px-6 h-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors rounded-[3px] font-sans text-[12px] font-semibold tracking-wide"
            >
              {isJoining ? <Loader2 size={14} className="animate-spin" /> : "Join"}
            </button>
          </form>
        </div>
      </div>

      {!authLoading && !user && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-red-600 dark:text-red-500 text-center font-bold">
          [ SIGN IN TO ACCESS LIVE COLLABORATION ]
        </p>
      )}

      {/* Global Error Notice */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest border border-red-200 dark:border-red-500/30 rounded-[3px] flex items-center gap-2">
          <Terminal size={14} /> [ERROR] {error}
        </div>
      )}
    </div>
  );
}

export default CollabTab;