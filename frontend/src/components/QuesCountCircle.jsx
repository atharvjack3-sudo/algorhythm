import React, { useState } from "react";

function QuesCountCircle({
  easyTotal = 1,
  medTotal = 1,
  hardTotal = 1,
  easySolved = 1,
  medSolved = 2,
  hardSolved = 3,
  size = 210,
  attempts = 8,
  ac_attempts = 0,
  user = {},
}) {
  const [hovered, setHovered] = useState(null); // 'easy' | 'medium' | 'hard' | null

  const totalQuestions = Math.max(1, easyTotal + medTotal + hardTotal);
  const radius = 75;
  const stroke = 8;
  const hoverStroke = 11;
  const circumference = 2 * Math.PI * radius;

  const gap = 7;
  const available = circumference - 3 * gap;

  const easyLen = (easyTotal / totalQuestions) * available;
  const medLen = (medTotal / totalQuestions) * available;
  const hardLen = available - easyLen - medLen;

  const easySolvedLen = Math.min(
    (easySolved / Math.max(1, easyTotal)) * easyLen,
    easyLen
  );
  const medSolvedLen = Math.min(
    (medSolved / Math.max(1, medTotal)) * medLen,
    medLen
  );
  const hardSolvedLen = Math.min(
    (hardSolved / Math.max(1, hardTotal)) * hardLen,
    hardLen
  );

  const startEasy = 0;
  const startMed = easyLen + gap;
  const startHard = easyLen + gap + medLen + gap;
  const offsetFor = (cumulativeStart) => circumference - cumulativeStart;

  const acceptanceRate = (
    ((ac_attempts || 0) / Math.max(1, attempts || 1)) *
    100
  ).toFixed(2);

  const solvedCount = easySolved + medSolved + hardSolved;

  const categories = {
    easy: {
      label: "Easy",
      solved: easySolved,
      total: easyTotal,
      textClass: "text-emerald-500 dark:text-emerald-400",
      glow: "rgba(16,185,129,0.55)",
    },
    medium: {
      label: "Medium",
      solved: medSolved,
      total: medTotal,
      textClass: "text-amber-500 dark:text-amber-400",
      glow: "rgba(245,158,11,0.55)",
    },
    hard: {
      label: "Hard",
      solved: hardSolved,
      total: hardTotal,
      textClass: "text-red-500 dark:text-red-400",
      glow: "rgba(239,68,68,0.55)",
    },
  };

  const active = hovered ? categories[hovered] : null;
  const activeRate = active
    ? ((active.solved / Math.max(1, active.total)) * 100).toFixed(2)
    : null;

  // Shared handlers per segment, plus a wider invisible hit-area for easier hovering
  const segProps = (key) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered((h) => (h === key ? null : h)),
    style: { cursor: "pointer" },
  });

  const isHovered = (key) => hovered === key;
  const isDimmed = (key) => hovered !== null && hovered !== key;

  return (
    <div
      className="select-none relative"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="-rotate-90 transition-all duration-300"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <filter id="glow-easy" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#10b981" floodOpacity="0.85" />
          </filter>
          <filter id="glow-medium" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f59e0b" floodOpacity="0.85" />
          </filter>
          <filter id="glow-hard" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ef4444" floodOpacity="0.85" />
          </filter>
        </defs>

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-slate-100 dark:stroke-slate-800 transition-colors duration-300"
          strokeWidth={stroke}
        />

        {/* Invisible wide hit-areas, drawn first so visible strokes render on top */}
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke="transparent"
          strokeWidth={22} strokeLinecap="butt"
          strokeDasharray={`${easyLen} ${circumference - easyLen}`}
          strokeDashoffset={offsetFor(startEasy)}
          {...segProps("easy")}
        />
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke="transparent"
          strokeWidth={22} strokeLinecap="butt"
          strokeDasharray={`${medLen} ${circumference - medLen}`}
          strokeDashoffset={offsetFor(startMed)}
          {...segProps("medium")}
        />
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke="transparent"
          strokeWidth={22} strokeLinecap="butt"
          strokeDasharray={`${hardLen} ${circumference - hardLen}`}
          strokeDashoffset={offsetFor(startHard)}
          {...segProps("hard")}
        />

        {/* Base segments (Unsolved backgrounds) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-emerald-100 dark:stroke-emerald-900/30 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("easy") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${easyLen} ${circumference - easyLen}`}
          strokeDashoffset={offsetFor(startEasy)}
          style={{ opacity: isDimmed("easy") ? 0.35 : 1 }}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-100 dark:stroke-amber-900/30 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("medium") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${medLen} ${circumference - medLen}`}
          strokeDashoffset={offsetFor(startMed)}
          style={{ opacity: isDimmed("medium") ? 0.35 : 1 }}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-red-100 dark:stroke-red-900/30 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("hard") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${hardLen} ${circumference - hardLen}`}
          strokeDashoffset={offsetFor(startHard)}
          style={{ opacity: isDimmed("hard") ? 0.35 : 1 }}
        />

        {/* Solved overlays (Active progress) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-emerald-500 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("easy") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${easySolvedLen} ${circumference - easySolvedLen}`}
          strokeDashoffset={offsetFor(startEasy)}
          style={{
            opacity: isDimmed("easy") ? 0.35 : 1,
            filter: isHovered("easy") ? "url(#glow-easy)" : "none",
          }}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-500 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("medium") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${medSolvedLen} ${circumference - medSolvedLen}`}
          strokeDashoffset={offsetFor(startMed)}
          style={{
            opacity: isDimmed("medium") ? 0.35 : 1,
            filter: isHovered("medium") ? "url(#glow-medium)" : "none",
          }}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-red-500 transition-all duration-300 pointer-events-none"
          strokeWidth={isHovered("hard") ? hoverStroke : stroke}
          strokeLinecap="butt"
          strokeDasharray={`${hardSolvedLen} ${circumference - hardSolvedLen}`}
          strokeDashoffset={offsetFor(startHard)}
          style={{
            opacity: isDimmed("hard") ? 0.35 : 1,
            filter: isHovered("hard") ? "url(#glow-hard)" : "none",
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div
          key={active ? active.label : "solved"}
          className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] mb-1 transition-colors duration-300"
        >
          {active ? active.label : "Solved"}
        </div>
        <div
          className={`font-sans text-4xl font-bold transition-colors duration-300 flex items-baseline ${
            active ? active.textClass : "text-slate-900 dark:text-white"
          }`}
        >
          {active ? active.solved : solvedCount}
          <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 ml-1 transition-colors duration-300">
            /{active ? active.total : totalQuestions}
          </span>
        </div>
        <div className="mt-1 font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] transition-colors duration-300 flex flex-col">
          <span
            className={`text-[13px] font-bold transition-colors duration-300 ${
              active ? active.textClass : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {active ? activeRate : acceptanceRate}%
          </span>
          {active ? "Solve rate" : "Acceptance"}
        </div>
      </div>
    </div>
  );
}

export default QuesCountCircle;