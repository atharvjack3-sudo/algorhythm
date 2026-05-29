import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext";

function ratingToProgress(rating) {
  const min = 500;
  const max = 1800;
  const clamped = Math.max(min, Math.min(max, rating));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

function Coach() {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchPerformance() {
      try {
        setLoading(true);
        const res = await api.get(`/users/${user.id}/performance`);
        console.log(res.data);
        const topicsFromApi = Array.isArray(res.data?.topics)
          ? res.data.topics
          : [];
        const mapped = topicsFromApi.map((t) => ({
          name: t.topic,
          rating: t.rating,
          attempts: t.attempts,
          solves: t.solves,
          progress: ratingToProgress(t.rating),
          level: t.level,
        }));

        setTopics(mapped);
        setAiAnalysis(res.data.ai_analysis);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to link tactical data");
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          ANALYZING PERFORMANCE...
        </span>
      </div>
    );
  }

  const weakTopics = topics.filter((t) => t.level === "weak");
  const mediumTopics = topics.filter((t) => t.level === "medium");
  const strongTopics = topics.filter((t) => t.level === "strong");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 pb-16">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  AI Coach
                </span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                Your Performance
              </h1>
              <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 tracking-[0.05em] mt-1">
                Cognitive Intelligence & Performance Matrix
              </p>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[200px] border border-slate-200 dark:border-slate-800 rounded-[3px] p-3 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-widest">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className="text-green-600 dark:text-green-500 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-widest">
                <span className="text-slate-500 dark:text-slate-400">Subject</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{user?.username}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            
            {/* --- LEFT: TOPIC ANALYSIS --- */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              
              {/* 1. WEAK SECTOR */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden transition-colors duration-300">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
                  <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-red-600 dark:text-red-400 uppercase flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"></span>
                    Critical Weaknesses
                  </div>
                </div>

                <div className="p-6">
                  {weakTopics.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-3">
                      <div className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Status Clear
                      </div>
                      <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
                        No critical vulnerabilities detected in your recent combat history.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      {weakTopics.map((topic) => (
                        <TopicMetric key={topic.name} topic={topic} accent="rose" />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 2. PROGRESSING & MASTERED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stable Sectors */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                    <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-amber-600 dark:text-amber-500 uppercase flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-[1px] bg-amber-500"></span>
                      Stable Sectors
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {mediumTopics.length === 0 ? (
                      <p className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center py-4">No data</p>
                    ) : mediumTopics.map((topic) => (
                      <TopicMetric key={topic.name} topic={topic} accent="amber" />
                    ))}
                  </div>
                </section>

                {/* Mastered Sectors */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-green-50/50 dark:bg-green-950/20 flex items-center justify-between">
                    <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-green-600 dark:text-green-500 uppercase flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-[1px] bg-green-500"></span>
                      Mastered Sectors
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {strongTopics.length === 0 ? (
                      <p className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center py-4">No data</p>
                    ) : strongTopics.map((topic) => (
                      <TopicMetric key={topic.name} topic={topic} accent="emerald" />
                    ))}
                  </div>
                </section>
                
              </div>
            </div>

            {/* --- RIGHT: AI DIRECTIVE --- */}
            <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
              
              {/* --- PRIMARY AI DIRECTIVE CHIP --- */}
              <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-md overflow-hidden shadow-xl dark:shadow-none transition-colors duration-300">
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                  <div className="font-mono text-[11px] font-bold tracking-[0.1em] text-blue-400 uppercase flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
                    Terminal Output
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* === AI SUMMARY: The "Voice" === */}
                  <div className="relative">
                    <p className="font-mono text-[12px] leading-relaxed text-slate-300">
                      <span className="text-blue-500 mr-2">{">"}</span>
                      {aiAnalysis?.summary ?? "Standby. Synchronizing with your combat history to generate optimized tactical guidance..."}
                    </p>
                  </div>

                  {/* === AI FOCUS TOPICS === */}
                  {aiAnalysis?.focus_topics?.length > 0 && (
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                        Priority Directives
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.focus_topics.map((topic) => (
                          <div key={topic} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-[3px] font-mono text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* === AI PRACTICE ADVICE === */}
                  {aiAnalysis?.practice_advice?.length > 0 && (
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                        Tactical Logs
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {aiAnalysis.practice_advice.map((advice, idx) => (
                          <li key={idx} className="font-mono text-[11px] text-slate-400 leading-relaxed flex gap-2.5 items-start">
                            <span className="text-blue-500 font-bold shrink-0 mt-0.5">[{idx + 1}]</span>
                            <span>{advice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* --- PERFORMANCE LEGEND --- */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 shadow-sm transition-colors duration-300">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">
                  Classification Legend
                </h4>

                <div className="flex flex-col gap-2">
                  {[
                    { label: "Elite Operative", range: "> 1500", color: "bg-green-500", text: "text-green-600 dark:text-green-400" },
                    { label: "Active Combatant", range: "1000–1500", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
                    { label: "Field Trainee", range: "< 1000", color: "bg-red-500", text: "text-red-600 dark:text-red-400" },
                  ].map((tier) => (
                    <div key={tier.label} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-[3px] border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-[1px] ${tier.color}`}></div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          {tier.label}
                        </span>
                      </div>
                      <span className={`font-mono text-[10px] font-bold tracking-wider ${tier.text}`}>
                        {tier.range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

{/* SUB-COMPONENT: TopicMetric */}
function TopicMetric({ topic, accent }) {
  const accentConfig = {
    rose: {
      bar: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
    },
    amber: {
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    },
    emerald: {
      bar: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
    },
  };

  const config = accentConfig[accent] || accentConfig.rose;

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-0.5">
          <h4 className="font-sans text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {topic.name}
          </h4>
          <p className="font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors duration-200">
            {topic.solves}/{topic.attempts} Solved
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className={`font-mono text-[13px] font-bold ${config.text} transition-colors duration-200`}>
            {topic.rating}
          </span>
          <p className="font-mono text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors duration-200">
            Rating
          </p>
        </div>
      </div>
      <div className="h-[3px] w-full bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden transition-colors duration-200">
        <div
          className={`h-full transition-all duration-1000 ${config.bar}`}
          style={{ width: `${topic.progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Coach;