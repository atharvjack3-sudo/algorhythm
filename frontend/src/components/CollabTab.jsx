import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function CollabTab({
  collabActive,
  setCollabActive,
  problemId,
  setCollabData,
  isOwner,
  setIsOwner
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
      /*
              res.status(201).json({
              errorPresent: false,
              errorMsg: null,
              roomCode: rcode,
              wsRoomId: wsRoomId,
          });
      */
      if (obj.errorPresent && obj.roomCode == null) {
        setCollabActive(false);
        setError(obj.errorMsg);
        return;
      } else if (obj.errorPresent && obj.roomCode != null) {
        setError(obj.errorMsg);
      }
      setCollabData({
        // this is for the parent prop where IDE code is present
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
        // this is for the parent prop where IDE code is present
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

  const Spinner = ({ className }) => (
    <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (collabActive) {
    return (
      <div className="flex flex-col gap-5 p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <p className="text-green-600 text-center w-full dark:text-green-400 font-bold tracking-wide">
            {" "}
            <span className="relative animate-pulse inline-flex rounded-full h-2 w-2 bg-green-500 mr-2"></span>
            {roomCode === "Fetching..."
              ? isOwner
                ? "Activating Room"
                : "Joining Room"
              : "Room Active"}
          </p>
        </div>

        {/* Dynamic Description Text */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          {isOwner
            ? "You are currently hosting a private room. Share this code with your friends to let them join."
            : "You have joined the private room and are ready to collaborate."}
        </p>

        {/* Room Code & Copy Button - ONLY SHOWN TO OWNER */}
        {isOwner && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Room Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={roomCode}
                className={`flex-1 ${roomCode === "Fetching..." ? "animate-pulse" : ""} h-10 px-3 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-mono text-center tracking-widest focus:outline-none`}
              />
              <button
                onClick={handleCopy}
                disabled={roomCode === "Fetching..."}
                className="px-4 h-10 disabled:cursor-not-allowed disabled:bg-gray-500 cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors duration-200 rounded-md text-white font-semibold flex items-center justify-center min-w-[80px] shadow-sm"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Conditional Action Buttons */}
        {isOwner ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              exitRoom();
            }}
            className="w-full mt-2 cursor-pointer hover:bg-red-600 bg-red-500 transition-all duration-200 h-10 rounded-md text-white font-semibold tracking-wide shadow-sm"
          >
            Terminate Room
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              exitRoom();
            }}
            className="w-full mt-2 cursor-pointer hover:bg-gray-600 bg-gray-500 transition-all duration-200 h-10 rounded-md text-white font-semibold tracking-wide shadow-sm"
          >
            Leave Room
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <span className="bg-orange-500/10 tracking-widest rounded-md font-light text-center text-xs py-1">[ BETA ]</span>

      {/* Create Room Section */}
      <div className="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You can make a private room and collaborate on this problem together
          with your friends.
        </p>
        <button
          onClick={async (e) => {
            setIsCreating(true);
            e.preventDefault();
            await handleRoomCreation();
            setIsCreating(false);
          }}
          disabled={isCreating}
          className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 hover:bg-orange-600 transition-all duration-200 h-10 rounded-md text-white font-semibold tracking-wide bg-orange-500 shadow-sm"
        >
          {isCreating && <Spinner className="text-white" />}
          {isCreating ? "Creating..." : "Create Room"}
        </button>
      </div>

      {/* Join Room Section */}
      <div className="flex flex-col gap-3 pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Or, join a pre-existing room and help out your friends on this
          problem.
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
            placeholder="Room Code"
            className="flex-1 h-10 px-3 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-center focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isJoining}
            className="px-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 h-10 rounded-md text-white dark:text-black font-semibold tracking-wide bg-gray-900 dark:bg-white shadow-sm"
          >
            {isJoining && <Spinner className="text-white dark:text-black" />}
            {isJoining ? "Joining..." : "Join"}
          </button>
        </form>
      </div>

      {error !== "" && (
        <p className="w-full h-10 rounded-md flex justify-center items-center bg-red-900/50 text-white">
          {error}
        </p>
      )}
    </div>
  );
}

export default CollabTab;
