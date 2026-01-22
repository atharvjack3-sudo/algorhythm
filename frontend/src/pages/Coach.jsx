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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfeff]">
        <div className="w-16 h-16 border-2 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-sky-500 animate-pulse">
          Your Coach is Thinking
        </p>
      </div>
    );
  }

  const weakTopics = topics.filter((t) => t.level === "weak");
  const mediumTopics = topics.filter((t) => t.level === "medium");
  const strongTopics = topics.filter((t) => t.level === "strong");

  return (
    <div className="min-h-screen w-full bg-[#fdfeff] text-slate-900 font-sans selection:bg-sky-100 overflow-x-hidden">
      {/* 🌌 AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-100/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* --- HEADER --- */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <svg
                  className="w-5 h-5 text-white"
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
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                Coach SGT. Rhythm
              </h1>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              Cognitive Intelligence & Performance Matrix
            </p>
          </div>

          <div className="flex gap-8 border-l border-slate-100 pl-8">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Status
              </p>
              <p className="text-xs font-black text-emerald-500 uppercase">
                Operational
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Subject
              </p>
              <p className="text-xs font-black text-slate-900 uppercase">
                {user.username}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT: TOPIC ANALYSIS --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. WEAK SECTOR */}
            <section className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[3rem] p-10 shadow-2xl shadow-sky-100/20">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                  Critical Weaknesses
                </h3>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>

              {weakTopics.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase italic">
                  No critical vulnerabilities detected.
                </p>
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
              <section className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[2.5rem] p-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-8">
                  Stable Sectors
                </h3>
                <div className="space-y-8">
                  {mediumTopics.map((topic) => (
                    <TopicMetric
                      key={topic.name}
                      topic={topic}
                      accent="amber"
                    />
                  ))}
                </div>
              </section>

              <section className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[2.5rem] p-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-8">
                  Mastered Sectors
                </h3>
                <div className="space-y-8">
                  {strongTopics.map((topic) => (
                    <TopicMetric
                      key={topic.name}
                      topic={topic}
                      accent="emerald"
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* --- RIGHT: AI DIRECTIVE --- */}
          <aside className="space-y-8 lg:sticky lg:top-8">
            {/* --- PRIMARY AI DIRECTIVE CHIP --- */}
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5">
              {/* Subtle Grid & Scanning Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent animate-scan"></div>

              <div className="relative z-10">
                {/* HUD Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></div>
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping opacity-40"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400">
                      Coach Directive
                    </span>
                  </div>
                </div>

                {/* === AI SUMMARY: The "Voice" === */}
                <div className="relative mb-12">
                  <span className="absolute -left-4 top-0 text-sky-500/30 text-4xl font-serif">
                    “
                  </span>
                  <p className="text-lg font-medium leading-relaxed text-slate-200 italic pl-2">
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
                      <div className="h-px w-full bg-white/5"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {aiAnalysis.focus_topics.map((topic) => (
                        <div
                          key={topic}
                          className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-4 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-sky-500/70 uppercase mb-1 tracking-widest">
                                Drill Required
                              </p>
                              <span className="text-xs font-black uppercase tracking-tight text-slate-200 group-hover:text-white transition-colors">
                                {topic}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <div className="h-px w-full bg-white/5"></div>
                    </div>

                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                      <ul className="space-y-4">
                        {aiAnalysis.practice_advice.map((advice, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-slate-400 leading-relaxed flex gap-3 group"
                          >
                            <span className="text-sky-500 font-black opacity-50 group-hover:opacity-100 transition-opacity">
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
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[2.5rem] p-8 shadow-xl shadow-sky-100/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg
                  className="w-16 h-16 text-slate-900"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 text-center">
                  Classification Legend
                </h4>

                <div className="flex flex-col gap-4">
                  {[
                    {
                      label: "Elite Operative",
                      range: "> 1500",
                      color: "bg-emerald-500",
                      text: "text-emerald-600",
                    },
                    {
                      label: "Active Combatant",
                      range: "1000–1500",
                      color: "bg-amber-500",
                      text: "text-amber-600",
                    },
                    {
                      label: "Field Trainee",
                      range: "< 1000",
                      color: "bg-rose-500",
                      text: "text-rose-600",
                    },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className="flex items-center justify-between px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${tier.color}`}
                        ></div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                          {tier.label}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black ${tier.text}`}>
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
  const accentColors = {
    rose: "bg-rose-400 text-rose-500",
    amber: "bg-amber-400 text-amber-500",
    emerald: "bg-emerald-400 text-emerald-500",
  };

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-3">
        <div>
          <h4 className="text-xs font-black uppercase text-slate-700 tracking-tight group-hover:text-sky-600 transition-colors">
            {topic.name}
          </h4>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            {topic.solves}/{topic.attempts} Successful Missions
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-black italic tracking-tighter ${accentColors[accent].split(" ")[1]}`}
          >
            {topic.rating}
          </span>
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Rating
          </p>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ${accentColors[accent].split(" ")[0]}`}
          style={{ width: `${topic.progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Coach;
