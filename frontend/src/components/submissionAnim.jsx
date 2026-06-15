import React, { useState, useEffect } from "react";

const EXECUTION_STEPS = [
  { id: 1, text: "Establishing secure connection..." },
  { id: 2, text: "Initializing isolated container..." },
  { id: 3, text: "Mounting sandbox environment..." },
  { id: 4, text: "Compiling source code..." },
  { id: 5, text: "Executing against standard test cases..." },
  { id: 6, text: "Validating hidden edge cases..." },
  { id: 7, text: "Aggregating memory & time telemetry..." },
  { id: 8, text: "Finalizing execution report..." },
];

export default function SubmissionAnim() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Halt progression right as we display the final step.
    // Progress bar will lock at 94% indefinitely until unmounted.
    if (currentStep >= EXECUTION_STEPS.length - 1) {
      setProgress(94);
      return;
    }

    // Calibrated window to average 1150ms per step (950ms to 1350ms)
    // 7 steps * 1150ms = ~8.05 seconds total runtime to reach the final index
    const stepDuration = Math.floor(Math.random() * 400) + 950;

    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, EXECUTION_STEPS[currentStep]]);
      setCurrentStep((prev) => prev + 1);
      
      // Scale progress smoothly over the 7 initial steps up toward 90%
      const calculatedProgress = Math.round(((currentStep + 1) / (EXECUTION_STEPS.length - 1)) * 88);
      setProgress(calculatedProgress);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
            System Execution
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-[3px] bg-slate-100 dark:bg-slate-800">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal Area */}
      <div className="p-6 bg-[#0c0c0c] min-h-[250px] font-mono flex flex-col gap-2 relative overflow-hidden">
        
        {/* Subtle grid background for the terminal */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
          {/* Completed Logs */}
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-[12px] text-slate-400 animate-in slide-in-from-bottom-2 duration-200">
              <span className="text-green-500 mt-0.5 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{log.text} <span className="text-slate-600">[DONE]</span></span>
            </div>
          ))}

          {/* Current Active Step (Locks and spins here indefinitely on step #8) */}
          {currentStep < EXECUTION_STEPS.length && (
            <div className="flex items-start gap-3 text-[12px] text-blue-400 mt-1">
              <span className="mt-0.5 shrink-0 animate-spin text-blue-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              <span className="animate-pulse">
                {EXECUTION_STEPS[currentStep]?.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}