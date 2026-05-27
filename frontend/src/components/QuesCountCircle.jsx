import React from "react";

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
  const totalQuestions = Math.max(1, easyTotal + medTotal + hardTotal);
  const radius = 75;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Drastically reduced gap since we no longer use rounded caps that overlap
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

  return (
    <div
      className="pointer-events-none select-none relative"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="-rotate-90 transition-all duration-300"
        style={{ display: "block" }}
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-slate-100 dark:stroke-slate-800 transition-colors duration-300"
          strokeWidth={stroke}
        />

        {/* Base segments (Unsolved backgrounds) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-emerald-100 dark:stroke-emerald-900/30 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${easyLen} ${circumference - easyLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-100 dark:stroke-amber-900/30 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${medLen} ${circumference - medLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-red-100 dark:stroke-red-900/30 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${hardLen} ${circumference - hardLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />

        {/* Solved overlays (Active progress) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-emerald-500 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${easySolvedLen} ${circumference - easySolvedLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-500 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${medSolvedLen} ${circumference - medSolvedLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-red-500 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${hardSolvedLen} ${circumference - hardSolvedLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] mb-1 transition-colors duration-300">
          Solved
        </div>
        <div className="font-sans text-4xl font-bold text-slate-900 dark:text-white transition-colors duration-300 flex items-baseline">
          {solvedCount}
          <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 ml-1 transition-colors duration-300">
            /{totalQuestions}
          </span>
        </div>
        <div className="mt-1 font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] transition-colors duration-300 flex flex-col">
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-colors duration-300">
            {acceptanceRate}%
          </span>
          Acceptance
        </div>
      </div>
    </div>
  );
}

export default QuesCountCircle;