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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#0a0c10] transition-colors duration-300">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-500 animate-pulse">
          Your Coach is Thinking
        </p>
      </div>
    );
  }

  const weakTopics = topics.filter((t) => t.level === "weak");
  const mediumTopics = topics.filter((t) => t.level === "medium");
  const strongTopics = topics.filter((t) => t.level === "strong");

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">
      
      {/* 🌌 AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none transition-opacity duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 dark:bg-blue-500/10 rounded-full blur-[120px] transition-colors duration-300"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/40 dark:bg-indigo-500/10 rounded-full blur-[100px] transition-colors duration-300"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* --- HEADER --- */}
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 dark:shadow-none transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-white dark:text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic text-slate-900 dark:text-white transition-colors duration-300">
                Coach SGT. Rhythm
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] transition-colors duration-300">
              Cognitive Intelligence & Performance Matrix
            </p>
          </div>

          <div className="flex gap-8 border-l-2 border-slate-200 dark:border-slate-800 pl-6 md:pl-8 transition-colors duration-300">
            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 transition-colors duration-300">
                Status
              </p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase transition-colors duration-300">
                Operational
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 transition-colors duration-300">
                Subject
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase transition-colors duration-300">
                {user.username}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: TOPIC ANALYSIS --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. WEAK SECTOR */}
            <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors duration-300">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 dark:text-rose-400 transition-colors duration-300">
                  Critical Weaknesses
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
              </div>

              {weakTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 transition-colors">
                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    No critical vulnerabilities detected.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {weakTopics.map((topic) => (
                    <TopicMetric key={topic.name} topic={topic} accent="rose" />
                  ))}
                </div>
              )}
            </section>

            {/* 2. PROGRESSING & MASTERED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors duration-300">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-500 mb-8 transition-colors duration-300">
                  Stable Sectors
                </h3>
                <div className="space-y-8">
                  {mediumTopics.length === 0 ? (
                     <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center py-4">No data</p>
                  ) : mediumTopics.map((topic) => (
                    <TopicMetric key={topic.name} topic={topic} accent="amber" />
                  ))}
                </div>
              </section>

              <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors duration-300">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-500 mb-8 transition-colors duration-300">
                  Mastered Sectors
                </h3>
                <div className="space-y-8">
                  {strongTopics.length === 0 ? (
                     <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center py-4">No data</p>
                  ) : strongTopics.map((topic) => (
                    <TopicMetric key={topic.name} topic={topic} accent="emerald" />
                  ))}
                </div>
              </section>
              
            </div>
          </div>

          {/* --- RIGHT: AI DIRECTIVE --- */}
          <aside className="space-y-8 lg:sticky lg:top-8">
            
            {/* --- PRIMARY AI DIRECTIVE CHIP --- */}
            <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 dark:shadow-none border border-slate-800 transition-colors duration-300">
              {/* Subtle Grid & Scanning Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] opacity-100"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scan"></div>

              <div className="relative z-10">
                
                {/* HUD Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping opacity-40"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">
                      Coach Directive
                    </span>
                  </div>
                </div>

                {/* === AI SUMMARY: The "Voice" === */}
                <div className="relative mb-12">
                  <span className="absolute -left-4 top-0 text-blue-500/30 text-4xl font-serif">
                    “
                  </span>
                  <p className="text-[15px] md:text-base font-medium leading-relaxed text-slate-300 italic pl-2">
                    {aiAnalysis?.summary ??
                      "Standby. Synchronizing with your combat history to generate optimized tactical guidance..."}
                  </p>
                </div>

                {/* === AI FOCUS TOPICS: Tactical Chips === */}
                {aiAnalysis?.focus_topics?.length > 0 && (
                  <div className="space-y-4 mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
                        Priority Sectors
                      </h4>
                      <div className="h-px w-full bg-white/10"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {aiAnalysis.focus_topics.map((topic) => (
                        <div
                          key={topic}
                          className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-blue-500/70 uppercase mb-1.5 tracking-widest">
                                Drill Required
                              </p>
                              <span className="text-xs font-black uppercase tracking-tight text-slate-200 group-hover:text-white transition-colors">
                                {topic}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M13 7l5 5-5 5M6 7l5 5-5 5"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === AI PRACTICE ADVICE: CLI Logs === */}
                {aiAnalysis?.practice_advice?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
                        Tactical Logs
                      </h4>
                      <div className="h-px w-full bg-white/10"></div>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                      <ul className="space-y-5">
                        {aiAnalysis.practice_advice.map((advice, idx) => (
                          <li
                            key={idx}
                            className="text-[12px] text-slate-400 leading-relaxed flex gap-3 group"
                          >
                            <span className="text-blue-500 font-black opacity-50 group-hover:opacity-100 transition-opacity mt-0.5">
                              [{idx + 1}]
                            </span>
                            <span className="group-hover:text-slate-200 transition-colors">
                              {advice}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- PERFORMANCE LEGEND --- */}
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 right-0 p-5 opacity-[0.03] dark:opacity-5 text-slate-900 dark:text-white transition-colors duration-300">
                <svg
                  className="w-20 h-20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-6 text-center transition-colors duration-300">
                  Classification Legend
                </h4>

                <div className="flex flex-col gap-3">
                  {[
                    {
                      label: "Elite Operative",
                      range: "> 1500",
                      color: "bg-emerald-500",
                      text: "text-emerald-600 dark:text-emerald-400",
                    },
                    {
                      label: "Active Combatant",
                      range: "1000–1500",
                      color: "bg-amber-500",
                      text: "text-amber-600 dark:text-amber-400",
                    },
                    {
                      label: "Field Trainee",
                      range: "< 1000",
                      color: "bg-rose-500",
                      text: "text-rose-600 dark:text-rose-400",
                    },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${tier.color}`}
                        ></div>
                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 transition-colors duration-300">
                          {tier.label}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black ${tier.text} transition-colors duration-300`}>
                        {tier.range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}

{
  /* SUB-COMPONENT: TopicMetric */
}
function TopicMetric({ topic, accent }) {
  // Using generic tailwind classes to ensure perfect dark/light mode switching
  const accentConfig = {
    rose: {
      bar: "bg-rose-500 dark:bg-rose-500",
      text: "text-rose-600 dark:text-rose-400",
    },
    amber: {
      bar: "bg-amber-500 dark:bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    },
    emerald: {
      bar: "bg-emerald-500 dark:bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  };

  const config = accentConfig[accent] || accentConfig.rose;

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-3">
        <div>
          <h4 className="text-[13px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {topic.name}
          </h4>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 transition-colors duration-300">
            {topic.solves}/{topic.attempts} Successful Missions
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-[15px] font-black italic tracking-tighter ${config.text} transition-colors duration-300`}
          >
            {topic.rating}
          </span>
          <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] transition-colors duration-300">
            Rating
          </p>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner dark:shadow-none transition-colors duration-300">
        <div
          className={`h-full transition-all duration-1000 ${config.bar}`}
          style={{ width: `${topic.progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Coach;