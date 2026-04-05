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
  const totalQuestions = easyTotal + medTotal + hardTotal;
  const radius = 75;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Increased gap to 24 to account for the 10px strokeWidth overlapping the ends (5px on each side)
  const gap = 15; 
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
          className="stroke-emerald-100 dark:stroke-emerald-500/20 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${easyLen} ${circumference - easyLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-100 dark:stroke-amber-500/20 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${medLen} ${circumference - medLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-rose-100 dark:stroke-rose-500/20 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${hardLen} ${circumference - hardLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />

        {/* Solved overlays (Active progress) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-emerald-500 dark:stroke-emerald-400 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${easySolvedLen} ${circumference - easySolvedLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-amber-500 dark:stroke-amber-400 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${medSolvedLen} ${circumference - medSolvedLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          className="stroke-rose-500 dark:stroke-rose-400 transition-colors duration-300"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${hardSolvedLen} ${circumference - hardSolvedLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-300">
          Solved
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300 flex items-baseline">
          {solvedCount}
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1 transition-colors duration-300">
            / {totalQuestions}
          </span>
        </div>
        <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-colors duration-300 flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-300 transition-colors duration-300 text-sm">
            {acceptanceRate}%
          </span>
          Acceptance
        </div>
      </div>
    </div>
  );
}

export default QuesCountCircle;