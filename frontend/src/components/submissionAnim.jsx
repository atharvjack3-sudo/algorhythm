import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function ZenLoader() {
  const blocksRef = useRef([]);
  const cursorRef = useRef(null);
  const textRef = useRef(null);
  const [dotCount, setDotCount] = useState(0);

  // Subtle "Thinking..." dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Terminal cursor blink (hard step, no fade)
    gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.6,
      repeat: -1,
      ease: "steps(1)", 
    });

    // 2. Ultra-subtle background breathing
    // Random blocks gently shift from 15% to 40% opacity, 
    // simulating background memory/processing without grabbing attention.
    blocksRef.current.forEach((block) => {
      if (!block) return;
      gsap.to(block, {
        opacity: 0.4,
        duration: "random(2, 4)", // Slow, relaxing durations
        delay: "random(0, 2)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

  }, []);

  // Structure for our "skeleton" code lines
  const codeLines = [
    [40, 20],
    [15, 30, 20],
    [50],
    [20, 35],
    [30, 15, 25],
    [60],
  ];

  return (
    <div className="w-full max-w-md shadow-xl mx-auto flex flex-col dark:bg-[#020617] border dark:border-slate-800/60 border-slate-300  overflow-hidden font-mono select-none">
      
      {/* Minimal Header */}
      <div className="px-5 py-2.5 border-b border-slate-300 dark:border-slate-800/60 dark:bg-[#0f172a]/50 flex items-center justify-between">
        <span className="text-[10px] dark:text-slate-500 text-slate-600 uppercase tracking-widest">
          Execution Code
        </span>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Ambient Animation Area */}
      <div className="relative h-[180px] p-6 flex flex-col justify-between">
        
        {/* Background Skeleton Code */}
        <div className="absolute inset-0 p-6 flex flex-col gap-3 pointer-events-none">
          {codeLines.map((line, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex gap-2"
              style={{ marginLeft: rowIndex === 1 || rowIndex === 3 || rowIndex === 4 ? "1.5rem" : "0" }}
            >
              {line.map((width, colIndex) => {
                // Calculate a flat index for the ref array
                const index = rowIndex * 10 + colIndex; 
                return (
                  <div
                    key={colIndex}
                    ref={(el) => (blocksRef.current[index] = el)}
                    className="h-2 rounded-sm bg-slate-700"
                    style={{ width: `${width}%`, opacity: 0.15 }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Foreground Status Text */}
        <div className="relative z-10 h-full flex items-end">
          <div className="flex items-center text-slate-400 text-sm">
            <span>judging</span>
            <span className="w-6 inline-block">
              {".".repeat(dotCount)}
            </span>
            <span ref={cursorRef} className="w-2 h-4 bg-slate-500 ml-1" />
          </div>
        </div>

      </div>
    </div>
  );
}