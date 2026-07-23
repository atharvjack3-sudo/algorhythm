import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  Code2,
  ExternalLink,
  HelpCircle,
  Layers,
  TerminalSquare,
  Trophy,
  Clock,
  BookOpen
} from 'lucide-react';

// --- MOCK DATA FOR DYNAMIC PROGRAMMING ---
const TRACK_DATA = {
  id: "dynamic-programming",
  title: "Dynamic Programming",
  description: "Master the art of breaking down complex problems into simpler overlapping subproblems. Learn state representation, memoization, and bottom-up tabulation.",
  difficulty: "Hard",
  total_progress: 35, // percentage
  modules: [
    {
      id: "mod-1",
      title: "The Core Concepts",
      description: "Understand state, transitions, and the difference between Top-Down and Bottom-Up approaches.",
      progress: 100,
      items: [
        { id: "i-1", title: "What is Dynamic Programming?", type: "article", status: "completed", duration: "10 min" },
        { id: "i-2", title: "Identifying Overlapping Subproblems", type: "quiz", status: "completed", duration: "5 Qs" },
        { id: "i-3", title: "Fibonacci Number", type: "problem", status: "completed", duration: "Easy" },
      ]
    },
    {
      id: "mod-2",
      title: "1D Dynamic Programming",
      description: "Solve problems where the state transitions occur along a single linear dimension.",
      progress: 50,
      items: [
        { id: "i-4", title: "State in 1D Space", type: "article", status: "completed", duration: "15 min" },
        { id: "i-5", title: "Climbing Stairs", type: "problem", status: "completed", duration: "Easy" },
        { id: "i-6", title: "Errichto's DP Tutorial (Part 1)", type: "external", status: "pending", duration: "20 min" },
        { id: "i-7", title: "House Robber", type: "problem", status: "pending", duration: "Medium" },
      ]
    },
    {
      id: "mod-3",
      title: "2D Dynamic Programming & Grids",
      description: "Navigate grid-based problems where the state requires two parameters.",
      progress: 0,
      items: [
        { id: "i-8", title: "Grid Paths and 2D States", type: "article", status: "pending", duration: "12 min" },
        { id: "i-9", title: "Unique Paths", type: "problem", status: "pending", duration: "Medium" },
        { id: "i-10", title: "Minimum Path Sum", type: "problem", status: "pending", duration: "Medium" },
        { id: "i-11", title: "Longest Common Subsequence", type: "problem", status: "pending", duration: "Medium" },
      ]
    },
    {
      id: "mod-4",
      title: "Knapsack Variations",
      description: "Master 0/1 Knapsack, Unbounded Knapsack, and Subset Sum patterns.",
      progress: 0,
      items: [
        { id: "i-12", title: "The 0/1 Knapsack Concept", type: "article", status: "pending", duration: "15 min" },
        { id: "i-13", title: "Partition Equal Subset Sum", type: "problem", status: "pending", duration: "Medium" },
        { id: "i-14", title: "Coin Change", type: "problem", status: "pending", duration: "Medium" },
        { id: "i-15", title: "Knapsack DP Patterns", type: "quiz", status: "pending", duration: "8 Qs" },
      ]
    }
  ]
};

// --- HELPER COMPONENTS ---
const TypeIcon = ({ type, size = 16, className = "" }) => {
  switch(type) {
    case 'article': return <FileText size={size} className={className} />;
    case 'problem': return <Code2 size={size} className={className} />;
    case 'external': return <ExternalLink size={size} className={className} />;
    case 'quiz': return <HelpCircle size={size} className={className} />;
    default: return <FileText size={size} className={className} />;
  }
};

export default function LearnTopicModules() {
  const navigate = useNavigate();
  // Open the first two modules by default
  const [expandedModules, setExpandedModules] = useState(new Set(["mod-1", "mod-2"]));

  const toggleModule = (id) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const completedItems = TRACK_DATA.modules.flatMap(m => m.items).filter(i => i.status === 'completed').length;
  const totalItems = TRACK_DATA.modules.flatMap(m => m.items).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="relative min-h-[calc(100vh-56px)] w-full bg-slate-100 dark:bg-[#050608] text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 font-sans transition-colors duration-300 overflow-hidden">
        
        {/* Widescreen IDE Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6 lg:gap-8">
          
          {/* --- TOP NAVIGATION & HEADER --- */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/learn')}
              className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500 hover:text-orange-500 uppercase tracking-widest w-fit transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} /> BACK TO LEARN
            </button>
            
            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 justify-between relative overflow-hidden">
              <div className="flex flex-col max-w-3xl z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[3px] text-red-600 dark:text-red-500">
                    <Layers size={20} strokeWidth={2} />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded-[3px] bg-red-50 dark:bg-red-500/10">
                    {TRACK_DATA.difficulty} TRACK
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mb-2">
                  {TRACK_DATA.title}
                </h1>
                <p className="font-sans text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {TRACK_DATA.description}
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] p-5 flex flex-col justify-center min-w-[240px] z-10 shrink-0">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Track Progress</span>
                    <span className="font-sans text-3xl font-bold text-slate-900 dark:text-white leading-none">
                      {TRACK_DATA.total_progress}%
                    </span>
                  </div>
                  <Trophy size={24} className={TRACK_DATA.total_progress === 100 ? "text-amber-500" : "text-slate-300 dark:text-slate-700"} />
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${TRACK_DATA.total_progress}%` }}></div>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3 text-right">
                  {completedItems} / {totalItems} COMPLETED
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* ================= LEFT COLUMN: MODULE LIST ================= */}
            <main className="flex-1 flex flex-col gap-4 min-w-0">
              
              <div className="flex items-center gap-2 mb-2">
                <TerminalSquare size={14} className="text-orange-500" />
                <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-700 dark:text-slate-300 uppercase">
                  Modules
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {TRACK_DATA.modules.map((mod, index) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const isModCompleted = mod.progress === 100;

                  return (
                    <div 
                      key={mod.id} 
                      className={`bg-white dark:bg-[#0d1117] border rounded-[3px] overflow-hidden shadow-sm transition-colors ${
                        isExpanded ? "border-orange-500/50 dark:border-orange-500/50" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Module Header (Clickable) */}
                      <div 
                        onClick={() => toggleModule(mod.id)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-[#161b22] hover:bg-slate-100 dark:hover:bg-[#1a2028] transition-colors select-none"
                      >
                        <div className="flex flex-col gap-1.5 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-slate-400">
                              Module {String(index + 1).padStart(2, '0')}
                            </span>
                            {isModCompleted && (
                              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.5 rounded-[3px] font-mono text-[8px] font-bold uppercase tracking-widest">
                                Completed
                              </span>
                            )}
                          </div>
                          <h3 className="font-sans text-[16px] font-bold text-slate-900 dark:text-white">
                            {mod.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex flex-col items-end gap-1.5 w-32">
                            <div className="flex justify-between w-full font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              <span>{mod.items.length} ITEMS</span>
                              <span className={isModCompleted ? "text-emerald-500" : ""}>{mod.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${isModCompleted ? "bg-emerald-500" : "bg-orange-500"}`} style={{ width: `${mod.progress}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Module Content (Items List) */}
                      {isExpanded && (
                        <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117]">
                          {mod.items.map((item, iIdx) => {
                            const isCompleted = item.status === 'completed';
                            
                            return (
                              <div 
                                key={item.id}
                                className={`group flex items-center justify-between p-4 border-l-2 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
                                  isCompleted 
                                    ? "border-l-transparent" 
                                    : "border-l-transparent hover:border-l-orange-500"
                                } ${iIdx !== mod.items.length - 1 ? "border-b border-slate-100 dark:border-slate-800/60" : ""}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="shrink-0 text-slate-400">
                                    {isCompleted ? (
                                      <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                      <Circle size={16} className="text-slate-300 dark:text-slate-700 group-hover:text-orange-500 transition-colors" />
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    <span className={`font-sans text-[14px] font-bold ${isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"} group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors`}>
                                      {item.title}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-[#050608] px-1.5 py-0.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                                        <TypeIcon type={item.type} size={10} />
                                        {item.type}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-[10px] font-semibold text-slate-400 tracking-widest uppercase hidden sm:block">
                                    {item.duration}
                                  </span>
                                  <button className="opacity-0 group-hover:opacity-100 font-mono text-[10px] font-bold tracking-widest text-orange-500 border border-orange-500 px-3 py-1.5 rounded-[3px] uppercase transition-all hover:bg-orange-50 dark:hover:bg-orange-500/10">
                                    {isCompleted ? "Review" : "Start"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </main>

            {/* ================= RIGHT COLUMN: TRACK INFO SIDEBAR ================= */}
            <aside className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
              
              <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col sticky top-6">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center gap-2">
                  <BookOpen size={14} className="text-orange-500" />
                  <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-slate-600 dark:text-slate-300 uppercase">
                    Track Overview
                  </span>
                </div>
                
                <div className="p-5 flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Time</span>
                    <div className="flex items-center gap-2 font-sans text-[14px] font-bold text-slate-900 dark:text-white">
                      <Clock size={16} className="text-slate-500" />
                      14 Hours
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prerequisites</span>
                    <ul className="flex flex-col gap-2 mt-1">
                      <li className="flex items-center gap-2 font-sans text-[13px] font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-orange-500 transition-colors">
                        <ArrowLeft size={12} className="text-orange-500" /> Recursion & Backtracking
                      </li>
                      <li className="flex items-center gap-2 font-sans text-[13px] font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-orange-500 transition-colors">
                        <ArrowLeft size={12} className="text-orange-500" /> Time Complexity Analysis
                      </li>
                    </ul>
                  </div>

                  <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60 my-1"></div>

                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instructors</span>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-8 h-8 rounded-[3px] bg-slate-200 dark:bg-[#050608] border border-slate-300 dark:border-slate-700 flex items-center justify-center font-sans font-bold text-slate-500">
                        A
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">Algorhythm Team</span>
                        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Platform Authors</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}