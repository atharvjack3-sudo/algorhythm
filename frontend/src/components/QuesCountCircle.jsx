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
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const gap = 6;
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
        className="-rotate-90"
        style={{ display: "block" }}
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={stroke}
        />

        {/* Base segments */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#bae6fd"
          strokeWidth={stroke}
          strokeDasharray={`${easyLen} ${circumference - easyLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#fef08a"
          strokeWidth={stroke}
          strokeDasharray={`${medLen} ${circumference - medLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#fecaca"
          strokeWidth={stroke}
          strokeDasharray={`${hardLen} ${circumference - hardLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />

        {/* Solved overlays */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#06b6d4"
          strokeWidth={stroke}
          strokeDasharray={`${easySolvedLen} ${circumference - easySolvedLen}`}
          strokeDashoffset={offsetFor(startEasy)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={stroke}
          strokeDasharray={`${medSolvedLen} ${circumference - medSolvedLen}`}
          strokeDashoffset={offsetFor(startMed)}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth={stroke}
          strokeDasharray={`${hardSolvedLen} ${circumference - hardSolvedLen}`}
          strokeDashoffset={offsetFor(startHard)}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-sm text-gray-500 font-lexend">Solved</div>
        <div className="text-2xl font-bold font-space text-gray-800">
          {solvedCount}
          <span className="text-lg font-space font-medium text-gray-500">
            / {totalQuestions}
          </span>
        </div>
        <span className="mt-1 text-xs text-gray-600 font-lexend">
          <span className="font-semibold">{acceptanceRate}%</span>
          <br /> Acceptance
        </span>
      </div>
    </div>
  );
}

export default QuesCountCircle;
