import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Layers, 
  GitCommit, 
  Network, 
  ArrowRightLeft, 
  BoxSelect, 
  TerminalSquare, 
  ChevronRight,
  Code2,
  Cpu,
  Sigma
} from 'lucide-react';

// --- Mock Data for the Landing Page ---
const LEARNING_TRACKS = [
  {
    id: "prefix-sums",
    title: "Prefix Sums & Arrays",
    description: "Master O(1) range queries and array preprocessing techniques.",
    difficulty: "Easy",
    modules: 4,
    progress: 100, // percentage
    icon: BoxSelect,
    color: "emerald"
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    description: "Optimize nested loops by maintaining a dynamic window of elements.",
    difficulty: "Medium",
    modules: 6,
    progress: 45,
    icon: ArrowRightLeft,
    color: "blue"
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    description: "Learn memoization, tabulation, and state transitions from the ground up.",
    difficulty: "Hard",
    modules: 12,
    progress: 0,
    icon: Layers,
    color: "red"
  },
  {
    id: "graph-theory",
    title: "Graph Algorithms",
    description: "Traversals, shortest paths, and spanning trees with interactive visualizations.",
    difficulty: "Medium",
    modules: 8,
    progress: 0,
    icon: Network,
    color: "blue"
  },
  {
    id: "segment-trees",
    title: "Range Queries (Segment Trees)",
    description: "Advanced data structures for mutable range queries and lazy propagation.",
    difficulty: "Advanced",
    modules: 5,
    progress: 0,
    icon: GitCommit,
    color: "purple"
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    description: "Low-level bitwise operations, masks, and XOR optimizations.",
    difficulty: "Easy",
    modules: 3,
    progress: 0,
    icon: Cpu,
    color: "emerald"
  },
  {
    id: "number-theory",
    title: "Number Theory",
    description: "Learn number theory concepts that commonly show up in CP problems.",
    difficulty: "Hard",
    modules: 8,
    progress: 0,
    icon: Sigma,
    color: "red"
  }
];

// --- Helper Components ---
const DifficultyBadge = ({ difficulty, color }) => {
  const colorMap = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/30",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-500/30",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/30",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-200 dark:border-purple-500/30",
  };

  return (
    <span className={`px-2 py-0.5 rounded-[3px] border font-mono text-[9px] font-bold uppercase tracking-widest ${colorMap[color]}`}>
      {difficulty}
    </span>
  );
};

export default function LearnHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Easy", "Medium", "Hard", "Advanced"];

  const filteredTracks = LEARNING_TRACKS.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          track.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || track.difficulty === activeFilter;
    return matchesSearch && matchesFilter;
  });

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

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
          
          {/* --- HERO SECTION --- */}
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 p-16 opacity-5 dark:opacity-10 pointer-events-none">
              <BookOpen size={200} />
            </div>

            <div className="flex flex-col max-w-2xl relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <TerminalSquare size={16} className="text-orange-500" />
                <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-500 tracking-[0.15em] uppercase">
                  Interactive Learning Environment
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mb-3">
                Algorhythm <span className="text-orange-500">Learn</span>
              </h1>
              <p className="font-sans text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Master data structures and algorithms through highly interactive visual articles, real-time code execution, and curated learning tracks designed for competitive programming.
              </p>
            </div>

            <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto">
              <div className="bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] p-4 flex flex-col gap-1 min-w-[200px]">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Progress</span>
                <div className="flex items-end justify-between">
                  <span className="font-sans text-2xl font-bold text-slate-900 dark:text-white">12%</span>
                  <span className="font-mono text-[10px] text-emerald-500 font-bold mb-1">2/15 TRACKS</span>
                </div>
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-orange-500 w-[12%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- SEARCH & FILTERS --- */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-[400px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search algorithms, data structures..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[3px] pl-9 pr-4 py-2.5 text-[13px] font-sans font-medium outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-2 md:pb-0">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`font-mono text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-[3px] border transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === filter 
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                      : "bg-white dark:bg-[#0d1117] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:text-orange-500"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* --- TOPIC GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map(track => {
              const Icon = track.icon;
              return (
                <div 
                  key={track.id}
                  onClick={() => navigate(`/learn/${track.id}`)}
                  className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm hover:shadow-md hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all cursor-pointer flex flex-col group"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[3px] text-slate-600 dark:text-slate-300 group-hover:text-orange-500 group-hover:border-orange-500/30 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      <DifficultyBadge difficulty={track.difficulty} color={track.color} />
                    </div>
                    
                    <h3 className="font-sans text-[16px] font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                      {track.title}
                    </h3>
                    <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-6">
                      {track.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Code2 size={12} /> {track.modules} Modules
                        </span>
                        <span className={`font-mono text-[10px] font-bold ${track.progress === 100 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                          {track.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-[#050608] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${track.progress === 100 ? "bg-emerald-500" : "bg-orange-500"}`} 
                          style={{ width: `${track.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Footer */}
                  <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0a0c10] flex justify-between items-center group-hover:bg-orange-50 dark:group-hover:bg-orange-500/5 transition-colors">
                    <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-orange-600 dark:group-hover:text-orange-500">
                      {track.progress === 0 ? "Start Track" : track.progress === 100 ? "Review Track" : "Continue"}
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTracks.length === 0 && (
            <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm">
              <Search size={32} className="text-slate-300 dark:text-slate-700 mb-4" />
              <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                NO TRACKS FOUND
              </p>
              <p className="font-sans text-[13px] text-slate-400 mt-2">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}